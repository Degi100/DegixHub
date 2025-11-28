'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { trpc } from '@/lib/trpc/react';

interface PinContextType {
  isUnlocked: boolean;
  hasPin: boolean | undefined;
  isLoading: boolean;
  unlockTimeout: number; // 5 minutes in ms
  rememberForSession: boolean;
  unlock: (rememberSession?: boolean) => void;
  lock: () => void;
  checkPinRequired: () => boolean;
  setRememberForSession: (value: boolean) => void;
  refetchHasPin: () => void;
}

const PIN_UNLOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const PinContext = createContext<PinContextType | null>(null);

export function PinProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockTimestamp, setUnlockTimestamp] = useState<number | null>(null);
  const [rememberForSession, setRememberForSession] = useState(false);

  const { data: pinStatus, isLoading, refetch: refetchHasPin } = trpc.securityPin.hasPin.useQuery();

  // Check if unlock has expired
  useEffect(() => {
    if (!isUnlocked || rememberForSession) return;

    const checkExpiry = () => {
      if (unlockTimestamp && Date.now() - unlockTimestamp > PIN_UNLOCK_TIMEOUT) {
        setIsUnlocked(false);
        setUnlockTimestamp(null);
      }
    };

    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, [isUnlocked, unlockTimestamp, rememberForSession]);

  const unlock = useCallback((rememberSession: boolean = false) => {
    setIsUnlocked(true);
    setUnlockTimestamp(Date.now());
    setRememberForSession(rememberSession);
  }, []);

  const lock = useCallback(() => {
    setIsUnlocked(false);
    setUnlockTimestamp(null);
    setRememberForSession(false);
  }, []);

  const checkPinRequired = useCallback(() => {
    // PIN required if user has a PIN set and is not currently unlocked
    return pinStatus?.hasPin === true && !isUnlocked;
  }, [pinStatus?.hasPin, isUnlocked]);

  const value: PinContextType = {
    isUnlocked,
    hasPin: pinStatus?.hasPin,
    isLoading,
    unlockTimeout: PIN_UNLOCK_TIMEOUT,
    rememberForSession,
    unlock,
    lock,
    checkPinRequired,
    setRememberForSession,
    refetchHasPin,
  };

  return <PinContext.Provider value={value}>{children}</PinContext.Provider>;
}

export function usePinContext() {
  const context = useContext(PinContext);
  if (!context) {
    throw new Error('usePinContext must be used within a PinProvider');
  }
  return context;
}
