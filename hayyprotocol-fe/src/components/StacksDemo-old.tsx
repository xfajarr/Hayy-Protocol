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
        evmAddress,
        (data) => {
          toast({ 
            title: "Collateral deposited successfully!", 
            description: `Transaction: ${data.txId}` 
          });
          setCollateralAmount('');
        },
        () => {
          toast({ title: "Collateral deposit cancelled", variant: "default" });
        }
      );
      
      toast({ title: "Collateral deposit initiated" });
    } catch (error) {
      console.error('Collateral deposit error:', error);
      toast({ title: "Failed to deposit collateral", variant: "destructive" });
    }
  };

  const handleCrossChainBorrow = async () => {
    if (!address) {
      toast({ title: "Please connect your Stacks wallet first", variant: "destructive" });
      return;
    }

    if (!evmAddress) {
      toast({ title: "Please connect your EVM wallet to receive borrowed tokens", variant: "destructive" });
      return;
    }

    if (!borrowAmount || !borrowToken) {
      toast({ title: "Please enter borrowing details", variant: "destructive" });
      return;
    }

    try {
      // Convert amount based on token decimals
      const decimals = borrowToken === 'WBTC' ? 8 : 6;
      const tokenAmount = (parseFloat(borrowAmount) * Math.pow(10, decimals)).toString();
      
      await borrowCrossChain(
        borrowToken, 
        tokenAmount, 
        evmAddress,
        address,
        (data) => {
          toast({ 
            title: "Cross-chain borrow initiated!", 
            description: `Borrowing ${borrowAmount} ${borrowToken} to ${evmAddress}. Transaction: ${data.txId}` 
          });
          setBorrowAmount('');
        }
      );
      
      toast({ title: "Cross-chain borrow transaction initiated" });
    } catch (error) {
      console.error('Cross-chain borrow error:', error);
      toast({ title: "Failed to initiate cross-chain borrow", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>StackLend - Stacks Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Connection Status: {isConnected ? "Connected" : "Disconnected"}
            </p>
            {address && (
              <p className="text-xs text-gray-500 break-all">
                Stacks Address: {address}
              </p>
            )}
            {evmAddress && (
              <p className="text-xs text-gray-500 break-all">
                EVM Address: {evmAddress}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Contracts: {STACKLEND_CONTRACTS.COLLATERAL.address}.{STACKLEND_CONTRACTS.COLLATERAL.name}
            </p>
          </div>

          {!isConnected ? (
            <Button onClick={connect} className="w-full">
              Connect Stacks Wallet
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Collateral Management */}
              <div className="space-y-2">
                <Label htmlFor="collateral">Collateral (STX)</Label>
                <Input
                  id="collateral"
                  type="number"
                  placeholder="Enter STX amount"
                  value={collateralAmount}
                  onChange={(e) => setCollateralAmount(e.target.value)}
                />
                <Button 
                  onClick={handleDepositCollateral}
                  className="w-full"
                  disabled={!evmAddress}
                >
                  Deposit Collateral
                </Button>
                {!evmAddress && (
                  <p className="text-xs text-orange-600">
                    Connect EVM wallet to enable cross-chain borrowing
                  </p>
                )}
              </div>

              {/* Cross-Chain Borrowing */}
              <div className="space-y-2">
                <Label htmlFor="borrow">Cross-Chain Borrow</Label>
                <Select value={borrowToken} onValueChange={setBorrowToken}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="WBTC">WBTC</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="borrow"
                  type="number"
                  placeholder="Enter amount to borrow"
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                />
                <Button 
                  onClick={handleCrossChainBorrow} 
                  className="w-full"
                  disabled={!evmAddress}
                >
                  Borrow {borrowToken} to EVM
                </Button>
                {!evmAddress && (
                  <p className="text-xs text-orange-600">
                    Connect EVM wallet to receive borrowed tokens
                  </p>
                )}
              </div>

              <Button onClick={disconnect} variant="outline" className="w-full">
                Disconnect Stacks Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StacksDemo;
