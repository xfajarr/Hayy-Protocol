# Hayy Protocol Stacks - Architecture Overview

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   Backend API   │    │   Relayer Service│
│   (React/Next)  │    │   (Express.js)  │    │   (Node.js)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ HTTP/WebSocket       │ HTTP/WebSocket       │ WebSocket
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Stacks Blockchain                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Money Market    │  │ Mock sBTC Token │  │ Mock Oracle     │ │
│  │ Core Contract   │  │ Contract        │  │ Contract        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                      │
          │ Cross-Chain Events    │ Price Feed
          ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Sui Blockchain                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Borrow          │  │ Lending Pools   │  │ Faucet Pool     │ │
│  │ Controller      │  │ (USDC/sBTC)     │  │ (Test Tokens)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Cross-Chain Flow Architecture

### 1. Deposit Flow (Stacks → Sui)

```
User Action (Frontend)                    Stacks Contract                     Relayer                          Sui Contract
┌─────────────────────┐                ┌─────────────────┐               ┌─────────────┐               ┌─────────────────┐
│ User deposits STX   │                │                 │               │             │               │                 │
│ via UI              │                │                 │               │             │               │                 │
│                     │                │                 │               │             │               │                 │
│ 1. Click "Deposit"  │                │                 │               │             │               │                 │
│ 2. Enter amount     │                │                 │               │             │               │                 │
│ 3. Confirm wallet   │ ─────────────► │ 4. supply-stx() │               │             │               │                 │
│    transaction      │                │                 │               │             │               │                 │
│                     │                │                 │               │             │               │                 │
│                     │                │ 5. Emit event:  │ ─────────────► │ 6. Monitor   │               │                 │
│                     │                │    "supply"     │               │    events    │               │                 │
│                     │                │                 │               │             │               │                 │
│                     │                │                 │               │ 7. Call Sui  │ ─────────────► │ 8. Register     │
│                     │                │                 │               │    contract  │               │    collateral   │
│                     │                │                 │               │             │               │                 │
│                     │                │                 │               │             │               │ 9. Update user  │
│                     │                │                 │               │             │               │    position      │
└─────────────────────┘                └─────────────────┘               └─────────────┘               └─────────────────┘
```

### 2. Borrow Flow (Sui Only)

```
User Action (Frontend)                    Sui Contract                     Backend API
┌─────────────────────┐                ┌─────────────────┐               ┌─────────────┐
│ User wants to borrow│                │                 │               │             │
│ USDC                │                │                 │               │             │
│                     │                │                 │               │             │
│ 1. Navigate to      │                │                 │               │             │
│    Borrow page      │                │                 │               │             │
│ 2. Select USDC      │                │                 │               │             │
│ 3. Enter amount     │                │                 │               │             │
│ 4. Confirm          │ ─────────────► │ 5. borrow-usdc()│               │             │
│                     │                │                 │               │             │
│                     │                │ 6. Check        │               │             │
│                     │                │    collateral   │               │             │
│                     │                │ 7. Transfer USDC │               │             │
│                     │                │    to user      │               │             │
│                     │                │ 8. Update debt  │               │             │
│                     │                │ 9. Emit event   │ ─────────────► │ 10. Update  │
│                     │                │                 │               │     cache   │
│                     │                │                 │               │ 11. Notify  │
│                     │                │                 │               │     UI      │
└─────────────────────┘                └─────────────────┘               └─────────────┘
```

### 3. Withdraw Flow (Stacks ← Sui)

