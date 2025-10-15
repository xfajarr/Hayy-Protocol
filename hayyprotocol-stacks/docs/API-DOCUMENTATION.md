# Hayy Protocol Stacks - API Documentation

## Overview

Hayy Protocol is a cross-chain lending protocol that enables users to supply collateral on Stacks and borrow assets on Sui. This documentation covers all smart contracts in the Stacks implementation.

## Contract Architecture

### Core Contracts

1. **money-market-core.clar** - Main lending protocol contract
2. **mock-sbtc-v1.clar** - Mock sBTC token (SIP-010 standard)
3. **mock-oracle-v1.clar** - Mock price oracle for testing

---

## 1. Money Market Core Contract

### Contract Principal
`.money-market-core`

### Constants

| Name | Value | Description |
|------|-------|-------------|
| `sbtc-contract` | `.mock-sbtc-v1` | sBTC token contract reference |
| `oracle-contract` | `.mock-oracle-v1` | Price oracle contract reference |
| `precision` | `1000000` | 6 decimal precision for calculations |
| `health-factor-threshold` | `1000000` | 1.0 - minimum health factor before liquidation |
| `stx-ltv` | `700000` | 70% loan-to-value ratio for STX |
| `stx-liquidation-threshold` | `850000` | 85% liquidation threshold for STX |
| `sbtc-ltv` | `700000` | 70% loan-to-value ratio for sBTC |
| `sbtc-liquidation-threshold` | `850000` | 85% liquidation threshold for sBTC |

### Error Codes

| Code | Error | Description |
|------|-------|-------------|
| `u100` | err-unauthorized | Caller not authorized |
| `u101` | err-insufficient-collateral | Insufficient collateral balance |
| `u102` | err-insufficient-liquidity | Insufficient liquidity in pool |
| `u103` | err-position-not-found | User position does not exist |
| `u104` | err-invalid-amount | Amount must be greater than 0 |
| `u105` | err-health-factor-too-low | Health factor below threshold |
| `u106` | err-not-liquidatable | Position not eligible for liquidation |
| `u107` | err-asset-not-supported | Asset not supported |
| `u108` | err-oracle-error | Oracle price fetch failed |
| `u109` | err-division-by-zero | Division by zero error |

---

### Public Functions

#### Supply Functions

##### `supply-stx(amount, use-as-collateral)`
- **Type**: Public Function
- **Parameters**:
  - `amount` (uint): Amount of STX to supply (in micro-STX)
  - `use-as-collateral` (bool): Whether to use supplied STX as collateral
- **Returns**: `(response bool uint)`
- **Description**: Supply STX to the lending protocol
- **Access**: Any user
- **Events**: Emits `supply` event with asset, user, amount, and collateral status

##### `supply-sbtc(amount, use-as-collateral)`
- **Type**: Public Function
- **Parameters**:
  - `amount` (uint): Amount of sBTC to supply
  - `use-as-collateral` (bool): Whether to use supplied sBTC as collateral
- **Returns**: `(response bool uint)`
- **Description**: Supply sBTC to the lending protocol
- **Access**: Any user
- **Events**: Emits `supply` event with asset, user, amount, and collateral status

#### Withdraw Functions

##### `withdraw-stx(amount)`
- **Type**: Public Function
- **Parameters**:
  - `amount` (uint): Amount of STX to withdraw (in micro-STX)
- **Returns**: `(response bool uint)`
- **Description**: Withdraw STX from the protocol
- **Access**: Any user
- **Requirements**: 
  - Must have sufficient supplied balance
  - Health factor must remain above threshold after withdrawal
- **Events**: Emits `withdraw` event

##### `withdraw-sbtc(amount)`
- **Type**: Public Function
- **Parameters**:
  - `amount` (uint): Amount of sBTC to withdraw
