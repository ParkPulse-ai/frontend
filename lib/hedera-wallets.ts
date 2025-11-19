import { ethers } from 'ethers';
import { DAppConnector, HederaSessionEvent, HederaJsonRpcMethod, HederaChainId } from '@hashgraph/hedera-wallet-connect';
import { LedgerId } from '@hashgraph/sdk';

// Hedera configuration
const HEDERA_NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
const HEDERA_SERVICE_URL = process.env.NEXT_PUBLIC_HEDERA_SERVICE_URL || 'http://localhost:5000';

// WalletConnect Project ID (get from https://cloud.walletconnect.com/)
const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

export enum WalletType {
  METAMASK = 'metamask',
  HASHPACK = 'hashpack',
  BLADE = 'blade',
}

// Global connector instance
let dAppConnector: DAppConnector | null = null;

/**
 * Initialize DAppConnector for HashPack/Blade wallets
 */
export async function initializeDAppConnector(): Promise<DAppConnector> {
  if (dAppConnector) {
    return dAppConnector;
  }

  const metadata = {
    name: 'ParkPulse.ai',
    description: 'AI-Powered Urban Intelligence Platform for Green Spaces',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://parkpulse.ai',
    icons: ['https://parkpulse.ai/logo.png'],
  };

  // Use LedgerId from @hashgraph/sdk for network parameter
  const network = HEDERA_NETWORK === 'testnet' ? LedgerId.TESTNET : LedgerId.MAINNET;

  // Determine chain IDs based on network
  const chainIds = HEDERA_NETWORK === 'testnet'
    ? [HederaChainId.Testnet]
    : [HederaChainId.Mainnet];

  dAppConnector = new DAppConnector(
    metadata,
    network,
    WALLET_CONNECT_PROJECT_ID,
    Object.values(HederaJsonRpcMethod),
    [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
    chainIds
  );

  // Initialize the connector
  await dAppConnector.init({ logger: 'error' });

  return dAppConnector;
}

/**
 * Connect to HashPack wallet
 */
export async function connectHashPack(): Promise<string> {
  const connector = await initializeDAppConnector();

  try {
    // Open the WalletConnect modal to connect
    const session = await connector.openModal();

    if (!session) {
      throw new Error('Failed to create HashPack session - user cancelled or connection failed');
    }

    // Extract account ID from session
    // Session format: hedera:testnet:0.0.XXXXX or hedera:mainnet:0.0.XXXXX
    const sessionAccount = session.namespaces?.hedera?.accounts?.[0];

    if (!sessionAccount) {
      throw new Error('No account found in session');
    }

    // Parse the account ID from the session string
    const accountParts = sessionAccount.split(':');
    const accountId = accountParts[accountParts.length - 1]; // Gets "0.0.XXXXX"

    console.log('✅ Connected to HashPack:', accountId);
    console.log('📡 Network:', accountParts[1]);

    return accountId;
  } catch (error) {
    console.error('❌ HashPack connection failed:', error);
    throw error;
  }
}

/**
 * Connect to Blade wallet
 */
export async function connectBlade(): Promise<string> {
  const connector = await initializeDAppConnector();

  try {
    const session = await connector.openModal();

    if (!session) {
      throw new Error('Failed to create Blade session - user cancelled or connection failed');
    }

    // Extract account ID from session
    const sessionAccount = session.namespaces?.hedera?.accounts?.[0];

    if (!sessionAccount) {
      throw new Error('No account found in session');
    }

    const accountParts = sessionAccount.split(':');
    const accountId = accountParts[accountParts.length - 1];

    console.log('✅ Connected to Blade:', accountId);

    return accountId;
  } catch (error) {
    console.error('❌ Blade connection failed:', error);
    throw error;
  }
}

/**
 * Connect to MetaMask (EVM-style)
 */
export async function connectMetaMask(): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  // Check/switch to Hedera network
  const network = await provider.getNetwork();
  const expectedChainId = HEDERA_NETWORK === 'testnet' ? 296 : 295;

  if (Number(network.chainId) !== expectedChainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await addHederaNetworkToMetaMask();
      } else {
        throw switchError;
      }
    }
  }

  const accounts = await provider.send('eth_requestAccounts', []);
  return accounts[0];
}