```
User Action (Frontend)                    Sui Contract                     Relayer                          Stacks Contract
┌─────────────────────┐                ┌─────────────────┐               ┌─────────────┐               ┌─────────────────┐
│ User wants to       │                │                 │               │             │               │                 │
│ withdraw STX        │                │                 │               │             │               │                 │
│                     │                │                 │               │             │               │                 │
│ 1. Click "Withdraw" │                │                 │               │             │               │                 │
│ 2. Enter amount     │                │                 │               │             │               │                 │
│ 3. Submit request   │ ─────────────► │ 4. request-     │               │             │               │                 │
│                     │                │    withdraw()   │               │             │               │                 │
│                     │                │                 │               │             │               │                 │
│                     │                │ 5. Check debt   │               │             │               │                 │
│                     │                │    = 0?         │               │             │               │                 │
│                     │                │ 6. If yes:      │               │             │               │                 │
│                     │                │    emit event   │ ─────────────► │ 7. Monitor   │               │                 │
│                     │                │                 │               │    events    │               │                 │
│                     │                │                 │               │             │               │                 │
│                     │                │                 │               │ 8. Verify    │               │                 │
│                     │                │                 │               │    debt = 0  │               │                 │
│                     │                │                 │               │             │               │                 │
│                     │                │                 │               │ 9. Call      │ ─────────────► │ 10. admin-      │
│                     │                │                 │               │    Stacks    │               │     unlock-      │
│                     │                │                 │               │    contract  │               │     collateral() │
│                     │                │                 │               │             │               │                 │
│                     │                │                 │               │             │               │ 11. Transfer STX │
│                     │                │                 │               │             │               │     to user      │
│                     │                │                 │               │             │               │ 12. Emit event   │
└─────────────────────┘                └─────────────────┘               └─────────────┘               └─────────────────┘
```

### 4. Liquidation Flow (Cross-Chain)

```
Liquidator Bot                          Sui Contract                     Relayer                          Stacks Contract
┌─────────────────────┐                ┌─────────────────┐               ┌─────────────┐               ┌─────────────────┐
│ Bot monitors liquid-│                │                 │               │             │               │                 │
│ atable positions     │                │                 │               │             │               │                 │
│                     │                │                 │               │             │               │                 │
│ 1. Scan all users   │                │                 │               │             │               │                 │
│ 2. Calculate health  │                │                 │               │             │               │                 │
│    factors          │                │                 │               │             │               │                 │
│ 3. Find HF < 1.0    │                │                 │               │             │               │                 │
│                     │                │                 │               │             │               │                 │
│ 4. Execute liquid-  │ ─────────────► │ 5. liquidate()  │               │             │               │                 │
│    ation on Sui     │                │                 │               │             │               │                 │
│                     │                │ 6. Repay debt   │               │             │               │                 │
│                     │                │ 7. Seize        │               │             │               │                 │
│                     │                │    collateral   │               │             │               │                 │
│                     │                │ 8. Emit event   │ ─────────────► │ 9. Monitor   │               │                 │
│                     │                │                 │               │    events    │               │                 │
│                     │                │                 │               │             │               │                 │
│                     │                │                 │               │ 10. Update   │               │                 │
│                     │                │                 │               │     Stacks   │               │                 │
│                     │                │                 │               │     position │               │                 │
│                     │                │                 │               │             │               │                 │
│                     │                │                 │               │ 11. Notify   │               │                 │
│                     │                │                 │               │     frontend │               │                 │
└─────────────────────┘                └─────────────────┘               └─────────────┘               └─────────────────┘
```

## Contract Interaction Flow

### User Journey Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER JOURNEY                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Onboarding│    │   Supply    │    │   Borrow    │    │   Repay     │    │  Withdraw   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Connect Wallet  │ │ Supply STX on   │ │ Borrow USDC on  │ │ Repay USDC on   │ │ Withdraw STX    │
│ (Hiro Wallet)   │ │ Stacks          │ │ Sui             │ │ Sui             │ │ from Stacks     │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
       │                   │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Get Address     │ │ call supply-stx()│ │ call borrow-    │ │ call repay-     │ │ call request-   │
│ & Balance       │ │                 │ │ usdc()          │ │ usdc()          │ │ withdraw()      │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
       │                   │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Show Dashboard  │ │ STX → Stacks    │ │ USDC → User     │ │ USDC → Protocol │ │ Verify debt = 0 │
│ with TVL,       │ │ Contract        │ │ wallet          │ │                 │ │                 │
│ APY, Health     │ │                 │ │                 │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
       │                   │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Enable          │ │ Register on Sui │ │ Update debt     │ │ Reduce debt     │ │ Admin unlocks   │
