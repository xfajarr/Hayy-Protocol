import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEVM } from '@/hooks/use-evm';
import { useAppState } from '@/hooks/use-app-state';
import { toast } from '@/hooks/use-toast';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import useStackLendEVM from '@/lib/evm-contracts';

export const EVMDemo = () => {
  const { address, isConnected, chainId } = useEVM();
  const { wallet } = useAppState();
  const {
    useUserBorrowBalance,
    useTokenBalance,
    useTokenAllowance,
    approveToken,
    repayBorrow,
    emergencyBorrow,
    formatTokenAmount,
    contracts,
    tokenConfig
  } = useStackLendEVM();

  const [repayAmount, setRepayAmount] = useState('');
  const [repayToken, setRepayToken] = useState<'USDC' | 'USDT' | 'WBTC'>('USDC');
  const [approveAmount, setApproveAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowToken, setBorrowToken] = useState<'USDC' | 'USDT' | 'WBTC'>('USDC');

  // Read contract data
  const { data: borrowBalance, isLoading: loadingBorrow } = useUserBorrowBalance(repayToken);
  const { data: tokenBalance, isLoading: loadingBalance } = useTokenBalance(repayToken);
  const { data: allowance, isLoading: loadingAllowance } = useTokenAllowance(repayToken);

  const getChainName = (chainId?: number) => {
    switch (chainId) {
      case 1: return "Ethereum Mainnet";
      case 137: return "Polygon";
      case 10: return "Optimism";
      case 42161: return "Arbitrum";
      case 8453: return "Base";
      case 534352: return "Scroll";
      case 11155111: return "Sepolia Testnet";
      case 534351: return "Scroll Sepolia";
      default: return "Unknown Network";
    }
  };

  const handleApproveToken = async () => {
    if (!approveAmount) {
      toast({ title: "Please enter amount to approve", variant: "destructive" });
      return;
    }

    await approveToken(repayToken, approveAmount);
  };

  const handleRepayBorrow = async () => {
    if (!repayAmount) {
      toast({ title: "Please enter repayment amount", variant: "destructive" });
      return;
    }

    await repayBorrow(repayToken, repayAmount);
  };

  const handleEmergencyBorrow = async () => {
    if (!borrowAmount) {
      toast({ title: "Please enter borrow amount", variant: "destructive" });
      return;
    }

    await emergencyBorrow(borrowToken, borrowAmount);
  };

  const isScrollSepolia = chainId === 534351;

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>StackLend - EVM Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Connection Status: {isConnected ? "Connected" : "Disconnected"}
            </p>
            {address && (
              <p className="text-xs text-gray-500 break-all">
                EVM Address: {address}
              </p>
            )}
            {chainId && (
              <p className="text-xs text-gray-500">
                Network: {getChainName(chainId)} ({chainId})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              BorrowController: {contracts.BORROW_CONTROLLER}
            </p>
            {!isScrollSepolia && chainId && (
              <p className="text-xs text-orange-600">
                ⚠️ Please switch to Scroll Sepolia (534351) for StackLend
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <ConnectButton />
          </div>

          {isConnected && isScrollSepolia && (
            <div className="space-y-6">
              {/* Account Information */}
              <div className="space-y-2">
                <Label>Account Information</Label>
                <div className="text-xs space-y-1">
                  <p>Borrow Balance ({repayToken}): {
                    loadingBorrow ? 'Loading...' : 
                    borrowBalance ? formatTokenAmount(borrowBalance, repayToken) : '0'
                  }</p>
                  <p>Token Balance ({repayToken}): {
                    loadingBalance ? 'Loading...' : 
                    tokenBalance ? formatTokenAmount(tokenBalance, repayToken) : '0'
                  }</p>
                  <p>Allowance ({repayToken}): {
                    loadingAllowance ? 'Loading...' : 
                    allowance ? formatTokenAmount(allowance, repayToken) : '0'
                  }</p>
                </div>
              </div>

              {/* Token Selection */}
              <div className="space-y-2">
                <Label>Select Token</Label>
                <Select value={repayToken} onValueChange={(value: 'USDC' | 'USDT' | 'WBTC') => setRepayToken(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="WBTC">WBTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Token Approval */}
              <div className="space-y-2">
                <Label htmlFor="approve">Approve Token Spending</Label>
                <Input
                  id="approve"
                  type="number"
                  placeholder="Enter amount to approve"
                  value={approveAmount}
                  onChange={(e) => setApproveAmount(e.target.value)}
                />
                <Button onClick={handleApproveToken} className="w-full">
                  Approve {repayToken}
                </Button>
              </div>

              {/* Repay Borrowed Tokens */}
              <div className="space-y-2">
                <Label htmlFor="repay">Repay Borrowed Tokens</Label>
                <Input
                  id="repay"
                  type="number"
                  placeholder="Enter repayment amount"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                />
                <Button onClick={handleRepayBorrow} className="w-full">
                  Repay {repayToken}
                </Button>
              </div>

              {/* Emergency Borrow (Direct EVM) */}
              <div className="space-y-2">
                <Label htmlFor="emergency">Emergency Borrow (Direct)</Label>
                <Select value={borrowToken} onValueChange={(value: 'USDC' | 'USDT' | 'WBTC') => setBorrowToken(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select token to borrow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="WBTC">WBTC</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="emergency"
                  type="number"
                  placeholder="Enter borrow amount"
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                />
                <Button onClick={handleEmergencyBorrow} className="w-full" variant="outline">
                  Emergency Borrow {borrowToken}
                </Button>
                <p className="text-xs text-orange-600">
                  ⚠️ Use only if cross-chain borrow fails
                </p>
              </div>
            </div>
          )}

          {isConnected && !isScrollSepolia && (
            <div className="text-center space-y-2">
              <p className="text-orange-600">Please switch to Scroll Sepolia</p>
              <p className="text-xs text-gray-500">
                StackLend contracts are deployed on Scroll Sepolia testnet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EVMDemo;
