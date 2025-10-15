(define-constant sbtc-contract .mock-sbtc-v1)
(define-constant oracle-contract .mock-oracle-v1)

(define-constant contract-owner tx-sender)
(define-constant err-unauthorized (err u100))
(define-constant err-insufficient-collateral (err u101))
(define-constant err-insufficient-liquidity (err u102))
(define-constant err-position-not-found (err u103))
(define-constant err-invalid-amount (err u104))
(define-constant err-health-factor-too-low (err u105))
(define-constant err-not-liquidatable (err u106))
(define-constant err-asset-not-supported (err u107))
(define-constant err-oracle-error (err u108))
(define-constant err-division-by-zero (err u109))

;; Helper to return this contract's principal
(define-read-only (contract-principal)
    (as-contract tx-sender)
)

;; Precision constants
(define-constant precision u1000000) ;; 6 decimals for percentages
(define-constant health-factor-threshold u1000000) ;; 1.0 = liquidatable

;; Risk params (per-asset can be split later if you want)
(define-constant stx-ltv u700000) ;; 70%
(define-constant stx-liquidation-threshold u850000) ;; 85%
(define-constant sbtc-ltv u700000)
(define-constant sbtc-liquidation-threshold u850000)

;; Protocol-level state
(define-data-var last-update-block uint u0)
(define-data-var total-users uint u0)

;; Pool-level state for STX and sBTC
(define-data-var stx-total-supply uint u0)
(define-data-var stx-total-borrowed uint u0)
(define-data-var stx-reserves uint u0)

(define-data-var sbtc-total-supply uint u0)
(define-data-var sbtc-total-borrowed uint u0)
(define-data-var sbtc-reserves uint u0)

;; User positions
(define-map user-supplies { user: principal, asset: (string-ascii 10) }
  { amount: uint, last-update: uint, is-collateral: bool })

(define-map user-borrows { user: principal, asset: (string-ascii 10) }
  { amount: uint, last-update: uint })

;; === ORACLE ===
(define-public (get-asset-price (asset (string-ascii 10)))
  (let (
    (p (unwrap! (contract-call? oracle-contract get-price asset) err-oracle-error))
  )
    (ok p)))

;; === HELPERS ===
(define-read-only (min (a uint) (b uint)) (if (< a b) a b))
(define-read-only (max (a uint) (b uint)) (if (> a b) a b))

(define-read-only (get-user-supply (user principal) (asset (string-ascii 10)))
    (default-to { amount: u0, last-update: u0, is-collateral: false }
        (map-get? user-supplies { user: user, asset: asset })))

(define-read-only (get-user-borrow (user principal) (asset (string-ascii 10)))
    (default-to { amount: u0, last-update: u0 }
        (map-get? user-borrows { user: user, asset: asset })))

;; total available liquidity per asset
(define-read-only (get-available-liquidity (asset (string-ascii 10)))
    (if (is-eq asset "STX")
        (ok (- (var-get stx-total-supply) (var-get stx-total-borrowed)))
        (if (is-eq asset "sBTC")
            (ok (- (var-get sbtc-total-supply) (var-get sbtc-total-borrowed)))
            err-asset-not-supported)))

;; Borrowing power with LTV
(define-public (get-user-borrowing-power (user principal))
    (let (
        (stx-s (get-user-supply user "STX"))
        (sbtc-s (get-user-supply user "sBTC"))
        (stx-p (get price (unwrap! (get-asset-price "STX") err-oracle-error)))
        (sbtc-p (get price (unwrap! (get-asset-price "sBTC") err-oracle-error)))
    )
        (ok (+
            (if (get is-collateral stx-s)
              (/ (* (* (get amount stx-s) stx-p) stx-ltv) precision)
              u0)
            (if (get is-collateral sbtc-s)
              (/ (* (* (get amount sbtc-s) sbtc-p) sbtc-ltv) precision)
              u0))))
)

