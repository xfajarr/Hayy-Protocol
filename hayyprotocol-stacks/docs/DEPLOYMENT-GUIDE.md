# Hayy Protocol Stacks - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Hayy Protocol Stacks contracts across different environments, along with integration steps for frontend and backend systems.

## Prerequisites

### Development Environment

1. **Node.js** (v18+)
2. **Clarinet CLI** (latest version)
3. **Git**
4. **Stacks Wallet** (Hiro Wallet or compatible)

### Installation

```bash
# Install Clarinet
curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-linux-x64.tar.gz | tar xz
sudo mv clarinet-linux-x64/clarinet /usr/local/bin/

# Verify installation
clarinet --version

# Clone repository
git clone <repository-url>
cd hayyprotocol-stacks

# Install dependencies
npm install
```

---

## 1. Local Development Setup

### 1.1 Initialize Local Environment

```bash
# Create new Clarinet project (if starting fresh)
clarinet new hayyprotocol-stacks

# Or use existing project
cd hayyprotocol-stacks

# Start local development environment
clarinet console
```

### 1.2 Local Configuration

The `Clarinet.toml` file should be configured as follows:

```toml
[project]
name = "hayyprotocol"
description = "Hayy Protocol - Cross-chain lending protocol"
authors = ["Your Name"]
telemetry = true
cache_dir = "./.cache"

[contracts.mock-sbtc-v1]
path = "contracts/mock-sbtc-v1.clar"
clarity_version = 3
epoch = "3.0"

[contracts.mock-oracle-v1]
path = "contracts/mock-oracle-v1.clar"
clarity_version = 3
epoch = "3.0"

[contracts.money-market-core]
path = "contracts/money-market-core.clar"
clarity_version = 3
epoch = "3.0"

[repl.analysis]
passes = ["check_checker"]
check_checker = { trusted_sender = false, trusted_caller = false, callee_filter = false }
```

### 1.3 Local Testing

```bash
# Run all tests
clarinet test

# Run specific test file
clarinet test --match "supply"

# Run tests with coverage
clarinet test --coverage

# Run tests with cost analysis
clarinet test --costs
```

### 1.4 Local Development Console

```bash
# Start interactive console
clarinet console

# In console, deploy contracts
::deploy-contracts

# Test functions
(stx-transfer? u1000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.money-market-core)

(contract-call? .money-market-core supply-stx u1000000 true)
```

---

## 2. Testnet Deployment

### 2.1 Testnet Configuration

Create `settings/Testnet.toml`:

```toml
[network]
name = "testnet"
stacks_node_rpc = "https://api.testnet.hiro.so"
bitcoin_node_rpc = "http://blockstack:blockstacksystem@bitcoind.testnet.stacks.co:18332"

[accounts.deployer]
mnemonic = "your testnet wallet mnemonic phrase here"

[deployment]
plan = "deployments/default.testnet-plan.yaml"
```

### 2.2 Deployment Plan

The `deployments/default.testnet-plan.yaml` should include:

```yaml
---
id: 0
name: Testnet deployment
network: testnet
stacks-node: "https://api.testnet.hiro.so"
bitcoin-node: "http://blockstack:blockstacksystem@bitcoind.testnet.stacks.co:18332"
plan:
  batches:
    - id: 0
      transactions:
        - contract-publish:
            contract-name: mock-oracle-v1
            expected-sender: ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0
            cost: 10520
            path: "contracts/mock-oracle-v1.clar"
            anchor-block-only: true
            clarity-version: 3
        - contract-publish:
            contract-name: mock-sbtc-v1
            expected-sender: ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0
            cost: 25790
            path: "contracts/mock-sbtc-v1.clar"
            anchor-block-only: true
            clarity-version: 3
        - contract-publish:
            contract-name: money-market-core
            expected-sender: ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0
            cost: 178460
            path: "contracts/money-market-core.clar"
            anchor-block-only: true
            clarity-version: 3
      epoch: "3.0"
```

### 2.3 Deploy to Testnet

```bash
# Deploy contracts
clarinet deploy --testnet

# Verify deployment
clarinet check-contracts --testnet
```

### 2.4 Post-Deployment Setup

After deployment, you need to initialize the contracts:

