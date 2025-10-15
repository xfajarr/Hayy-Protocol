import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BORROWABLE_TOKENS, TOKENS, TokenSymbol, PRICES_USD } from "@/data/tokens";
import { useAppState } from "@/hooks/use-app-state";
import { useMemo, useState } from "react";
import { BridgeDialog } from "@/components/common/BridgeDialog";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BorrowDrawer from "@/components/borrow/BorrowDrawer";
import BorrowTable from "@/components/borrow/BorrowTable";
import { Coins, TrendingUp, Info, AlertTriangle } from "lucide-react";

const Borrow = () => {
  const { wallet, totals, addBorrowed, addCollateral } = useAppState();
  const [selected, setSelected] = useState<null | TokenSymbol>(null);
  const [bridging, setBridging] = useState(false);
  const [activeTab, setActiveTab] = useState('stacks');

  // Mock liquidity data - in real app, fetch from smart contracts
  const [liquidityData] = useState({
    usdc: { current: 2500, target: 50000, available: 2500 },
    sbtc: { current: 0.5, target: 10, available: 0.5 }
  });

  // Sui borrowable tokens
  const suiBorrowTokens = useMemo(() => [
    { ...TOKENS.USDC, chain: 'Sui', available: true }
  ], []);

  const onConfirm = async (symbol: TokenSymbol, lockStx: number, amount: number) => {
    setBridging(true);
    // Simulate cross-chain transaction
    await new Promise(r => setTimeout(r, 3000));
    setBridging(false);
    addCollateral("STX", lockStx);
    addBorrowed(symbol, amount);
    toast({ 
      title: `Borrowed ${amount} ${symbol}`, 
      description: `Locked ${lockStx} STX as collateral on ${activeTab === 'stacks' ? 'Stacks' : 'Sui'}.` 
    });
  };

  const currentTotalsUSD = { collateralUSD: totals.usd.collateral, borrowedUSD: totals.usd.borrowed };

  const isLowLiquidity = (poolType: 'usdc' | 'sbtc') => {
    const data = liquidityData[poolType];
    return (data.current / data.target) < 0.2; // Less than 20% of target
  };

  return (
    <>
      <SEO title="StackLend — Borrow" description="Borrow assets against your collateral. Cross-chain borrowing available." canonical="/borrow" />
      <section className="space-y-6 animate-enter">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Borrow Assets</h1>
          <p className="text-muted-foreground mt-1">Borrow against your collateral across multiple blockchains.</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stacks" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Stacks Network
            </TabsTrigger>
            <TabsTrigger value="sui" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Sui Network
            </TabsTrigger>
          </TabsList>

          {/* Stacks Tab - Empty for now */}
          <TabsContent value="stacks" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">Coming Soon</Badge>
              <Badge variant="secondary">Cross-Chain Ready</Badge>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Stacks borrowing features are coming soon. You'll be able to borrow EVM tokens using STX and sBTC as collateral.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Placeholder cards */}
              <Card className="opacity-50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-sm">
                        ?
                      </div>
                      Cross-Chain Borrowing
                    </span>
                    <Badge variant="outline">Soon</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Use STX and sBTC as collateral to borrow tokens on EVM networks
                  </div>
                  <Button disabled className="w-full">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>

              <Card className="opacity-50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-sm">
                        ?
                      </div>
                      Multi-Chain Assets
                    </span>
                    <Badge variant="outline">Soon</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Access liquidity from multiple blockchain ecosystems
                  </div>
                  <Button disabled className="w-full">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sui Tab */}
          <TabsContent value="sui" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">High Performance</Badge>
              <Badge variant="outline">1 Asset</Badge>
            </div>
            
            {/* Low Liquidity Warning */}
            {isLowLiquidity('usdc') && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Low Liquidity:</strong> This pool has limited borrowing capacity. 
                  Help <a href="/lend" className="underline font-semibold">bootstrap liquidity</a> to earn bonus rewards!
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* USDC Borrowing */}
              <Card className={`hover:shadow-md transition-shadow ${isLowLiquidity('usdc') ? 'border-amber-200' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        USDC
                      </div>
                      USD Coin (USDC)
                    </span>
                    <Badge variant="default">{TOKENS.USDC.apyBorrow || 2.5}% APR</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Stable coin borrowing with competitive rates on Sui
                  </div>
                  <div className={`text-xs ${isLowLiquidity('usdc') ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    Available: {liquidityData.usdc.available.toLocaleString()} USDC
                    {isLowLiquidity('usdc') && ' ⚠️ Low Liquidity'}
                  </div>
                  
                  {isLowLiquidity('usdc') ? (
                    <div className="space-y-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (!wallet) { 
                            toast({ title: "Please connect a wallet first" }); 
                            return; 
                          }
                          setSelected('USDC');
                        }}
                        className="w-full"
                        disabled={liquidityData.usdc.available < 100}
                      >
                        {liquidityData.usdc.available < 100 ? 'Insufficient Liquidity' : 'Limited Borrow'}
                      </Button>
                      <Button 
                        onClick={() => window.open('/lend', '_blank')}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        🚀 Bootstrap Pool & Earn Rewards
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => {
                        if (!wallet) { 
                          toast({ title: "Please connect a wallet first" }); 
                          return; 
                        }
                        setSelected('USDC');
                      }}
                      className="w-full"
                    >
                      Borrow USDC
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Empty slot for future assets */}
              <Card className="hover:shadow-md transition-shadow opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-sm">
                        ?
                      </div>
                      More Assets Coming
                    </span>
                    <Badge variant="outline">Soon</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Additional borrowing opportunities will be available soon
                  </div>
                  <Button disabled className="w-full">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <BorrowDrawer
          open={selected !== null}
          onOpenChange={(v) => !v && setSelected(null)}
          token={selected ? TOKENS[selected] : null}
          currentTotalsUSD={currentTotalsUSD}
          onConfirm={async (lockStx, amt) => { if (selected) { await onConfirm(selected, lockStx, amt); setSelected(null); } }}
        />

        <BridgeDialog open={bridging} />
      </section>
    </>
  );
};

export default Borrow;
