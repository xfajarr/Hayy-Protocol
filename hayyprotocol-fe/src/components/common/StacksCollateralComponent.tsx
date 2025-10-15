import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStacks } from '@/hooks/use-stacks';
import { useEVM } from '@/hooks/use-evm';
import { useStacksContractData } from '@/hooks/use-stacks-data';
import { useStacksTransactions } from '@/hooks/use-stacks-transactions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoaderIcon, CheckCircleIcon, AlertCircleIcon, LockIcon } from 'lucide-react';

export const StacksCollateralComponent = () => {
  const { address: stacksAddress, isConnected: stacksConnected } = useStacks();
  const { address: evmAddress } = useEVM();
  const { 
    collateralData, 
    loading: dataLoading, 
    refreshData 
  } = useStacksContractData(stacksAddress);
  const { 
    collateralTxState,
    depositCollateral, 
    withdrawCollateral,
    resetState 
  } = useStacksTransactions();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const handleDeposit = async () => {
    if (!stacksAddress || !depositAmount) return;
    
    try {
      await depositCollateral(depositAmount);
      setDepositAmount('');
      // Refresh data after successful transaction
      setTimeout(refreshData, 2000);
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!stacksAddress || !withdrawAmount) return;
    
    try {
      await withdrawCollateral(withdrawAmount, stacksAddress);
      setWithdrawAmount('');
      // Refresh data after successful transaction
      setTimeout(refreshData, 2000);
    } catch (error) {
      console.error('Withdraw failed:', error);
    }
  };

  const calculateUtilization = () => {
    if (!collateralData || collateralData.collateralAmount === 0) return 0;
    return (collateralData.borrowedAmount / (collateralData.collateralAmount * 0.8)) * 100;
  };

  const canWithdraw = () => {
    return collateralData && collateralData.borrowedAmount === 0;
  };

  if (!stacksConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>STX Collateral</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              Please connect your Stacks wallet to manage collateral.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const utilization = calculateUtilization();

  return (
    <Card>
      <CardHeader>
        <CardTitle>STX Collateral Management</CardTitle>
        {collateralData && (
          <div className="text-sm text-muted-foreground">
            <p>Deposited: {collateralData.collateralAmount.toFixed(6)} STX</p>
            <p>Borrowed Against: ${collateralData.borrowedAmount.toFixed(2)}</p>
            <p>Utilization: {utilization.toFixed(1)}%</p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transaction Status */}
        {collateralTxState.loading && (
          <Alert>
            <LoaderIcon className="h-4 w-4 animate-spin" />
            <AlertDescription>Processing collateral transaction...</AlertDescription>
          </Alert>
        )}
        
        {collateralTxState.error && (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              {collateralTxState.error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2" 
                onClick={() => resetState('collateral')}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {collateralTxState.txId && (
          <Alert>
            <CheckCircleIcon className="h-4 w-4" />
            <AlertDescription>
              Transaction successful! TX ID: {collateralTxState.txId.slice(0, 8)}...
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2" 
                onClick={() => resetState('collateral')}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Deposit Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Deposit STX Collateral</h3>
          <div className="space-y-2">
            <Label htmlFor="collateral-deposit">Amount (STX)</Label>
            <Input
              id="collateral-deposit"
              type="number"
              placeholder="Enter STX amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={collateralTxState.loading}
            />
          </div>
          <Button 
            onClick={handleDeposit}
            disabled={!depositAmount || collateralTxState.loading || dataLoading}
            className="w-full"
          >
            {collateralTxState.loading ? (
              <>
                <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <LockIcon className="w-4 h-4 mr-2" />
                Deposit Collateral
              </>
            )}
          </Button>
        </div>

        {/* Withdraw Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Withdraw STX Collateral</h3>
          
          {!canWithdraw() && (
            <Alert>
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>
                You must repay all borrowed amounts before withdrawing collateral.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="collateral-withdraw">Amount (STX)</Label>
            <Input
              id="collateral-withdraw"
              type="number"
              placeholder="Enter STX amount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              disabled={collateralTxState.loading || !canWithdraw()}
              max={collateralData?.collateralAmount || 0}
            />
            {collateralData && (
              <p className="text-xs text-muted-foreground">
                Available: {collateralData.collateralAmount.toFixed(6)} STX
              </p>
            )}
          </div>
          <Button 
            onClick={handleWithdraw}
            disabled={!withdrawAmount || collateralTxState.loading || dataLoading || !canWithdraw()}
            variant="outline"
            className="w-full"
          >
            {collateralTxState.loading ? (
              <>
                <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Withdraw Collateral'
            )}
          </Button>
        </div>

        {/* Collateral Statistics */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-3">Collateral Overview</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Deposited</span>
              <span className="text-sm font-medium">
                {collateralData ? `${collateralData.collateralAmount.toFixed(6)} STX` : '---'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Borrowed Against</span>
              <span className="text-sm font-medium">
                ${collateralData ? collateralData.borrowedAmount.toFixed(2) : '---'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Borrowing Power Used</span>
              <span className={`text-sm font-medium ${
                utilization > 80 ? 'text-red-600' : 
                utilization > 60 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {utilization.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Available to Borrow</span>
              <span className="text-sm font-medium text-green-600">
                ${collateralData ? 
                  Math.max(0, (collateralData.collateralAmount * 0.8) - collateralData.borrowedAmount).toFixed(2) : 
                  '---'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Risk Warning */}
        {utilization > 70 && (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              Warning: High utilization ratio. Consider adding more collateral or repaying loans to avoid liquidation.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