```bash
# Initialize oracle prices
clarinet console --testnet

# In console, set initial prices
(contract-call? .mock-oracle-v1 set-price "STX" u3000000000)  // $30 STX
(contract-call? .mock-oracle-v1 set-price "sBTC" u300000000000) // $30,000 sBTC

# Mint test sBTC (if you're the contract owner)
(contract-call? .mock-sbtc-v1 mint u1000000000 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

### 2.5 Testnet Verification

```bash
# Verify contract deployment
curl "https://api.testnet.hiro.so/v2/contracts/source/ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0.money-market-core"

# Check contract state
curl "https://api.testnet.hiro.so/v2/contracts/ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0.money-market-core"
```

---

## 3. Mainnet Deployment

### 3.1 Security Preparations

Before mainnet deployment:

1. **Security Audit**: Complete third-party security audit
2. **Multi-sig Setup**: Set up multi-signature wallet for contract ownership
3. **Test Coverage**: Ensure >95% test coverage
4. **Stress Testing**: Perform load testing on testnet
5. **Economic Modeling**: Validate economic parameters

### 3.2 Mainnet Configuration

Create `settings/Mainnet.toml`:

```toml
[network]
name = "mainnet"
stacks_node_rpc = "https://api.hiro.so"
bitcoin_node_rpc = "https://bitcoin.mainnet.stacks.co:8332"

[accounts.deployer]
mnemonic = "your mainnet multi-sig mnemonic phrase here"

[deployment]
plan = "deployments/default.mainnet-plan.yaml"

[security]
require_multisig = true
min_signers = 3
confirmation_blocks = 100
```

### 3.3 Mainnet Deployment Plan

```yaml
---
id: 0
name: Mainnet deployment
network: mainnet
stacks-node: "https://api.hiro.so"
bitcoin-node: "https://bitcoin.mainnet.stacks.co:8332"
plan:
  batches:
    - id: 0
      transactions:
        - contract-publish:
            contract-name: price-oracle-v1
            expected-sender: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
            cost: 10520
            path: "contracts/price-oracle-v1.clar"
            anchor-block-only: true
            clarity-version: 3
        - contract-publish:
            contract-name: sbtc-token-v1
            expected-sender: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
            cost: 25790
            path: "contracts/sbtc-token-v1.clar"
            anchor-block-only: true
            clarity-version: 3
        - contract-publish:
            contract-name: money-market-core
            expected-sender: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
            cost: 178460
            path: "contracts/money-market-core.clar"
            anchor-block-only: true
            clarity-version: 3
      epoch: "3.0"
```

### 3.4 Mainnet Deployment Steps

```bash
# 1. Deploy to mainnet (requires multi-sig approval)
clarinet deploy --mainnet

# 2. Verify deployment
clarinet check-contracts --mainnet

# 3. Initialize with real price oracle
# 4. Transfer ownership to multi-sig
# 5. Set up monitoring and alerting
```

---

## 4. Frontend Integration

### 4.1 Environment Configuration

Create `.env.local` for frontend:

```bash
# Stacks Configuration
VITE_STACKS_NETWORK=mainnet
VITE_STACKS_API_URL=https://api.hiro.so
VITE_STACKS_EXPLORER_URL=https://explorer.stacks.co

# Contract Addresses
VITE_MONEY_MARKET_CORE=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.money-market-core
VITE_SBTC_TOKEN=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.sbtc-token-v1
VITE_PRICE_ORACLE=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.price-oracle-v1

# Backend API
VITE_API_URL=https://api.hayyprotocol.com
VITE_WS_URL=wss://api.hayyprotocol.com/ws
```

### 4.2 Stacks.js Integration

Install required packages:

```bash
npm install @stacks/connect @stacks/transactions @stacks/auth
```

Configuration file (`src/lib/stacks-config.ts`):

```typescript
import { StacksMainnet, StacksTestnet } from '@stacks/network';

const network = import.meta.env.VITE_STACKS_NETWORK === 'mainnet' 
  ? new StacksMainnet() 
  : new StacksTestnet();

export const stacksConfig = {
  network,
  appDetails: {
    name: 'Hayy Protocol',
    icon: '/logo.png',
  },
  contractAddresses: {
    moneyMarketCore: import.meta.env.VITE_MONEY_MARKET_CORE,
    sbtcToken: import.meta.env.VITE_SBTC_TOKEN,
    priceOracle: import.meta.env.VITE_PRICE_ORACLE,
  },
};
```

### 4.3 Wallet Connection

```typescript
// src/lib/wallet.ts
import { connect, UserSession } from '@stacks/connect';

export class WalletService {
  private userSession: UserSession;

