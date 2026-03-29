"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { connectWallet, getWalletAddress } from "@/hooks/contract";

interface WalletContextType {
  walletAddress: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    getWalletAddress().then((addr) => {
      if (addr) setWalletAddress(addr);
    });
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const addr = await connectWallet();
      setWalletAddress(addr);
    } catch (err) {
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWalletAddress(null);
  }, []);

  return (
    <WalletContext.Provider value={{ walletAddress, isConnecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
