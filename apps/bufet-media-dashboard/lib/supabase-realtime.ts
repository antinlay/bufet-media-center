import { supabase } from './supabase';

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
