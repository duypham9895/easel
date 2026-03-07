import { Alert } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/appStore';

const MAX_BYTES = 5 * 1024 * 1024;

export function useAvatarUpload() {
  const userId = useAppStore((s) => s.userId);
  const updateAvatarUrl = useAppStore((s) => s.updateAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);

  async function upload() {
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

    if (!userId) {
      Alert.alert('Error', 'Not signed in.');
      return;
    }

    const mimeType = asset.mimeType ?? 'image/jpeg';
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      Alert.alert('Unsupported format', 'Please choose a JPEG, PNG, or WebP image.');
      return;
    }

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

    setIsUploading(true);
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
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
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return { upload, isUploading };
}