;; Health factor = (sum collateral * liq-threshold) / (sum borrows)
(define-public (get-user-health-factor (user principal))
    (let (
        (stx-s (get-user-supply user "STX"))
        (sbtc-s (get-user-supply user "sBTC"))
        (stx-b (get-user-borrow user "STX"))
        (sbtc-b (get-user-borrow user "sBTC"))
        (stx-p (get price (unwrap! (get-asset-price "STX") err-oracle-error)))
        (sbtc-p (get price (unwrap! (get-asset-price "sBTC") err-oracle-error)))
        (num (+
          (if (get is-collateral stx-s)
            (/ (* (* (get amount stx-s) stx-p) stx-liquidation-threshold) precision)
            u0)
          (if (get is-collateral sbtc-s)
            (/ (* (* (get amount sbtc-s) sbtc-p) sbtc-liquidation-threshold) precision)
            u0)))
        (den (+ (* (get amount stx-b) stx-p) (* (get amount sbtc-b) sbtc-p)))
    )
        (ok (if (is-eq den u0) u18446744073709551615 (/ (* num precision) den)))))

;; === SUPPLY ===
(define-public (supply-stx (amount uint) (use-as-collateral bool))
  (begin
    (asserts! (> amount u0) err-invalid-amount)
    (try! (stx-transfer? amount tx-sender (contract-principal)))
    (let ((cur (get amount (get-user-supply tx-sender "STX"))))
      (map-set user-supplies { user: tx-sender, asset: "STX" }
        { amount: (+ cur amount), last-update: stacks-block-height, is-collateral: use-as-collateral })
      (var-set stx-total-supply (+ (var-get stx-total-supply) amount))
      (print { event: "supply", asset: "STX", user: tx-sender, amount: amount, use-as-collateral: use-as-collateral, block: stacks-block-height })
      (ok true)))
)

(define-public (supply-sbtc (amount uint) (use-as-collateral bool))
  (begin
    (asserts! (> amount u0) err-invalid-amount)
    ;; user -> vault
    (try! (contract-call? sbtc-contract transfer amount tx-sender (contract-principal) none))
    (let ((cur (get amount (get-user-supply tx-sender "sBTC"))))
      (map-set user-supplies { user: tx-sender, asset: "sBTC" }
        { amount: (+ cur amount), last-update: stacks-block-height, is-collateral: use-as-collateral })
      (var-set sbtc-total-supply (+ (var-get sbtc-total-supply) amount))
      (print { event: "supply", asset: "sBTC", user: tx-sender, amount: amount, use-as-collateral: use-as-collateral, block: stacks-block-height })
      (ok true))))

;; === WITHDRAW ===
(define-public (calculate-health-after-withdraw (user principal) (asset (string-ascii 10)) (amount uint))
  (let (
    (s (get-user-supply user asset))
    (new-s (if (> (get amount s) amount) (- (get amount s) amount) u0))
  )
    (if (is-eq asset "STX")
      (let ((stx-p (get price (unwrap! (get-asset-price "STX") err-oracle-error)))
            (sbtc-p (get price (unwrap! (get-asset-price "sBTC") err-oracle-error)))
            (stx-supply new-s)
            (sbtc-supply (get amount (get-user-supply user "sBTC")))
            (stx-b (get amount (get-user-borrow user "STX")))
            (sbtc-b (get amount (get-user-borrow user "sBTC"))))
        (ok (let (
              (num (+
                (if (get is-collateral s)
                  (/ (* (* stx-supply stx-p) stx-liquidation-threshold) precision)
                  u0)
                (if (get is-collateral (get-user-supply user "sBTC"))
                  (/ (* (* sbtc-supply sbtc-p) sbtc-liquidation-threshold) precision)
                  u0)))
              (den (+ (* stx-b stx-p) (* sbtc-b sbtc-p))))
             (if (is-eq den u0) u18446744073709551615 (/ (* num precision) den)))))
      ;; asset is sBTC
      (let ((stx-p (get price (unwrap! (get-asset-price "STX") err-oracle-error)))
            (sbtc-p (get price (unwrap! (get-asset-price "sBTC") err-oracle-error)))
            (stx-supply (get amount (get-user-supply user "STX")))
            (sbtc-supply new-s)
            (stx-b (get amount (get-user-borrow user "STX")))
            (sbtc-b (get amount (get-user-borrow user "sBTC"))))
        (ok (let (
              (num (+
                (if (get is-collateral (get-user-supply user "STX"))
                  (/ (* (* stx-supply stx-p) stx-liquidation-threshold) precision)
                  u0)
                (if (get is-collateral s)
                  (/ (* (* sbtc-supply sbtc-p) sbtc-liquidation-threshold) precision)
                  u0)))
              (den (+ (* stx-b stx-p) (* sbtc-b sbtc-p))))
             (if (is-eq den u0) u18446744073709551615 (/ (* num precision) den))))))))

