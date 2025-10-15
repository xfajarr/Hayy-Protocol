;; Cross-Chain Lending & Borrowing Protocol
;; Supports STX and sBTC with unified liquidity pool

(define-constant sbtc-contract 'ST1AY6BBPTAQ5YBYEED1MRAB6FYHYB7NF1REJ3WS6.mock-sbtc-v2)
(define-constant oracle-contract 'ST1AY6BBPTAQ5YBYEED1MRAB6FYHYB7NF1REJ3WS6.mock-oracle-v2)

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

;; Precision constants
(define-constant precision u1000000) ;; 6 decimals for percentages
(define-constant health-factor-threshold u1000000) ;; 1.0 = liquidatable

;; Asset parameters (per 1M units for precision)
(define-constant stx-ltv u750000) ;; 75% LTV
(define-constant sbtc-ltv u800000) ;; 80% LTV
(define-constant stx-liquidation-threshold u850000) ;; 85%
(define-constant sbtc-liquidation-threshold u900000) ;; 90%
(define-constant liquidation-penalty u100000) ;; 10% bonus for liquidator
(define-constant reserve-factor u100000) ;; 10% of interest goes to reserves

;; Interest rate parameters (annual rates with 6 decimals)
(define-constant base-rate u20000) ;; 2% base rate
(define-constant optimal-utilization u800000) ;; 80% optimal
(define-constant slope1 u40000) ;; 4% slope before optimal
(define-constant slope2 u600000) ;; 60% slope after optimal

;; Protocol-level data
(define-data-var total-users uint u0)
(define-data-var stx-total-supplied uint u0)
(define-data-var stx-total-borrowed uint u0)
(define-data-var stx-total-reserves uint u0)
(define-data-var sbtc-total-supplied uint u0)
(define-data-var sbtc-total-borrowed uint u0)
(define-data-var sbtc-total-reserves uint u0)
(define-data-var last-update-block uint u0)

;; User positions
(define-map user-supplies
    { user: principal, asset: (string-ascii 10) }
    { 
        amount: uint,
        last-update: uint,
        is-collateral: bool
    }
)

(define-map user-borrows
    { user: principal, asset: (string-ascii 10) }
    { 
        amount: uint,
        last-update: uint
    }
)

(define-map registered-users principal bool)

(define-map user-tx-count principal uint)

;; Asset prices from mock oracle
(define-read-only (get-asset-price (asset (string-ascii 10)))
    (contract-call? .mock-oracle-v2 get-price asset)
)

(define-read-only (calculate-utilization-rate (total-supplied uint) (total-borrowed uint))
    (if (is-eq total-supplied u0)
        (ok u0)
        (ok (/ (* total-borrowed precision) total-supplied))
    )
)

(define-read-only (calculate-borrow-apr (asset (string-ascii 10)))
    (let (
        (total-supplied (if (is-eq asset "STX") 
            (var-get stx-total-supplied) 
            (var-get sbtc-total-supplied)))
        (total-borrowed (if (is-eq asset "STX") 
            (var-get stx-total-borrowed) 
            (var-get sbtc-total-borrowed)))
        (utilization (unwrap! (calculate-utilization-rate total-supplied total-borrowed) err-division-by-zero))
    )
        (if (<= utilization optimal-utilization)
            ;; Below optimal: base-rate + (utilization * slope1 / optimal)
            (ok (+ base-rate (/ (* utilization slope1) optimal-utilization)))
            ;; Above optimal: base-rate + slope1 + ((utilization - optimal) * slope2 / (1 - optimal))
            (ok (+ (+ base-rate slope1) 
                   (/ (* (- utilization optimal-utilization) slope2) 
                      (- precision optimal-utilization))))
        )
    )
)

(define-read-only (calculate-supply-apy (asset (string-ascii 10)))
    (let (
        (borrow-apr (unwrap! (calculate-borrow-apr asset) err-division-by-zero))
        (total-supplied (if (is-eq asset "STX") 
            (var-get stx-total-supplied) 
            (var-get sbtc-total-supplied)))
        (total-borrowed (if (is-eq asset "STX") 
            (var-get stx-total-borrowed) 
            (var-get sbtc-total-borrowed)))
        (utilization (unwrap! (calculate-utilization-rate total-supplied total-borrowed) err-division-by-zero))
    )
        ;; Supply APY = Borrow APR * Utilization * (1 - Reserve Factor)
        (ok (/ (* (* borrow-apr utilization) (- precision reserve-factor)) 
               (* precision precision)))
    )
)

;; USER POSITIONS

(define-read-only (get-user-supply (user principal) (asset (string-ascii 10)))
    (default-to { amount: u0, last-update: u0, is-collateral: false }
        (map-get? user-supplies { user: user, asset: asset }))
)

(define-read-only (get-user-borrow (user principal) (asset (string-ascii 10)))
    (default-to { amount: u0, last-update: u0 }
        (map-get? user-borrows { user: user, asset: asset }))
)

(define-read-only (get-user-collateral-value (user principal))
    (let (
        (stx-supply (get amount (get-user-supply user "STX")))
        (stx-collateral (get is-collateral (get-user-supply user "STX")))
        (sbtc-supply (get amount (get-user-supply user "sBTC")))
        (sbtc-collateral (get is-collateral (get-user-supply user "sBTC")))
        (stx-price-data (unwrap! (get-asset-price "STX") err-oracle-error))
        (sbtc-price-data (unwrap! (get-asset-price "sBTC") err-oracle-error))
        (stx-price (get price stx-price-data))
        (sbtc-price (get price sbtc-price-data))
    )
        (ok (+ 
            (if stx-collateral 
                (/ (* (* stx-supply stx-price) stx-ltv) precision) 
                u0)
            (if sbtc-collateral 
                (/ (* (* sbtc-supply sbtc-price) sbtc-ltv) precision) 
                u0)
        ))
    )
)

(define-read-only (get-user-borrow-value (user principal))
    (let (
        (stx-borrow (get amount (get-user-borrow user "STX")))
        (sbtc-borrow (get amount (get-user-borrow user "sBTC")))
        (stx-price-data (unwrap! (get-asset-price "STX") err-oracle-error))
        (sbtc-price-data (unwrap! (get-asset-price "sBTC") err-oracle-error))
        (stx-price (get price stx-price-data))
        (sbtc-price (get price sbtc-price-data))
    )
        (ok (+ (* stx-borrow stx-price) (* sbtc-borrow sbtc-price)))
    )
)

(define-read-only (get-user-health-factor (user principal))
    (let (
        (collateral-value (unwrap! (get-user-collateral-value user) err-oracle-error))
        (borrow-value (unwrap! (get-user-borrow-value user) err-oracle-error))
    )
        (if (is-eq borrow-value u0)
            (ok u99999999999) ;; Max health factor if no borrows
            (ok (/ (* collateral-value precision) borrow-value))
        )
    )
)

(define-read-only (get-user-borrowing-power (user principal))
    (let (
        (collateral-value (unwrap! (get-user-collateral-value user) err-oracle-error))
        (borrow-value (unwrap! (get-user-borrow-value user) err-oracle-error))
    )
        (ok (if (> collateral-value borrow-value)
            (- collateral-value borrow-value)
            u0))
    )
)

;; PROTOCOL-LEVEL DATA

(define-read-only (get-protocol-tvl)
    (let (
        (stx-price-data (unwrap! (get-asset-price "STX") err-oracle-error))
        (sbtc-price-data (unwrap! (get-asset-price "sBTC") err-oracle-error))
        (stx-price (get price stx-price-data))
        (sbtc-price (get price sbtc-price-data))
    )
        (ok (+ 
            (* (var-get stx-total-supplied) stx-price)
            (* (var-get sbtc-total-supplied) sbtc-price)
        ))
    )
)

(define-read-only (get-protocol-total-borrows)
    (let (
        (stx-price-data (unwrap! (get-asset-price "STX") err-oracle-error))
        (sbtc-price-data (unwrap! (get-asset-price "sBTC") err-oracle-error))
        (stx-price (get price stx-price-data))
        (sbtc-price (get price sbtc-price-data))
    )
        (ok (+ 
            (* (var-get stx-total-borrowed) stx-price)
            (* (var-get sbtc-total-borrowed) sbtc-price)
        ))
    )
)

(define-read-only (get-available-liquidity (asset (string-ascii 10)))
    (if (is-eq asset "STX")
        (ok (- (var-get stx-total-supplied) (var-get stx-total-borrowed)))
        (ok (- (var-get sbtc-total-supplied) (var-get sbtc-total-borrowed)))
    )
)

(define-read-only (get-asset-stats (asset (string-ascii 10)))
    (let (
        (total-supplied (if (is-eq asset "STX") 
            (var-get stx-total-supplied) 
            (var-get sbtc-total-supplied)))
        (total-borrowed (if (is-eq asset "STX") 
            (var-get stx-total-borrowed) 
            (var-get sbtc-total-borrowed)))
        (reserves (if (is-eq asset "STX") 
            (var-get stx-total-reserves) 
            (var-get sbtc-total-reserves)))
        (price-data (unwrap! (get-asset-price asset) err-oracle-error))
        (utilization (unwrap! (calculate-utilization-rate total-supplied total-borrowed) err-division-by-zero))
        (borrow-apr (unwrap! (calculate-borrow-apr asset) err-division-by-zero))
        (supply-apy (unwrap! (calculate-supply-apy asset) err-division-by-zero))
    )
        (ok {
            total-supplied: total-supplied,
            total-borrowed: total-borrowed,
            available-liquidity: (- total-supplied total-borrowed),
            reserves: reserves,
            utilization-rate: utilization,
            supply-apy: supply-apy,
            borrow-apr: borrow-apr,
            oracle-price: (get price price-data),
            ltv: (if (is-eq asset "STX") stx-ltv sbtc-ltv),
            liquidation-threshold: (if (is-eq asset "STX") stx-liquidation-threshold sbtc-liquidation-threshold),
            liquidation-penalty: liquidation-penalty,
            reserve-factor: reserve-factor
        })
    )
)

;; CORE FUNCTIONS: SUPPLY

(define-public (supply-stx (amount uint) (use-as-collateral bool))
    (let (
        (current-supply (get amount (get-user-supply tx-sender "STX")))
    )
        (asserts! (> amount u0) err-invalid-amount)
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        
        ;; Update user position
        (map-set user-supplies
            { user: tx-sender, asset: "STX" }
            { 
                amount: (+ current-supply amount),
                last-update: block-height,
                is-collateral: use-as-collateral
            }
        )
        
        ;; Update protocol stats
        (var-set stx-total-supplied (+ (var-get stx-total-supplied) amount))
        (register-user tx-sender)
        
        ;; Emit event
        (print {
            event: "supply",
            user: tx-sender,
            asset: "STX",
            amount: amount,
            use-as-collateral: use-as-collateral,
            block: block-height
        })
        
        (ok true)
    )
)

(define-public (supply-sbtc (amount uint) (use-as-collateral bool))
    (let (
        (current-supply (get amount (get-user-supply tx-sender "sBTC")))
    )
        (asserts! (> amount u0) err-invalid-amount)
        (try! (contract-call? .mock-sbtc-v2 transfer amount tx-sender (as-contract tx-sender) none))
        
        ;; Update user position
        (map-set user-supplies
            { user: tx-sender, asset: "sBTC" }
            { 
                amount: (+ current-supply amount),
                last-update: block-height,
                is-collateral: use-as-collateral
            }
        )
        
        ;; Update protocol stats
        (var-set sbtc-total-supplied (+ (var-get sbtc-total-supplied) amount))
        (register-user tx-sender)
        
        ;; Emit event
        (print {
            event: "supply",
            user: tx-sender,
            asset: "sBTC",
            amount: amount,
            use-as-collateral: use-as-collateral,
            block: block-height
        })
        
        (ok true)
    )
)

;; CORE FUNCTIONS: WITHDRAW

(define-public (withdraw-stx (amount uint))
    (let (
        (user-supply (get-user-supply tx-sender "STX"))
        (current-amount (get amount user-supply))
        (health-factor-after (unwrap! (calculate-health-after-withdraw tx-sender "STX" amount) err-oracle-error))
    )
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (>= current-amount amount) err-insufficient-collateral)
        (asserts! (>= health-factor-after health-factor-threshold) err-health-factor-too-low)
        
        ;; Transfer STX back to user
        (try! (as-contract (stx-transfer? amount tx-sender tx-sender)))
        
        ;; Update user position
        (map-set user-supplies
            { user: tx-sender, asset: "STX" }
            (merge user-supply { amount: (- current-amount amount), last-update: block-height })
        )
        
        ;; Update protocol stats
        (var-set stx-total-supplied (- (var-get stx-total-supplied) amount))
        
        ;; Emit event
        (print {
            event: "withdraw",
            user: tx-sender,
            asset: "STX",
            amount: amount,
            block: block-height
        })
        
        (ok true)
    )
)

(define-public (withdraw-sbtc (amount uint))
    (let (
        (user-supply (get-user-supply tx-sender "sBTC"))
        (current-amount (get amount user-supply))
        (health-factor-after (unwrap! (calculate-health-after-withdraw tx-sender "sBTC" amount) err-oracle-error))
    )
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (>= current-amount amount) err-insufficient-collateral)
        (asserts! (>= health-factor-after health-factor-threshold) err-health-factor-too-low)
        
        ;; Transfer sBTC back to user
        (try! (as-contract (contract-call? .mock-sbtc-v2 transfer amount tx-sender tx-sender none)))
        
        ;; Update user position
        (map-set user-supplies
            { user: tx-sender, asset: "sBTC" }
            (merge user-supply { amount: (- current-amount amount), last-update: block-height })
        )
        
        ;; Update protocol stats
        (var-set sbtc-total-supplied (- (var-get sbtc-total-supplied) amount))
        
        ;; Emit event
        (print {
            event: "withdraw",
            user: tx-sender,
            asset: "sBTC",
            amount: amount,
            block: block-height
        })
        
        (ok true)
    )
)

