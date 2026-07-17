import { useEffect, useState } from 'react';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { palette } from '../../theme';
import type { PlaylistMediaType } from './model';

export function MediaThumbnail({
  uri,
  type,
  style,
}: {
  uri: string | null;
  type: PlaylistMediaType;
  style?: StyleProp<ImageStyle | ViewStyle>;
}) {
  const [loading, setLoading] = useState(Boolean(uri));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoading(Boolean(uri));
    setFailed(false);
  }, [uri]);

  return (
    <View style={[styles.frame, style]}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={160}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
        />
      ) : (
        <MaterialCommunityIcons
          name={type === 'Video' ? 'play-circle-outline' : 'image-outline'}
          color={palette.gold}
          size={28}
        />
      )}
      {loading ? <ActivityIndicator color={palette.gold} size="small" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#23262D',
  },
});