(define-public (withdraw-stx (amount uint))
  (let ((pos (get-user-supply tx-sender "STX")))
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (>= (get amount pos) amount) err-insufficient-collateral)
    (asserts! (>= (unwrap! (calculate-health-after-withdraw tx-sender "STX" amount) err-oracle-error) health-factor-threshold) err-health-factor-too-low)
    (map-set user-supplies { user: tx-sender, asset: "STX" } (merge pos { amount: (- (get amount pos) amount), last-update: stacks-block-height }))
    (var-set stx-total-supply (- (var-get stx-total-supply) amount))
    (try! (stx-transfer? amount (contract-principal) tx-sender))
    (print { event: "withdraw", asset: "STX", user: tx-sender, amount: amount, block: stacks-block-height })
    (ok true)))

(define-public (withdraw-sbtc (amount uint))
  (let ((pos (get-user-supply tx-sender "sBTC")))
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (>= (get amount pos) amount) err-insufficient-collateral)
    (asserts! (>= (unwrap! (calculate-health-after-withdraw tx-sender "sBTC" amount) err-oracle-error) health-factor-threshold) err-health-factor-too-low)
    (map-set user-supplies { user: tx-sender, asset: "sBTC" } (merge pos { amount: (- (get amount pos) amount), last-update: stacks-block-height }))
    (var-set sbtc-total-supply (- (var-get sbtc-total-supply) amount))
    ;; vault -> user (must be called under as-contract, and sender must be the contract principal)
    (let ((self (contract-principal))) (try! (as-contract (contract-call? sbtc-contract transfer amount self tx-sender none))))
    (print { event: "withdraw", asset: "sBTC", user: tx-sender, amount: amount, block: stacks-block-height })
    (ok true)))

;; === BORROW ===
(define-public (borrow-stx (amount uint))
  (let (
    (avail (unwrap! (get-available-liquidity "STX") err-insufficient-liquidity))
    (bp (unwrap! (get-user-borrowing-power tx-sender) err-oracle-error))
    (px (get price (unwrap! (get-asset-price "STX") err-oracle-error)))
    (cur (get amount (get-user-borrow tx-sender "STX")))
  )
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (>= avail amount) err-insufficient-liquidity)
    (asserts! (>= bp (* amount px)) err-insufficient-collateral)
    (map-set user-borrows { user: tx-sender, asset: "STX" } { amount: (+ cur amount), last-update: stacks-block-height })
    (var-set stx-total-borrowed (+ (var-get stx-total-borrowed) amount))
    (try! (stx-transfer? amount (contract-principal) tx-sender))
    (print { event: "borrow", asset: "STX", user: tx-sender, amount: amount, block: stacks-block-height })
    (ok true)))

