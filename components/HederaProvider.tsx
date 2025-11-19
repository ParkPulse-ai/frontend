'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  connectWallet,
  getCurrentWalletAddress,
  disconnectWallet,
  WalletType
} from '../lib/hedera-wallets';
import { createInitialAccount } from '../lib/supabase';

interface HederaContextType {
  address: string | null;
  isConnected: boolean;
  walletType: WalletType | null;
  connect: (type: WalletType) => Promise<void>;
  disconnect: () => void;
  network: string;
}

const HederaContext = createContext<HederaContextType>({
  address: null,
  isConnected: false,
  walletType: null,
  connect: async () => {},
  disconnect: () => {},
  network: 'testnet',
});

export function useHedera() {
  return useContext(HederaContext);
}

interface HederaProviderProps {
  children: ReactNode;
}

export default function HederaProvider({ children }: HederaProviderProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';

  useEffect(() => {
    // Try to restore wallet connection from localStorage
    const restoreConnection = async () => {
      try {
        const savedWalletType = localStorage.getItem('hedera_wallet_type') as WalletType | null;

        if (!savedWalletType) {
          return;
        }

        // Try to get current address for saved wallet type
        const addr = await getCurrentWalletAddress(savedWalletType);

        if (addr) {
          console.log('🔄 Restored wallet connection:', savedWalletType, addr);
          setAddress(addr);
          setIsConnected(true);
          setWalletType(savedWalletType);

          // Create initial account if it doesn't exist
          await createInitialAccount(addr);
        } else {
          // No active session, clear saved wallet type
          localStorage.removeItem('hedera_wallet_type');
        }
      } catch (error) {
        console.log('Could not restore wallet connection:', error);
        localStorage.removeItem('hedera_wallet_type');
      }
    };

    restoreConnection();
  }, []);

  const connect = async (type: WalletType) => {
    try {
      const result = await connectWallet(type);
      setAddress(result.address);
      setWalletType(result.type);
      setIsConnected(true);

      // Save wallet type to localStorage for persistence
      localStorage.setItem('hedera_wallet_type', result.type);

      // Create initial account in Supabase when wallet connects
      await createInitialAccount(result.address);

      console.log('💾 Wallet connection saved:', result.type);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    if (walletType) {
      await disconnectWallet(walletType);
    }
    setAddress(null);
    setIsConnected(false);
    setWalletType(null);

    // Clear saved wallet type from localStorage
    localStorage.removeItem('hedera_wallet_type');

    console.log('🗑️ Wallet connection cleared');
  };

  return (
    <HederaContext.Provider
      value={{
        address,
        isConnected,
        walletType,
        connect,
        disconnect,
        network,
      }}
    >
      {children}
    </HederaContext.Provider>
  );
}
