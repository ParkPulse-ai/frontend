# ParkPulse Frontend

**Next.js frontend application for ParkPulse.ai - Community-driven park protection platform**

---

## 🔗 Hedera Contract Information

| Property | Value |
|----------|-------|
| **Contract Name** | ParkPulseCommunity |
| **Contract ID** | `0.0.7298075` |
| **HCS Topic ID** | `0.0.7284567` |
| **Network** | Hedera Testnet |
| **Explorer** | [View on HashScan](https://hashscan.io/testnet/contract/0.0.7298075) |

---

## 📖 Overview

ParkPulse is a decentralized platform that empowers communities to protect public parks through transparent, blockchain-based voting. Built on Hedera Hashgraph for fast, secure, and low-cost transactions.

### Key Features

- 🗳️ **Decentralized Voting**: Community-driven proposals and voting
- 🌳 **Environmental Impact**: AI-powered NDVI and air quality analysis
- 🗺️ **Interactive Maps**: Mapbox-powered park visualization
- 💰 **Crowdfunding**: Support accepted proposals with HBAR donations
- 📊 **Real-time Data**: Live proposal updates from blockchain
- 🔐 **Wallet Integration**: MetaMask and WalletConnect support

---

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS
- **Blockchain**: Hedera Hashgraph
- **Backend API**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)

---

## ⚙️ Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Hedera Service**: Running on port 5000
- **Backend API**: Running on port 4000

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd parkpulsefe
npm install
```

### 2. Configure Environment

Create `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4000

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# WalletConnect Project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id

# Hedera Configuration
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_HEDERA_SERVICE_URL=http://localhost:5000

# Hedera Contract (Deployed)
NEXT_PUBLIC_HEDERA_CONTRACT_ID=0.0.7298075
NEXT_PUBLIC_HEDERA_CONTRACT_ADDRESS=0.0.7298075

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at: `http://localhost:3000`

---

## 📁 Project Structure

```
parkpulsefe/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── proposals/           # Proposal pages
│   ├── create/              # Create proposal
│   └── dashboard/           # User dashboard
├── components/              # React components
│   ├── Map/                 # Mapbox components
│   ├── Proposal/            # Proposal cards & details
│   ├── Vote/                # Voting interface
│   └── ui/                  # Reusable UI components
├── lib/                     # Utility functions
│   ├── hedera.ts           # Hedera SDK config
│   └── api.ts              # API client
├── types/                   # TypeScript types
├── public/                  # Static assets
├── .env.local              # Environment variables
└── package.json
```

---

## 🔌 Backend Integration

### Hedera Service (Port 5000)

The frontend communicates with the Hedera service for blockchain operations:

```typescript
// Get contract info
const response = await fetch(`${HEDERA_SERVICE_URL}/api/contract/info`);

// Create proposal
await fetch(`${HEDERA_SERVICE_URL}/api/contract/create-proposal`, {
  method: 'POST',
  body: JSON.stringify(proposalData)
});

// Submit vote
await fetch(`${HEDERA_SERVICE_URL}/api/contract/vote`, {
  method: 'POST',
  body: JSON.stringify({ proposalId, vote, voter })
});
```

### Python Backend (Port 4000)

Environmental analysis and park data:

```typescript
// Get parks
const parks = await fetch(`${API_URL}/api/parks`);

// Analyze park impact
const analysis = await fetch(`${API_URL}/api/analyze`, {
  method: 'POST',
  body: JSON.stringify({ parkId, location })
});
```

---

## 🗺️ Features & Pages

### Home Page (`/`)
- Featured parks at risk
- Active proposals overview
- Platform statistics
- Call-to-action for engagement

### Proposals (`/proposals`)
- Browse all proposals
- Filter by status (Active, Accepted, Rejected)
- View environmental impact data
- Real-time vote counts

### Create Proposal (`/create`)
- Interactive map for park selection
- AI-powered environmental analysis
- Demographic impact assessment
- Smart contract integration