;; CORE FUNCTIONS: BORROW

(define-public (borrow-stx (amount uint))
    (let (
        (available (unwrap! (get-available-liquidity "STX") err-insufficient-liquidity))
        (current-borrow (get amount (get-user-borrow tx-sender "STX")))
        (borrowing-power (unwrap! (get-user-borrowing-power tx-sender) err-oracle-error))
        (stx-price-data (unwrap! (get-asset-price "STX") err-oracle-error))
        (stx-price (get price stx-price-data))
        (borrow-value (* amount stx-price))
    )
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (>= available amount) err-insufficient-liquidity)
        (asserts! (>= borrowing-power borrow-value) err-insufficient-collateral)
        
        ;; Transfer STX to user
        (try! (as-contract (stx-transfer? amount tx-sender tx-sender)))
        
        ;; Update user borrow position
        (map-set user-borrows
            { user: tx-sender, asset: "STX" }
            { 
                amount: (+ current-borrow amount),
                last-update: block-height
            }
        )
        
        ;; Update protocol stats
        (var-set stx-total-borrowed (+ (var-get stx-total-borrowed) amount))
        
        ;; Emit event
        (print {
            event: "borrow",
            user: tx-sender,
            asset: "STX",
            amount: amount,
            block: block-height
        })
        
        (ok true)
    )
)

