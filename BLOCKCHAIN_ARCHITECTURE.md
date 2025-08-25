# Blockchain Architecture Documentation

## Overview

This document describes the blockchain and transaction mechanism implemented in the StarsLab application. The system features a real-time blockchain visualization with dynamic mining, transaction processing, and chain forking capabilities.

## System Architecture

### Frontend Components

#### 1. BlockchainViz.svelte
The main visualization component that renders the blockchain network in real-time using Canvas 2D.

**Key Features:**
- **Dynamic Mining**: Blocks are mined every 5 seconds (base time)
- **User Interaction**: Click interactions speed up mining (up to 95% faster)
- **Chain Forking**: Simulates blockchain forks with 30% probability
- **Transaction Pool**: Maintains mempool of pending transactions
- **Network Nodes**: Visualizes validators, miners, and peers

**Mining Configuration:**
```javascript
baseMiningTime = 5000; // 5 seconds when idle
miningSpeedMultiplier = 1 + (userActivityLevel * 0.95); // Dynamic based on activity
```

#### 2. BlockchainExplorer.svelte
Provides a blockchain explorer interface with three main tabs:
- **Blocks**: Lists all mined blocks with height, hash, and timestamp
- **Transactions**: Shows all transactions with status tracking
- **Chain Forks**: Displays fork statistics and resolution

**Features:**
- Real-time data updates every 5 seconds
- Search functionality for blocks and transactions
- Transaction status tracking (pending → confirmed)

#### 3. BlockchainStats.svelte
Displays real-time blockchain statistics:
- Total blocks mined
- Active nodes in network
- Transactions per second
- Current mining difficulty

### Backend Architecture (Cloudflare Workers + D1)

#### Database Schema

**Blocks Table:**
```sql
blocks (
  id INTEGER PRIMARY KEY,
  hash TEXT UNIQUE NOT NULL,
  previousHash TEXT NOT NULL,
  height INTEGER NOT NULL,
  chainId TEXT NOT NULL,
  timestamp INTEGER DEFAULT CURRENT_TIMESTAMP,
  transactionCount INTEGER DEFAULT 0,
  minerAddress TEXT,
  difficulty REAL,
  nonce INTEGER,
  createdAt INTEGER DEFAULT CURRENT_TIMESTAMP
)
```

**Transactions Table:**
```sql
transactions (
  id INTEGER PRIMARY KEY,
  hash TEXT UNIQUE NOT NULL,
  blockHash TEXT REFERENCES blocks(hash),
  fromAddress TEXT NOT NULL,
  toAddress TEXT NOT NULL,
  value REAL NOT NULL,
  fee REAL,
  status TEXT DEFAULT 'pending', -- pending|confirmed|failed
  userCreated BOOLEAN DEFAULT false,
  createdAt INTEGER DEFAULT CURRENT_TIMESTAMP
)
```

**Additional Tables:**
- `interactions`: Tracks user clicks and interactions
- `miningStats`: Records mining performance metrics
- `nodes`: Network node registry
- `chainForks`: Fork tracking and resolution

#### API Endpoints

**Blockchain Routes** (`/api/blockchain/*`):
- `GET /blocks` - List blocks with pagination
- `GET /blocks/:hash` - Get specific block
- `POST /blocks` - Create new block
- `GET /blocks/latest` - Get latest block
- `GET /blocks/stats` - Blockchain statistics

**Transaction Routes** (`/api/transactions/*`):
- `GET /transactions` - List transactions
- `GET /transactions/:hash` - Get specific transaction
- `POST /transactions` - Create transaction
- `PATCH /transactions/:hash` - Update transaction status
- `GET /transactions/stats/summary` - Transaction statistics
- `GET /transactions/mempool/pending` - Get pending transactions

**Analytics Routes** (`/api/analytics/*`):
- `POST /interactions` - Record user interaction
- `GET /mining-stats/:sessionId` - Get mining statistics
- `POST /mining-stats` - Update mining statistics

## Transaction Lifecycle

### 1. Transaction Creation
When a user clicks on the visualization:
```javascript
1. Frontend generates random transaction data
2. Calls api.createTransaction() with:
   - hash: Unique identifier
   - fromAddress: Random sender
   - toAddress: Random recipient
   - value: Random amount (10-100)
   - status: 'pending'
   - createdAt: Current timestamp
```

### 2. Mempool Management
- Transactions start in 'pending' status
- Stored in database with `createdAt` timestamp
- Retrieved via `/api/transactions/mempool/pending`

