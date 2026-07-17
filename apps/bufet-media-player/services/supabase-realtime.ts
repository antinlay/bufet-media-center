import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = url && publishableKey
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;

export async function subscribeToPlaylistChanges(
  screenId: string | number,
  onChange: () => void,
): Promise<(() => Promise<void>) | null> {
  if (!supabase) return null;

  const channel = supabase
    .channel(`screen:${screenId}`)
    .on('broadcast', { event: 'playlist_changed' }, () => onChange());

  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') resolve();
    });
  });

  return async () => {
    await supabase.removeChannel(channel);
  };
}