(define-public (borrow-sbtc (amount uint))
    (let (
        (available (unwrap! (get-available-liquidity "sBTC") err-insufficient-liquidity))
        (current-borrow (get amount (get-user-borrow tx-sender "sBTC")))
        (borrowing-power (unwrap! (get-user-borrowing-power tx-sender) err-oracle-error))
        (sbtc-price-data (unwrap! (get-asset-price "sBTC") err-oracle-error))
        (sbtc-price (get price sbtc-price-data))
        (borrow-value (* amount sbtc-price))
    )
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (>= available amount) err-insufficient-liquidity)
        (asserts! (>= borrowing-power borrow-value) err-insufficient-collateral)
        
        ;; Transfer sBTC to user
        (try! (as-contract (contract-call? .mock-sbtc-v2 transfer amount tx-sender tx-sender none)))
        
        ;; Update user borrow position
        (map-set user-borrows
            { user: tx-sender, asset: "sBTC" }
            { 
                amount: (+ current-borrow amount),
                last-update: block-height
            }
        )
        
        ;; Update protocol stats
        (var-set sbtc-total-borrowed (+ (var-get sbtc-total-borrowed) amount))
        
        ;; Emit event
        (print {
            event: "borrow",
            user: tx-sender,
            asset: "sBTC",
            amount: amount,
            block: block-height
        })
        
        (ok true)
    )
)

