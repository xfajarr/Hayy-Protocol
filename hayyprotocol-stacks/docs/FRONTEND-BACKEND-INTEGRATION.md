# Hayy Protocol Stacks - Frontend & Backend Integration Guide

## Overview

This guide categorizes all contract functions based on their suitability for frontend (client-side) and backend (server-side) use cases, providing integration patterns and best practices for each.

## Function Classification

### 🎨 Frontend-Only Functions
*Direct user interactions that require wallet connection*

### 📊 Frontend + Backend Functions
*Functions used by both, but with different patterns*

### ⚙️ Backend-Only Functions
*Server-side operations, monitoring, and automation*

### 🔐 Admin Functions
*Privileged operations requiring special permissions*

---

## 1. Frontend-Only Functions

These functions require direct user interaction and wallet signatures. They should only be called from the frontend.

### 1.1 Supply Functions

#### `supply-stx(amount, use-as-collateral)`
- **Use Case**: User deposits STX into the protocol
- **Frontend Integration**:
  ```typescript
  import { openSTXTransfer } from '@stacks/connect';

  const supplySTX = async (amount: number, useAsCollateral: boolean) => {
    const options = {
      contractAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
      contractName: 'money-market-core',
      functionName: 'supply-stx',
      functionArgs: [
        contractPrincipalCV(amount), // micro-STX
        boolCV(useAsCollateral)
      ],
      appDetails: {
        name: 'Hayy Protocol',
        icon: window.location.origin + '/logo.png',
      },
      onFinish: (data) => {
        console.log('Transaction ID:', data.txId);
        // Refresh user data
        fetchUserData();
      }
    };
    
    await openSTXTransfer(options);
  };
  ```

#### `supply-sbtc(amount, use-as-collateral)`
- **Use Case**: User deposits sBTC into the protocol
- **Frontend Integration**:
  ```typescript
  const supplySBTC = async (amount: number, useAsCollateral: boolean) => {
    const options = {
      contractAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
      contractName: 'money-market-core',
      functionName: 'supply-sbtc',
      functionArgs: [
        contractPrincipalCV(amount), // sBTC units (8 decimals)
        boolCV(useAsCollateral)
      ],
      // ... same configuration as above
    };
    
    await openContractCall(options);
  };
  ```

### 1.2 Withdraw Functions

#### `withdraw-stx(amount)`
- **Use Case**: User withdraws STX from the protocol
- **Frontend Integration**:
  ```typescript
  const withdrawSTX = async (amount: number) => {
    // Pre-flight check: verify sufficient balance
    const balance = await getUserBalance('STX');
    if (balance < amount) {
      throw new Error('Insufficient balance');
    }
    
    const options = {
      contractAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
      contractName: 'money-market-core',
      functionName: 'withdraw-stx',
      functionArgs: [uintCV(amount)],
      // ... configuration
    };
    
    await openContractCall(options);
  };
  ```

#### `withdraw-sbtc(amount)`
- **Use Case**: User withdraws sBTC from the protocol
- **Frontend Integration**: Similar to `withdraw-stx`

### 1.3 Borrow Functions

#### `borrow-stx(amount)`
- **Use Case**: User borrows STX against their collateral
- **Frontend Integration**:
  ```typescript
  const borrowSTX = async (amount: number) => {
    // Pre-flight checks
    const borrowingPower = await getBorrowingPower(userAddress);
    const availableLiquidity = await getAvailableLiquidity('STX');
    
    if (amount > borrowingPower) {
      throw new Error('Insufficient borrowing power');
    }
    
    if (amount > availableLiquidity) {
      throw new Error('Insufficient liquidity');
    }
    
    const options = {
      contractAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
      contractName: 'money-market-core',
      functionName: 'borrow-stx',
      functionArgs: [uintCV(amount)],
      // ... configuration
    };
    
    await openContractCall(options);
  };
  ```

#### `borrow-sbtc(amount)`
- **Use Case**: User borrows sBTC against their collateral
- **Frontend Integration**: Similar to `borrow-stx`