(define-public (borrow-sbtc (amount uint))
  (let (
    (avail (unwrap! (get-available-liquidity "sBTC") err-insufficient-liquidity))
    (bp (unwrap! (get-user-borrowing-power tx-sender) err-oracle-error))
    (px (get price (unwrap! (get-asset-price "sBTC") err-oracle-error)))
    (cur (get amount (get-user-borrow tx-sender "sBTC")))
  )
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (>= avail amount) err-insufficient-liquidity)
    (asserts! (>= bp (* amount px)) err-insufficient-collateral)
    (map-set user-borrows { user: tx-sender, asset: "sBTC" } { amount: (+ cur amount), last-update: stacks-block-height })
    (var-set sbtc-total-borrowed (+ (var-get sbtc-total-borrowed) amount))
    ;; vault -> user (as-contract with sender=self)
    (let ((self (contract-principal))) (try! (as-contract (contract-call? sbtc-contract transfer amount self tx-sender none))))
    (print { event: "borrow", asset: "sBTC", user: tx-sender, amount: amount, block: stacks-block-height })
    (ok true)))

;; === REPAY ===
(define-public (repay-stx (amount uint))
  (let ((cur (get amount (get-user-borrow tx-sender "STX")))
        (repay (if (> amount cur) cur amount)))
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (> cur u0) err-position-not-found)
    (try! (stx-transfer? repay tx-sender (contract-principal)))
    (map-set user-borrows { user: tx-sender, asset: "STX" } { amount: (- cur repay), last-update: stacks-block-height })
    (var-set stx-total-borrowed (- (var-get stx-total-borrowed) repay))
    (print { event: "repay", asset: "STX", user: tx-sender, amount: repay, block: stacks-block-height })
    (ok true)))

(define-public (repay-sbtc (amount uint))
  (let ((cur (get amount (get-user-borrow tx-sender "sBTC")))
        (repay (if (> amount cur) cur amount)))
    (asserts! (> amount u0) err-invalid-amount)
    (asserts! (> cur u0) err-position-not-found)
    ;; user -> vault
    (try! (contract-call? sbtc-contract transfer repay tx-sender (contract-principal) none))
    (map-set user-borrows { user: tx-sender, asset: "sBTC" } { amount: (- cur repay), last-update: stacks-block-height })
    (var-set sbtc-total-borrowed (- (var-get sbtc-total-borrowed) repay))
    (print { event: "repay", asset: "sBTC", user: tx-sender, amount: repay, block: stacks-block-height })
    (ok true)))

;; === LIQUIDATION (basic) ===
(define-public (liquidate-sbtc-with-stx (user principal) (repay-amount uint))
  (let (
    (hf (unwrap! (get-user-health-factor user) err-oracle-error))
    (sbtc-b (get amount (get-user-borrow user "sBTC")))
    (sbtc-s (get-user-supply user "sBTC"))
  )
    (asserts! (< hf health-factor-threshold) err-not-liquidatable)
    (asserts! (> sbtc-b u0) err-position-not-found)
    (let ((actual (min repay-amount sbtc-b)))
      ;; liquidator pays STX to protocol to cover some sBTC debt
      (try! (stx-transfer? (* actual (get price (unwrap! (get-asset-price "sBTC") err-oracle-error))) tx-sender (contract-principal)))
      (map-set user-borrows { user: user, asset: "sBTC" } { amount: (- sbtc-b actual), last-update: stacks-block-height })
      (var-set sbtc-total-borrowed (- (var-get sbtc-total-borrowed) actual))
      ;; seize sBTC collateral from user to liquidator (protocol-held -> liquidator)
      (let ((self (contract-principal))
            (collateral-to-seize (min (get amount sbtc-s) actual)))
        ;; decrease user supply
        (map-set user-supplies { user: user, asset: "sBTC" } (merge sbtc-s { amount: (- (get amount sbtc-s) collateral-to-seize), last-update: stacks-block-height }))
        (var-set sbtc-total-supply (- (var-get sbtc-total-supply) collateral-to-seize))
        (try! (as-contract (contract-call? sbtc-contract transfer collateral-to-seize self tx-sender none)))
        (print { event: "liquidate", target: user, asset: "sBTC", repaid: actual, seized: collateral-to-seize, by: tx-sender }))
      (ok true)))
)