;; CORE FUNCTIONS: REPAY

(define-public (repay-stx (amount uint))
    (let (
        (current-borrow (get amount (get-user-borrow tx-sender "STX")))
        (actual-repay (if (> amount current-borrow) current-borrow amount))
    )
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (> current-borrow u0) err-position-not-found)
        
        ;; Transfer STX from user to contract
        (try! (stx-transfer? actual-repay tx-sender (as-contract tx-sender)))
        
        ;; Update user borrow position
        (map-set user-borrows
            { user: tx-sender, asset: "STX" }
            { 
                amount: (- current-borrow actual-repay),
                last-update: block-height
            }
        )
        
        ;; Update protocol stats
        (var-set stx-total-borrowed (- (var-get stx-total-borrowed) actual-repay))
        
        ;; Emit event
        (print {
            event: "repay",
            user: tx-sender,
            asset: "STX",
            amount: actual-repay,
            block: block-height
        })
        
        (ok actual-repay)
    )
)

(define-public (repay-sbtc (amount uint))
    (let (
        (current-borrow (get amount (get-user-borrow tx-sender "sBTC")))
        (actual-repay (if (> amount current-borrow) current-borrow amount))
    )
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (> current-borrow u0) err-position-not-found)
        
        ;; Transfer sBTC from user to contract
        (try! (contract-call? .mock-sbtc-v2 transfer actual-repay tx-sender (as-contract tx-sender) none))
        
        ;; Update user borrow position
        (map-set user-borrows
            { user: tx-sender, asset: "sBTC" }
            { 
                amount: (- current-borrow actual-repay),
                last-update: block-height
            }
        )
        
        ;; Update protocol stats
        (var-set sbtc-total-borrowed (- (var-get sbtc-total-borrowed) actual-repay))
        
        ;; Emit event
        (print {
            event: "repay",
            user: tx-sender,
            asset: "sBTC",
            amount: actual-repay,
            block: block-height
        })
        
        (ok actual-repay)
    )
)

