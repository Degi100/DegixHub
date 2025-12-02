'use client';

import { useState } from 'react';
import { usePinContext } from '../components/pin';

type PinModalMode = 'setup' | 'verify';

interface UsePinProtectionOptions<T> {
  onExecute: (action: T) => void;
}

export function usePinProtection<T>({ onExecute }: UsePinProtectionOptions<T>) {
  const { hasPin, checkPinRequired, unlock, refetchHasPin } = usePinContext();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<PinModalMode>('verify');
  const [pendingAction, setPendingAction] = useState<T | null>(null);

  const handleProtectedAction = (action: T) => {
    // If no PIN is set, show setup modal
    if (hasPin === false) {
      setPinModalMode('setup');
      setPendingAction(action);
      setShowPinModal(true);
      return;
    }

    // If PIN is required (set but not unlocked), show verify modal
    if (checkPinRequired()) {
      setPinModalMode('verify');
      setPendingAction(action);
      setShowPinModal(true);
      return;
    }

    // PIN unlocked, execute action
    onExecute(action);
  };

  const handlePinSuccess = (rememberSession: boolean) => {
    setShowPinModal(false);
    unlock(rememberSession);
    refetchHasPin();

    // Execute pending action
    if (pendingAction !== null) {
      onExecute(pendingAction);
      setPendingAction(null);
    }
  };

  const handlePinClose = () => {
    setShowPinModal(false);
    setPendingAction(null);
  };

  return {
    showPinModal,
    pinModalMode,
    handleProtectedAction,
    handlePinSuccess,
    handlePinClose,
  };
}
