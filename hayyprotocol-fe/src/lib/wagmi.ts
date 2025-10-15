import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
  scrollSepolia,
  scroll,
} from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'StackLend',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get this from https://cloud.walletconnect.com
  chains: [
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    scroll,
    scrollSepolia,
    ...(process.env.NODE_ENV === 'development' ? [sepolia, scrollSepolia] : []),
  ],
  ssr: false, // If your dApp uses server side rendering (SSR)
});