;; LIQUIDATION

(define-public (liquidate (borrower principal) (repay-asset (string-ascii 10)) (repay-amount uint) (collateral-asset (string-ascii 10)))
    (let (
        (health-factor (unwrap! (get-user-health-factor borrower) err-oracle-error))
        (borrow-position (get-user-borrow borrower repay-asset))
        (collateral-position (get-user-supply borrower collateral-asset))
        (repay-price-data (unwrap! (get-asset-price repay-asset) err-oracle-error))
        (collateral-price-data (unwrap! (get-asset-price collateral-asset) err-oracle-error))
        (repay-value (* repay-amount (get price repay-price-data)))
        (collateral-to-seize (/ (* repay-value (+ precision liquidation-penalty)) (get price collateral-price-data)))
    )
        (asserts! (< health-factor health-factor-threshold) err-not-liquidatable)
        (asserts! (> (get amount borrow-position) u0) err-position-not-found)
        (asserts! (>= (get amount collateral-position) collateral-to-seize) err-insufficient-collateral)
        
        ;; Transfer repay asset from liquidator to contract
        (if (is-eq repay-asset "STX")
            (try! (stx-transfer? repay-amount tx-sender (as-contract tx-sender)))
            (try! (contract-call? .mock-sbtc-v2 transfer repay-amount tx-sender (as-contract tx-sender) none))
        )
        
        ;; Transfer collateral from contract to liquidator
        (if (is-eq collateral-asset "STX")
            (try! (as-contract (stx-transfer? collateral-to-seize tx-sender tx-sender)))
            (try! (as-contract (contract-call? .mock-sbtc-v2 transfer collateral-to-seize tx-sender tx-sender none)))
        )
        
        ;; Update borrower's borrow position
        (map-set user-borrows
            { user: borrower, asset: repay-asset }
            { 
                amount: (- (get amount borrow-position) repay-amount),
                last-update: block-height
            }
        )
        
        ;; Update borrower's collateral position
        (map-set user-supplies
            { user: borrower, asset: collateral-asset }
            (merge collateral-position { 
                amount: (- (get amount collateral-position) collateral-to-seize),
                last-update: block-height
            })
        )
        
        ;; Update protocol stats
        (if (is-eq repay-asset "STX")
            (var-set stx-total-borrowed (- (var-get stx-total-borrowed) repay-amount))
            (var-set sbtc-total-borrowed (- (var-get sbtc-total-borrowed) repay-amount))
        )
        
        (if (is-eq collateral-asset "STX")
            (var-set stx-total-supplied (- (var-get stx-total-supplied) collateral-to-seize))
            (var-set sbtc-total-supplied (- (var-get sbtc-total-supplied) collateral-to-seize))
        )
        
        ;; Emit event
        (print {
            event: "liquidation",
            liquidator: tx-sender,
            borrower: borrower,
            repay-asset: repay-asset,
            repay-amount: repay-amount,
            collateral-asset: collateral-asset,
            collateral-seized: collateral-to-seize,
            block: block-height
        })
        
        (ok collateral-to-seize)
    )
)

