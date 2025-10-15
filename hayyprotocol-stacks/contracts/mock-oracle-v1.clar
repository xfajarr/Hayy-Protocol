(define-data-var contract-owner principal tx-sender)

(define-map prices
  (string-ascii 10)
  {
    price: uint,
    last-updated-at: uint
  }
)

(define-constant PRICE_PRECISION u100000000)

(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_PRICE_NOT_AVAILABLE (err u404))

(define-public (set-price (symbol (string-ascii 10)) (price uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (map-set prices symbol {
      price: price,
      last-updated-at: burn-block-height
    })
    (print { topic: "price-update", symbol: symbol, price: price })
    (ok true)
  )
)

(define-public (transfer-ownership (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (var-set contract-owner new-owner)
    (ok true)
  )
)

(define-read-only (get-price (symbol (string-ascii 10)))
  (match (map-get? prices symbol)
    price-data (ok price-data)
    ERR_PRICE_NOT_AVAILABLE
  )
)

(define-read-only (get-owner)
  (ok (var-get contract-owner))
)