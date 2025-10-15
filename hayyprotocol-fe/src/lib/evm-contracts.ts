import { useWriteContract, useReadContract, useAccount, useConfig } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { toast } from '@/hooks/use-toast';

// StackLend EVM Contract Addresses (Scroll Sepolia)
export const STACKLEND_EVM_CONTRACTS = {
  BORROW_CONTROLLER: '0x55fc7d4588b5d31e2d7e6b59079e00b0ed938821',
  TOKENS: {
    USDC: '0x7456733cb8d301cbee45c89e0aeb46edda511e7e',
    USDT: '0x217a6912a3a44dabb07851909c52557ff6d1a147',
    WBTC: '0xaf23e637893ee7ec080be5c7760152919261a2b9'
  }
};

// BorrowController ABI - Core functions for cross-chain borrowing
export const BORROW_CONTROLLER_ABI = [
  {
    type: 'function',
    name: 'borrow',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'string' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'repay',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'string' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'getTokenAddress',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'string' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    type: 'function',
    name: 'getUserBorrowBalance',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'tokenId', type: 'string' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'hasRole',
    stateMutability: 'view',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    type: 'event',
    name: 'BorrowExecuted',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'tokenId', type: 'string', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'recipient', type: 'address', indexed: true }
    ]
  },
  {
    type: 'event',
    name: 'RepaymentReceived',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'tokenId', type: 'string', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  }
] as const;

// ERC20 ABI for token operations
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  }
] as const;

// Token configuration
export const TOKEN_CONFIG = {
  USDC: { decimals: 6, symbol: 'USDC' },
  USDT: { decimals: 6, symbol: 'USDT' },
  WBTC: { decimals: 8, symbol: 'WBTC' }
} as const;

// Custom hook for EVM contract interactions
export const useStackLendEVM = () => {
  const { address, chain } = useAccount();
  const config = useConfig();
  const { writeContract } = useWriteContract();

  // Read user's borrow balance for a specific token
  const useUserBorrowBalance = (tokenId: keyof typeof TOKEN_CONFIG) => {
    return useReadContract({
      address: STACKLEND_EVM_CONTRACTS.BORROW_CONTROLLER as `0x${string}`,
      abi: BORROW_CONTROLLER_ABI,
      functionName: 'getUserBorrowBalance',
      args: address ? [address, tokenId] : undefined,
      query: { enabled: !!address }
    });
  };

  // Read token balance
  const useTokenBalance = (tokenId: keyof typeof TOKEN_CONFIG) => {
    const tokenAddress = STACKLEND_EVM_CONTRACTS.TOKENS[tokenId] as `0x${string}`;
    return useReadContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: address ? [address] : undefined,
      query: { enabled: !!address }
    });
  };

  // Read token allowance for BorrowController
  const useTokenAllowance = (tokenId: keyof typeof TOKEN_CONFIG) => {
    const tokenAddress = STACKLEND_EVM_CONTRACTS.TOKENS[tokenId] as `0x${string}`;
    return useReadContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: address ? [address as `0x${string}`, STACKLEND_EVM_CONTRACTS.BORROW_CONTROLLER as `0x${string}`] : undefined,
      query: { enabled: !!address }
    });
  };

  // Approve token spending
  const approveToken = async (tokenId: keyof typeof TOKEN_CONFIG, amount: string) => {
    if (!address) {
      toast({ title: "Please connect your wallet", variant: "destructive" });
      return;
    }

    const tokenAddress = STACKLEND_EVM_CONTRACTS.TOKENS[tokenId] as `0x${string}`;
    const decimals = TOKEN_CONFIG[tokenId].decimals;
    const parsedAmount = parseUnits(amount, decimals);
    try {
      await writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [STACKLEND_EVM_CONTRACTS.BORROW_CONTROLLER as `0x${string}`, parsedAmount],
        chain: chain,
        account: address as `0x${string}`
      });
      
      toast({ 
        title: "Approval transaction submitted",
        description: `Approving ${amount} ${tokenId} for spending`
      });
    } catch (error) {
      console.error('Approval error:', error);
      toast({ 
        title: "Approval failed", 
        description: error.message || "Failed to approve token spending",
        variant: "destructive" 
      });
    }
  };

  // Repay borrowed tokens
  const repayBorrow = async (tokenId: keyof typeof TOKEN_CONFIG, amount: string) => {
    if (!address) {
      toast({ title: "Please connect your wallet", variant: "destructive" });
      return;
    }

    const decimals = TOKEN_CONFIG[tokenId].decimals;
    const parsedAmount = parseUnits(amount, decimals);

    try {
      await writeContract({
        address: STACKLEND_EVM_CONTRACTS.BORROW_CONTROLLER as `0x${string}`,
        abi: BORROW_CONTROLLER_ABI,
        functionName: 'repay',
        args: [tokenId, parsedAmount],
        chain: chain,
        account: address as `0x${string}`
      });
      
      toast({ 
        title: "Repayment transaction submitted",
        description: `Repaying ${amount} ${tokenId}`
      });
    } catch (error) {
      console.error('Repay error:', error);
      toast({ 
        title: "Repayment failed", 
        description: error.message || "Failed to repay borrowed tokens",
        variant: "destructive" 
      });
    }
  };

  // Emergency borrow function (if direct EVM borrowing is needed)
  const emergencyBorrow = async (
    tokenId: keyof typeof TOKEN_CONFIG, 
    amount: string, 
    recipient?: string
  ) => {
    if (!address) {
      toast({ title: "Please connect your wallet", variant: "destructive" });
      return;
    }
    
    const decimals = TOKEN_CONFIG[tokenId].decimals;
    const parsedAmount = parseUnits(amount, decimals);
    const recipientAddress = recipient || address;
    
    try {
      await writeContract({
        address: STACKLEND_EVM_CONTRACTS.BORROW_CONTROLLER as `0x${string}`,
        abi: BORROW_CONTROLLER_ABI,
        functionName: 'borrow',
        args: [tokenId, parsedAmount, recipientAddress as `0x${string}`],
        chain: chain,
        account: address as `0x${string}`
      });
      
      toast({ 
        title: "Borrow transaction submitted",
        description: `Borrowing ${amount} ${tokenId}`
      });
    } catch (error) {
      console.error('Borrow error:', error);
      toast({ 
        title: "Borrow failed", 
        description: error.message || "Failed to execute borrow",
        variant: "destructive" 
      });
    }
  };

  // Helper function to format token amounts
  const formatTokenAmount = (amount: bigint, tokenId: keyof typeof TOKEN_CONFIG) => {
    const decimals = TOKEN_CONFIG[tokenId].decimals;
    return formatUnits(amount, decimals);
  };

  return {
    useUserBorrowBalance,
    useTokenBalance,
    useTokenAllowance,
    approveToken,
    repayBorrow,
    emergencyBorrow,
    formatTokenAmount,
    contracts: STACKLEND_EVM_CONTRACTS,
    tokenConfig: TOKEN_CONFIG
  };
};

export default useStackLendEVM;
