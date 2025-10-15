import { SEO } from "@/components/SEO";
import { useAppState } from "@/hooks/use-app-state";
import { TOKENS, PRICES_USD, TokenSymbol } from "@/data/tokens";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PositionTable } from "@/components/common/PositionTable";
import { toast } from "@/hooks/use-toast";
import { StatCard } from "@/components/common/StatCard";
import { StacksLending } from "@/components/lend/StacksLending";
import { EVMBorrowing } from "@/components/borrow/EVMBorrowing";
import { CrossChainMonitor } from "@/components/common/CrossChainMonitor";
import { useStacks } from "@/hooks/use-stacks";
import { useStacksTransactions } from "@/hooks/use-stacks-transactions";

const Dashboard = () => {
  const { totals, positions, repayBorrowed, withdrawCollateral } = useAppState();
  const stacksWallet = useStacks();
  const { executeInitAdmin, executeAddToken } = useStacksTransactions();

  const borrowedAssets = useMemo(() => ["USDC", "ETH", "WBTC"].map(sym => TOKENS[sym as keyof typeof TOKENS]).filter(t => positions[t.symbol].borrowed > 0), [positions]);

  const [repayOpen, setRepayOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const firstBorrowed = borrowedAssets[0]?.symbol as TokenSymbol | undefined;

  return (
    <>
      <SEO title="StackLend — Dashboard" description="Overview of your collateral, borrows and health on StackLend." canonical="/" />
      <section className="space-y-6 animate-enter">
        {/* Debug Stacks Wallet State */}
        {/* <div className="card-brut p-4 bg-yellow-100 border-yellow-400">
          <h3 className="font-bold">Debug: Stacks Wallet State</h3>
          <p>Connected: {stacksWallet.isConnected ? 'YES' : 'NO'}</p>
          <p>Address: {stacksWallet.address || 'Not connected'}</p>
          <Button onClick={stacksWallet.connect} className="mt-2">Test Connect Stacks</Button>
        </div> */}
        
        <header>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-muted-foreground mt-1">Your collateral, borrows, and risk overview.</p>
        </header>

        {/* Debug Section - Stacks Wallet State */}
        <div className="card-brut p-4 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">Stacks Wallet Debug</h3>
          <p className="text-sm">Connected: {stacksWallet.isConnected ? 'Yes' : 'No'}</p>
          <p className="text-sm">Address: {stacksWallet.address || 'None'}</p>
          <p className="text-sm">UserSession: {stacksWallet.userSession ? 'Available' : 'None'}</p>
          <Button 
            onClick={stacksWallet.connect} 
            size="sm" 
            className="mt-2"
            disabled={stacksWallet.isConnected}
          >
            Test Connect Stacks
          </Button>
          {stacksWallet.isConnected && (
            <div className="mt-2 space-x-2">
              <Button 
                onClick={async () => {
                  try {
                    const { showConnect } = await import('@stacks/connect');
                    await showConnect({
                      appDetails: {
                        name: 'Test App',
                        icon: window.location.origin + '/favicon.ico',
                      },
                      onFinish: () => {
                        toast({ title: "Connect test successful!" });
                      },
                      onCancel: () => {
                        toast({ title: "Connect test cancelled" });
                      }
                    });
                  } catch (error) {
                    toast({ title: "Connect test failed", description: `Error: ${error}`, variant: "destructive" });
                  }
                }}
                size="sm" 
                variant="outline"
              >
                Test Connect
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    await executeInitAdmin();
                    toast({ title: "Admin initialization started!", description: "Check your wallet for transaction" });
                  } catch (error) {
                    toast({ title: "Failed to initialize admin", description: `Error: ${error}`, variant: "destructive" });
                  }
                }}
                size="sm" 
                variant="outline"
              >
                Init Admin
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    const { initAdminSimple } = await import('@/lib/stacks-transactions-simple');
                    await initAdminSimple(
                      (data) => toast({ title: "Admin initialized!", description: `Tx: ${data.txId}` }),
                      () => toast({ title: "Admin init cancelled" })
                    );
                  } catch (error) {
                    toast({ title: "Simple init failed", description: `Error: ${error}`, variant: "destructive" });
                  }
                }}
                size="sm" 
                variant="outline"
              >
                Simple Init Admin
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    await executeAddToken('USDC');
                    toast({ title: "USDC token addition started!", description: "Check your wallet for transaction" });
                  } catch (error) {
                    toast({ title: "Failed to add USDC token", description: `Error: ${error}`, variant: "destructive" });
                  }
                }}
                size="sm" 
                variant="outline"
              >
                Add USDC Token
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    const { addTokenSimple } = await import('@/lib/stacks-transactions-simple');
                    await addTokenSimple(
                      'USDC',
                      (data) => toast({ title: "USDC token added!", description: `Tx: ${data.txId}` }),
                      () => toast({ title: "Add USDC cancelled" })
                    );
                  } catch (error) {
                    toast({ title: "Simple add token failed", description: `Error: ${error}`, variant: "destructive" });
                  }
                }}
                size="sm" 
                variant="outline"
              >
                Simple Add USDC
              </Button>
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Collateral"
            value={`${positions.STX.collateral.toFixed(2)} STX`}
            hint={`≈ $${totals.usd.collateral.toFixed(2)} USD`}
          />
          <StatCard
            title="Total Borrowed"
            value={`${totals.usd.borrowed.toFixed(2)}`}
            hint={`In USD across all borrowed assets`}
          />
          <StatCard
            title="Health Factor"
            value={totals.healthFactor}
            hint="Higher is safer. Based on 80% LTV of STX collateral."
          />
          <div className="card-brut p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-muted-foreground">Quick Actions</h3>
              <span aria-label="info" className="cursor-help select-none">ⓘ</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button variant="brutal" disabled={!firstBorrowed} onClick={() => setRepayOpen(true)}>Repay</Button>
              <Button variant="brutal" disabled={positions.STX.collateral <= 0} onClick={() => setWithdrawOpen(true)}>Withdraw</Button>
            </div>
          </div>
        </div>

        {/* Positions table */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Your Positions</h2>
          <PositionTable
            rows={[
              { symbol: "STX", collateral: positions.STX.collateral, borrowed: positions.STX.borrowed, apy: 4.2, status: "Active" },
              { symbol: "USDC", collateral: positions.USDC.collateral, borrowed: positions.USDC.borrowed, apy: 2.5, status: "Coming Soon" },
              { symbol: "ETH", collateral: positions.ETH.collateral, borrowed: positions.ETH.borrowed, apy: 3.9, status: "Coming Soon" },
              { symbol: "WBTC", collateral: positions.WBTC.collateral, borrowed: positions.WBTC.borrowed, apy: 4.9, status: "Coming Soon" },
            ]}
          />
        </div>

  {/* End summary cards */}

        <ConfirmDialog
          open={repayOpen}
          onOpenChange={setRepayOpen}
          title={firstBorrowed ? `Repay ${firstBorrowed}` : "Nothing to repay"}
          actionLabel="Confirm"
          loadingLabel="Submitting…"
          onConfirm={async (amt) => {
            if (!firstBorrowed) return;
            repayBorrowed(firstBorrowed, amt);
            toast({ title: `Repaid ${amt} ${firstBorrowed}` });
          }}
        />

        <ConfirmDialog
          open={withdrawOpen}
          onOpenChange={setWithdrawOpen}
          title="Withdraw STX Collateral"
          actionLabel="Confirm"
          loadingLabel="Submitting…"
          onConfirm={async (amt) => {
            withdrawCollateral("STX", amt);
            toast({ title: `Withdrew ${amt} STX` });
          }}
        />

        {/* Real StackLend Integration */}
        <div className="mt-8 space-y-6">
          {/* Cross-Chain Monitor */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Cross-Chain Activity</h2>
            <p className="text-muted-foreground mb-4">
              Real-time monitoring of cross-chain transactions and relayer status
            </p>
            <CrossChainMonitor />
          </div>

          {/* Lending & Borrowing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Stacks Lending & Collateral</h2>
              <p className="text-muted-foreground mb-4">
                Deposit STX as collateral and initiate cross-chain borrowing
              </p>
              <StacksLending />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">EVM Token Management</h2>
              <p className="text-muted-foreground mb-4">
                Manage borrowed tokens and repayments on Scroll Sepolia
              </p>
              <EVMBorrowing />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Dashboard;