- **Returns**: `(response bool uint)`
- **Description**: Withdraw sBTC from the protocol
- **Access**: Any user
- **Requirements**: 
  - Must have sufficient supplied balance
  - Health factor must remain above threshold after withdrawal
- **Events**: Emits `withdraw` event

#### Borrow Functions

##### `borrow-stx(amount)`
- **Type**: Public Function
- **Parameters**:
  - `amount` (uint): Amount of STX to borrow (in micro-STX)
- **Returns**: `(response bool uint)`
- **Description**: Borrow STX from the protocol
- **Access**: Any user
- **Requirements**:
  - Sufficient liquidity available
  - Borrowing power must cover the requested amount
- **Events**: Emits `borrow` event

##### `borrow-sbtc(amount)`
- **Type**: Public Function
- **Parameters**:
  - `amount` (uint): Amount of sBTC to borrow
- **Returns**: `(response bool uint)`
- **Description**: Borrow sBTC from the protocol
- **Access**: Any user
- **Requirements**:
  - Sufficient liquidity available
  - Borrowing power must cover the requested amount
- **Events**: Emits `borrow` event

#### Repay Functions

##### `repay-stx(amount)`
- **Type**: Public Function
- **Parameters**:
  - `amount` (uint): Amount of STX to repay (in micro-STX)
- **Returns**: `(response bool uint)`
- **Description**: Repay borrowed STX
- **Access**: Any user
- **Note**: Will repay up to the total borrowed amount (excess is not returned)
- **Events**: Emits `repay` event

##### `repay-sbtc(amount)`
- **Type**: Public Function
- **Parameters**:
  - `amount` (uint): Amount of sBTC to repay
- **Returns**: `(response bool uint)`
- **Description**: Repay borrowed sBTC
- **Access**: Any user
- **Note**: Will repay up to the total borrowed amount (excess is not returned)
- **Events**: Emits `repay` event

#### Collateral Management

##### `enable-collateral(asset)`
- **Type**: Public Function
- **Parameters**:
  - `asset` (string-ascii 10): Asset symbol ("STX" or "sBTC")
- **Returns**: `(response bool uint)`
- **Description**: Enable supplied asset as collateral
- **Access**: Any user
- **Requirements**: Must have supplied balance of the asset
- **Events**: Emits `enable-collateral` event

##### `disable-collateral(asset)`
- **Type**: Public Function
- **Parameters**:
  - `asset` (string-ascii 10): Asset symbol ("STX" or "sBTC")
- **Returns**: `(response bool uint)`
- **Description**: Disable asset as collateral
- **Access**: Any user
- **Requirements**: Health factor must remain above threshold
- **Events**: Emits `disable-collateral` event

#### Liquidation

##### `liquidate-sbtc-with-stx(user, repay-amount)`
- **Type**: Public Function
- **Parameters**:
  - `user` (principal): Address of the borrower to liquidate
  - `repay-amount` (uint): Amount of sBTC debt to repay
- **Returns**: `(response bool uint)`
- **Description**: Liquidate a user's sBTC position using STX
- **Access**: Any liquidator
- **Requirements**:
  - User's health factor must be below threshold
  - User must have sBTC debt
- **Events**: Emits `liquidate` event

#### Admin Functions

##### `admin-skim-sbtc(amount)`
- **Type**: Public Function
- **Parameters**:
  - `amount` (uint): Amount of sBTC to skim
- **Returns**: `(response bool uint)`
- **Description**: Admin function to skim sBTC from contract
- **Access**: Contract owner only
- **Security**: Critical admin function

---

### Read-Only Functions

#### Price Oracle

##### `get-asset-price(asset)`
- **Type**: Read-Only Function
- **Parameters**:
  - `asset` (string-ascii 10): Asset symbol ("STX" or "sBTC")
- **Returns**: `(response {price: uint, last-updated-at: uint} uint)`
- **Description**: Get current price of asset from oracle

#### User Position Queries

##### `get-user-borrowing-power(user)`
- **Type**: Public Function (read-only)
- **Parameters**:
  - `user` (principal): User address