### 3. Block Mining
Every 5 seconds (or faster with user activity):
```javascript
1. Select 3-8 pending transactions from mempool
2. Create new block with:
   - Unique hash
   - Previous block hash (chain linking)
   - Height (incremental)
   - Chain ID (for fork tracking)
   - Transaction count
3. Update transactions to 'confirmed' status
4. Store block in database
```

### 4. Transaction Confirmation
- Transaction status changes from 'pending' to 'confirmed'
- `blockHash` field updated with containing block
- Displayed in explorer with confirmation status

## Mining Mechanism

### Base Mining
- Default interval: 5 seconds per block
- Minimum interval: 1 second (prevents burst mining)
- Mining progress bar shows time until next block

### Dynamic Speed Adjustment
User interactions affect mining speed:
```javascript
userActivityLevel = Math.min(clickCount * 0.1, 1); // 0 to 1
miningSpeedMultiplier = 1 + (userActivityLevel * 0.95); // 1x to 1.95x
currentMiningTime = baseMiningTime / miningSpeedMultiplier;
```

### Chain Competition
- 30% chance of fork creation
- Forks compete for longest chain
- Main chain has 60% mining advantage
- Fork resolution after 5+ blocks difference

## Data Synchronization

### Frontend-Backend Sync
- Stats update every 5 seconds via polling
- Session-based tracking with UUID
- Optimistic UI updates with backend confirmation

### Real-time Updates
```javascript
// Frontend polls for updates
setInterval(async () => {
  const stats = await api.getMiningStats();
  if (stats) {
    updateVisualization(stats);
  }
}, 5000);
```

## Performance Optimizations

### Canvas Rendering
- Object pooling for blocks and transactions
- Efficient particle system with reuse
- RequestAnimationFrame for smooth 60fps
- Viewport culling for off-screen elements

### Database Queries
- Indexed columns: hash, sessionId, status
- Pagination with limit/offset
- Descending order by ID for newest-first
- Batch updates for transaction confirmation

### API Response Caching
- 15-minute cache for WebFetch operations
- Cloudflare CDN caching for static assets
- KV storage for frequently accessed data

## Security Considerations

### Input Validation
- Zod schemas for all API inputs
- SQL injection prevention via Drizzle ORM
- Rate limiting on interaction endpoints

### CORS Configuration
```javascript
cors({
  origin: ['http://localhost:5173', 'https://starslab.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
})
```

## Deployment

### Cloudflare Workers
- Single worker serves both API and frontend
- D1 database for persistent storage
- Automatic SSL/TLS encryption
- Global CDN distribution

### Environment Variables
- `DB`: D1 database binding
- `ENVIRONMENT`: production/development
- `CORS_ORIGIN`: Allowed origins

## Future Enhancements

1. **Consensus Mechanisms**: Implement PoW/PoS simulation
2. **Smart Contracts**: Add contract deployment and execution
3. **Network Sharding**: Simulate sharded blockchain
4. **Cross-chain Bridges**: Inter-blockchain communication
5. **Gas Fee Market**: Dynamic fee calculation
6. **Block Rewards**: Mining incentive system
7. **Wallet Integration**: User wallet management
8. **Transaction Signatures**: Cryptographic validation

## Troubleshooting

### Common Issues

1. **Transactions showing "Pending" timestamp**
   - Ensure `createdAt` is set when creating transactions
   - Check database schema has proper defaults

2. **Mining burst after refresh**
   - Check `lastBlockTime` initialization
   - Verify minimum 1-second constraint

3. **Blocks disappearing**
   - Implement modulo wrap for canvas positioning
   - Check viewport boundaries

4. **API connection errors**
   - Verify relative API paths in production
   - Check CORS configuration
   - Ensure wrangler dev runs on correct port (43251)

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start API server
cd api && npx wrangler dev --port 43251

# Build for production
npm run build

# Deploy to Cloudflare
cd api && npx wrangler deploy
```

## Testing

### Manual Testing Checklist
- [ ] Click to create transactions
- [ ] Verify mining speed increases with activity
- [ ] Check block creation every 5 seconds
- [ ] Confirm transactions move from pending to confirmed
- [ ] Test blockchain explorer search functionality
- [ ] Verify timestamps display correctly
- [ ] Check chain fork visualization
- [ ] Test API endpoints with different parameters

## Contributing

When contributing to the blockchain mechanism:
1. Follow existing code patterns
2. Update this documentation for significant changes
3. Test transaction lifecycle end-to-end
4. Ensure backward compatibility with existing data
5. Run linting and type checking before commits

---

*Last Updated: August 2024*
*Version: 1.0.0*