import * as DocumentPicker from 'expo-document-picker';

export type PickedFile = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

export const MAX_MEDIA_PICK_COUNT = 10;

function mapAsset(asset: DocumentPicker.DocumentPickerAsset): PickedFile {
  return {
    uri: asset.uri,
    name: asset.name ?? 'file',
    type: asset.mimeType ?? 'application/octet-stream',
    size: asset.size,
  };
}

export async function pickMedia(): Promise<PickedFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'video/*'],
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  return mapAsset(asset);
}

export async function pickMediaFiles(): Promise<PickedFile[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'video/*'],
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];
  if (result.assets.length > MAX_MEDIA_PICK_COUNT) {
    throw new Error(`Можно выбрать не больше ${MAX_MEDIA_PICK_COUNT} файлов`);
  }
  return result.assets.map(mapAsset);
}
