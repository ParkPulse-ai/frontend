'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  connectWallet,
  getCurrentWalletAddress,
  disconnectWallet,
  WalletType
} from '../lib/hedera-wallets';

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
    // Check if already connected (HashPack via WalletConnect)
    getCurrentWalletAddress(WalletType.HASHPACK).then((addr) => {
      if (addr) {
        setAddress(addr);
        setIsConnected(true);
        setWalletType(WalletType.HASHPACK);
      }
    }).catch((error) => {
      // HashPack not connected yet, this is expected
      console.log('HashPack not connected on load');
    });
  }, []);

  const connect = async (type: WalletType) => {
    try {
      const result = await connectWallet(type);
      setAddress(result.address);
      setWalletType(result.type);
      setIsConnected(true);
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