  constructor() {
    this.userSession = new UserSession({
      appConfig: {
        appDetails: {
          name: 'Hayy Protocol',
          icon: '/logo.png',
        },
      },
    });
  }

  async connectWallet() {
    return new Promise((resolve, reject) => {
      connect({
        appDetails: {
          name: 'Hayy Protocol',
          icon: '/logo.png',
        },
        onFinish: ({ userSession }) => {
          this.userSession = userSession;
          resolve(userSession);
        },
        onCancel: () => {
          reject(new Error('Wallet connection cancelled'));
        },
      });
    });
  }

  getAddress() {
    return this.userSession.loadUserData().profile.stxAddress.mainnet;
  }

  isConnected() {
    return this.userSession.isUserSignedIn();
  }
}
```

### 4.4 Contract Interaction Service

```typescript
// src/lib/contract-service.ts
import { 
  makeContractCall, 
  callReadOnlyFunction,
  cvToJSON,
  uintCV,
  boolCV,
  principalCV,
  stringAsciiCV,
} from '@stacks/transactions';
import { stacksConfig } from './stacks-config';

export class ContractService {
  async supplySTX(amount: number, useAsCollateral: boolean) {
    const tx = await makeContractCall({
      contractAddress: stacksConfig.contractAddresses.moneyMarketCore.split('.')[0],
      contractName: stacksConfig.contractAddresses.moneyMarketCore.split('.')[1],
      functionName: 'supply-stx',
      functionArgs: [
        uintCV(amount),
        boolCV(useAsCollateral)
      ],
      network: stacksConfig.network,
      appDetails: stacksConfig.appDetails,
      onFinish: (data) => {
        console.log('Transaction completed:', data.txId);
      },
    });

    return tx;
  }

  async getUserDashboard(userAddress: string) {
    const result = await callReadOnlyFunction({
      contractAddress: stacksConfig.contractAddresses.moneyMarketCore.split('.')[0],
      contractName: stacksConfig.contractAddresses.moneyMarketCore.split('.')[1],
      functionName: 'get-user-dashboard',
      functionArgs: [principalCV(userAddress)],
      senderAddress: userAddress,
      network: stacksConfig.network,
    });

    return cvToJSON(result);
  }

  async getProtocolMetrics() {
    const result = await callReadOnlyFunction({
      contractAddress: stacksConfig.contractAddresses.moneyMarketCore.split('.')[0],
      contractName: stacksConfig.contractAddresses.moneyMarketCore.split('.')[1],
      functionName: 'get-protocol-metrics',
      functionArgs: [],
      senderAddress: stacksConfig.contractAddresses.moneyMarketCore.split('.')[0],
      network: stacksConfig.network,
    });

    return cvToJSON(result);
  }
}
```

### 4.5 React Hooks Integration

```typescript
// src/hooks/useContractData.ts
import { useState, useEffect } from 'react';
import { ContractService } from '../lib/contract-service';

export function useUserDashboard(address: string) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const contractService = new ContractService();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await contractService.getUserDashboard(address);
        setDashboard(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [address]);

  return { dashboard, loading, error };
}
```

---

## 5. Backend Integration

### 5.1 API Server Setup

Install dependencies:

```bash
npm install express cors helmet morgan redis ioredis
npm install @stacks/transactions @stacks/network
```

Server setup (`src/server.ts`):

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import Redis from 'ioredis';
import { StacksMainnet, StacksTestnet } from '@stacks/network';

const app = express();
const redis = new Redis(process.env.REDIS_URL);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Stacks network configuration
const network = process.env.NODE_ENV === 'production' 
  ? new StacksMainnet() 
  : new StacksTestnet();

// Contract addresses
const contracts = {
  moneyMarketCore: process.env.MONEY_MARKET_CORE_ADDRESS,
  sbtcToken: process.env.SBTC_TOKEN_ADDRESS,
  priceOracle: process.env.PRICE_ORACLE_ADDRESS,
};

// API Routes
app.get('/api/protocol/metrics', async (req, res) => {
  try {
    const cacheKey = 'protocol:metrics';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const metrics = await getProtocolMetrics();
    await redis.setex(cacheKey, 60, JSON.stringify(metrics)); // Cache for 60s
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/:address/dashboard', async (req, res) => {
  try {
    const { address } = req.params;
    const cacheKey = `user:${address}:dashboard`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const dashboard = await getUserDashboard(address);
    await redis.setex(cacheKey, 30, JSON.stringify(dashboard)); // Cache for 30s
    
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 5.2 Contract Service for Backend

```typescript
// src/services/contract-service.ts
import { 
  callReadOnlyFunction,
  cvToJSON,
  principalCV,
} from '@stacks/transactions';
import { network } from '../config/network';

