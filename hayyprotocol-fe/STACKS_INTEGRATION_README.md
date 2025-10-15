# StackLend Frontend - Stacks Integration

## Overview

This document describes the completed integration between the StackLend frontend and the Stacks smart contracts for lending and borrowing functionality.

## What's Been Implemented

### 🏗️ Core Infrastructure

1. **Contract Reader (`stacks-contract-reader.ts`)**
   - Read-only functions to fetch data from smart contracts
   - Utility functions for STX/microSTX conversion
   - Comprehensive error handling

2. **Transaction Handler (`stacks-transactions.ts`)**
   - Write operations for all contract interactions
   - Wallet integration with transaction callbacks
   - Support for collateral, lending, and borrowing operations

3. **Configuration System (`config.ts`)**
   - Centralized contract addresses and network settings
   - Support for both testnet and mainnet
   - Protocol constants and supported tokens

### 🎯 React Hooks

1. **Data Hook (`use-stacks-data.ts`)**
   - Fetch and manage contract data with React state
   - Real-time balance updates
   - Loading states and error handling

2. **Transaction Hook (`use-stacks-transactions.ts`)**
   - Manage transaction states (loading, success, error)
   - Easy-to-use wrapper functions for contract calls
   - Automatic state management

### 🎨 UI Components

1. **StacksLendingComponent**
   - Deposit/withdraw STX to earn interest
   - Shows current balance and APY
   - Real-time transaction status

2. **StacksBorrowingComponent**
   - Borrow tokens cross-chain using STX collateral
   - Health factor and borrowing power calculation
   - Integration with EVM wallet for receiving tokens

3. **StacksCollateralComponent**
   - Manage STX collateral deposits
   - Risk monitoring and withdrawal restrictions
   - Utilization tracking

4. **Updated StacksDemo**
   - Tabbed interface for all protocol features
   - Wallet connection status
   - Protocol information and statistics

## Key Features

### 🔗 Cross-Chain Integration
- STX collateral on Stacks enables borrowing on other chains
- EVM wallet integration for receiving borrowed tokens
- Support for USDC, USDT, WBTC, and ETH

### 🛡️ Risk Management
- 80% loan-to-value ratio
- Health factor monitoring
- Automatic liquidation threshold checks
- Real-time risk warnings

### 💰 Lending Pool
- 5% APY for STX deposits
- Interest accrual
- Easy deposit/withdrawal

### 🎛️ User Experience
- Real-time balance updates
- Transaction status tracking
- Comprehensive error handling
- Responsive design

## How to Use

### 1. Connect Wallets
- Connect your Stacks wallet (required)
- Connect EVM wallet (for cross-chain borrowing)

### 2. Deposit Collateral
- Go to "Collateral" tab
- Enter STX amount to deposit
- Confirm transaction in wallet

### 3. Start Lending
- Go to "Lending" tab
- Deposit STX to earn 5% APY
- Withdraw anytime

### 4. Borrow Cross-Chain
- Go to "Borrowing" tab
- Select asset to borrow (USDC, USDT, etc.)
- Enter amount (up to 80% of collateral value)
- Tokens sent to your EVM address

## Smart Contract Functions Used

### Collateral Contract
- `deposit-collateral`: Deposit STX as collateral
- `withdraw-collateral`: Withdraw collateral (if no loans)
- `request-borrow`: Request cross-chain borrow
- `signal-repay`: Signal loan repayment
- `get-collateral`: Get user's collateral balance
- `get-borrowed-total`: Get user's borrowed amount

### Lending Contract
- `deposit-lend-collateral`: Deposit STX for lending
- `withdraw-lend-collateral`: Withdraw from lending pool
- `get-lend-balance`: Get user's lending balance
- `get-total-lend`: Get total pool size
- `get-lend-apy-bps`: Get lending APY

## Configuration

### Contract Addresses
Update addresses in `src/lib/config.ts` after deployment:

```typescript
export const CONTRACT_ADDRESSES = {
  testnet: {
    COLLATERAL: { address: 'YOUR_ADDRESS', name: 'collateral-v1' },
    LENDING: { address: 'YOUR_ADDRESS', name: 'lending-v1' }
  }
};
```

### Network Settings
Switch between testnet and mainnet:

```typescript
export const NETWORK_CONFIG = {
  NETWORK: 'testnet' // or 'mainnet'
};
```

## File Structure

```
src/
├── components/
│   ├── borrow/
│   │   └── StacksBorrowingComponent.tsx
│   ├── lend/
│   │   └── StacksLendingComponent.tsx
│   ├── common/
│   │   └── StacksCollateralComponent.tsx
│   └── StacksDemo.tsx
├── hooks/
│   ├── use-stacks-data.ts
│   └── use-stacks-transactions.ts
└── lib/
    ├── config.ts
    ├── stacks-contract-reader.ts
    └── stacks-transactions.ts
```

## Next Steps

1. **Deploy Contracts**: Deploy the smart contracts to testnet/mainnet
2. **Update Addresses**: Update contract addresses in config.ts
3. **Test Integration**: Test all functionality with deployed contracts
4. **Add Relayer**: Integrate with relayer system for cross-chain operations
5. **Production Deploy**: Deploy frontend to production

## Error Handling

The integration includes comprehensive error handling for:
- Network connectivity issues
- Wallet connection problems
- Insufficient funds
- Contract interaction failures
- Invalid transaction parameters

## Security Features

- Input validation on all user inputs
- Safe transaction parameter handling
- Wallet signature verification
- Network configuration validation
- Error boundary protection

This completes the frontend integration with Stacks smart contracts for the core lending and borrowing functionality.
