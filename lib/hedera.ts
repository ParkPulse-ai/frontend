import { ethers } from 'ethers';

// Hedera Testnet configuration
const HEDERA_NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
const HEDERA_CONTRACT_ID = process.env.NEXT_PUBLIC_HEDERA_CONTRACT_ID || '';
const HEDERA_SERVICE_URL = process.env.NEXT_PUBLIC_HEDERA_SERVICE_URL || 'http://localhost:5000';

// Convert Hedera Contract ID to EVM address
// Hedera contract IDs like 0.0.XXXXX need to be converted to EVM hex addresses
function contractIdToEvmAddress(contractId: string): string {
  // This is a simplified conversion - actual implementation depends on Hedera's addressing
  // For now, use environment variable or fallback
  return process.env.NEXT_PUBLIC_HEDERA_CONTRACT_ADDRESS || contractId;
}

/**
 * Get Hedera provider (MetaMask connected to Hedera JSON-RPC relay)
 */
export async function getHederaProvider() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);

  // Check if connected to Hedera network
  const network = await provider.getNetwork();
  const expectedChainId = HEDERA_NETWORK === 'testnet' ? 296 : 295; // Hedera testnet: 296, mainnet: 295

  if (Number(network.chainId) !== expectedChainId) {
    // Request network switch
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Network doesn't exist, add it
      if (switchError.code === 4902) {
        await addHederaNetwork();
      } else {
        throw switchError;
      }
    }
  }

  return provider;
}

/**
 * Add Hedera network to MetaMask
 */
export async function addHederaNetwork() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not installed');
  }

  const networkConfig = HEDERA_NETWORK === 'testnet' ? {
    chainId: '0x128', // 296 in hex
    chainName: 'Hedera Testnet',
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
    rpcUrls: ['https://testnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/testnet'],
  } : {
    chainId: '0x127', // 295 in hex
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
 * Connect wallet
 */
export async function connectWallet(): Promise<string> {
  const provider = await getHederaProvider();
  const accounts = await provider.send('eth_requestAccounts', []);
  return accounts[0];
}

/**
 * Get current wallet address
 */
export async function getCurrentWalletAddress(): Promise<string | null> {
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

/**
 * Vote on a proposal using MetaMask and Hedera smart contract
 */
export async function voteOnProposal(proposalId: number, vote: 'yes' | 'no'): Promise<string> {
  const provider = await getHederaProvider();
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

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
 * Check if user has voted on a proposal
 */
export async function hasUserVoted(proposalId: number, userAddress: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${HEDERA_SERVICE_URL}/api/contract/has-voted/${proposalId}/${userAddress}`
    );

    const result = await response.json();

    if (result.success) {
      return result.hasVoted;
    }

    return false;
  } catch (error) {
    console.error('Error checking if user has voted:', error);
    return false;
  }
}

/**
 * Get contract info from backend
 */
export async function getContractInfo() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const response = await fetch(`${API_URL}/api/contract-info`);

  if (!response.ok) {
    throw new Error('Failed to fetch contract info');
  }

  return response.json();
}

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