### Proposal Details (`/proposals/[id]`)
- Full proposal information
- Environmental metrics (NDVI, PM2.5)
- Demographics breakdown
- Voting interface
- Funding progress (if accepted)

### Dashboard (`/dashboard`)
- User's voting history
- Created proposals
- Donation tracking
- Community impact stats

---

## 🎨 Key Components

### MapView Component
```typescript
import MapView from '@/components/Map/MapView';

<MapView
  parks={parks}
  onParkSelect={handleParkSelect}
  center={[lat, lng]}
/>
```

### ProposalCard Component
```typescript
import ProposalCard from '@/components/Proposal/ProposalCard';

<ProposalCard
  proposal={proposal}
  onVote={handleVote}
  showVoteButton={true}
/>
```

### VoteButton Component
```typescript
import VoteButton from '@/components/Vote/VoteButton';

<VoteButton
  proposalId={proposalId}
  onVoteSuccess={handleSuccess}
  disabled={hasVoted}
/>
```

---

## 🔐 Wallet Integration

### Supported Wallets
- MetaMask
- WalletConnect (mobile wallets)
- Hedera HashPack (coming soon)

### Connect Wallet Example
```typescript
import { useWallet } from '@/hooks/useWallet';

const { connect, address, isConnected } = useWallet();

<button onClick={connect}>
  {isConnected ? address : 'Connect Wallet'}
</button>
```

---

## 📊 State Management

### Environment Variables
Access via `process.env.NEXT_PUBLIC_*`:
```typescript
const contractId = process.env.NEXT_PUBLIC_HEDERA_CONTRACT_ID;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### React Hooks
- `useWallet()` - Wallet connection & state
- `useProposals()` - Fetch and manage proposals
- `useVote()` - Handle voting logic
- `useContract()` - Contract interactions

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test:watch

# E2E tests
npm run test:e2e
```

---

## 🏗️ Build & Deploy

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Lint & Format
```bash
npm run lint
npm run format
```

---

## 🌐 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Environment Variables for Production
Ensure all `NEXT_PUBLIC_*` variables are set in your deployment platform:
- Hedera contract ID
- API URLs (production endpoints)
- Mapbox token
- Supabase credentials

---

## 🔄 API Integration Flow

1. **User Action**: Select park on map
2. **Frontend Request**: POST to `/api/analyze`
3. **AI Analysis**: Environmental impact calculated
4. **Proposal Creation**: POST to Hedera service
5. **Smart Contract**: Transaction submitted to blockchain
6. **Confirmation**: Proposal ID returned
7. **UI Update**: Display new proposal

---

## 🐛 Troubleshooting

### Contract Not Found
- Verify `NEXT_PUBLIC_HEDERA_CONTRACT_ID` matches deployed contract
- Ensure Hedera service is running
- Check network (testnet/mainnet)

### Wallet Connection Issues
- Ensure WalletConnect Project ID is valid
- Check wallet network matches Hedera testnet (chainId: 296)
- Clear browser cache and reconnect

### Map Not Loading
- Verify Mapbox token is valid
- Check API quotas
- Ensure public access token has correct scopes

### API Errors
- Confirm backend services are running (ports 4000 & 5000)
- Check CORS configuration
- Verify API URLs in `.env.local`

---

## 📚 Additional Resources

### Documentation
- **Next.js**: https://nextjs.org/docs
- **Hedera**: https://docs.hedera.com/
- **Mapbox**: https://docs.mapbox.com/
- **Tailwind CSS**: https://tailwindcss.com/docs

### Explorer & Tools
- **HashScan**: https://hashscan.io/testnet/contract/0.0.7298075
- **Hedera Portal**: https://portal.hedera.com/
- **Supabase Dashboard**: Your Supabase project URL

---

## 🔒 Security

- All sensitive keys are environment variables
- Private keys never exposed to frontend
- API requests validated server-side
- Smart contract audited for vulnerabilities
- CORS properly configured

---

Made with ❤️ for parks, communities, and the environment

**#BuildOnHedera #Web3ForGood**
