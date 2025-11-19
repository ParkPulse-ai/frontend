'use client';

import { useState } from 'react';
import { useHedera } from './HederaProvider';
import { WalletType } from '../lib/hedera-wallets';

export default function WalletConnectButton() {
  const { address, isConnected, connect, disconnect, walletType } = useHedera();
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  const handleConnect = async (type: WalletType) => {
    try {
      await connect(type);
      setShowWalletOptions(false);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <span className="text-xs text-gray-400">
            (HashPack)
          </span>
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowWalletOptions(!showWalletOptions)}
        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        Connect Wallet
      </button>

      {showWalletOptions && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
          <div className="p-3 border-b border-gray-700">
            <p className="text-sm text-gray-400">Connect with HashPack</p>
          </div>

          <div className="p-2">
            {/* HashPack - Native Hedera Wallet */}
            <button
              onClick={() => handleConnect(WalletType.HASHPACK)}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-xl">🔐</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">HashPack</p>
                <p className="text-xs text-gray-400">Native Hedera Wallet</p>
              </div>
            </button>
          </div>

          <div className="p-3 bg-gray-900 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Don't have HashPack?{' '}
              <a
                href="https://www.hashpack.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300"
              >
                Download Now →
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