export class ContractService {
  async getProtocolMetrics() {
    const result = await callReadOnlyFunction({
      contractAddress: contracts.moneyMarketCore.split('.')[0],
      contractName: contracts.moneyMarketCore.split('.')[1],
      functionName: 'get-protocol-metrics',
      functionArgs: [],
      senderAddress: contracts.moneyMarketCore.split('.')[0],
      network,
    });

    return cvToJSON(result);
  }

  async getUserDashboard(userAddress: string) {
    const result = await callReadOnlyFunction({
      contractAddress: contracts.moneyMarketCore.split('.')[0],
      contractName: contracts.moneyMarketCore.split('.')[1],
      functionName: 'get-user-dashboard',
      functionArgs: [principalCV(userAddress)],
      senderAddress: userAddress,
      network,
    });

    return cvToJSON(result);
  }

  async getUserHealthFactor(userAddress: string) {
    const result = await callReadOnlyFunction({
      contractAddress: contracts.moneyMarketCore.split('.')[0],
      contractName: contracts.moneyMarketCore.split('.')[1],
      functionName: 'get-user-health-factor',
      functionArgs: [principalCV(userAddress)],
      senderAddress: userAddress,
      network,
    });

    return cvToJSON(result);
  }
}
```

### 5.3 Event Monitoring Service

```typescript
// src/services/event-monitor.ts
import WebSocket from 'ws';
import { ContractService } from './contract-service';

export class EventMonitor {
  private ws: WebSocket;
  private contractService: ContractService;

  constructor() {
    this.contractService = new ContractService();
    this.ws = new WebSocket('wss://api.hiro.so/v2/ws');
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.ws.on('open', () => {
      console.log('Connected to Stacks WebSocket');
      this.subscribeToEvents();
    });

    this.ws.on('message', async (data) => {
      const event = JSON.parse(data.toString());
      await this.processEvent(event);
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.reconnect();
    });
  }

  private subscribeToEvents() {
    this.ws.send(JSON.stringify({
      action: 'subscribe',
      query: {
        type: 'contract_call',
        contract_id: contracts.moneyMarketCore,
      },
    }));
  }

  private async processEvent(event: any) {
    if (event.type === 'contract_call') {
      const { contract_call } = event;
      
      switch (contract_call.function_name) {
        case 'supply-stx':
        case 'supply-sbtc':
          await this.handleSupplyEvent(event);
          break;
        case 'borrow-stx':
        case 'borrow-sbtc':
          await this.handleBorrowEvent(event);
          break;
        case 'withdraw-stx':
        case 'withdraw-sbtc':
          await this.handleWithdrawEvent(event);
          break;
        case 'repay-stx':
        case 'repay-sbtc':
          await this.handleRepayEvent(event);
          break;
      }
    }
  }

  private async handleSupplyEvent(event: any) {
    const userAddress = event.contract_call.sender_address;
    
    // Update cache
    await redis.del(`user:${userAddress}:dashboard`);
    
    // Send notification
    await this.sendNotification(userAddress, 'supply', event);
    
    // Update analytics
    await this.updateAnalytics('supply', event);
  }

  private async sendNotification(userAddress: string, type: string, event: any) {
    // Implement notification logic (WebSocket, push notification, etc.)
  }

  private async updateAnalytics(type: string, event: any) {
    // Implement analytics tracking
  }

  private reconnect() {
    setTimeout(() => {
      this.ws = new WebSocket('wss://api.hiro.so/v2/ws');
      this.setupEventHandlers();
    }, 5000);
  }
}
```

---

## 6. Relayer Service Setup

### 6.1 Relayer Configuration

Create `relayer/config.toml`:

```toml
[network]
stacks_node = "https://api.hiro.so"
sui_node = "https://fullnode.mainnet.sui.io:443"

[relayer]
private_key = "your relayer private key"
stacks_address = "your relayer stacks address"
sui_address = "your relayer sui address"

[contracts]
stacks_money_market = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.money-market-core"
sui_borrow_controller = "0x..."

[monitoring]
check_interval = 5000  # 5 seconds
max_retries = 3
retry_delay = 1000
```

### 6.2 Relayer Service Implementation

```typescript
// relayer/src/index.ts
import { RelayerService } from './services/relayer-service';

const relayer = new RelayerService();

