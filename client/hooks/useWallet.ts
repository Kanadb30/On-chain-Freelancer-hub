import { useState, useEffect, useCallback } from "react";
import { connectWallet, getWalletAddress } from "./contract";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize on mount
  useEffect(() => {
    getWalletAddress().then((addr) => {
      if (addr) setAddress(addr);
    });
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const addr = await connectWallet();
      setAddress(addr);
    } catch (err) {
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    // Freighter doesn't have an explicit 'disconnect', we just clear state
    setAddress(null);
  }, []);

  return { address, connect, disconnect, isConnecting };
}