;; COLLATERAL MANAGEMENT

(define-public (enable-collateral (asset (string-ascii 10)))
    (let (
        (user-supply (get-user-supply tx-sender asset))
    )
        (asserts! (> (get amount user-supply) u0) err-position-not-found)
        (map-set user-supplies
            { user: tx-sender, asset: asset }
            (merge user-supply { is-collateral: true })
        )
        (print { event: "enable-collateral", user: tx-sender, asset: asset, block: block-height })
        (ok true)
    )
)

(define-public (disable-collateral (asset (string-ascii 10)))
    (let (
        (user-supply (get-user-supply tx-sender asset))
        (health-factor-after (unwrap! (calculate-health-after-disable-collateral tx-sender asset) err-oracle-error))
    )
        (asserts! (> (get amount user-supply) u0) err-position-not-found)
        (asserts! (>= health-factor-after health-factor-threshold) err-health-factor-too-low)
        (map-set user-supplies
            { user: tx-sender, asset: asset }
            (merge user-supply { is-collateral: false })
        )
        (print { event: "disable-collateral", user: tx-sender, asset: asset, block: block-height })
        (ok true)
    )
)

;; HELPER FUNCTIONS

(define-private (register-user (user principal))
    (if (is-none (map-get? registered-users user))
        (begin
            (map-set registered-users user true)
            (var-set total-users (+ (var-get total-users) u1))
            true
        )
        false
    )
)

