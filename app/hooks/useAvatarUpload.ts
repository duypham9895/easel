import { Alert, Platform } from 'react-native';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/appStore';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getExtFromMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

/** Pick an image file on web using the native file input dialog. */
function pickImageOnWeb(): Promise<{ blob: Blob; mimeType: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      resolve({ blob: file, mimeType: file.type });
    };
    // User cancelled the dialog
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

export function useAvatarUpload() {
  const userId = useAppStore((s) => s.userId);
  const updateAvatarUrl = useAppStore((s) => s.updateAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);

  async function upload() {
    let blob: Blob;
    let mimeType: string;

    if (Platform.OS === 'web') {
      // Web: use HTML file input
      const picked = await pickImageOnWeb();
      if (!picked) return;
      if (picked.blob.size > MAX_BYTES) {
        alert('Please choose an image under 5 MB.');
        return;
      }
      if (!ALLOWED_TYPES.includes(picked.mimeType)) {
        alert('Please choose a JPEG, PNG, or WebP image.');
        return;
      }
      blob = picked.blob;
      mimeType = picked.mimeType;
    } else {
      // Native: use expo-image-picker
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ImagePicker = require('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];

      if (asset.fileSize && asset.fileSize > MAX_BYTES) {
        Alert.alert('Too large', 'Please choose an image under 5 MB.');
        return;
      }

      mimeType = asset.mimeType ?? 'image/jpeg';
      if (!ALLOWED_TYPES.includes(mimeType)) {
        Alert.alert('Unsupported format', 'Please choose a JPEG, PNG, or WebP image.');
        return;
      }

      const response = await fetch(asset.uri);
      blob = await response.blob();
    }

    if (!userId) {
      Platform.OS === 'web' ? alert('Not signed in.') : Alert.alert('Error', 'Not signed in.');
      return;
    }

    const ext = getExtFromMime(mimeType);

    setIsUploading(true);
    try {
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: mimeType, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      updateAvatarUrl(urlData.publicUrl);
    } catch (err) {
      console.warn('[useAvatarUpload] upload failed:', err);
      Platform.OS === 'web' ? alert('Upload failed. Please try again.') : Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return { upload, isUploading };
}