### 1.4 Repay Functions

#### `repay-stx(amount)`
- **Use Case**: User repays their STX debt
- **Frontend Integration**:
  ```typescript
  const repaySTX = async (amount: number) => {
    // Get current debt to show user
    const currentDebt = await getUserDebt('STX');
    const repayAmount = Math.min(amount, currentDebt);
    
    const options = {
      contractAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
      contractName: 'money-market-core',
      functionName: 'repay-stx',
      functionArgs: [uintCV(repayAmount)],
      // ... configuration
    };
    
    await openContractCall(options);
  };
  ```

#### `repay-sbtc(amount)`
- **Use Case**: User repays their sBTC debt
- **Frontend Integration**: Similar to `repay-stx`

### 1.5 Collateral Management

#### `enable-collateral(asset)` / `disable-collateral(asset)`
- **Use Case**: User toggles collateral status for their supplied assets
- **Frontend Integration**:
  ```typescript
  const toggleCollateral = async (asset: string, enable: boolean) => {
    const functionName = enable ? 'enable-collateral' : 'disable-collateral';
    
    const options = {
      contractAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
      contractName: 'money-market-core',
      functionName,
      functionArgs: [stringAsciiCV(asset)],
      // ... configuration
    };
    
    await openContractCall(options);
  };
  ```

---

## 2. Frontend + Backend Functions

These functions are used by both frontend and backend, but with different patterns and purposes.

### 2.1 User Position Queries

#### `get-user-dashboard(user)`
- **Frontend Use**: Display user's complete position in the UI
- **Backend Use**: User profile data, API endpoints, analytics

**Frontend Integration**:
```typescript
const fetchUserDashboard = async (userAddress: string) => {
  const result = await callReadOnlyFunction({
    contractAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
    contractName: 'money-market-core',
    functionName: 'get-user-dashboard',
    functionArgs: [principalCV(userAddress)],
    senderAddress: userAddress,
  });
  
  return cvToJSON(result);
};

// React hook for real-time updates
const useUserDashboard = (address: string) => {
  const [dashboard, setDashboard] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchUserDashboard(address);
      setDashboard(data);
    };
    
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    
    return () => clearInterval(interval);
  }, [address]);
  
  return dashboard;
};
```

**Backend Integration**:
```typescript
// Express.js endpoint
app.get('/api/user/:address/dashboard', async (req, res) => {
  try {
    const { address } = req.params;
    const dashboard = await fetchUserDashboard(address);
    
    // Cache for 30 seconds
    await cache.set(`dashboard:${address}`, dashboard, 30);
    
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### `get-user-health-factor(user)`
- **Frontend Use**: Display health indicator, warnings
- **Backend Use**: Liquidation monitoring, risk assessment

**Frontend Integration**:
```typescript
const HealthFactorIndicator = ({ userAddress }) => {
  const [healthFactor, setHealthFactor] = useState(null);
  
  useEffect(() => {
    const fetchHealthFactor = async () => {
      const result = await callReadOnlyFunction({
        contractAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
        contractName: 'money-market-core',
        functionName: 'get-user-health-factor',
        functionArgs: [principalCV(userAddress)],
        senderAddress: userAddress,
      });
      
      const hf = cvToValue(result);
      setHealthFactor(hf);
    };
    
    fetchHealthFactor();
  }, [userAddress]);
  
  if (!healthFactor) return <div>Loading...</div>;
  
  const isHealthy = healthFactor >= 1000000; // 1.0
  const color = isHealthy ? 'green' : healthFactor >= 1100000 ? 'yellow' : 'red';
  
  return (
    <div style={{ color }}>
      Health Factor: {(healthFactor / 1000000).toFixed(2)}
      {!isHealthy && <WarningBanner />}
    </div>
  );
};
```

**Backend Integration**:
```typescript
// Liquidation monitoring service
class LiquidationMonitor {
  async checkPositions() {
    const atRiskUsers = await this.getAtRiskUsers();
    
    for (const user of atRiskUsers) {
      const healthFactor = await this.getHealthFactor(user.address);
      
      if (healthFactor < 1000000) {
        await this.notifyLiquidators(user, healthFactor);
        await this.logLiquidationOpportunity(user, healthFactor);
      }
    }
  }
  
