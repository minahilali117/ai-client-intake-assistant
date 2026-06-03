const CHANNEL_NAME = 'intake-auth-sync';
const LOGOUT_STORAGE_KEY = 'intake-auth-logout';

export type AuthSyncEvent = { type: 'logout' | 'login' };

export function broadcastAuthSync(event: AuthSyncEvent) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(event);
    channel.close();
  } catch {
    // BroadcastChannel may be unavailable in some environments.
  }

  if (event.type === 'logout') {
    localStorage.setItem(LOGOUT_STORAGE_KEY, String(Date.now()));
    localStorage.removeItem(LOGOUT_STORAGE_KEY);
  }
}

export function subscribeAuthSync(onEvent: (event: AuthSyncEvent) => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let channel: BroadcastChannel | null = null;

  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (message: MessageEvent<AuthSyncEvent>) => {
      if (message.data?.type) {
        onEvent(message.data);
      }
    };
  } catch {
    // ignore
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === LOGOUT_STORAGE_KEY && event.newValue) {
      onEvent({ type: 'logout' });
    }
  };

  window.addEventListener('storage', onStorage);

  return () => {
    channel?.close();
    window.removeEventListener('storage', onStorage);
  };
}
