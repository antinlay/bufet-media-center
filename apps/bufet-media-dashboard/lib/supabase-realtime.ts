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

export async function broadcastPlaylistChanged(screenId: number, revision?: string | number) {
  if (!supabase) return;

  const channel = supabase.channel(`screen:${screenId}`);
  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') resolve();
    });
  });

  try {
    await channel.send({
      type: 'broadcast',
      event: 'playlist_changed',
      payload: { screenId, revision: revision ?? Date.now() },
    });
  } finally {
    await supabase.removeChannel(channel);
  }
}
