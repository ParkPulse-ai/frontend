import { ethers } from 'ethers';
import { DAppConnector, HederaSessionEvent, HederaJsonRpcMethod, HederaChainId } from '@hashgraph/hedera-wallet-connect';
import { LedgerId, ContractExecuteTransaction, ContractFunctionParameters, ContractId, Hbar } from '@hashgraph/sdk';

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

  // Initialize the connector - this will restore any existing sessions
  await dAppConnector.init({ logger: 'error' });

  console.log('🔌 DAppConnector initialized');

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

  // For HashPack/Blade, initialize connector and check for active session
  try {
    const connector = await initializeDAppConnector();
    const sessions = connector.signers;

    if (sessions && sessions.length > 0) {
      const address = sessions[0].getAccountId().toString();
      console.log('✅ Found active session for:', walletType, address);
      return address;
    }
  } catch (error) {
    console.log('No active session found for:', walletType);
  }

  return null;
}

/**
 * Vote on proposal - works with HashPack wallet (default)
 * Opens wallet for user to approve the transaction
 */
export async function voteOnProposal(
  proposalId: number,
  vote: 'yes' | 'no'
): Promise<string> {
  // Check wallet connection
  if (!dAppConnector) {
    throw new Error('Wallet not connected. Please connect your wallet first.');
  }

  const signers = dAppConnector.signers;
  if (!signers || signers.length === 0) {
    throw new Error('No active wallet session. Please reconnect your wallet.');
  }

  const signer = signers[0];
  const userAddress = signer.getAccountId().toString();

  // Get contract address from environment
  const contractIdStr = process.env.NEXT_PUBLIC_HEDERA_CONTRACT_ID;
  if (!contractIdStr) {
    throw new Error('Contract ID not configured');
  }

  try {
    console.log(`Submitting vote: ${vote} for proposal ${proposalId}`);
    console.log(`User address: ${userAddress}`);

    // Convert voter address to EVM format for contract parameter
    const voterEvmAddress = userAddress.startsWith('0.0.')
      ? '0x' + Buffer.from(userAddress.split('.')[2]).toString('hex').padStart(40, '0')
      : userAddress;

    // Create contract execute transaction
    // This will trigger the wallet to open for user approval
    const contractExecTx = await new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(contractIdStr))
      .setGas(1000000)
      .setFunction('vote', new ContractFunctionParameters()
        .addUint64(proposalId)
        .addBool(vote === 'yes')
        .addAddress(voterEvmAddress)
      )
      .freezeWithSigner(signer); // Freeze the transaction with signer

    // Execute through wallet signer - this opens the wallet for approval
    const txResponse = await contractExecTx.executeWithSigner(signer);

    // Wait for receipt
    const receipt = await txResponse.getReceiptWithSigner(signer);

    const transactionId = txResponse.transactionId.toString();

    console.log('✅ Vote transaction successful:', transactionId);
    console.log('Receipt status:', receipt.status.toString());

    return transactionId;

  } catch (error: any) {
    console.error('❌ Voting transaction failed:', error);
    throw new Error(error?.message || 'Failed to submit vote through wallet');
  }
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
 * Donate to proposal - works with connected wallet
 * Opens wallet for user to approve the transaction
 */
export async function donateToProposal(
  proposalId: number,
  amount: number
): Promise<string> {
  // Check if wallet is connected
  if (!dAppConnector) {
    throw new Error('Wallet not connected. Please connect your wallet first.');
  }

  const signers = dAppConnector.signers;
  if (!signers || signers.length === 0) {
    throw new Error('No active wallet session. Please reconnect your wallet.');
  }

  const signer = signers[0];
  const userAddress = signer.getAccountId().toString();

  // Get contract address from environment
  const contractIdStr = process.env.NEXT_PUBLIC_HEDERA_CONTRACT_ID;
  if (!contractIdStr) {
    throw new Error('Contract ID not configured');
  }

  try {
    console.log(`Donating ${amount} HBAR to proposal ${proposalId}`);
    console.log(`User address: ${userAddress}`);

    // Create contract execute transaction with payable amount
    // This will trigger the wallet to open for user approval
    const contractExecTx = await new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(contractIdStr))
      .setGas(1000000)
      .setPayableAmount(new Hbar(amount)) // Send HBAR with the transaction
      .setFunction('donateToProposal', new ContractFunctionParameters()
        .addUint64(proposalId)
      )
      .freezeWithSigner(signer); // Freeze the transaction with signer

    // Execute through wallet signer - this opens the wallet for approval
    const txResponse = await contractExecTx.executeWithSigner(signer);

    // Wait for receipt
    const receipt = await txResponse.getReceiptWithSigner(signer);

    const transactionId = txResponse.transactionId.toString();

    console.log('✅ Donation transaction successful:', transactionId);
    console.log('Receipt status:', receipt.status.toString());

    return transactionId;

  } catch (error: any) {
    console.error('❌ Donation transaction failed:', error);
    throw new Error(error?.message || 'Failed to process donation through wallet');
  }
}

/**
 * Close proposal - works with connected wallet
 * Opens wallet for user to approve the transaction
 */
export async function closeProposal(proposalId: number): Promise<string> {
  // Check if wallet is connected
  if (!dAppConnector) {
    throw new Error('Wallet not connected. Please connect your wallet first.');
  }

  const signers = dAppConnector.signers;
  if (!signers || signers.length === 0) {
    throw new Error('No active wallet session. Please reconnect your wallet.');
  }

  const signer = signers[0];
  const userAddress = signer.getAccountId().toString();

  // Get contract address from environment
  const contractIdStr = process.env.NEXT_PUBLIC_HEDERA_CONTRACT_ID;
  if (!contractIdStr) {
    throw new Error('Contract ID not configured');
  }

  try {
    console.log(`Closing proposal ${proposalId}`);
    console.log(`User address: ${userAddress}`);

    // Create contract execute transaction
    // This will trigger the wallet to open for user approval
    const contractExecTx = await new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(contractIdStr))
      .setGas(1000000)
      .setFunction('closeProposal', new ContractFunctionParameters()
        .addUint64(proposalId)
      )
      .freezeWithSigner(signer); // Freeze the transaction with signer

    // Execute through wallet signer - this opens the wallet for approval
    const txResponse = await contractExecTx.executeWithSigner(signer);

    // Wait for receipt
    const receipt = await txResponse.getReceiptWithSigner(signer);

    const transactionId = txResponse.transactionId.toString();

    console.log('✅ Close proposal transaction successful:', transactionId);
    console.log('Receipt status:', receipt.status.toString());

    return transactionId;

  } catch (error: any) {
    console.error('❌ Close proposal transaction failed:', error);
    throw new Error(error?.message || 'Failed to close proposal through wallet');
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
