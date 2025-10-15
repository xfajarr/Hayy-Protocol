;; Mock sBTC Token Contract (SIP-010 Fungible Token Standard)
;; sBTC uses 8 decimals (same as Bitcoin)

(define-fungible-token sbtc)

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-insufficient-balance (err u102))
(define-constant err-invalid-amount (err u103))

(define-data-var token-uri (optional (string-utf8 256)) (some u"https://gateway.pinata.cloud/ipfs/QmSomeHashForSBTC"))

(define-read-only (get-name)
    (ok "sBTC")
)

(define-read-only (get-symbol)
    (ok "sBTC")
)

(define-read-only (get-decimals)
    (ok u8)  ;; 8 decimals
)

(define-read-only (get-balance (account principal))
    (ok (ft-get-balance sbtc account))
)

(define-read-only (get-total-supply)
    (ok (ft-get-supply sbtc))
)

(define-read-only (get-token-uri)
    (ok (var-get token-uri))
)

;; Transfer function (SIP-010 Standard)
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
    (begin
        (asserts! (is-eq tx-sender sender) err-not-token-owner)
        (asserts! (> amount u0) err-invalid-amount)
        (try! (ft-transfer? sbtc amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

;; Mint function - simulates sBTC peg-in (wrapping BTC)
(define-public (mint (amount uint) (recipient principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (asserts! (> amount u0) err-invalid-amount)
        (ft-mint? sbtc amount recipient)
    )
)

;; Burn function - simulates sBTC peg-out (unwrapping to BTC)
(define-public (burn (amount uint) (sender principal))
    (begin
        (asserts! (is-eq tx-sender sender) err-not-token-owner)
        (asserts! (> amount u0) err-invalid-amount)
        (ft-burn? sbtc amount sender)
    )
)

;; Update token URI (owner only)
(define-public (set-token-uri (new-uri (optional (string-utf8 256))))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (ok (var-set token-uri new-uri))
    )
)

;; 1 BTC = 100,000,000 satoshis = 100000000 units in this contract
(define-read-only (btc-to-sbtc (btc-amount uint))
    (ok (* btc-amount u100000000))
)

;; Helper function to convert satoshis to BTC (for display)
(define-read-only (sbtc-to-btc (sbtc-amount uint))
    (ok (/ sbtc-amount u100000000))
)

;; Initialize with some test tokens (equivalent to 10 BTC)
;; Remove or adjust this for production
(begin
    (try! (ft-mint? sbtc u1000000000 contract-owner))
)