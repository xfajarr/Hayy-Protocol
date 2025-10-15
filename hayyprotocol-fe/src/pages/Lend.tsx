import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TOKENS, TokenSymbol } from "@/data/tokens";
import { useAppState } from "@/hooks/use-app-state";
import { useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import LendDrawer from "@/components/lend/LendDrawer";
import LendTable from "@/components/lend/LendTable";
import { LiquidityBootstrap } from "@/components/common/LiquidityBootstrap";
import { Coins, TrendingUp, Info, AlertTriangle } from "lucide-react";

const Lend = () => {
  const { wallet, addCollateral, positions } = useAppState();
  const [open, setOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>('STX');
  const [activeTab, setActiveTab] = useState('stacks');
  
  // Mock liquidity data - in real app, fetch from smart contracts
  const [liquidityData, setLiquidityData] = useState({
    usdc: { current: 2500, target: 50000 }, // Low liquidity = bootstrap needed
    sbtc: { current: 0.5, target: 10 }
  });

  // Stacks lending tokens
  const stacksTokens = useMemo(() => [
    { ...TOKENS.STX, available: true },
    { symbol: 'sBTC', name: 'Stacks Bitcoin', apySupply: 6.5, available: true }
  ], []);

  // Sui lending tokens  
  const suiTokens = useMemo(() => [
    { symbol: 'sBTC', name: 'Sui Bitcoin', apySupply: 7.2, available: true }
  ], []);

  const onConfirm = async (amount: number) => {
    await new Promise(r => setTimeout(r, 1200)); // simulate tx
    addCollateral(selectedToken, amount);
    toast({ 
      title: "Lending successful", 
      description: `${amount} ${selectedToken} supplied on ${activeTab === 'stacks' ? 'Stacks' : 'Sui'}.` 
    });
    setOpen(false);
  };

  const handleBootstrapDeposit = () => {
    if (!wallet) { 
      toast({ title: "Please connect a wallet first" }); 
      return; 
    }
    // Open drawer with bootstrap-specific messaging
    setSelectedToken(activeTab === 'stacks' ? 'sBTC' : 'USDC');
    setOpen(true);
    toast({
      title: "Bootstrap Mode",
      description: "You'll earn bonus rewards for helping bootstrap this pool!"
    });
  };

  return (
    <>
      <SEO title="StackLend — Lend" description="Supply assets as collateral. STX live, more assets coming soon." canonical="/lend" />
      <section className="space-y-6 animate-enter">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Lend Your Assets</h1>
          <p className="text-muted-foreground mt-1">Earn yield and power your borrowing capacity across chains.</p>
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

          {/* Stacks Tab */}
          <TabsContent value="stacks" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">Bitcoin Security</Badge>
              <Badge variant="outline">2 Assets</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* STX Lending */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                        STX
                      </div>
                      Stacks (STX)
                    </span>
                    <Badge variant="default">{TOKENS.STX.apySupply || 5.5}% APY</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Native Stacks token backed by Bitcoin security
                  </div>
                  <Button 
                    onClick={() => {
                      if (!wallet) { 
                        toast({ title: "Please connect a wallet first" }); 
                        return; 
                      }
                      setSelectedToken('STX');
                      setOpen(true);
                    }}
                    className="w-full"
                  >
                    Supply STX
                  </Button>
                </CardContent>
              </Card>

              {/* sBTC Lending */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold text-sm">
                        sBTC
                      </div>
                      Stacks Bitcoin (sBTC)
                    </span>
                    <Badge variant="default">6.5% APY</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Bitcoin on Stacks for enhanced liquidity
                  </div>
                  <Button 
                    onClick={() => {
                      if (!wallet) { 
                        toast({ title: "Please connect a wallet first" }); 
                        return; 
                      }
                      setSelectedToken('sBTC');
                      setOpen(true);
                    }}
                    className="w-full"
                  >
                    Supply sBTC
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
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Bootstrap Needed:</strong> These pools need initial liquidity to enable borrowing. 
                Early lenders earn massive bonus rewards!
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Lending Options */}
              <div className="space-y-4">
                {/* sBTC on Sui */}
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                          sBTC
                        </div>
                        Sui Bitcoin (sBTC)
                      </span>
                      <Badge variant="default">14.5% APY</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Bitcoin on Sui with bootstrap bonus rewards
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      🎁 +8% Bootstrap Bonus + NFT + 250 STACK tokens
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedToken('sBTC');
                        handleBootstrapDeposit();
                      }}
                      className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                    >
                      Bootstrap sBTC Pool
                    </Button>
                  </CardContent>
                </Card>

                {/* Future USDC Pool */}
                <Card className="hover:shadow-md transition-shadow border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                          USDC
                        </div>
                        USDC Pool (Coming Soon)
                      </span>
                      <Badge variant="outline">Soon</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Stable coin lending with competitive rates. Will have bootstrap rewards too!
                    </div>
                    <Button disabled className="w-full">
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Bootstrap Component */}
              <div>
                <LiquidityBootstrap
                  poolType="sBTC"
                  currentLiquidity={liquidityData.sbtc.current}
                  targetLiquidity={liquidityData.sbtc.target}
                  onBootstrapDeposit={handleBootstrapDeposit}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <LendDrawer 
          open={open} 
          onOpenChange={setOpen} 
          apy={selectedToken === 'STX' ? TOKENS.STX.apySupply || 5.5 : selectedToken === 'sBTC' ? (activeTab === 'stacks' ? 6.5 : 7.2) : 0} 
          onConfirm={onConfirm} 
        />
      </section>
    </>
  );
};

export default Lend;
