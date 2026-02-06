import * as DocumentPicker from 'expo-document-picker';

export type PickedFile = {
  uri: string;
  name: string;
  type: string;
};

export async function pickMedia(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'video/*'],
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  return {
    uri: asset.uri,
    name: asset.name ?? 'file',
    type: asset.mimeType ?? 'application/octet-stream',
  };
}