│ Notifications   │ │ via Relayer     │ │ on Sui          │ │ on Sui          │ │ STX on Stacks   │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Data Flow Architecture

### 1. Real-time Data Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   Backend API   │    │   Event Stream  │    │   Blockchain   │
│                 │    │                 │    │   Processor    │    │   Events        │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │                      │
          │ WebSocket/HTTP       │ WebSocket            │ WebSocket            │ WebSocket
          │                      │                      │                      │
          ▼                      ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ React State     │    │ Cache Layer     │    │ Event Buffer    │    │ New Blocks      │
│ Management      │    │ (Redis/Memory)  │    │ (Queue)         │    │ & Transactions  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │                      │
          │ State Updates        │ Cache Invalidation   │ Event Processing     │ Event Emission
          │                      │                      │                      │
          └──────────────────────┴──────────────────────┴──────────────────────┘
                                   Real-time UI Updates
```

### 2. Cache Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cache Strategy                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   L1 Cache      │    │   L2 Cache      │    │   L3 Cache      │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
│                 │    │                 │    │                 │
│ • React State   │    │ • Redis         │    │ • PostgreSQL    │
│ • Local Storage │    │ • Memory Store  │    │ • Time Series   │
│ • Session Data  │    │ • Query Results │    │ • Historical    │
│ TTL: 5-30s      │    │ TTL: 1-5min     │    │ TTL: Permanent  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                      │                      │
          │ State Sync           │ Cache Sync           │ Query Results
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cache Invalidation                            │
│                                                                 │
│ • WebSocket Events → Invalidate Related Cache                   │
│ • Time-based TTL → Auto-expire                                 │
│ • Manual Cache Clear → Admin Operations                         │
│ • Chain Reorgs → Invalidate Affected Blocks                    │
└─────────────────────────────────────────────────────────────────┘
```

## Security Architecture

### 1. Trust Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        Trust Boundaries                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Wallet   │    │   Frontend      │    │   Backend       │
│   (Trusted)     │    │   (Semi-Trusted)│    │   (Trusted)     │
│                 │    │                 │    │                 │
│ • Private Keys  │    • No secrets     │    • API Keys       │
│ • Transaction   │    • Client-side    │    • Admin Keys     │
│   Signing       │    • Validation     │    • Multi-sig      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                      │                      │
          │ Signed Transactions  │ HTTP/HTTPS          │ Internal API
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Smart Contracts                              │
│                 (Trustless / Verified)                          │
│                                                                 │
│ • Immutable Logic      • Audited Code       • On-chain Validation│
│ • Transparent State    • Open Source        • Economic Security  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Attack Vector Defense

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layers                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Input         │    │   Transaction   │    │   Contract      │
│   Validation    │    │   Validation    │    │   Validation    │
│                 │    │                 │    │                 │
│ • Type Checking │    • Signature      │    • Access Control │
│ • Range Checks  │    • Nonce Check    │    • State Checks   │
│ • Sanitization  │    • Gas Limits     │    • Reentrancy     │
│ • Rate Limiting │    • Post Conditions│    • Integer Overflow│
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                      │                      │
          │ Clean Data           │ Valid Transactions  │ Secure Execution
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Monitoring & Response                         │
│                                                                 │
│ • Real-time Alerts    • Incident Response   • Forensic Analysis │
│ • Anomaly Detection   • Emergency Pause     • Recovery Plans    │
│ • Audit Logging       • Multi-sig Controls   • Insurance         │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Architecture                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │   State         │    │   Services      │
│                 │    │   Management    │    │                 │
│ • React Hooks   │    • Zustand/Redux  │    • Wallet Connect │
│ • Web3 Utils    │    • Query Cache    │    • API Client     │
│ • Charts        │    • Event Store    │    • Event Stream   │
│ • Forms         │    • User Profile   │    • Notifications  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                      │                      │
          │ Props/Events         │ State Updates        │ Data Fetching
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Router                            │
│                                                                 │
│ • Page Routes         • Protected Routes   • Error Boundaries  │
│ • Query Parameters    • SEO Optimization   • Analytics         │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Architecture                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Layer     │    │   Business      │    │   Data Layer    │
│                 │    │   Logic         │    │                 │
│ • REST/GraphQL  │    • Lending Logic  │    • PostgreSQL     │
│ • WebSocket     │    • Risk Engine    │    • Redis Cache    │
│ • Auth/AuthZ    │    • Event Handler  │    • Time Series    │
│ • Rate Limiting │    • Relayer Logic  │    • File Storage   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                      │                      │
          │ HTTP/WebSocket       │ Business Rules       │ Data Persistence
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure                                │
│                                                                 │
│ • Load Balancer       • Container Orchestration   • Monitoring │
│ • API Gateway         • Service Mesh             • Logging    │
│ • CDN                • Secret Management        • Backup     │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

