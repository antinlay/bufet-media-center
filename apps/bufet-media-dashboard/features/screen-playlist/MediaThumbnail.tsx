import { useEffect, useState } from 'react';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '../../providers/AppThemeProvider';
import type { PlaylistMediaType } from './model';
import { VideoThumbnailFrame } from './VideoThumbnailFrame';

export function MediaThumbnail({
  uri,
  mediaUri,
  type,
  style,
}: {
  uri: string | null;
  mediaUri?: string | null;
  type: PlaylistMediaType;
  style?: StyleProp<ImageStyle | ViewStyle>;
}) {
  const [loading, setLoading] = useState(Boolean(uri));
  const [failed, setFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const { colors } = useAppTheme();

  useEffect(() => {
    setLoading(Boolean(uri));
    setFailed(false);
    setVideoFailed(false);
  }, [mediaUri, uri]);

  const imageUri = uri && !failed ? uri : null;
  const showVideoFrame = !imageUri && type === 'Video' && Boolean(mediaUri) && !videoFailed;

  return (
    <View style={[styles.frame, { backgroundColor: colors.surfaceMuted }, style]}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
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
      ) : showVideoFrame ? (
        <>
          <VideoThumbnailFrame uri={mediaUri as string} onError={() => setVideoFailed(true)} />
          <View pointerEvents="none" style={[styles.playBadge, { backgroundColor: colors.overlayStrong }]}>
            <MaterialCommunityIcons name="play" color={colors.onImage} size={18} />
          </View>
        </>
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
  playBadge: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
