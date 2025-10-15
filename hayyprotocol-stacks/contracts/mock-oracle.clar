(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-invalid-price (err u101))
(define-constant err-price-too-old (err u102))
(define-constant err-asset-not-found (err u103))

(define-constant price-decimals u6)

(define-constant max-price-age u6)

(define-map price-feeds
    { asset: (string-ascii 10) }
    {
        price: uint,           ;; Price in USD with 6 decimals
        last-update: uint,     ;; Block height of last update
        source: (string-ascii 50)  ;; Price source identifier
    }
)

(define-map authorized-updaters principal bool)

(map-set authorized-updaters contract-owner true)

(define-read-only (get-stx-price)
    (let ((price-data (map-get? price-feeds { asset: "STX" })))
        (match price-data
            data (ok {
                price: (get price data),
                last-update: (get last-update data),
                source: (get source data)
            })
            err-asset-not-found
        )
    )
)

(define-read-only (get-sbtc-price)
    (let ((price-data (map-get? price-feeds { asset: "sBTC" })))
        (match price-data
            data (ok {
                price: (get price data),
                last-update: (get last-update data),
                source: (get source data)
            })
            err-asset-not-found
        )
    )
)

(define-read-only (get-price (asset (string-ascii 10)))
    (let ((price-data (map-get? price-feeds { asset: asset })))
        (match price-data
            data (ok {
                price: (get price data),
                last-update: (get last-update data),
                source: (get source data)
            })
            err-asset-not-found
        )
    )
)

(define-read-only (is-price-fresh (asset (string-ascii 10)))
    (let ((price-data (map-get? price-feeds { asset: asset })))
        (match price-data
            data (ok (< (- block-height (get last-update data)) max-price-age))
            err-asset-not-found
        )
    )
)

(define-read-only (get-stx-sbtc-rate)
    (let (
        (stx-data (unwrap! (map-get? price-feeds { asset: "STX" }) err-asset-not-found))
        (sbtc-data (unwrap! (map-get? price-feeds { asset: "sBTC" }) err-asset-not-found))
        (stx-price (get price stx-data))
        (sbtc-price (get price sbtc-data))
    )
        (ok (/ (* sbtc-price (pow u10 price-decimals)) stx-price))
    )
)

(define-read-only (get-sbtc-stx-rate)
    (let (
        (stx-data (unwrap! (map-get? price-feeds { asset: "STX" }) err-asset-not-found))
        (sbtc-data (unwrap! (map-get? price-feeds { asset: "sBTC" }) err-asset-not-found))
        (stx-price (get price stx-data))
        (sbtc-price (get price sbtc-data))
    )
        (ok (/ (* stx-price (pow u10 price-decimals)) sbtc-price))
    )
)

(define-read-only (convert-amount (from-asset (string-ascii 10)) (to-asset (string-ascii 10)) (amount uint))
    (let (
        (from-data (unwrap! (map-get? price-feeds { asset: from-asset }) err-asset-not-found))
        (to-data (unwrap! (map-get? price-feeds { asset: to-asset }) err-asset-not-found))
        (from-price (get price from-data))
        (to-price (get price to-data))
    )
        (ok (/ (* amount from-price) to-price))
    )
)

(define-public (update-stx-price (new-price uint) (source (string-ascii 50)))
    (begin
        (asserts! (default-to false (map-get? authorized-updaters tx-sender)) err-owner-only)
        (asserts! (> new-price u0) err-invalid-price)
        (ok (map-set price-feeds
            { asset: "STX" }
            {
                price: new-price,
                last-update: block-height,
                source: source
            }
        ))
    )
)

(define-public (update-sbtc-price (new-price uint) (source (string-ascii 50)))
    (begin
        (asserts! (default-to false (map-get? authorized-updaters tx-sender)) err-owner-only)
        (asserts! (> new-price u0) err-invalid-price)
        (ok (map-set price-feeds
            { asset: "sBTC" }
            {
                price: new-price,
                last-update: block-height,
                source: source
            }
        ))
    )
)

(define-public (update-price (asset (string-ascii 10)) (new-price uint) (source (string-ascii 50)))
    (begin
        (asserts! (default-to false (map-get? authorized-updaters tx-sender)) err-owner-only)
        (asserts! (> new-price u0) err-invalid-price)
        (ok (map-set price-feeds
            { asset: asset }
            {
                price: new-price,
                last-update: block-height,
                source: source
            }
        ))
    )
)

(define-public (batch-update-prices 
    (stx-price uint) 
    (sbtc-price uint) 
    (source (string-ascii 50)))
    (begin
        (asserts! (default-to false (map-get? authorized-updaters tx-sender)) err-owner-only)
        (asserts! (and (> stx-price u0) (> sbtc-price u0)) err-invalid-price)
        (map-set price-feeds
            { asset: "STX" }
            { price: stx-price, last-update: block-height, source: source }
        )
        (ok (map-set price-feeds
            { asset: "sBTC" }
            { price: sbtc-price, last-update: block-height, source: source }
        ))
    )
)

(define-public (add-updater (updater principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (ok (map-set authorized-updaters updater true))
    )
)

(define-public (remove-updater (updater principal))
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (ok (map-set authorized-updaters updater false))
    )
)

;; Initialize with mock prices
(begin
    ;; Sets STX price to $0.5
    (map-set price-feeds
        { asset: "STX" }
        { price: u500000, last-update: block-height, source: "INIT" }
    )
    
    ;; Sets sBTC price to $110,000
    (map-set price-feeds
        { asset: "sBTC" }
        { price: u110000000000, last-update: block-height, source: "INIT" }
    )
)