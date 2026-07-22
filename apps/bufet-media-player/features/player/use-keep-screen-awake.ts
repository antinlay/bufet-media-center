import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const WAKE_LOCK_TAG = 'player-screen';

function releaseWakeLock() {
  try {
    deactivateKeepAwake(WAKE_LOCK_TAG);
  } catch (error) {
    console.warn('Keep awake release failed', error);
  }
}

export function useKeepScreenAwake() {
  useEffect(() => {
    let active = true;

    const requestWakeLock = async () => {
      if (process.env.EXPO_OS === 'web' && typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      try {
        await activateKeepAwakeAsync(WAKE_LOCK_TAG);
      } catch (error) {
        console.warn('Keep awake failed', error);
      }
    };

    void requestWakeLock();

    if (process.env.EXPO_OS === 'web' && typeof document !== 'undefined') {
      const handleVisibility = () => {
        if (!active) return;
        if (document.visibilityState === 'visible') {
          void requestWakeLock();
        } else {
          releaseWakeLock();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => {
        active = false;
        document.removeEventListener('visibilitychange', handleVisibility);
        releaseWakeLock();
      };
    }

    return () => {
      active = false;
      releaseWakeLock();
    };
  }, []);
}