(define-private (calculate-health-after-withdraw (user principal) (asset (string-ascii 10)) (amount uint))
    (let (
        (current-supply (get amount (get-user-supply user asset)))
        (is-collateral (get is-collateral (get-user-supply user asset)))
        (price-data (unwrap! (get-asset-price asset) err-oracle-error))
        (price (get price price-data))
        (ltv (if (is-eq asset "STX") stx-ltv sbtc-ltv))
        (collateral-reduction (if is-collateral (/ (* (* amount price) ltv) precision) u0))
        (current-collateral (unwrap! (get-user-collateral-value user) err-oracle-error))
        (borrow-value (unwrap! (get-user-borrow-value user) err-oracle-error))
        (new-collateral (if (>= current-collateral collateral-reduction)
            (- current-collateral collateral-reduction)
            u0))
    )
        (if (is-eq borrow-value u0)
            (ok u99999999999)
            (ok (/ (* new-collateral precision) borrow-value))
        )
    )
)

(define-private (calculate-health-after-disable-collateral (user principal) (asset (string-ascii 10)))
    (let (
        (supply-amount (get amount (get-user-supply user asset)))
        (price-data (unwrap! (get-asset-price asset) err-oracle-error))
        (price (get price price-data))
        (ltv (if (is-eq asset "STX") stx-ltv sbtc-ltv))
        (collateral-reduction (/ (* (* supply-amount price) ltv) precision))
        (current-collateral (unwrap! (get-user-collateral-value user) err-oracle-error))
        (borrow-value (unwrap! (get-user-borrow-value user) err-oracle-error))
        (new-collateral (if (>= current-collateral collateral-reduction)
            (- current-collateral collateral-reduction)
            u0))
    )
        (if (is-eq borrow-value u0)
            (ok u99999999999)
            (ok (/ (* new-collateral precision) borrow-value))
        )
    )
)

;; ADMIN FUNCTIONS

(define-public (withdraw-reserves (asset (string-ascii 10)) (amount uint))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-unauthorized)
        (if (is-eq asset "STX")
            (begin
                (asserts! (>= (var-get stx-total-reserves) amount) err-insufficient-liquidity)
                (try! (as-contract (stx-transfer? amount tx-sender contract-owner)))
                (var-set stx-total-reserves (- (var-get stx-total-reserves) amount))
                (ok true)
            )
            (begin
                (asserts! (>= (var-get sbtc-total-reserves) amount) err-insufficient-liquidity)
                (try! (as-contract (contract-call? .mock-sbtc-v2 transfer amount tx-sender contract-owner none)))
                (var-set sbtc-total-reserves (- (var-get sbtc-total-reserves) amount))
                (ok true)
            )
        )
    )
)

;; READ-ONLY: PROTOCOL STATS

(define-read-only (get-protocol-stats)
    (let (
        (tvl (unwrap! (get-protocol-tvl) err-oracle-error))
        (total-borrows (unwrap! (get-protocol-total-borrows) err-oracle-error))
    )
        (ok {
            tvl: tvl,
            total-borrows: total-borrows,
            available-liquidity: (- tvl total-borrows),
            total-users: (var-get total-users),
            stx-reserves: (var-get stx-total-reserves),
            sbtc-reserves: (var-get sbtc-total-reserves),
            last-update: (var-get last-update-block)
        })
    )
)

;; READ-ONLY: USER DASHBOARD