async function main() {
  console.log('Starting Hayy Protocol Relayer...');
  
  try {
    await relayer.start();
  } catch (error) {
    console.error('Relayer failed to start:', error);
    process.exit(1);
  }
}

main().catch(console.error);
```

```typescript
// relayer/src/services/relayer-service.ts
import WebSocket from 'ws';
import { SuiClient } from '@mysten/sui/client';

export class RelayerService {
  private stacksWs: WebSocket;
  private suiClient: SuiClient;
  private isRunning = false;

  constructor() {
    this.stacksWs = new WebSocket('wss://api.hiro.so/v2/ws');
    this.suiClient = new SuiClient({ url: 'https://fullnode.mainnet.sui.io:443' });
  }

  async start() {
    console.log('Starting relayer service...');
    
    // Connect to Stacks WebSocket
    await this.connectToStacks();
    
    // Start monitoring events
    this.startEventMonitoring();
    
    this.isRunning = true;
    console.log('Relayer service started successfully');
  }

  private async connectToStacks() {
    return new Promise((resolve, reject) => {
      this.stacksWs.on('open', () => {
        console.log('Connected to Stacks WebSocket');
        resolve();
      });

      this.stacksWs.on('error', reject);
    });
  }

  private startEventMonitoring() {
    this.stacksWs.on('message', async (data) => {
      const event = JSON.parse(data.toString());
      await this.processStacksEvent(event);
    });

    // Subscribe to relevant events
    this.subscribeToEvents();
  }

  private async processStacksEvent(event: any) {
    if (event.type === 'contract_call') {
      const { contract_call } = event;
      
      if (contract_call.contract_id.includes('money-market-core')) {
        switch (contract_call.function_name) {
          case 'supply-stx':
          case 'supply-sbtc':
            await this.handleSupplyEvent(event);
            break;
          case 'request-withdraw':
            await this.handleWithdrawRequest(event);
            break;
        }
      }
    }
  }

  private async handleSupplyEvent(event: any) {
    const { contract_call } = event;
    const userAddress = contract_call.sender_address;
    const asset = contract_call.function_name.includes('stx') ? 'STX' : 'sBTC';
    const amount = this.extractAmount(contract_call.function_args[0]);

    console.log(`Processing supply event: ${userAddress} supplied ${amount} ${asset}`);

    try {
      // Register collateral on Sui
      const tx = await this.registerCollateralOnSui(userAddress, asset, amount);
      console.log(`Collateral registered on Sui: ${tx}`);
      
      // Update mapping
      await this.updateAddressMapping(userAddress, asset, amount);
    } catch (error) {
      console.error('Failed to register collateral on Sui:', error);
    }
  }

  private async handleWithdrawRequest(event: any) {
    const { contract_call } = event;
    const userAddress = contract_call.sender_address;
    const amount = this.extractAmount(contract_call.function_args[0]);

    console.log(`Processing withdraw request: ${userAddress} wants to withdraw ${amount}`);

    try {
      // Check user's debt on Sui
      const position = await this.getUserPositionOnSui(userAddress);
      
      if (position.debt === 0) {
        // Approve withdrawal on Stacks
        await this.approveWithdrawalOnStacks(userAddress, amount);
        console.log(`Withdrawal approved for ${userAddress}`);
      } else {
        console.log(`Withdrawal denied: user has outstanding debt`);
      }
    } catch (error) {
      console.error('Failed to process withdraw request:', error);
    }
  }

  private async registerCollateralOnSui(userAddress: string, asset: string, amount: number) {
    // Implement Sui contract call to register collateral
    const tx = await this.suiClient.executeTransaction({
      transactionKind: 'programmableTransaction',
      ... // Transaction details
    });

    return tx.digest;
  }

  private async getUserPositionOnSui(userAddress: string) {
    // Implement Sui contract call to get user position
    const result = await this.suiClient.queryEvents({
      query: { MoveEventType: `${this.config.contracts.sui_borrow_controller}::PositionUpdated` },
    });

    return this.parsePositionFromEvents(result.data, userAddress);
  }

  private async approveWithdrawalOnStacks(userAddress: string, amount: number) {
    // Implement Stacks contract call to approve withdrawal
    // This would be an admin function call
  }

  private extractAmount(arg: any): number {
    // Parse amount from contract argument
    return parseInt(arg.hex, 16);
  }