  async getHealthFactor(userAddress: string): Promise<number> {
    const result = await callReadOnlyFunction({
      contractAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
      contractName: 'money-market-core',
      functionName: 'get-user-health-factor',
      functionArgs: [principalCV(userAddress)],
      senderAddress: this.backendAddress,
    });
    
    return cvToValue(result);
  }
}
```

#### `get-user-borrowing-power(user)`
- **Frontend Use**: Show available borrowing capacity
- **Backend Use**: Risk calculations, lending limits

### 2.2 Protocol Metrics

#### `get-protocol-metrics()`
- **Frontend Use**: Display TVL, total borrows on dashboard
- **Backend Use**: Analytics, monitoring, reporting

**Frontend Integration**:
```typescript
const ProtocolStats = () => {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      const result = await callReadOnlyFunction({
        contractAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
        contractName: 'money-market-core',
        functionName: 'get-protocol-metrics',
        functionArgs: [],
        senderAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
      });
      
      const data = cvToJSON(result);
      setMetrics(data);
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);
  
  if (!metrics) return <div>Loading metrics...</div>;
  
  return (
    <div>
      <StatCard label="TVL" value={`$${(metrics.tvl / 1000000).toFixed(2)}M`} />
      <StatCard label="Total Borrows" value={`$${(metrics.total-borrows / 1000000).toFixed(2)}M`} />
      <StatCard label="Available Liquidity" value={`$${(metrics.available-liquidity / 1000000).toFixed(2)}M`} />
    </div>
  );
};
```

**Backend Integration**:
```typescript
// Analytics service
class AnalyticsService {
  async collectMetrics() {
    const metrics = await this.getProtocolMetrics();
    
    // Store in time-series database
    await this.timeSeriesDB.insert({
      timestamp: new Date(),
      tvl: metrics.tvl,
      totalBorrows: metrics.total-borrows,
      availableLiquidity: metrics.available-liquidity,
      reserves: metrics.reserves,
      uniqueUsers: metrics.unique-users
    });
    
    // Trigger alerts if needed
    await this.checkThresholds(metrics);
  }
  
  async getHistoricalMetrics(timeRange: string) {
    return await this.timeSeriesDB.query({
      timeRange,
      metrics: ['tvl', 'total-borrows', 'available-liquidity']
    });
  }
}
```

---

## 3. Backend-Only Functions

These functions are primarily used by backend services for monitoring, automation, and operations.

### 3.1 Liquidation Functions

#### `liquidate-sbtc-with-stx(user, repay-amount)`
- **Use Case**: Automated liquidation bots
- **Backend Integration**:
```typescript
class LiquidationBot {
  private privateKey: string;
  private stxAddress: string;
  
  async liquidatePosition(borrowerAddress: string, repayAmount: number) {
    const tx = await makeSTXTokenTransfer({
      recipient: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0.money-market-core',
      amount: repayAmount,
      memo: Buffer.from('liquidation'),
      senderKey: this.privateKey,
      network: new StacksTestnet(),
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Deny,
      // Function call for liquidation
      sponsored: false,
      nonce: await this.getNextNonce(),
    });
    
    // Add contract call for liquidation
    const contractCall = await makeContractCall({
      contractAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
      contractName: 'money-market-core',
      functionName: 'liquidate-sbtc-with-stx',
      functionArgs: [
        principalCV(borrowerAddress),
        uintCV(repayAmount)
      ],
      senderKey: this.privateKey,
      network: new StacksTestnet(),
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Deny,
    });
    
    // Broadcast transaction
    const result = await broadcastTransaction(contractCall);
    return result;
  }
  