(define-read-only (get-user-dashboard (user principal))
    (let (
        (stx-supply (get-user-supply user "STX"))
        (sbtc-supply (get-user-supply user "sBTC"))
        (stx-borrow (get-user-borrow user "STX"))
        (sbtc-borrow (get-user-borrow user "sBTC"))
        (stx-price-data (unwrap! (get-asset-price "STX") err-oracle-error))
        (sbtc-price-data (unwrap! (get-asset-price "sBTC") err-oracle-error))
        (stx-price (get price stx-price-data))
        (sbtc-price (get price sbtc-price-data))
        (health-factor (unwrap! (get-user-health-factor user) err-oracle-error))
        (borrowing-power (unwrap! (get-user-borrowing-power user) err-oracle-error))
        (total-supply-usd (+ 
            (* (get amount stx-supply) stx-price)
            (* (get amount sbtc-supply) sbtc-price)))
        (total-borrow-usd (+ 
            (* (get amount stx-borrow) stx-price)
            (* (get amount sbtc-borrow) sbtc-price)))
        (stx-supply-apy (unwrap! (calculate-supply-apy "STX") err-division-by-zero))
        (sbtc-supply-apy (unwrap! (calculate-supply-apy "sBTC") err-division-by-zero))
        (stx-borrow-apr (unwrap! (calculate-borrow-apr "STX") err-division-by-zero))
        (sbtc-borrow-apr (unwrap! (calculate-borrow-apr "sBTC") err-division-by-zero))
    )
        (ok {
            health-factor: health-factor,
            borrowing-power: borrowing-power,
            total-supply-usd: total-supply-usd,
            total-borrow-usd: total-borrow-usd,
            net-apy: (calculate-net-apy 
                (get amount stx-supply) stx-supply-apy
                (get amount sbtc-supply) sbtc-supply-apy
                (get amount stx-borrow) stx-borrow-apr
                (get amount sbtc-borrow) sbtc-borrow-apr
                stx-price sbtc-price),
            supplies: {
                stx: {
                    amount: (get amount stx-supply),
                    value-usd: (* (get amount stx-supply) stx-price),
                    is-collateral: (get is-collateral stx-supply),
                    apy: stx-supply-apy
                },
                sbtc: {
                    amount: (get amount sbtc-supply),
                    value-usd: (* (get amount sbtc-supply) sbtc-price),
                    is-collateral: (get is-collateral sbtc-supply),
                    apy: sbtc-supply-apy
                }
            },
            borrows: {
                stx: {
                    amount: (get amount stx-borrow),
                    value-usd: (* (get amount stx-borrow) stx-price),
                    apr: stx-borrow-apr
                },
                sbtc: {
                    amount: (get amount sbtc-borrow),
                    value-usd: (* (get amount sbtc-borrow) sbtc-price),
                    apr: sbtc-borrow-apr
                }
            }
        })
    )
)

(define-private (calculate-net-apy 
    (stx-supply-amt uint) (stx-supply-rate uint)
    (sbtc-supply-amt uint) (sbtc-supply-rate uint)
    (stx-borrow-amt uint) (stx-borrow-rate uint)
    (sbtc-borrow-amt uint) (sbtc-borrow-rate uint)
    (stx-price uint) (sbtc-price uint))
    (let (
        (total-supply-value (+ (* stx-supply-amt stx-price) (* sbtc-supply-amt sbtc-price)))
        (supply-earnings (+ 
            (/ (* (* stx-supply-amt stx-price) stx-supply-rate) precision)
            (/ (* (* sbtc-supply-amt sbtc-price) sbtc-supply-rate) precision)))
        (borrow-costs (+ 
            (/ (* (* stx-borrow-amt stx-price) stx-borrow-rate) precision)
            (/ (* (* sbtc-borrow-amt sbtc-price) sbtc-borrow-rate) precision)))
        (net-earnings (if (>= supply-earnings borrow-costs)
            (- supply-earnings borrow-costs)
            u0))
    )
        (if (is-eq total-supply-value u0)
            u0
            (/ (* net-earnings precision) total-supply-value)
        )
    )
)

;; INITIALIZE

(begin
    (var-set last-update-block block-height)
)