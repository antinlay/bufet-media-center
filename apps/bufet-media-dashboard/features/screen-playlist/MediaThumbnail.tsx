import { useEffect, useState } from 'react';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../providers/AppThemeProvider';
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
  const { colors } = useAppTheme();

  useEffect(() => {
    setLoading(Boolean(uri));
    setFailed(false);
  }, [uri]);

  return (
    <View style={[styles.frame, { backgroundColor: colors.surfaceMuted }, style]}>
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
          color={colors.accent}
          size={28}
        />
      )}
      {loading ? <ActivityIndicator color={colors.accent} size="small" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
