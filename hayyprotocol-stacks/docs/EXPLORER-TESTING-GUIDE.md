# Hayy Protocol Stacks - Explorer Testing Guide

## Overview

This guide provides step-by-step instructions on how to test all contract functions using the Stacks Explorer. Each function includes the exact parameters to use and expected results.

## Prerequisites

1. **Stacks Wallet**: Install [Hiro Wallet](https://www.hiro.so/wallet) or compatible Stacks wallet
2. **Testnet STX**: Get testnet STX from the [faucet](https://explorer.stacks.co/txid/ST2F5BKZGK1ZYEQJMFH3WQSVEE7J5P3Z4JQJDQ44V.bridge-v1?chain=testnet)
3. **Explorer Access**: Use [Stacks Explorer](https://explorer.stacks.co/) (testnet)

## Contract Addresses (Testnet)

- **Money Market Core**: `ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0.money-market-core`
- **Mock sBTC**: `ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0.mock-sbtc-v1`
- **Mock Oracle**: `ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0.mock-oracle-v1`

---

## 1. Money Market Core Contract Testing

### 1.1 Supply Functions

#### Supply STX

**Function**: `supply-stx`

**Steps**:
1. Go to [Money Market Core Contract](https://explorer.stacks.co/contract/ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0.money-market-core?chain=testnet)
2. Click "Call Contract" tab
3. Select function: `supply-stx`
4. Enter parameters:
   ```
   amount: 1000000  // 1 STX (6 decimals)
   use-as-collateral: true
   ```
5. Click "Submit Transaction"
6. Confirm in your wallet

**Expected Result**: Transaction succeeds, STX transferred from your wallet to contract

**Verify**:
```clarity
// Call get-user-supply to verify
function: get-user-supply
parameters:
  user: [your wallet address]
  asset: "STX"
```

#### Supply sBTC

**Function**: `supply-sbtc`

**Prerequisites**: You need sBTC tokens first (see sBTC Mint section)

**Steps**:
1. Go to [Money Market Core Contract](https://explorer.stacks.co/contract/ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0.money-market-core?chain=testnet)
2. Click "Call Contract" tab
3. Select function: `supply-sbtc`
4. Enter parameters:
   ```
   amount: 100000000  // 1 sBTC (8 decimals)
   use-as-collateral: true
   ```
5. Click "Submit Transaction"
6. Confirm in your wallet

**Expected Result**: Transaction succeeds, sBTC transferred to contract

### 1.2 Withdraw Functions

#### Withdraw STX

**Function**: `withdraw-stx`

**Steps**:
1. Go to Money Market Core Contract
2. Select function: `withdraw-stx`
3. Enter parameters:
   ```
   amount: 500000  // 0.5 STX
   ```
4. Submit transaction

**Expected Result**: STX transferred back to your wallet

#### Withdraw sBTC

**Function**: `withdraw-sbtc`

**Steps**:
1. Go to Money Market Core Contract
2. Select function: `withdraw-sbtc`
3. Enter parameters:
   ```
   amount: 50000000  // 0.5 sBTC
   ```
4. Submit transaction

**Expected Result**: sBTC transferred back to your wallet

### 1.3 Borrow Functions

#### Borrow STX

**Function**: `borrow-stx`

**Prerequisites**: Must have collateral enabled and sufficient borrowing power

**Steps**:
1. Go to Money Market Core Contract
2. Select function: `borrow-stx`
3. Enter parameters:
   ```
   amount: 500000  // 0.5 STX
   ```
4. Submit transaction

**Expected Result**: STX transferred to your wallet

#### Borrow sBTC

**Function**: `borrow-sbtc`

**Steps**:
1. Go to Money Market Core Contract
2. Select function: `borrow-sbtc`
3. Enter parameters:
   ```
   amount: 50000000  // 0.5 sBTC
   ```
4. Submit transaction

**Expected Result**: sBTC transferred to your wallet

### 1.4 Repay Functions

#### Repay STX

**Function**: `repay-stx`

**Steps**:
1. Go to Money Market Core Contract
2. Select function: `repay-stx`
3. Enter parameters:
   ```
   amount: 250000  // 0.25 STX
   ```
4. Submit transaction

**Expected Result**: Your STX debt decreases

#### Repay sBTC

**Function**: `repay-sbtc`

**Steps**:
1. Go to Money Market Core Contract
2. Select function: `repay-sbtc`
3. Enter parameters:
   ```
   amount: 25000000  // 0.25 sBTC
   ```
4. Submit transaction

**Expected Result**: Your sBTC debt decreases

### 1.5 Collateral Management

#### Enable Collateral

**Function**: `enable-collateral`

**Steps**:
1. Go to Money Market Core Contract
2. Select function: `enable-collateral`
3. Enter parameters:
   ```
   asset: "STX"
   ```
4. Submit transaction

**Expected Result**: Your STX supply is now enabled as collateral

#### Disable Collateral

**Function**: `disable-collateral`

**Steps**:
1. Go to Money Market Core Contract
2. Select function: `disable-collateral`
3. Enter parameters:
   ```
   asset: "STX"
   ```
4. Submit transaction

**Expected Result**: Your STX supply is no longer used as collateral

### 1.6 Liquidation

#### Liquidate Position

**Function**: `liquidate-sbtc-with-stx`

**Note**: This requires a position with health factor < 1.0

**Steps**:
1. Go to Money Market Core Contract
2. Select function: `liquidate-sbtc-with-stx`
3. Enter parameters:
   ```
   user: [borrower's address]
   repay-amount: 100000000  // 1 sBTC debt to repay
   ```
4. Submit transaction

**Expected Result**: You repay sBTC debt and receive sBTC collateral at a discount

### 1.7 Read-Only Functions

#### Get User Dashboard

**Function**: `get-user-dashboard`

**Steps**:
1. Go to Money Market Core Contract
2. Click "Read Function" tab
3. Select function: `get-user-dashboard`
4. Enter parameters:
   ```
   user: [your wallet address]
   ```
5. Click "Call Read-Only Function"

**Expected Result**: Returns your complete position data including health factor, borrowing power, supplies, and borrows

#### Get User Health Factor

**Function**: `get-user-health-factor`

**Steps**:
1. Go to Money Market Core Contract
2. Click "Read Function" tab
3. Select function: `get-user-health-factor`
4. Enter parameters:
   ```
   user: [your wallet address]
   ```
5. Click "Call Read-Only Function"

**Expected Result**: Returns your health factor (1.0 = 1000000, higher is safer)

#### Get Borrowing Power

**Function**: `get-user-borrowing-power`

**Steps**:
1. Go to Money Market Core Contract
2. Click "Read Function" tab
3. Select function: `get-user-borrowing-power`
4. Enter parameters:
   ```
   user: [your wallet address]
   ```
5. Click "Call Read-Only Function"

**Expected Result**: Returns your maximum borrowing capacity in USD

#### Get Protocol Metrics

**Function**: `get-protocol-metrics`

**Steps**:
1. Go to Money Market Core Contract
2. Click "Read Function" tab
3. Select function: `get-protocol-metrics`
4. Click "Call Read-Only Function"

**Expected Result**: Returns protocol-wide TVL, total borrows, liquidity, etc.

#### Get Asset Price

**Function**: `get-asset-price`

**Steps**:
1. Go to Money Market Core Contract
2. Click "Read Function" tab
3. Select function: `get-asset-price`
4. Enter parameters:
   ```
   asset: "STX"
   ```
5. Click "Call Read-Only Function"

**Expected Result**: Returns current STX price with 8 decimals

---

## 2. Mock sBTC Token Testing

### 2.1 Token Information

**Contract**: `ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0.mock-sbtc-v1`

### 2.2 Mint sBTC (Contract Owner Only)

**Function**: `mint`

**Note**: Only contract owner can mint

**Steps**:
1. Go to [sBTC Contract](https://explorer.stacks.co/contract/ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0.mock-sbtc-v1?chain=testnet)
2. Click "Call Contract" tab
3. Select function: `mint`
4. Enter parameters:
   ```
   amount: 1000000000  // 10 sBTC
   recipient: [your wallet address]
   ```
5. Submit transaction

**Expected Result**: sBTC minted to your address

### 2.3 Transfer sBTC

**Function**: `transfer`

**Steps**:
1. Go to sBTC Contract
2. Select function: `transfer`
3. Enter parameters:
   ```
   amount: 100000000  // 1 sBTC
   sender: [your wallet address]
   recipient: [recipient address]
   memo: (optional)
   ```
4. Submit transaction

**Expected Result**: sBTC transferred to recipient

### 2.4 Burn sBTC

**Function**: `burn`

**Steps**:
1. Go to sBTC Contract
2. Select function: `burn`
3. Enter parameters:
   ```
   amount: 100000000  // 1 sBTC
   sender: [your wallet address]
   ```
4. Submit transaction

**Expected Result**: sBTC burned from your balance

### 2.5 Read-Only Functions

#### Get Balance

**Function**: `get-balance`

**Steps**:
1. Go to sBTC Contract
2. Click "Read Function" tab
3. Select function: `get-balance`
4. Enter parameters:
   ```
   account: [your wallet address]
   ```
5. Click "Call Read-Only Function"

**Expected Result**: Returns your sBTC balance

#### Get Token Info

**Functions**: `get-name`, `get-symbol`, `get-decimals`, `get-total-supply`

**Steps**:
1. Go to sBTC Contract
2. Click "Read Function" tab
3. Select any of the above functions
4. Click "Call Read-Only Function"

**Expected Results**:
- `get-name`: "sBTC"
- `get-symbol`: "sBTC"
- `get-decimals`: 8
- `get-total-supply`: Total sBTC in circulation

---

## 3. Mock Oracle Testing

### 3.1 Set Price (Contract Owner Only)

**Contract**: `ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0.mock-oracle-v1`

**Function**: `set-price`

**Steps**:
1. Go to [Oracle Contract](https://explorer.stacks.co/contract/ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0.mock-oracle-v1?chain=testnet)
2. Click "Call Contract" tab
3. Select function: `set-price`
4. Enter parameters:
   ```
   symbol: "STX"
   price: 3000000000  // $30 STX price (8 decimals)
   ```
5. Submit transaction

**Expected Result**: Price updated for STX

### 3.2 Read-Only Functions

#### Get Price

**Function**: `get-price`

**Steps**:
1. Go to Oracle Contract
2. Click "Read Function" tab
3. Select function: `get-price`
4. Enter parameters:
   ```
   symbol: "STX"
   ```
5. Click "Call Read-Only Function"

**Expected Result**: Returns STX price data with timestamp

---

## 4. Complete Testing Workflow

### 4.1 Full User Journey Test

**Step 1: Setup Oracle Prices**
```clarity
// Set STX price to $30
set-price("STX", 3000000000)

// Set sBTC price to $30,000
set-price("sBTC", 300000000000)
```

**Step 2: Get sBTC for Testing**
```clarity
// Mint 10 sBTC (if you're contract owner)
mint(1000000000, [your-address])
```

**Step 3: Supply Collateral**
```clarity
// Supply 5 STX as collateral
supply-stx(5000000, true)

// Supply 1 sBTC as collateral
supply-sbtc(100000000, true)
```

**Step 4: Check Position**
```clarity
// Get user dashboard
get-user-dashboard([your-address])

// Check borrowing power
get-user-borrowing-power([your-address])

// Check health factor
get-user-health-factor([your-address])
```

**Step 5: Borrow Assets**
```clarity
// Borrow 2 STX
borrow-stx(2000000)

// Borrow 0.5 sBTC
borrow-sbtc(50000000)
```

**Step 6: Repay Partially**
```clarity
// Repay 1 STX
repay-stx(1000000)

// Repay 0.25 sBTC
repay-sbtc(25000000)
```

**Step 7: Withdraw Some Collateral**
```clarity
// Withdraw 2 STX
withdraw-stx(2000000)

// Withdraw 0.5 sBTC
withdraw-sbtc(50000000)
```

**Step 8: Final Position Check**
```clarity
// Get final dashboard
get-user-dashboard([your-address])
```

### 4.2 Liquidation Test

**Prerequisites**: Two accounts needed (borrower and liquidator)

**Step 1: Setup Borrower Position**
```clarity
// Borrower supplies 1 STX
supply-stx(1000000, true)

// Borrower borrows maximum sBTC (creates risky position)
borrow-sbtc(20000000) // High borrow against low collateral
```

**Step 2: Check Health Factor**
```clarity
// Should be < 1.0 (liquidatable)
get-user-health-factor([borrower-address])
```

**Step 3: Liquidate**
```clarity
// Liquidator repays debt and receives collateral
liquidate-sbtc-with-stx([borrower-address], 10000000)
```

**Step 4: Verify Results**
```clarity
// Check both positions after liquidation
get-user-dashboard([borrower-address])
get-user-dashboard([liquidator-address])
```

---

## 5. Common Issues & Troubleshooting

### 5.1 Transaction Failures

**Error: `err-insufficient-collateral`**
- Cause: Trying to withdraw more than supplied
- Fix: Check your supply balance first with `get-user-supply`

**Error: `err-health-factor-too-low`**
- Cause: Withdrawal would make position unsafe
- Fix: Repay some debt first or withdraw less

**Error: `err-insufficient-liquidity`**
- Cause: Not enough assets available to borrow
- Fix: Wait for more liquidity or borrow less

**Error: `err-not-liquidatable`**
- Cause: Position health factor >= 1.0
- Fix: Only liquidate positions with health factor < 1.0

### 5.2 Price Issues

**Oracle returns error**
- Cause: Price not set for asset
- Fix: Contract owner must set price using `set-price`

### 5.3 Balance Issues

**sBTC balance shows 0**
- Cause: Haven't received sBTC tokens
- Fix: Mint sBTC (if owner) or receive from someone

---

## 6. Testing Checklist

### 6.1 Basic Functionality
- [ ] Supply STX
- [ ] Supply sBTC
- [ ] Enable/disable collateral
- [ ] Borrow STX
- [ ] Borrow sBTC
- [ ] Repay STX
- [ ] Repay sBTC
- [ ] Withdraw STX
- [ ] Withdraw sBTC

### 6.2 Read-Only Functions
- [ ] Get user dashboard
- [ ] Get health factor
- [ ] Get borrowing power
- [ ] Get protocol metrics
- [ ] Get asset prices

### 6.3 Edge Cases
- [ ] Withdraw with insufficient balance
- [ ] Borrow with insufficient collateral
- [ ] Repay more than owed
- [ ] Liquidation scenario
- [ ] Disable collateral with active borrows

### 6.4 Admin Functions
- [ ] Set oracle prices
- [ ] Mint sBTC tokens
- [ ] Transfer oracle ownership

---

## 7. Integration Testing

### 7.1 Frontend Integration

For frontend integration, focus on these read-only functions for UI updates:
- `get-user-dashboard` - Complete position view
- `get-protocol-metrics` - Global statistics
- `get-asset-price` - Current prices
- `get-available-liquidity` - Available amounts for borrowing

### 7.2 Backend Integration

For backend systems:
- Monitor events for real-time updates
- Use `get-user-health-factor` for liquidation monitoring
- Implement retry logic for failed transactions
- Cache read-only function results for performance

This guide provides comprehensive coverage of all contract functions and their testing procedures using the Stacks Explorer.