- **Returns**: `(response uint uint)`
- **Description**: Calculate user's total borrowing power based on collateral

##### `get-user-health-factor(user)`
- **Type**: Public Function (read-only)
- **Parameters**:
  - `user` (principal): User address
- **Returns**: `(response uint uint)`
- **Description**: Calculate user's health factor (max value if no debt)

##### `get-user-dashboard(user)`
- **Type**: Public Function (read-only)
- **Parameters**:
  - `user` (principal): User address
- **Returns**: `(response {health-factor: uint, borrowing-power: uint, total-supply-usd: uint, total-borrow-usd: uint, supplies: {...}, borrows: {...}} uint)`
- **Description**: Get comprehensive user dashboard data

#### Protocol Metrics

##### `get-protocol-metrics()`
- **Type**: Public Function (read-only)
- **Parameters**: None
- **Returns**: `(response {tvl: uint, total-borrows: uint, available-liquidity: uint, reserves: uint, unique-users: uint} uint)`
- **Description**: Get protocol-wide metrics

#### Liquidity Queries

##### `get-available-liquidity(asset)`
- **Type**: Read-Only Function
- **Parameters**:
  - `asset` (string-ascii 10): Asset symbol ("STX" or "sBTC")
- **Returns**: `(response uint uint)`
- **Description**: Get available liquidity for lending

---

## 2. Mock sBTC Token Contract

### Contract Principal
`.mock-sbtc-v1`

### Overview
Mock implementation of sBTC following SIP-010 Fungible Token Standard with 8 decimals (same as Bitcoin).

### Public Functions

#### Token Standard Functions

##### `transfer(amount, sender, recipient, memo)`
- **Type**: Public Function
- **Parameters**:
  - `amount` (uint): Amount to transfer
  - `sender` (principal): Token owner
  - `recipient` (principal): Token recipient
  - `memo` (optional (buff 34)): Optional memo
- **Returns**: `(response bool uint)`
- **Description**: Transfer tokens between accounts
- **Access**: Token owner only

#### Mint/Burn Functions

##### `mint(amount, recipient)`
- **Type**: Public Function
- **Parameters**:
  - `amount` (uint): Amount to mint
  - `recipient` (principal): Recipient address
- **Returns**: `(response bool uint)`
- **Description**: Mint new tokens (simulates BTC peg-in)
- **Access**: Contract owner only

##### `burn(amount, sender)`
- **Type**: Public Function
- **Parameters**:
  - `amount` (uint): Amount to burn
  - `sender` (principal): Token owner
- **Returns**: `(response bool uint)`
- **Description**: Burn tokens (simulates BTC peg-out)
- **Access**: Token owner only

#### Admin Functions

##### `set-token-uri(new-uri)`
- **Type**: Public Function
- **Parameters**:
  - `new-uri` (optional (string-utf8 256)): New token URI
- **Returns**: `(response bool uint)`
- **Description**: Update token metadata URI
- **Access**: Contract owner only

### Read-Only Functions

##### `get-name()`
- **Returns**: `(response (string-ascii 32) uint)`
- **Description**: Returns "sBTC"

##### `get-symbol()`
- **Returns**: `(response (string-ascii 32) uint)`
- **Description**: Returns "sBTC"

##### `get-decimals()`
- **Returns**: `(response uint uint)`
- **Description**: Returns 8 (decimals)

##### `get-balance(account)`
- **Parameters**:
  - `account` (principal): Account address
- **Returns**: `(response uint uint)`
- **Description**: Get token balance of account

##### `get-total-supply()`
- **Returns**: `(response uint uint)`
- **Description**: Get total token supply

##### `get-token-uri()`
- **Returns**: `(response (optional (string-utf8 256)) uint)`
- **Description**: Get token metadata URI

#### Utility Functions