  async runLiquidationLoop() {
    while (true) {
      try {
        const atRiskPositions = await this.findAtRiskPositions();
        
        for (const position of atRiskPositions) {
          const profitability = await this.calculateProfitability(position);
          
          if (profitability > this.minProfitThreshold) {
            await this.liquidatePosition(position.user, position.debtAmount);
            await this.logLiquidation(position, profitability);
          }
        }
        
        await this.sleep(10000); // Check every 10 seconds
      } catch (error) {
        console.error('Liquidation error:', error);
        await this.sleep(30000); // Wait longer on error
      }
    }
  }
}
```

### 3.2 Event Monitoring

**Backend Integration**:
```typescript
class EventMonitor {
  async startMonitoring() {
    const socket = new WebSocket('wss://api.testnet.hiro.so/v2/ws');
    
    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'mempool' || data.type === 'block') {
        await this.processEvents(data);
      }
    };
  }
  
  async processEvents(data: any) {
    for (const tx of data.transactions) {
      if (tx.tx_type === 'contract_call') {
        await this.handleContractCall(tx);
      }
    }
  }
  
  async handleContractCall(tx: any) {
    const { contract_call } = tx;
    
    if (contract_call.contract_id.includes('money-market-core')) {
      switch (contract_call.function_name) {
        case 'supply-stx':
        case 'supply-sbtc':
          await this.handleSupplyEvent(tx);
          break;
        case 'borrow-stx':
        case 'borrow-sbtc':
          await this.handleBorrowEvent(tx);
          break;
        case 'withdraw-stx':
        case 'withdraw-sbtc':
          await this.handleWithdrawEvent(tx);
          break;
        case 'repay-stx':
        case 'repay-sbtc':
          await this.handleRepayEvent(tx);
          break;
      }
    }
  }
  
  async handleSupplyEvent(tx: any) {
    // Update user profile
    await this.updateUserProfile(tx.sender_address);
    
    // Send notification
    await this.notificationService.sendSupplyConfirmation(tx);
    
    // Update analytics
    await this.analyticsService.recordSupply(tx);
    
    // Check for referral rewards
    await this.referralService.processSupply(tx);
  }
}
```

### 3.3 Price Feed Management

**Backend Integration**:
```typescript
class PriceFeedService {
  async updatePrices() {
    const prices = await this.fetchPricesFromExchanges();
    
    for (const [symbol, price] of Object.entries(prices)) {
      await this.updateOraclePrice(symbol, price);
    }
  }
  
  private async updateOraclePrice(symbol: string, price: number) {
    const priceInPrecision = Math.floor(price * 100000000); // 8 decimals
    
    const tx = await makeContractCall({
      contractAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
      contractName: 'mock-oracle-v1',
      functionName: 'set-price',
      functionArgs: [
        stringAsciiCV(symbol),
        uintCV(priceInPrecision)
      ],
      senderKey: this.oraclePrivateKey,
      network: new StacksTestnet(),
    });
    
    await broadcastTransaction(tx);
    await this.logPriceUpdate(symbol, price);
  }
  
  async startPriceFeed() {
    // Update prices every 30 seconds
    setInterval(() => this.updatePrices(), 30000);
  }
}
```

---

## 4. Admin Functions

These functions require special permissions and should only be called by authorized administrators.

### 4.1 Oracle Management

#### `set-price(symbol, price)`
- **Use Case**: Updating asset prices
- **Access**: Contract owner only
- **Backend Integration**:
```typescript
class OracleAdmin {
  private adminKey: string;
  
