# Hayy Protocol Stacks - Troubleshooting & FAQ

## Table of Contents

1. [Common Issues](#common-issues)
2. [Development Issues](#development-issues)
3. [Deployment Issues](#deployment-issues)
4. [Frontend Integration Issues](#frontend-integration-issues)
5. [Backend Integration Issues](#backend-integration-issues)
6. [Cross-Chain Issues](#cross-chain-issues)
7. [Performance Issues](#performance-issues)
8. [Security Issues](#security-issues)
9. [Frequently Asked Questions](#frequently-asked-questions)

---

## Common Issues

### Transaction Failures

#### Q: Why is my transaction failing with "err-insufficient-funds"?

**A**: This error occurs when you don't have enough balance for the operation.

**Solutions**:
1. Check your actual balance:
   ```bash
   stx balance ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
   ```
2. Ensure you have enough for gas fees (typically 0.05-0.1 STX)
3. For supply operations, verify you have the amount you're trying to supply
4. For borrow operations, check if you have sufficient collateral

#### Q: Why am I getting "err-health-factor-too-low"?

**A**: Your health factor is below the minimum threshold (1.0).

**Solutions**:
1. Supply more collateral
2. Repay some of your debt
3. Wait for asset prices to improve (if applicable)
4. Check your current health factor:
   ```clarity
   (contract-call? .money-market-core get-user-health-factor 'YOUR_ADDRESS)
   ```

#### Q: Transaction is stuck in mempool

**A**: Transactions can get stuck due to network congestion or low gas fees.

**Solutions**:
1. Wait longer (network may be congested)
2. Check transaction status on [Stacks Explorer](https://explorer.stacks.co/)
3. If stuck for >30 minutes, consider resubmitting with higher fees
4. Use `clarinet check-mempool` to see pending transactions

---

## Development Issues

### Clarinet Issues

#### Q: Clarinet commands are not found

**A**: Clarinet is not installed or not in your PATH.

**Solutions**:
1. Install Clarinet:
   ```bash
   curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-linux-x64.tar.gz | tar xz
   sudo mv clarinet-linux-x64/clarinet /usr/local/bin/
   ```
2. Verify installation:
   ```bash
   clarinet --version
   ```
3. Add to PATH if needed:
   ```bash
   export PATH=$PATH:/path/to/clarinet
   ```

#### Q: Tests are failing with "contract not found"

**A**: Contracts are not deployed in the test environment.

**Solutions**:
1. Ensure contracts are defined in `Clarinet.toml`
2. Run `clarinet console` and type `::deploy-contracts`
3. Check contract names match between `.toml` and test files
4. Verify contract paths are correct

#### Q: Getting "epoch mismatch" errors

**A**: Your contracts are using a different epoch version than the network.

**Solutions**:
1. Update `Clarinet.toml` to use epoch "3.0":
   ```toml
   [contracts.your-contract]
   clarity_version = 3
   epoch = "3.0"
   ```
2. Redeploy contracts with correct epoch
3. Ensure all contracts use the same epoch version

### Code Issues

#### Q: Integer overflow/underflow errors

**A**: Clarity automatically handles integer overflow, but logic errors can occur.

**Solutions**:
1. Use proper arithmetic checks:
   ```clarity
   (asserts! (> amount u0) err-invalid-amount)
   (asserts! (<= amount max-uint) err-amount-too-large)
   ```
2. Use `try!` for operations that might fail
3. Test edge cases with maximum values

#### Q: Map lookups returning unexpected values

**A**: Map might not have the key or returning default values.

**Solutions**:
1. Use `map-get?` for optional lookups
2. Use `default-to` with appropriate defaults:
   ```clarity
   (default-to { amount: u0 } (map-get? user-balances { user: caller }))
   ```
3. Verify key types match map definition

---

## Deployment Issues

### Testnet Deployment

#### Q: Deployment fails with "insufficient balance"

**A**: Deployer wallet doesn't have enough STX for deployment costs.

**Solutions**:
1. Get testnet STX from [faucet](https://explorer.stacks.co/txid/ST2F5BKZGK1ZYEQJMFH3WQSVEE7J5P3Z4JQJDQ44V.bridge-v1?chain=testnet)
2. Check deployment costs:
   ```bash
   clarinet check-spend --testnet
   ```
3. Ensure wallet has at least 2x the estimated cost for safety

#### Q: Contract deployment times out

**A**: Network congestion or anchor block issues.

**Solutions**:
1. Use `anchor-block-only: true` in deployment plan
2. Wait for next anchor block (every 10 blocks on testnet)
3. Check network status on [Stacks Explorer](https://explorer.stacks.co/)
4. Try deploying during off-peak hours

#### Q: Contract address doesn't match expected

**A**: Deployer address is different than expected.

**Solutions**:
1. Verify deployer address in deployment plan
2. Update `expected-sender` field to match your wallet
3. Use current wallet address:
   ```bash
   stx address
   ```

### Mainnet Deployment

#### Q: Multi-sig transaction not working

**A**: Multi-sig setup requires proper coordination.

**Solutions**:
1. Ensure all signers have the contract deployment transaction
2. Verify signature threshold is met
3. Use proper multi-sig wallet (e.g., Leather, Xverse)
4. Test multi-sig process on testnet first

#### Q: Gas fees too high

**A**: Mainnet gas fees can be significant during congestion.

**Solutions**:
1. Monitor gas prices before deployment
2. Consider deploying during off-peak hours
3. Optimize contract code to reduce size
4. Batch multiple functions if possible

---

## Frontend Integration Issues

### Wallet Connection

#### Q: Wallet connection fails

**A**: Various issues with wallet provider or configuration.

**Solutions**:
1. Ensure wallet is installed and unlocked
2. Check wallet network (testnet/mainnet matches)
3. Clear browser cache and cookies
4. Try different browser
5. Check wallet permissions for the site

#### Q: Transaction signing not working

**A**: Wallet not properly configured or transaction malformed.

**Solutions**:
1. Verify transaction arguments are correct
2. Check contract addresses match network
3. Ensure function arguments have correct types
4. Test with small amounts first
5. Check wallet console for error messages

### Data Display

#### Q: User data not loading

**A**: API calls failing or returning errors.

**Solutions**:
1. Check network connectivity
2. Verify API endpoints are accessible
3. Check browser console for CORS errors
4. Verify contract addresses are correct
5. Test API calls directly with curl

#### Q: Real-time updates not working

**A**: WebSocket connection issues or event handling problems.

**Solutions**:
1. Check WebSocket connection status
2. Verify event subscription filters
3. Check browser console for WebSocket errors
4. Ensure event parsing logic is correct
5. Test with manual API polling as fallback

---

## Backend Integration Issues

### API Issues

#### Q: API returning 500 errors

**A**: Server-side errors in backend code.

**Solutions**:
1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Check database connectivity
4. Test contract calls directly
5. Ensure proper error handling in code

#### Q: Rate limiting issues

**A**: Too many requests to Stacks API or hitting rate limits.

**Solutions**:
1. Implement caching with Redis
2. Add exponential backoff for retries
3. Use API keys for higher rate limits
4. Optimize queries to reduce calls
5. Consider using API provider with higher limits

### Event Processing

#### Q: Missing events in processing

**A**: WebSocket connection issues or event filtering problems.

**Solutions**:
1. Implement reconnection logic with exponential backoff
2. Add event sequence number tracking
3. Store processed events to avoid duplicates
4. Add health checks for WebSocket connection
5. Implement fallback polling mechanism

#### Q: Event processing backlog

**A**: High event volume causing processing delays.

**Solutions**:
1. Use message queue (Redis, RabbitMQ)
2. Implement parallel processing
3. Add horizontal scaling
4. Optimize event processing logic
5. Consider event batching

---

## Cross-Chain Issues

### Relayer Problems

#### Q: Relayer not processing events

**A**: Relayer service not running or misconfigured.

**Solutions**:
1. Check relayer service logs
2. Verify WebSocket connections to both chains
3. Check configuration files
4. Ensure private keys are correct
5. Test with manual event triggers

#### Q: Cross-chain state mismatch

**A**: State synchronization issues between chains.

**Solutions**:
1. Implement state reconciliation checks
2. Add manual override capabilities
3. Use merkle proofs for verification
4. Implement retry logic with exponential backoff
5. Add monitoring and alerting for mismatches

### Address Mapping

#### Q: Address mapping incorrect

**A**: User addresses not properly mapped between chains.

**Solutions**:
1. Implement address registration flow
2. Use cryptographic proofs for address ownership
3. Add manual verification process
4. Store mapping in decentralized storage
5. Implement recovery mechanisms

---

## Performance Issues

### Slow Response Times

#### Q: API responses are slow

**A**: Various performance bottlenecks.

**Solutions**:
1. Add Redis caching for frequently accessed data
2. Optimize database queries with proper indexes
3. Use connection pooling
4. Implement response compression
5. Add CDN for static assets

#### Q: Frontend rendering is slow

**A**: Inefficient React rendering or data fetching.

**Solutions**:
1. Use React.memo for component optimization
2. Implement virtual scrolling for large lists
3. Add loading skeletons for better UX
4. Use React Query for data caching
5. Implement code splitting

### High Memory Usage

#### Q: Memory leaks in backend

**A**: Unclosed connections or event listeners.

**Solutions**:
1. Use memory profiling tools
2. Ensure proper cleanup in error handlers
3. Limit WebSocket connections
4. Implement object pooling
5. Add memory monitoring and alerts

---

## Security Issues

### Smart Contract Security

#### Q: Reentrancy vulnerability

**A**: Contract vulnerable to reentrancy attacks.

**Solutions**:
1. Follow checks-effects-interactions pattern
2. Use reentrancy guards
3. Limit external call complexity
4. Audit all external calls
5. Use formal verification tools

#### Q: Access control issues

**A**: Unauthorized access to admin functions.

**Solutions**:
1. Implement proper access controls
2. Use multi-sig for critical functions
3. Add role-based permissions
4. Audit all privileged functions
5. Implement time locks for admin actions

### API Security

#### Q: API endpoints not secured

**A**: Missing authentication or authorization.

**Solutions**:
1. Implement API key authentication
2. Add rate limiting
3. Use HTTPS everywhere
4. Implement proper CORS policies
5. Add request validation

---

## Frequently Asked Questions

### General Questions

#### Q: What is Hayy Protocol?

**A**: Hayy Protocol is a cross-chain lending protocol that enables users to supply collateral on Stacks and borrow assets on Sui. It leverages the security of both blockchains while providing optimal capital efficiency.

#### Q: How does the cross-chain mechanism work?

**A**: The protocol uses a relayer service that monitors events on both chains:
1. User supplies STX collateral on Stacks
2. Relayer detects the event and registers collateral on Sui
3. User can borrow against this collateral on Sui
4. For withdrawals, relayer verifies debt is zero before unlocking

#### Q: What are the supported assets?

**A**: Currently supported assets:
- Stacks: STX (collateral only)
- Sui: USDC (borrowing), sBTC (collateral & borrowing)
- Future: More assets planned based on governance

#### Q: What are the fees?

**A**: Fee structure:
- Supply fee: 0%
- Borrow fee: Variable based on utilization
- Withdrawal fee: 0%
- Liquidation fee: 5% bonus to liquidators
- Cross-chain relayer fees: Minimal gas costs

### Technical Questions

#### Q: What blockchain does Hayy Protocol use?

**A**: Hayy Protocol is built on:
- Stacks Blockchain for STX collateral management
- Sui Blockchain for borrowing and lending operations
- Cross-chain relayer for state synchronization

#### Q: How are prices determined?

**A**: Prices are provided by:
- Stacks: Price oracle contract (Pyth or Band Protocol in production)
- Sui: On-chain price feeds
- Both chains use the same price sources to ensure consistency

#### Q: Is the protocol audited?

**A**: Yes, the protocol undergoes:
- Smart contract audits by reputable firms
- Formal verification where applicable
- Bug bounty programs
- Community security reviews

#### Q: How is liquidation handled?

**A**: Liquidation process:
1. Positions with health factor < 1.0 are liquidatable
2. Anyone can liquidate underwater positions
3. Liquidators receive a 5% bonus
4. Cross-chain liquidations are handled by the relayer

### User Questions

#### Q: How do I start using Hayy Protocol?

**A**: Getting started guide:
1. Install a Stacks wallet (Hiro, Leather, or Xverse)
2. Get STX tokens from an exchange or faucet
3. Connect your wallet to the Hayy Protocol dApp
4. Supply STX as collateral
5. Switch to Sui chain to borrow assets

#### Q: What are the risks?

**A**: Main risks include:
- Smart contract risk (mitigated by audits)
- Oracle price risk (mitigated by diversified price sources)
- Liquidation risk (manage by maintaining healthy collateral ratios)
- Cross-chain relayer risk (mitigated by decentralization)

#### Q: How do I maintain a healthy position?

**A**: Best practices:
1. Keep health factor above 1.5 for safety
2. Monitor asset prices regularly
3. Don't borrow at maximum capacity
4. Consider market volatility
5. Set up price alerts

#### Q: Can I lose my funds?

**A**: While the protocol is designed to be secure, risks exist:
- Smart contract bugs (unlikely due to audits)
- Market crashes causing liquidations
- Oracle failures (mitigated by redundancy)
- Cross-chain failures (mitigated by relayer monitoring)

### Developer Questions

#### Q: How can I integrate Hayy Protocol into my dApp?

**A**: Integration options:
1. Use our frontend SDK for React applications
2. Use our REST API for backend integration
3. Direct contract calls for custom implementations
4. Use our subgraph for historical data

#### Q: What programming languages are supported?

**A**: Supported languages:
- Frontend: TypeScript/JavaScript (React, Vue, Angular)
- Backend: Node.js, Python, Go, Rust
- Smart Contracts: Clarity (Stacks), Move (Sui)
- Mobile: React Native, Flutter

#### Q: How can I contribute to the protocol?

**A**: Contribution opportunities:
1. Code contributions on GitHub
2. Bug bounty participation
3. Community governance
4. Documentation improvements
5. Testing and feedback

#### Q: Where can I get help?

**A**: Support channels:
1. Documentation: docs.hayyprotocol.com
2. Discord: discord.gg/hayyprotocol
3. GitHub Issues: github.com/hayyprotocol/issues
4. Twitter: @hayyprotocol
5. Email: support@hayyprotocol.com

### Troubleshooting Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Transaction fails | Check balance, gas fees, and health factor |
| Wallet won't connect | Clear cache, check network, try different browser |
| Data not loading | Check API endpoints, verify contract addresses |
| Relayer not working | Check logs, verify WebSocket connections |
| High gas fees | Wait for off-peak hours, optimize transactions |
| Liquidation risk | Add more collateral or repay debt |
| Cross-chain delays | Check relayer status, monitor event processing |

---

## Emergency Procedures

### Smart Contract Emergency

If a critical vulnerability is discovered:

1. **Pause Protocol**: Use emergency pause functions
2. **Notify Community**: Announce through all channels
3. **Deploy Fix**: Deploy patched contracts
4. **Migrate Funds**: Safely migrate user funds
5. **Post-mortem**: Analyze and share findings

### Relayer Emergency

If relayer service fails:

1. **Switch to Backup**: Activate backup relayer
2. **Manual Processing**: Process critical transactions manually
3. **Investigate**: Analyze root cause
4. **Restore**: Bring primary relayer back online
5. **Monitor**: Watch for any issues

### Security Incident

If a security incident occurs:

1. **Contain**: Isolate affected systems
2. **Assess**: Determine impact scope
3. **Communicate**: Inform stakeholders
4. **Remediate**: Fix vulnerabilities
5. **Review**: Improve security measures

---

## Contact Information

- **Security Team**: security@hayyprotocol.com
- **Technical Support**: support@hayyprotocol.com
- **Business Inquiries**: business@hayyprotocol.com
- **Media**: press@hayyprotocol.com

For urgent security issues, please use the security email with "URGENT" in the subject line.

This troubleshooting guide should help resolve most common issues with Hayy Protocol. For additional support, please reach out through our official channels.