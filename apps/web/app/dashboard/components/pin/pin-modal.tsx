'use client';

import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc/react';
import { toast } from 'sonner';
import { PinRecoveryOptions } from './pin-recovery-options';
import { PinRecoveryKeyInput } from './pin-recovery-key-input';
import styles from './pin-modal.module.css';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (rememberSession: boolean) => void;
  mode: 'setup' | 'verify' | 'change' | 'recovery';
}

export function PinModal({ isOpen, onClose, onSuccess, mode }: PinModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [oldPin, setOldPin] = useState(['', '', '', '']);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [step, setStep] = useState<'old' | 'enter' | 'confirm' | 'recovery-key'>('enter');
  const [error, setError] = useState('');
  const [rememberSession, setRememberSession] = useState(false);
  const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const oldPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setPinMutation = trpc.securityPin.setPin.useMutation({
    onSuccess: () => {
      toast.success('PIN erfolgreich gesetzt');
      onSuccess(false);
      resetState();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const verifyPinMutation = trpc.securityPin.verifyPin.useMutation({
    onSuccess: () => {
      onSuccess(rememberSession);
      resetState();
    },
    onError: () => {
      setError('Falscher PIN');
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    },
  });

  // Verify old PIN before allowing change
  const verifyOldPinMutation = trpc.securityPin.verifyPin.useMutation({
    onSuccess: () => {
      setError('');
      setStep('enter');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    },
    onError: () => {
      setError('Alter PIN ist falsch');
      setOldPin(['', '', '', '']);
      setTimeout(() => oldPinRefs.current[0]?.focus(), 100);
    },
  });

  const changePinMutation = trpc.securityPin.changePin.useMutation({
    onSuccess: () => {
      toast.success('PIN erfolgreich geändert');
      onSuccess(false);
      resetState();
    },
    onError: (error) => {
      if (error.message.includes('Alter PIN')) {
        setError('Alter PIN ist falsch');
        setOldPin(['', '', '', '']);
        setStep('old');
        setTimeout(() => oldPinRefs.current[0]?.focus(), 100);
      } else {
        setError(error.message);
      }
    },
  });

  const resetPinMutation = trpc.securityPin.resetPinWithRecovery.useMutation({
    onSuccess: () => {
      toast.success('PIN erfolgreich zurückgesetzt');
      onSuccess(false);
      resetState();
    },
    onError: (error) => {
      if (error.message.includes('Sicherheitscode')) {
        setError('Ungültiger Sicherheitscode');
        setRecoveryKey('');
        setStep('recovery-key');
      } else {
        setError(error.message);
      }
    },
  });

  // Verify recovery key before allowing PIN reset
  const verifyRecoveryKeyMutation = trpc.securityPin.verifyRecoveryKey.useMutation({
    onSuccess: () => {
      setError('');
      setStep('enter');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    },
    onError: () => {
      setError('Ungültiger Sicherheitscode');
    },
  });

  const resetState = () => {
    setPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
    setOldPin(['', '', '', '']);
    setRecoveryKey('');
    setStep(mode === 'change' ? 'old' : mode === 'recovery' ? 'recovery-key' : 'enter');
    setError('');
    setShowRecoveryOptions(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
      setTimeout(() => {
        if (mode === 'change') {
          oldPinRefs.current[0]?.focus();
        } else {
          inputRefs.current[0]?.focus();
        }
      }, 100);
    }
  }, [isOpen, mode]);

  const handlePinChange = (
    index: number,
    value: string,
    pinType: 'main' | 'confirm' | 'old' = 'main'
  ) => {
    if (!/^\d*$/.test(value)) return;

    const newValue = value.slice(-1);
    let currentPin: string[];
    let setter: (pin: string[]) => void;
    let refs: React.MutableRefObject<(HTMLInputElement | null)[]>;

    if (pinType === 'old') {
      currentPin = [...oldPin];
      setter = setOldPin;
      refs = oldPinRefs;
    } else if (pinType === 'confirm') {
      currentPin = [...confirmPin];
      setter = setConfirmPin;
      refs = confirmInputRefs;
    } else {
      currentPin = [...pin];
      setter = setPin;
      refs = inputRefs;
    }

    currentPin[index] = newValue;
    setter(currentPin);
    setError('');

    // Auto-focus next input
    if (newValue && index < 3) {
      refs.current[index + 1]?.focus();
    }

    // Check if PIN is complete
    if (newValue && index === 3) {
      const fullPin = currentPin.join('');
      handlePinComplete(fullPin, pinType);
    }
  };

  const handlePinComplete = (fullPin: string, pinType: 'main' | 'confirm' | 'old') => {
    if (mode === 'setup') {
      if (pinType === 'main' && step === 'enter') {
        setTimeout(() => {
          setStep('confirm');
          setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
        }, 100);
      } else if (pinType === 'confirm' && step === 'confirm') {
        const originalPin = pin.join('');
        if (originalPin === fullPin) {
          setPinMutation.mutate({ pin: fullPin });
        } else {
          setError('PINs stimmen nicht überein');
          setConfirmPin(['', '', '', '']);
          setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
        }
      }
    } else if (mode === 'verify') {
      verifyPinMutation.mutate({ pin: fullPin });
    } else if (mode === 'change') {
      if (pinType === 'old' && step === 'old') {
        // Verify old PIN immediately via API
        verifyOldPinMutation.mutate({ pin: fullPin });
      } else if (pinType === 'main' && step === 'enter') {
        setTimeout(() => {
          setStep('confirm');
          setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
        }, 100);
      } else if (pinType === 'confirm' && step === 'confirm') {
        const newPin = pin.join('');
        if (newPin === fullPin) {
          changePinMutation.mutate({
            oldPin: oldPin.join(''),
            newPin: newPin,
          });
        } else {
          setError('PINs stimmen nicht überein');
          setConfirmPin(['', '', '', '']);
          setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
        }
      }
    } else if (mode === 'recovery') {
      if (pinType === 'main' && step === 'enter') {
        setTimeout(() => {
          setStep('confirm');
          setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
        }, 100);
      } else if (pinType === 'confirm' && step === 'confirm') {
        const newPin = pin.join('');
        if (newPin === fullPin) {
          resetPinMutation.mutate({
            recoveryKey: recoveryKey,
            newPin: newPin,
          });
        } else {
          setError('PINs stimmen nicht überein');
          setConfirmPin(['', '', '', '']);
          setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
        }
      }
    }
  };

  const handleRecoveryKeySubmit = () => {
    if (recoveryKey.trim().length < 8) {
      setError('Bitte gib einen gültigen Sicherheitscode ein');
      return;
    }
    // Verify recovery key via API
    verifyRecoveryKeyMutation.mutate({ recoveryKey: recoveryKey.trim() });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    pinType: 'main' | 'confirm' | 'old' = 'main'
  ) => {
    if (e.key === 'Backspace') {
      let currentPin: string[];
      let refs: React.MutableRefObject<(HTMLInputElement | null)[]>;

      if (pinType === 'old') {
        currentPin = oldPin;
        refs = oldPinRefs;
      } else if (pinType === 'confirm') {
        currentPin = confirmPin;
        refs = confirmInputRefs;
      } else {
        currentPin = pin;
        refs = inputRefs;
      }

      if (!currentPin[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    }
  };

  if (!isOpen) return null;

  const isLoading =
    setPinMutation.isPending ||
    verifyPinMutation.isPending ||
    verifyOldPinMutation.isPending ||
    verifyRecoveryKeyMutation.isPending ||
    changePinMutation.isPending ||
    resetPinMutation.isPending;

  const getTitle = () => {
    if (mode === 'setup') {
      return step === 'enter' ? 'PIN festlegen' : 'PIN bestätigen';
    }
    if (mode === 'verify') {
      return 'PIN eingeben';
    }
    if (mode === 'change') {
      if (showRecoveryOptions) return 'PIN vergessen?';
      if (step === 'old') return 'Alter PIN';
      if (step === 'enter') return 'Neuer PIN';
      return 'Neuer PIN bestätigen';
    }
    if (mode === 'recovery') {
      if (step === 'recovery-key') return 'PIN zurücksetzen';
      if (step === 'enter') return 'Neuer PIN';
      return 'Neuer PIN bestätigen';
    }
    return 'PIN';
  };

  const getDescription = () => {
    if (mode === 'setup') {
      return step === 'enter'
        ? 'Lege einen 4-stelligen PIN fest, um deine Credentials zu schützen.'
        : 'Gib den PIN erneut ein zur Bestätigung.';
    }
    if (mode === 'verify') {
      return 'Gib deinen PIN ein, um fortzufahren.';
    }
    if (mode === 'change') {
      if (showRecoveryOptions) {
        return 'Wähle eine Option, um deinen PIN zurückzusetzen.';
      }
      if (step === 'old') return 'Gib deinen aktuellen PIN ein.';
      if (step === 'enter') return 'Gib deinen neuen PIN ein.';
      return 'Bestätige deinen neuen PIN.';
    }
    if (mode === 'recovery') {
      if (step === 'recovery-key') {
        return 'Gib den Sicherheitscode ein, den du beim Onboarding erhalten hast.';
      }
      if (step === 'enter') return 'Gib deinen neuen PIN ein.';
      return 'Bestätige deinen neuen PIN.';
    }
    return '';
  };

  const getCurrentPinArray = () => {
    if (step === 'old') return oldPin;
    if (step === 'confirm') return confirmPin;
    return pin;
  };

  const getCurrentPinType = (): 'main' | 'confirm' | 'old' => {
    if (step === 'old') return 'old';
    if (step === 'confirm') return 'confirm';
    return 'main';
  };

  const getCurrentRefs = () => {
    if (step === 'old') return oldPinRefs;
    if (step === 'confirm') return confirmInputRefs;
    return inputRefs;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle}>{getTitle()}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>{getDescription()}</p>

          {/* Recovery Options View */}
          {mode === 'change' && showRecoveryOptions && (
            <PinRecoveryOptions
              onRecoveryKeySelect={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('open-pin-recovery'));
              }}
              onBack={() => setShowRecoveryOptions(false)}
            />
          )}

          {/* Recovery Key Input */}
          {mode === 'recovery' && step === 'recovery-key' && (
            <PinRecoveryKeyInput
              value={recoveryKey}
              onChange={(value) => {
                setRecoveryKey(value);
                setError('');
              }}
              onSubmit={handleRecoveryKeySubmit}
              isLoading={verifyRecoveryKeyMutation.isPending}
            />
          )}

          {/* PIN Input */}
          {!showRecoveryOptions && step !== 'recovery-key' && (
            <div className={styles.pinContainer}>
              {getCurrentPinArray().map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    getCurrentRefs().current[index] = el;
                  }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value, getCurrentPinType())}
                  onKeyDown={(e) => handleKeyDown(e, index, getCurrentPinType())}
                  className={styles.pinInput}
                  disabled={isLoading}
                  autoComplete="off"
                />
              ))}
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          {/* Remember Session for verify mode */}
          {mode === 'verify' && (
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
                className={styles.checkbox}
              />
              <span>Für diese Session merken</span>
            </label>
          )}

          {/* Forgot PIN link for change mode */}
          {mode === 'change' && step === 'old' && !showRecoveryOptions && (
            <button
              className={styles.forgotPinLink}
              onClick={() => setShowRecoveryOptions(true)}
            >
              PIN vergessen?
            </button>
          )}

          {isLoading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export remember session state getter for use in credential access
export function getRememberSession(): boolean {
  return sessionStorage.getItem('pinRememberSession') === 'true';
}