/**
 * Add Hedera network to MetaMask
 */
export async function addHederaNetworkToMetaMask() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const networkConfig = HEDERA_NETWORK === 'testnet' ? {
    chainId: '0x128', // 296
    chainName: 'Hedera Testnet',
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
    rpcUrls: ['https://testnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/testnet'],
  } : {
    chainId: '0x127', // 295
    chainName: 'Hedera Mainnet',
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/mainnet'],
  };

  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [networkConfig],
  });
}

/**
 * Universal connect function - auto-detects and connects to available wallet
 */
export async function connectWallet(walletType: WalletType): Promise<{ address: string; type: WalletType }> {
  switch (walletType) {
    case WalletType.HASHPACK:
      const hashpackAccount = await connectHashPack();
      return { address: hashpackAccount, type: WalletType.HASHPACK };

    case WalletType.BLADE:
      const bladeAccount = await connectBlade();
      return { address: bladeAccount, type: WalletType.BLADE };

    case WalletType.METAMASK:
    default:
      const metamaskAddress = await connectMetaMask();
      return { address: metamaskAddress, type: WalletType.METAMASK };
  }
}

/**
 * Get current wallet address
 */
export async function getCurrentWalletAddress(walletType?: WalletType): Promise<string | null> {
  if (!walletType || walletType === WalletType.METAMASK) {
    if (typeof window === 'undefined' || !window.ethereum) {
      return null;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      return accounts[0]?.address || null;
    } catch {
      return null;
    }
  }

  // For HashPack/Blade, check if connector has active session
  if (dAppConnector) {
    const sessions = dAppConnector.signers;
    if (sessions && sessions.length > 0) {
      return sessions[0].getAccountId().toString();
    }
  }

  return null;
}

/**
 * Vote on proposal - works with HashPack wallet (default)
 */
export async function voteOnProposal(
  proposalId: number,
  vote: 'yes' | 'no'
): Promise<string> {
  let userAddress: string;

  // HashPack wallet
  if (!dAppConnector) {
    throw new Error('HashPack wallet not connected. Please connect your wallet first.');
  }

  const signers = dAppConnector.signers;
  if (!signers || signers.length === 0) {
    throw new Error('No active HashPack session. Please reconnect your wallet.');
  }

  userAddress = signers[0].getAccountId().toString();

  // Call Hedera service to submit vote
  const response = await fetch(`${HEDERA_SERVICE_URL}/api/contract/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      proposalId,
      vote: vote === 'yes',
      voter: userAddress,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to submit vote');
  }

  return result.transactionId;
}

/**
 * Check if user has voted
 */
export async function hasUserVoted(proposalId: number, userAddress: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${HEDERA_SERVICE_URL}/api/contract/has-voted/${proposalId}/${userAddress}`
    );

    const result = await response.json();
    return result.success ? result.hasVoted : false;
  } catch (error) {
    console.error('Error checking if user has voted:', error);
    return false;
  }
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet(walletType: WalletType) {
  if (walletType !== WalletType.METAMASK && dAppConnector) {
    await dAppConnector.disconnectAll();
    dAppConnector = null;
  }
}

/**
 * Get available wallets
 */
export function getAvailableWallets(): WalletType[] {
  const wallets: WalletType[] = [];

  // Check for MetaMask
  if (typeof window !== 'undefined' && window.ethereum) {
    wallets.push(WalletType.METAMASK);
  }

  // HashPack and Blade are available via WalletConnect
  wallets.push(WalletType.HASHPACK, WalletType.BLADE);

  return wallets;
}

// Type declarations
declare global {
  interface Window {
    ethereum?: any;
  }
}

// No longer needed - HederaChainId is imported from the library
