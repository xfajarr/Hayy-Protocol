import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStacks } from '@/hooks/use-stacks';
import { useEVM } from '@/hooks/use-evm';
import { useStacksContractData } from '@/hooks/use-stacks-data';
import { useStacksTransactions } from '@/hooks/use-stacks-transactions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { LoaderIcon, CheckCircleIcon, AlertCircleIcon, TrendingUpIcon } from 'lucide-react';

const SUPPORTED_TOKENS = [
  { id: 'USDC', name: 'USD Coin', symbol: 'USDC' },
  { id: 'USDT', name: 'Tether USD', symbol: 'USDT' },
  { id: 'WBTC', name: 'Wrapped Bitcoin', symbol: 'WBTC' },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH' }
];

export const StacksBorrowingComponent = () => {
  const { address: stacksAddress, isConnected: stacksConnected } = useStacks();
  const { address: evmAddress, isConnected: evmConnected } = useEVM();
  const { 
    collateralData, 
    tokenMetadata, 
    borrowedTokens,
    loading: dataLoading, 
    refreshData 
  } = useStacksContractData(stacksAddress);
  const { 
    borrowTxState,
    repayTxState,
    borrowToken, 
    repayToken,
    resetState 
  } = useStacksTransactions();

  const [borrowAmount, setBorrowAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('');
  const [repayToken_, setRepayToken] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  const handleBorrow = async () => {
    if (!stacksAddress || !evmAddress || !selectedToken || !borrowAmount) return;
    
    try {
      await borrowToken(selectedToken, borrowAmount, evmAddress, stacksAddress);
      setBorrowAmount('');
      setSelectedToken('');
      // Refresh data after successful transaction
      setTimeout(refreshData, 2000);
    } catch (error) {
      console.error('Borrow failed:', error);
    }
  };

  const handleRepay = async () => {
    if (!stacksAddress || !repayToken_ || !repayAmount) return;
    
    try {
      await repayToken(repayToken_, repayAmount, stacksAddress);
      setRepayAmount('');
      setRepayToken('');
      // Refresh data after successful transaction
      setTimeout(refreshData, 2000);
    } catch (error) {
      console.error('Repay failed:', error);
    }
  };

  const getTokenMetadata = (tokenId: string) => {
    return tokenMetadata[tokenId] || null;
  };

  const calculateBorrowingPower = () => {
    if (!collateralData) return 0;
    // 80% LTV (Loan-to-Value ratio)
    return (collateralData.collateralAmount * 0.8) - collateralData.borrowedAmount;
  };

  const calculateHealthFactor = () => {
    if (!collateralData || collateralData.borrowedAmount === 0) return Infinity;
    const liquidationThreshold = 0.8; // 80%
    return (collateralData.collateralAmount * liquidationThreshold) / collateralData.borrowedAmount;
  };

  if (!stacksConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cross-Chain Borrowing</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              Please connect your Stacks wallet to access borrowing features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!evmConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cross-Chain Borrowing</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              Please connect your EVM wallet to receive borrowed tokens on other chains.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const borrowingPower = calculateBorrowingPower();
  const healthFactor = calculateHealthFactor();

  return (
    <div className="space-y-6">
      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Borrowing Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Collateral</p>
              <p className="text-lg font-semibold">
                {collateralData ? `${collateralData.collateralAmount.toFixed(2)} STX` : '---'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Borrowed</p>
              <p className="text-lg font-semibold">
                ${collateralData ? collateralData.borrowedAmount.toFixed(2) : '---'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Borrowing Power</p>
              <p className="text-lg font-semibold text-green-600">
                ${borrowingPower.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Health Factor</p>
              <p className={`text-lg font-semibold ${
                healthFactor > 2 ? 'text-green-600' : 
                healthFactor > 1.2 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {healthFactor === Infinity ? '∞' : healthFactor.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Borrow Section */}
      <Card>
        <CardHeader>
          <CardTitle>Borrow Assets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transaction Status */}
          {borrowTxState.loading && (
            <Alert>
              <LoaderIcon className="h-4 w-4 animate-spin" />
              <AlertDescription>Processing borrow transaction...</AlertDescription>
            </Alert>
          )}
          
          {borrowTxState.error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>
                {borrowTxState.error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2" 
                  onClick={() => resetState('borrow')}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {borrowTxState.txId && (
            <Alert>
              <CheckCircleIcon className="h-4 w-4" />
              <AlertDescription>
                Borrow request submitted! TX ID: {borrowTxState.txId.slice(0, 8)}...
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2" 
                  onClick={() => resetState('borrow')}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Asset to Borrow</Label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a token to borrow" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_TOKENS.map((token) => {
                    const metadata = getTokenMetadata(token.id);
                    return (
                      <SelectItem key={token.id} value={token.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{token.name} ({token.symbol})</span>
                          {metadata && (
                            <Badge variant="secondary" className="ml-2">
                              {(metadata.apyBps / 100).toFixed(2)}% APY
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="borrow-amount">Amount (USD)</Label>
              <Input
                id="borrow-amount"
                type="number"
                placeholder="Enter amount to borrow"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                disabled={borrowTxState.loading}
              />
              <p className="text-xs text-muted-foreground">
                Available to borrow: ${borrowingPower.toFixed(2)}
              </p>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Receiving Address (EVM)</p>
              <p className="text-sm font-mono">{evmAddress}</p>
            </div>

            <Button 
              onClick={handleBorrow}
              disabled={!selectedToken || !borrowAmount || borrowTxState.loading || dataLoading || borrowingPower <= 0}
              className="w-full"
            >
              {borrowTxState.loading ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <TrendingUpIcon className="w-4 h-4 mr-2" />
                  Borrow {selectedToken}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Loans */}
      {borrowedTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {borrowedTokens.map((borrowed) => (
                <div key={borrowed.tokenId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{borrowed.tokenId}</p>
                    <p className="text-sm text-muted-foreground">
                      Borrowed: ${borrowed.amount.toFixed(2)}
                    </p>
                    {borrowed.metadata && (
                      <p className="text-xs text-muted-foreground">
                        APY: {(borrowed.metadata.apyBps / 100).toFixed(2)}%
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRepayToken(borrowed.tokenId)}
                  >
                    Repay
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repay Section */}
      {repayToken_ && (
        <Card>
          <CardHeader>
            <CardTitle>Repay Loan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Repay Transaction Status */}
            {repayTxState.loading && (
              <Alert>
                <LoaderIcon className="h-4 w-4 animate-spin" />
                <AlertDescription>Processing repayment signal...</AlertDescription>
              </Alert>
            )}
            
            {repayTxState.error && (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  {repayTxState.error}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-2" 
                    onClick={() => resetState('repay')}
                  >
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {repayTxState.txId && (
              <Alert>
                <CheckCircleIcon className="h-4 w-4" />
                <AlertDescription>
                  Repayment signal sent! TX ID: {repayTxState.txId.slice(0, 8)}...
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-2" 
                    onClick={() => resetState('repay')}
                  >
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label>Repaying: {repayToken_}</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Outstanding amount: $
                {borrowedTokens.find(b => b.tokenId === repayToken_)?.amount.toFixed(2) || '0.00'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="repay-amount">Repay Amount (USD)</Label>
              <Input
                id="repay-amount"
                type="number"
                placeholder="Enter amount to repay"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                disabled={repayTxState.loading}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleRepay}
                disabled={!repayAmount || repayTxState.loading}
                className="flex-1"
              >
                {repayTxState.loading ? (
                  <>
                    <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Signal Repayment'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setRepayToken('')}
                disabled={repayTxState.loading}
              >
                Cancel
              </Button>
            </div>

            <Alert>
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>
                This signals your intent to repay. You'll need to send the actual tokens through the relayer system.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
