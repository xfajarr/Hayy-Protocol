import { AppStateProvider } from "@/state/AppState";
import { StacksProvider } from "@/contexts/StacksContext";
import { EVMProvider } from "@/contexts/EVMContext";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <EVMProvider>
      <StacksProvider>
        <AppStateProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 pt-6 pb-24 md:pb-8">
              {children}
            </main>
            <Footer />
            <BottomNav />
          </div>
        </AppStateProvider>
      </StacksProvider>
    </EVMProvider>
  );
};
