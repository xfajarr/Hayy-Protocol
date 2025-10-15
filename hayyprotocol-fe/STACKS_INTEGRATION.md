# Stacks Wallet Integration

This project now includes real Stacks wallet connection using the official Stacks.js libraries.

## Features

- ✅ Real wallet connection using `@stacks/connect`
- ✅ Transaction handling with `@stacks/transactions`
- ✅ Network configuration with `@stacks/network`
- ✅ TypeScript support with proper types
- ✅ React hooks for easy wallet state management
- ✅ Context providers for global state management

## Libraries Used

- `@stacks/connect` - Wallet connection and authentication
- `@stacks/transactions` - Transaction building and signing
- `@stacks/network` - Network configuration

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm add @stacks/connect @stacks/transactions @stacks/network
```

### 2. Wallet Connection Hook

The `useStacksWallet` hook in `src/hooks/use-stacks-wallet.tsx` handles:
- Wallet connection state
- User session management
- Address retrieval
- Connection/disconnection methods

### 3. Transaction Utilities

The `src/lib/stacks-transactions.ts` file provides utilities for:
- Contract calls (`callContract`)
- STX transfers (`transferSTX`)
- Example lending functions (`lendSTX`, `borrowToken`, `repayLoan`)

### 4. Context Management

- `StacksProvider` in `src/contexts/StacksContext.tsx` provides wallet state
- `AppStateProvider` integrates with the Stacks wallet state
- Both providers are wrapped in the Layout component

## Usage Example

### Basic Wallet Connection

```tsx
import { useStacks } from '@/hooks/use-stacks';

function WalletComponent() {
  const { address, isConnected, connect, disconnect } = useStacks();

  return (
    <div>
      {!isConnected ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}
```

### Making Contract Calls

```tsx
import { callContract } from '@/lib/stacks-transactions';
import { uintCV, stringUtf8CV } from '@stacks/transactions';

async function lendTokens(amount: string, userAddress: string) {
  await callContract({
    contractAddress: 'YOUR_CONTRACT_ADDRESS',
    contractName: 'your-contract-name',
    functionName: 'lend',
    functionArgs: [uintCV(amount)],
    senderAddress: userAddress,
    onFinish: (data) => {
      console.log('Transaction completed:', data);
    },
    onCancel: () => {
      console.log('Transaction cancelled');
    }
  });
}
```

## Demo Component

Check the `StacksDemo` component in `src/components/StacksDemo.tsx` for a complete example of:
- Wallet connection status
- Real transaction initiation
- Error handling
- User feedback

## Network Configuration

Currently configured for **Stacks Testnet**. To switch to mainnet:

1. Change network in transaction utilities
2. Update address handling in the wallet hook
3. Use `.mainnet` instead of `.testnet` for addresses

## Testing

1. Install a Stacks wallet (e.g., Hiro Wallet, Leather)
2. Switch to Stacks testnet
3. Get testnet STX from the faucet
4. Test wallet connection and transactions

## Production Considerations

- Replace example contract addresses with your actual deployed contracts
- Switch to mainnet network configuration
- Implement proper error handling and user feedback
- Add transaction fee estimation
- Include transaction status monitoring

## File Structure

```
src/
├── hooks/
│   ├── use-stacks-wallet.tsx    # Wallet connection hook
│   ├── use-stacks.ts           # Context hook
│   └── use-app-state.ts        # App state hook
├── contexts/
│   └── StacksContext.tsx       # Stacks wallet context
├── lib/
│   └── stacks-transactions.ts  # Transaction utilities
├── components/
│   ├── StacksDemo.tsx         # Demo component
│   └── wallet/
│       └── WalletConnect.tsx   # Wallet connection UI
└── state/
    └── AppState.tsx           # Global app state
```