##### `btc-to-sbtc(btc-amount)`
- **Parameters**:
  - `btc-amount` (uint): Amount in BTC
- **Returns**: `(response uint uint)`
- **Description**: Convert BTC to sBTC units (multiply by 100,000,000)

##### `sbtc-to-btc(sbtc-amount)`
- **Parameters**:
  - `sbtc-amount` (uint): Amount in sBTC units
- **Returns**: `(response uint uint)`
- **Description**: Convert sBTC units to BTC (divide by 100,000,000)

---

## 3. Mock Oracle Contract

### Contract Principal
`.mock-oracle-v1`

### Overview
Mock price oracle for testing purposes. In production, this should be replaced with a real price feed.

### Constants

| Name | Value | Description |
|------|-------|-------------|
| `PRICE_PRECISION` | `100000000` | 8 decimal precision for prices |

### Public Functions

##### `set-price(symbol, price)`
- **Type**: Public Function
- **Parameters**:
  - `symbol` (string-ascii 10): Asset symbol
  - `price` (uint): Price in USD with 8 decimals
- **Returns**: `(response bool uint)`
- **Description**: Set price for an asset
- **Access**: Contract owner only
- **Events**: Emits `price-update` event

##### `transfer-ownership(new-owner)`
- **Type**: Public Function
- **Parameters**:
  - `new-owner` (principal): New owner address
- **Returns**: `(response bool uint)`
- **Description**: Transfer contract ownership
- **Access**: Contract owner only

### Read-Only Functions

##### `get-price(symbol)`
- **Parameters**:
  - `symbol` (string-ascii 10): Asset symbol
- **Returns**: `(response {price: uint, last-updated-at: uint} uint)`
- **Description**: Get price data for asset

##### `get-owner()`
- **Returns**: `(response principal uint)`
- **Description**: Get contract owner address

---

## Event Structure

All events follow a consistent structure for monitoring and indexing:

### Supply Event
```clarity
{
  event: "supply",
  asset: "STX" | "sBTC",
  user: principal,
  amount: uint,
  use-as-collateral: bool,
  block: uint
}
```

### Withdraw Event
```clarity
{
  event: "withdraw",
  asset: "STX" | "sBTC",
  user: principal,
  amount: uint,
  block: uint
}
```

### Borrow Event
```clarity
{
  event: "borrow",
  asset: "STX" | "sBTC",
  user: principal,
  amount: uint,
  block: uint
}
```

### Repay Event
```clarity
{
  event: "repay",
  asset: "STX" | "sBTC",
  user: principal,
  amount: uint,
  block: uint
}
```

### Liquidate Event
```clarity
{
  event: "liquidate",
  target: principal,
  asset: "sBTC",
  repaid: uint,
  seized: uint,
  by: principal
}
```

### Collateral Events
```clarity
{
  event: "enable-collateral" | "disable-collateral",
  user: principal,
  asset: "STX" | "sBTC"
}
```

---

## Contract Interactions

### Typical User Flow

1. **Supply Assets**: Call `supply-stx()` or `supply-sbtc()`
2. **Enable Collateral**: Call `enable-collateral()` for supplied assets
3. **Borrow**: Call `borrow-stx()` or `borrow-sbtc()` up to borrowing power
4. **Repay**: Call `repay-stx()` or `repay-sbtc()` to reduce debt
5. **Withdraw**: Call `withdraw-stx()` or `withdraw-sbtc()` to retrieve assets

### Liquidator Flow

1. **Monitor**: Watch for positions with health factor < 1.0
2. **Liquidate**: Call `liquidate-sbtc-with-stx()` to liquidate underwater positions
3. **Profit**: Receive discounted collateral in exchange for repaying debt

### Cross-Chain Integration

The Stacks contracts are designed to work with Sui contracts through a relayer system:

- Stacks manages STX collateral deposits/withdrawals
- Sui handles all borrowing, lending, and sBTC collateral
- Relayer monitors events and synchronizes state between chains