;; === COLLATERAL TOGGLE ===
(define-public (enable-collateral (asset (string-ascii 10)))
  (let ((pos (get-user-supply tx-sender asset)))
    (asserts! (> (get amount pos) u0) err-position-not-found)
    (map-set user-supplies { user: tx-sender, asset: asset } (merge pos { is-collateral: true }))
    (print { event: "enable-collateral", user: tx-sender, asset: asset })
    (ok true)))

(define-public (disable-collateral (asset (string-ascii 10)))
  (let ((pos (get-user-supply tx-sender asset)))
    (asserts! (> (get amount pos) u0) err-position-not-found)
    (asserts! (>= (unwrap! (calculate-health-after-withdraw tx-sender asset u0) err-oracle-error) health-factor-threshold) err-health-factor-too-low)
    (map-set user-supplies { user: tx-sender, asset: asset } (merge pos { is-collateral: false }))
    (print { event: "disable-collateral", user: tx-sender, asset: asset })
    (ok true)))

;; === METRICS (TVL, APY placeholders) ===
(define-public (get-protocol-metrics)
  (let ((stx-p (get price (unwrap! (get-asset-price "STX") err-oracle-error)))
        (sbtc-p (get price (unwrap! (get-asset-price "sBTC") err-oracle-error))))
    (ok {
      tvl: (+ (* (var-get stx-total-supply) stx-p) (* (var-get sbtc-total-supply) sbtc-p)),
      total-borrows: (+ (* (var-get stx-total-borrowed) stx-p) (* (var-get sbtc-total-borrowed) sbtc-p)),
      available-liquidity: (+ (* (- (var-get stx-total-supply) (var-get stx-total-borrowed)) stx-p)
                              (* (- (var-get sbtc-total-supply) (var-get sbtc-total-borrowed)) sbtc-p)),
      reserves: (+ (* (var-get stx-reserves) stx-p) (* (var-get sbtc-reserves) sbtc-p)),
      unique-users: (var-get total-users)
    })))

;; User dashboard-lite
(define-public (get-user-dashboard (user principal))
  (let (
    (stx-s (get-user-supply user "STX"))
    (sbtc-s (get-user-supply user "sBTC"))
    (stx-b (get-user-borrow user "STX"))
    (sbtc-b (get-user-borrow user "sBTC"))
    (stx-p (get price (unwrap! (get-asset-price "STX") err-oracle-error)))
    (sbtc-p (get price (unwrap! (get-asset-price "sBTC") err-oracle-error)))
    (hf (unwrap! (get-user-health-factor user) err-oracle-error))
    (bp (unwrap! (get-user-borrowing-power user) err-oracle-error))
  )
    (ok {
      health-factor: hf,
      borrowing-power: bp,
      total-supply-usd: (+ (* (get amount stx-s) stx-p) (* (get amount sbtc-s) sbtc-p)),
      total-borrow-usd: (+ (* (get amount stx-b) stx-p) (* (get amount sbtc-b) sbtc-p)),
      supplies: {
        stx: { amount: (get amount stx-s), is-collateral: (get is-collateral stx-s) },
        sbtc: { amount: (get amount sbtc-s), is-collateral: (get is-collateral sbtc-s) }
      },
      borrows: {
        stx: { amount: (get amount stx-b) },
        sbtc: { amount: (get amount sbtc-b) }
      }
    })))

;; === ADMIN ===
(define-public (admin-skim-sbtc (amount uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-unauthorized)
    (let ((self (contract-principal)))
      (try! (as-contract (contract-call? sbtc-contract transfer amount self contract-owner none))))
    (ok true)))

;; === INIT ===
(begin (var-set last-update-block stacks-block-height))

