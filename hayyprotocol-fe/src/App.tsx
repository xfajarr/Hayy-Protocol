import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "./lib/wagmi";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Lend from "./pages/Lend";
import Borrow from "./pages/Borrow";
import Faucet from "./pages/Faucet";
import NotFound from "./pages/NotFound";
import { Layout } from "@/components/layout/Layout";
import { StacksProvider } from "./contexts/StacksContext";

import "@rainbow-me/rainbowkit/styles.css";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { networkConfig } from "./useNetworkConfig";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        <StacksProvider>
          <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
            <WalletProvider autoConnect>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/lend" element={<Lend />} />
                      <Route path="/borrow" element={<Borrow />} />
                      <Route path="/faucet" element={<Faucet />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </BrowserRouter>
              </TooltipProvider>
            </WalletProvider>
          </SuiClientProvider>
        </StacksProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
