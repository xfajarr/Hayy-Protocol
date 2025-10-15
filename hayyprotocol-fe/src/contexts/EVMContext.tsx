import React, { createContext } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

interface EVMContextValue {
  address?: string;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  chainId?: number;
}

const EVMContext = createContext<EVMContextValue | undefined>(undefined);

export { EVMContext };

export const EVMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    // Use the first available connector (usually MetaMask or RainbowKit modal)
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  const value: EVMContextValue = {
    address,
    isConnected,
    isConnecting: isPending,
    connect: handleConnect,
    disconnect,
    chainId,
  };

  return <EVMContext.Provider value={value}>{children}</EVMContext.Provider>;
};
