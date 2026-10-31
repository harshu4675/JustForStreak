import { useEffect, useRef, useState } from 'react';

export function useCountdownTimer({ enabled, deadlineMs, onExpire }) {
  const calculateRemaining = () => {
    if (!enabled || !deadlineMs) return null;
    return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
  };

  const [remainingSeconds, setRemainingSeconds] = useState(calculateRemaining);
  const expiredTriggeredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    expiredTriggeredRef.current = false;
    if (!enabled || !deadlineMs) {
      setRemainingSeconds(null);
      return undefined;
    }

    const tick = () => {
      const next = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next <= 0 && !expiredTriggeredRef.current) {
        expiredTriggeredRef.current = true;
        if (typeof onExpireRef.current === 'function') {
          onExpireRef.current();
        }
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [enabled, deadlineMs]);

  return remainingSeconds;
}
