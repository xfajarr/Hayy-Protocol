import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStacks } from '@/hooks/use-stacks';
import { useEVM } from '@/hooks/use-evm';
import { StacksLendingComponent } from '@/components/lend/StacksLendingComponent';
import { StacksBorrowingComponent } from '@/components/borrow/StacksBorrowingComponent';
import { StacksCollateralComponent } from '@/components/common/StacksCollateralComponent';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WalletIcon, ExternalLinkIcon, InfoIcon } from 'lucide-react';

export const StacksDemo = () => {
  const { address: stacksAddress, isConnected: stacksConnected, connect: connectStacks, disconnect: disconnectStacks } = useStacks();
  const { address: evmAddress, isConnected: evmConnected } = useEVM();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5" />
            StackLend Protocol - Stacks Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stacks Wallet Status */}
            <div className="space-y-2">
              <h3 className="font-medium">Stacks Wallet</h3>
              {stacksConnected ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-600">✓ Connected</p>
                  <p className="text-xs font-mono bg-muted p-2 rounded">
                    {stacksAddress}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={disconnectStacks}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Not connected</p>
                  <Button onClick={connectStacks}>
                    Connect Stacks Wallet
                  </Button>
                </div>
              )}
            </div>

            {/* EVM Wallet Status */}
            <div className="space-y-2">
              <h3 className="font-medium">EVM Wallet (for Cross-chain)</h3>
              {evmConnected ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-600">✓ Connected</p>
                  <p className="text-xs font-mono bg-muted p-2 rounded">
                    {evmAddress}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    For receiving borrowed tokens
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Not connected</p>
                  <p className="text-xs text-muted-foreground">
                    Connect EVM wallet to enable cross-chain borrowing
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Protocol Info */}
          <Alert className="mt-4">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>StackLend Protocol:</strong> Use STX as collateral to borrow assets on other chains, 
              or deposit STX to earn lending rewards. All powered by Clarity smart contracts on Stacks.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Main Interface */}
      {stacksConnected ? (
        <Tabs defaultValue="collateral" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="collateral">Collateral</TabsTrigger>
            <TabsTrigger value="lending">Lending</TabsTrigger>
            <TabsTrigger value="borrowing">Borrowing</TabsTrigger>
          </TabsList>

          <TabsContent value="collateral" className="space-y-4">
            <StacksCollateralComponent />
          </TabsContent>

          <TabsContent value="lending" className="space-y-4">
            <StacksLendingComponent />
          </TabsContent>

          <TabsContent value="borrowing" className="space-y-4">
            <StacksBorrowingComponent />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <WalletIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Stacks Wallet</h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              To start using StackLend, please connect your Stacks wallet. You'll be able to:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 mb-6">
              <li>• Deposit STX as collateral</li>
              <li>• Lend STX to earn interest</li>
              <li>• Borrow assets cross-chain</li>
            </ul>
            <Button onClick={connectStacks} size="lg">
              Connect Stacks Wallet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Protocol Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Protocol Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Network</p>
              <p className="font-medium">Stacks Testnet</p>
            </div>
            <div>
              <p className="text-muted-foreground">Liquidation Threshold</p>
              <p className="font-medium">80%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Lending APY</p>
              <p className="font-medium text-green-600">5.00%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Borrowing APY</p>
              <p className="font-medium text-blue-600">8.00%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Links */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Collateral Contract</span>
              <Button variant="outline" size="sm" className="h-8">
                <ExternalLinkIcon className="w-3 h-3 mr-1" />
                View
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Lending Contract</span>
              <Button variant="outline" size="sm" className="h-8">
                <ExternalLinkIcon className="w-3 h-3 mr-1" />
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