### 1. Stacks Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                    Stacks Deployment                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │   Testnet       │    │   Mainnet       │
│                 │    │                 │    │                 │
│ • Local Simnet  │    • Public Testnet │    • Production     │
│ • Clarinet      │    • Stacks 2.4     │    • Audited Code   │
│ • Unit Tests    │    • Test STX       │    • Multi-sig      │
│ • Integration   │    • Test Tokens    │    • Monitoring     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                      │                      │
          │ Development          │ Testing             │ Production
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Contract Addresses                            │
│                                                                 │
│ • Dev: Localhost       • Test: ST27SK3...   • Main: TBD         │
│ • Mock Oracle          • Mock sBTC         • Real Oracle       │
│ • Test Tokens          • Test Faucet       • Real Tokens       │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Infrastructure Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Deployment                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Relayer       │
│                 │    │                 │    │                 │
│ • Vercel/Netlify│    • AWS/GCP        │    • Dedicated VM   │
│ • CDN           │    • Docker/K8s     │    • High Uptime    │
│ • Static Assets │    • Auto-scaling   │    • Monitoring     │
│ • SPA           │    • Load Balancer  │    • Alerts         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                      │                      │
          │ Global CDN           │ API Endpoints       │ Cross-Chain
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Monitoring & Observability                    │
│                                                                 │
│ • Prometheus/Grafana • ELK Stack        • Sentry         • APM  │
│ • AlertManager       • Log Aggregation  • Error Tracking • Uptime│
└─────────────────────────────────────────────────────────────────┘
```

## Performance Architecture

### 1. Request Flow Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    Performance Optimization                      │
└─────────────────────────────────────────────────────────────────┘

User Request → CDN → Edge Cache → API Cache → Database → Blockchain
     │           │         │          │          │          │
     ▼           ▼         ▼          ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ <100ms  │ │ <50ms   │ │ <10ms   │ │ <100ms  │ │ <200ms  │ │ 1-5s    │
│ Static  │ │ Static  │ │ API     │ │ Query   │ │ DB      │ │ On-chain│
│ Assets  │ │ Content │ │ Results │ │ Cache   │ │ Query   │ │ Call    │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### 2. Caching Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Multi-Level Caching                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   CDN           │    │   Edge          │
│   Cache         │    │   Cache         │    │   Cache         │
│                 │    │                 │    │                 │
│ • Static Assets │    • Static Content │    • API Responses  │
│ • API Responses │    • Pages          │    • User Sessions  │
│ • 5-30 min TTL  │    • 1-24 hour TTL  │    • 1-5 min TTL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                      │                      │
          │ Cache Miss           │ Cache Miss           │ Cache Miss
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Origin Server                                  │
│                                                                 │
│ • Application Cache    • Database Cache    • Blockchain Cache   │
│ • Redis/Memory         • Query Results     • Read-only Calls    │
│ • 1-5 min TTL          • 10-60 min TTL     • 30-60 sec TTL      │
└─────────────────────────────────────────────────────────────────┘
```

This architecture overview provides a comprehensive view of the Hayy Protocol system, including cross-chain flows, security models, deployment strategies, and performance optimizations.