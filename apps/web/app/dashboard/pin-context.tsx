'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { trpc } from '@/lib/trpc/react';

interface PinContextType {
  isUnlocked: boolean;
  hasPin: boolean | undefined;
  isLoading: boolean;
  unlockTimeout: number; // 5 minutes in ms
  inactivityTimeout: number; // 10 minutes in ms
  rememberForSession: boolean;
  unlock: (rememberSession?: boolean) => void;
  lock: () => void;
  checkPinRequired: () => boolean;
  setRememberForSession: (value: boolean) => void;
  refetchHasPin: () => void;
  resetInactivityTimer: () => void;
}

const PIN_UNLOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes of inactivity

const PinContext = createContext<PinContextType | null>(null);

export function PinProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockTimestamp, setUnlockTimestamp] = useState<number | null>(null);
  const [rememberForSession, setRememberForSession] = useState(false);
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState<number>(Date.now());
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: pinStatus, isLoading, refetch: refetchHasPin } = trpc.securityPin.hasPin.useQuery();

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    setLastActivityTimestamp(Date.now());
  }, []);

  // Track user activity for auto-lock
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetInactivityTimer]);

  // Auto-lock after inactivity
  useEffect(() => {
    if (!isUnlocked || !pinStatus?.hasPin) return;

    const checkInactivity = () => {
      const timeSinceActivity = Date.now() - lastActivityTimestamp;
      if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
        setIsUnlocked(false);
        setUnlockTimestamp(null);
        setRememberForSession(false);
        // Optional: Show notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('DegixHub', { body: 'Session locked due to inactivity' });
        }
      }
    };

    inactivityTimeoutRef.current = setInterval(checkInactivity, 10000); // Check every 10 seconds

    return () => {
      if (inactivityTimeoutRef.current) {
        clearInterval(inactivityTimeoutRef.current);
      }
    };
  }, [isUnlocked, lastActivityTimestamp, pinStatus?.hasPin]);

  // Check if unlock has expired (existing timeout logic)
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
    inactivityTimeout: INACTIVITY_TIMEOUT,
    rememberForSession,
    unlock,
    lock,
    checkPinRequired,
    setRememberForSession,
    refetchHasPin,
    resetInactivityTimer,
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
