import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEVM } from '@/hooks/use-evm';
import { toast } from '@/hooks/use-toast';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import useStackLendEVM from '@/lib/evm-contracts';
import { Loader2, Wallet, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatUnits } from 'viem';

interface EVMBorrowingProps {
  className?: string;
}

export const EVMBorrowing: React.FC<EVMBorrowingProps> = ({ className }) => {
  const { address, isConnected, chainId } = useEVM();
  const {
    useUserBorrowBalance,
    useTokenBalance,
    useTokenAllowance,
    approveToken,
    repayBorrow,
    formatTokenAmount,
    contracts,
    tokenConfig
  } = useStackLendEVM();

  const [selectedToken, setSelectedToken] = useState<'USDC' | 'USDT' | 'WBTC'>('USDC');
  const [repayAmount, setRepayAmount] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);

  // Contract read hooks
  const { data: borrowBalance, isLoading: loadingBorrow, refetch: refetchBorrow } = useUserBorrowBalance(selectedToken);
  const { data: tokenBalance, isLoading: loadingBalance, refetch: refetchBalance } = useTokenBalance(selectedToken);
  const { data: allowance, isLoading: loadingAllowance, refetch: refetchAllowance } = useTokenAllowance(selectedToken);

  const isScrollSepolia = chainId === 534351;
  const isWrongNetwork = isConnected && !isScrollSepolia;

  // Auto-refresh data when token changes
  useEffect(() => {
    if (isConnected && isScrollSepolia) {
      refetchBorrow();
      refetchBalance();
      refetchAllowance();
    }
  }, [selectedToken, isConnected, isScrollSepolia, refetchBorrow, refetchBalance, refetchAllowance]);

  // Clear inputs when disconnected
  useEffect(() => {
    if (!isConnected) {
      setRepayAmount('');
      setApproveAmount('');
    }
  }, [isConnected]);

  const handleApproveToken = async () => {
    if (!approveAmount || parseFloat(approveAmount) <= 0) {
      toast({ 
        title: "Invalid Amount", 
        description: "Please enter a valid approval amount",
        variant: "destructive" 
      });
      return;
    }

    setIsApproving(true);
    try {
      await approveToken(selectedToken, approveAmount);
      
      // Refresh allowance after approval
      setTimeout(() => {
        refetchAllowance();
      }, 2000);
      
      setApproveAmount('');
    } catch (error) {
      console.error('Approval error:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRepayBorrow = async () => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      toast({ 
        title: "Invalid Amount", 
        description: "Please enter a valid repayment amount",
        variant: "destructive" 
      });
      return;
    }

    // Check if user has enough balance
    if (tokenBalance) {
      const userBalance = parseFloat(formatTokenAmount(tokenBalance, selectedToken));
      const repayAmountNum = parseFloat(repayAmount);
      
      if (repayAmountNum > userBalance) {
        toast({ 
          title: "Insufficient Balance", 
          description: `You only have ${userBalance.toFixed(6)} ${selectedToken}`,
          variant: "destructive" 
        });
        return;
      }
    }

    // Check if user has enough allowance
    if (allowance) {
      const currentAllowance = parseFloat(formatTokenAmount(allowance, selectedToken));
      const repayAmountNum = parseFloat(repayAmount);
      
      if (repayAmountNum > currentAllowance) {
        toast({ 
          title: "Insufficient Allowance", 
          description: `Please approve at least ${repayAmountNum} ${selectedToken} first`,
          variant: "destructive" 
        });
        return;
      }
    }

    setIsRepaying(true);
    try {
      await repayBorrow(selectedToken, repayAmount);
      
      // Refresh data after repayment
      setTimeout(() => {
        refetchBorrow();
        refetchBalance();
        refetchAllowance();
      }, 3000);
      
      setRepayAmount('');
    } catch (error) {
      console.error('Repayment error:', error);
    } finally {
      setIsRepaying(false);
    }
  };

  const formatBalance = (balance: bigint | undefined, loading: boolean) => {
    if (loading) return 'Loading...';
    if (!balance) return '0';
    return parseFloat(formatTokenAmount(balance, selectedToken)).toFixed(6);
  };

  const hasActiveBorrow = borrowBalance && borrowBalance > 0n;
  const hasTokenBalance = tokenBalance && tokenBalance > 0n;
  const hasAllowance = allowance && allowance > 0n;

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            EVM Borrowing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <Wallet className="h-12 w-12 mx-auto text-gray-400" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Connect your EVM wallet to manage borrowing</p>
              <p className="text-xs text-gray-500">
                Repay borrowed tokens and manage allowances
              </p>
            </div>
            <ConnectButton />
          </div>
          
          <div className="border-t pt-4">
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Network:</strong> Scroll Sepolia (534351)</p>
              <p><strong>Contract:</strong> {contracts.BORROW_CONTROLLER}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isWrongNetwork) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Wrong Network
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-orange-500" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Please switch to Scroll Sepolia</p>
              <p className="text-xs text-gray-500">
                StackLend contracts are deployed on Scroll Sepolia testnet (Chain ID: 534351)
              </p>
              <p className="text-xs text-orange-600">
                Current network: {chainId}
              </p>
            </div>
            <ConnectButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          EVM Borrowing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Network Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">Connected to Scroll Sepolia</span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            {address}
          </p>
        </div>

        {/* Token Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Token</Label>
          <Select value={selectedToken} onValueChange={(value: 'USDC' | 'USDT' | 'WBTC') => setSelectedToken(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select token" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USDC">USDC (6 decimals)</SelectItem>
              <SelectItem value="USDT">USDT (6 decimals)</SelectItem>
              <SelectItem value="WBTC">WBTC (8 decimals)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Account Information */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Account Information</Label>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Borrowed ({selectedToken}):</span>
              <span className={hasActiveBorrow ? 'text-red-600 font-medium' : 'text-gray-600'}>
                {formatBalance(borrowBalance, loadingBorrow)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Wallet Balance ({selectedToken}):</span>
              <span className={hasTokenBalance ? 'text-green-600 font-medium' : 'text-gray-600'}>
                {formatBalance(tokenBalance, loadingBalance)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Allowance ({selectedToken}):</span>
              <span className={hasAllowance ? 'text-blue-600 font-medium' : 'text-gray-600'}>
                {formatBalance(allowance, loadingAllowance)}
              </span>
            </div>
          </div>
        </div>

        {/* Token Approval */}
        <div className="space-y-3">
          <Label htmlFor="approve" className="text-sm font-medium">
            Approve Token Spending
          </Label>
          <div className="space-y-2">
            <Input
              id="approve"
              type="number"
              placeholder={`Enter ${selectedToken} amount to approve`}
              value={approveAmount}
              onChange={(e) => setApproveAmount(e.target.value)}
              disabled={isApproving}
            />
            <Button 
              onClick={handleApproveToken} 
              className="w-full"
              disabled={isApproving || !approveAmount}
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                `Approve ${selectedToken}`
              )}
            </Button>
            <p className="text-xs text-gray-500">
              You need to approve tokens before repaying borrowed amounts
            </p>
          </div>
        </div>

        {/* Repay Borrowed Tokens */}
        {hasActiveBorrow && (
          <div className="space-y-3">
            <Label htmlFor="repay" className="text-sm font-medium">
              Repay Borrowed Tokens
            </Label>
            <div className="space-y-2">
              <Input
                id="repay"
                type="number"
                placeholder={`Enter ${selectedToken} amount to repay`}
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                disabled={isRepaying}
              />
              <Button 
                onClick={handleRepayBorrow} 
                className="w-full"
                disabled={isRepaying || !repayAmount || !hasTokenBalance}
                variant={hasActiveBorrow ? 'default' : 'outline'}
              >
                {isRepaying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Repaying...
                  </>
                ) : (
                  `Repay ${selectedToken}`
                )}
              </Button>
              {!hasTokenBalance && (
                <p className="text-xs text-orange-600">
                  You need {selectedToken} tokens in your wallet to repay
                </p>
              )}
            </div>
          </div>
        )}

        {!hasActiveBorrow && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              No active borrows for {selectedToken}. Borrowed tokens will appear here after cross-chain borrowing from Stacks.
            </p>
          </div>
        )}

        {/* Contract Information */}
        <div className="border-t pt-4">
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>BorrowController:</strong> {contracts.BORROW_CONTROLLER}</p>
            <p><strong>Token Contract:</strong> {contracts.TOKENS[selectedToken]}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EVMBorrowing;