  private subscribeToEvents() {
    this.stacksWs.send(JSON.stringify({
      action: 'subscribe',
      query: {
        type: 'contract_call',
        contract_id: this.config.contracts.stacks_money_market,
      },
    }));
  }
}
```

---

## 7. Monitoring and Alerting

### 7.1 Health Check Endpoint

```typescript
// src/routes/health.ts
import express from 'express';
import Redis from 'ioredis';

const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      redis: await checkRedis(),
      stacks: await checkStacks(),
      sui: await checkSui(),
    },
  };

  const allHealthy = Object.values(health.services).every(status => status === 'ok');
  res.status(allHealthy ? 200 : 503).json(health);
});

async function checkRedis(): Promise<string> {
  try {
    const redis = new Redis(process.env.REDIS_URL);
    await redis.ping();
    return 'ok';
  } catch {
    return 'error';
  }
}

async function checkStacks(): Promise<string> {
  try {
    const response = await fetch('https://api.hiro.so/v2/info');
    return response.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

async function checkSui(): Promise<string> {
  try {
    const client = new SuiClient({ url: 'https://fullnode.mainnet.sui.io:443' });
    await client.getLatestSuiSystemState();
    return 'ok';
  } catch {
    return 'error';
  }
}

export default router;
```

### 7.2 Prometheus Metrics

```typescript
// src/metrics.ts
import client from 'prom-client';

// Create metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
});

const contractCallsTotal = new client.Counter({
  name: 'contract_calls_total',
  help: 'Total number of contract calls',
  labelNames: ['contract', 'function', 'status'],
});

const protocolTVL = new client.Gauge({
  name: 'protocol_tvl_usd',
  help: 'Total Value Locked in USD',
});

const activeUsers = new client.Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
});

export {
  httpRequestDuration,
  contractCallsTotal,
  protocolTVL,
  activeUsers,
  client,
};
```

### 7.3 Alert Configuration

```yaml
# prometheus/alerts.yml
groups:
  - name: hayy-protocol
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
          description: "Error rate is {{ $value }} errors per second"

      - alert: ContractCallFailure
        expr: increase(contract_calls_total{status="error"}[5m]) > 10
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: Contract call failures detected
          description: "Contract calls are failing at rate {{ $value }} per 5 minutes"

      - alert: LowTVL
        expr: protocol_tvl_usd < 1000000
        for: 10m
        labels:
          severity: info
        annotations:
          summary: TVL below threshold
          description: "TVL is ${{ $value }}, below minimum threshold"
```

---

## 8. Deployment Automation

### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Hayy Protocol

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  deploy-testnet:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Testnet
        run: |
          clarinet deploy --testnet
        env:
          MNEMONIC: ${{ secrets.TESTNET_MNEMONIC }}

  deploy-mainnet:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Mainnet
        run: |
          clarinet deploy --mainnet
        env:
          MNEMONIC: ${{ secrets.MAINNET_MNEMONIC }}
```

### 8.2 Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  relayer:
    build: ./relayer
    environment:
      - RELAYER_PRIVATE_KEY=${RELAYER_PRIVATE_KEY}
    depends_on:
      - api
```

---

## 9. Troubleshooting

### 9.1 Common Issues

**Deployment Fails with "Insufficient STX"**
- Ensure deployer wallet has enough STX for gas fees
- Check gas cost estimates in deployment plan
- Use `clarinet check-spend` to verify costs

**Contract Calls Fail with "Unauthorized"**
- Verify contract addresses are correct
- Check if function requires admin permissions
- Ensure caller is authorized for the operation

**Price Oracle Returns Errors**
- Verify oracle contract is deployed and initialized
- Check if prices are set for required assets
- Ensure oracle contract owner is calling set-price

**Cross-Chain Events Not Processing**
- Verify relayer is running and connected
- Check WebSocket connections to both chains
- Ensure address mapping is correct

### 9.2 Debug Commands

```bash
# Check contract deployment
clarinet check-contracts --testnet

# Verify contract state
curl "https://api.testnet.hiro.so/v2/contracts/CONTRACT_ADDRESS"

# Check transaction status
curl "https://api.testnet.hiro.so/v2/transactions/TX_ID"

# Debug contract calls
clarinet console --testnet
```

### 9.3 Performance Optimization

- Use Redis caching for frequently accessed data
- Implement connection pooling for database connections
- Optimize WebSocket subscriptions to reduce bandwidth
- Use CDN for static assets
- Implement rate limiting for API endpoints

This deployment guide provides comprehensive instructions for deploying Hayy Protocol across all environments and integrating with frontend and backend systems.