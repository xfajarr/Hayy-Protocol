import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStacks } from '@/hooks/use-stacks';
import { useStacksContractData } from '@/hooks/use-stacks-data';
import { useStacksTransactions } from '@/hooks/use-stacks-transactions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoaderIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';

export const StacksLendingComponent = () => {
  const { address, isConnected } = useStacks();
  const { lendingData, loading: dataLoading, refreshData } = useStacksContractData(address);
  const { 
    lendingTxState, 
    depositLending, 
    withdrawLending, 
    resetState 
  } = useStacksTransactions();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const handleDeposit = async () => {
    if (!address || !depositAmount) return;
    
    try {
      await depositLending(depositAmount, address);
      setDepositAmount('');
      // Refresh data after successful transaction
      setTimeout(refreshData, 2000);
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!address || !withdrawAmount) return;
    
    try {
      await withdrawLending(withdrawAmount, address);
      setWithdrawAmount('');
      // Refresh data after successful transaction
      setTimeout(refreshData, 2000);
    } catch (error) {
      console.error('Withdraw failed:', error);
    }
  };

  const handleResetTxState = () => {
    resetState('lending');
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>STX Lending Pool</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              Please connect your Stacks wallet to access lending features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>STX Lending Pool</CardTitle>
        {lendingData && (
          <div className="text-sm text-muted-foreground">
            <p>Your Balance: {lendingData.lendBalance.toFixed(6)} STX</p>
            <p>Total Pool: {lendingData.totalLend.toFixed(2)} STX</p>
            <p>APY: {(lendingData.lendApyBps / 100).toFixed(2)}%</p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transaction Status */}
        {lendingTxState.loading && (
          <Alert>
            <LoaderIcon className="h-4 w-4 animate-spin" />
            <AlertDescription>Transaction in progress...</AlertDescription>
          </Alert>
        )}
        
        {lendingTxState.error && (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              {lendingTxState.error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2" 
                onClick={handleResetTxState}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {lendingTxState.txId && (
          <Alert>
            <CheckCircleIcon className="h-4 w-4" />
            <AlertDescription>
              Transaction successful! TX ID: {lendingTxState.txId.slice(0, 8)}...
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2" 
                onClick={handleResetTxState}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Deposit Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Deposit STX to Earn Interest</h3>
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Amount (STX)</Label>
            <Input
              id="deposit-amount"
              type="number"
              placeholder="Enter STX amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={lendingTxState.loading}
            />
          </div>
          <Button 
            onClick={handleDeposit}
            disabled={!depositAmount || lendingTxState.loading || dataLoading}
            className="w-full"
          >
            {lendingTxState.loading ? (
              <>
                <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Deposit STX'
            )}
          </Button>
        </div>

        {/* Withdraw Section */}
        {lendingData && lendingData.lendBalance > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Withdraw STX</h3>
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount (STX)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="Enter STX amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={lendingTxState.loading}
                max={lendingData.lendBalance}
              />
              <p className="text-xs text-muted-foreground">
                Available: {lendingData.lendBalance.toFixed(6)} STX
              </p>
            </div>
            <Button 
              onClick={handleWithdraw}
              disabled={!withdrawAmount || lendingTxState.loading || dataLoading}
              variant="outline"
              className="w-full"
            >
              {lendingTxState.loading ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Withdraw STX'
              )}
            </Button>
          </div>
        )}

        {/* Pool Statistics */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Pool Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Value Locked</p>
              <p className="font-medium">
                {lendingData ? `${lendingData.totalLend.toFixed(2)} STX` : '---'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Current APY</p>
              <p className="font-medium text-green-600">
                {lendingData ? `${(lendingData.lendApyBps / 100).toFixed(2)}%` : '---'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