  async updatePrice(symbol: string, price: number) {
    const tx = await makeContractCall({
      contractAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
      contractName: 'mock-oracle-v1',
      functionName: 'set-price',
      functionArgs: [
        stringAsciiCV(symbol),
        uintCV(price * 100000000) // 8 decimals
      ],
      senderKey: this.adminKey,
      network: new StacksMainnet(), // Use mainnet for production
    });
    
    const result = await broadcastTransaction(tx);
    
    // Log for audit
    await this.auditLog.log({
      action: 'price_update',
      symbol,
      price,
      txId: result.txid,
      timestamp: new Date(),
      admin: this.getAddress()
    });
    
    return result;
  }
}
```

### 4.2 Token Management

#### `mint(amount, recipient)` (sBTC)
- **Use Case**: Minting new sBTC tokens
- **Access**: Contract owner only
- **Backend Integration**:
```typescript
class TokenAdmin {
  async mintSBTC(amount: number, recipient: string) {
    // Multi-sig approval check
    const approval = await this.getMultiSigApproval('mint', amount, recipient);
    if (!approval) {
      throw new Error('Multi-sig approval required');
    }
    
    const tx = await makeContractCall({
      contractAddress: 'ST27SK3XEXY9QW51FJHKBR3QEHR5RFDBH3C16RTW0',
      contractName: 'mock-sbtc-v1',
      functionName: 'mint',
      functionArgs: [
        uintCV(amount),
        principalCV(recipient)
      ],
      senderKey: this.adminKey,
      network: new StacksMainnet(),
    });
    
    const result = await broadcastTransaction(tx);
    
    // Compliance logging
    await this.complianceLog.logMint({
      amount,
      recipient,
      txId: result.txid,
      timestamp: new Date(),
      approvedBy: approval.approvers
    });
    
    return result;
  }
}
```

---

## 5. Integration Best Practices

### 5.1 Frontend Best Practices

1. **Pre-flight Validation**: Always validate user inputs before transactions
2. **Error Handling**: Provide clear error messages for failed transactions
3. **Loading States**: Show appropriate loading indicators during transactions
4. **Real-time Updates**: Use subscriptions or polling for real-time data
5. **Gas Estimation**: Show transaction costs before confirmation

```typescript
const useTransactionCost = (functionName: string, args: any[]) => {
  const [cost, setCost] = useState(null);
  
  useEffect(() => {
    const estimateCost = async () => {
      try {
        const estimate = await estimateTransactionCost(functionName, args);
        setCost(estimate);
      } catch (error) {
        console.error('Cost estimation failed:', error);
      }
    };
    
    estimateCost();
  }, [functionName, args]);
  
  return cost;
};
```

### 5.2 Backend Best Practices

1. **Caching**: Cache read-only function results to improve performance
2. **Rate Limiting**: Implement rate limiting for API endpoints
3. **Monitoring**: Set up comprehensive monitoring and alerting
4. **Error Recovery**: Implement retry logic with exponential backoff
5. **Security**: Use multi-sig for critical operations

```typescript
class RobustAPIClient {
  async callReadOnlyFunction(fn: string, args: any[], retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const result = await callReadOnlyFunction({
          contractAddress: this.contractAddress,
          contractName: this.contractName,
          functionName: fn,
          functionArgs: args,
          senderAddress: this.senderAddress,
        });
        
        return cvToJSON(result);
      } catch (error) {
        if (i === retries - 1) throw error;
        
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await this.sleep(delay);
      }
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 5.3 Security Considerations

1. **Input Validation**: Validate all inputs on both frontend and backend
2. **Access Control**: Implement proper access control for admin functions
3. **Audit Logging**: Log all sensitive operations for audit trails
4. **Multi-sig**: Use multi-signature wallets for critical operations
5. **Rate Limiting**: Prevent abuse with appropriate rate limiting

---

## 6. Integration Checklist

### 6.1 Frontend Integration
- [ ] Wallet connection handling
- [ ] Transaction signing and broadcasting
- [ ] Real-time data updates
- [ ] Error handling and user feedback
- [ ] Loading states and progress indicators
- [ ] Responsive design for mobile/desktop
- [ ] Accessibility compliance

### 6.2 Backend Integration
- [ ] API rate limiting
- [ ] Caching strategy
- [ ] Error monitoring and alerting
- [ ] Database connection pooling
- [ ] Security middleware
- [ ] API documentation
- [ ] Load testing

### 6.3 Cross-Chain Integration
- [ ] Relayer service setup
- [ ] Event monitoring across chains
- [ ] State synchronization
- [ ] Failure handling and retries
- [ ] Security audits
- [ ] Performance optimization

This guide provides comprehensive integration patterns for all contract functions, ensuring secure and efficient frontend and backend implementations.