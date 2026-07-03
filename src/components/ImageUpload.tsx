import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  pickImage,
  validateImageSize,
  formatFileSize,
} from '../utils/imageUtils';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface ImageUploadProps {
  onImageSelected: (base64: string) => void;
  currentImage?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelected,
  currentImage,
  maxSizeMB = 5,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    if (disabled || loading) return;

    setLoading(true);
    try {
      const base64Image = await pickImage();

      if (!base64Image) {
        setLoading(false);
        return;
      }

      // Validate image size
      if (!validateImageSize(base64Image, maxSizeMB)) {
        Alert.alert(
          'Image Too Large',
          `Image size exceeds ${maxSizeMB}MB limit. Please choose a smaller image.`,
        );
        setLoading(false);
        return;
      }

      // Calculate and log size
      const sizeInBytes = (base64Image.length * 3) / 4;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      console.log(`Image selected: ${formatFileSize(sizeInBytes)}`);

      onImageSelected(base64Image);
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        onPress: () => onImageSelected(''),
        style: 'destructive',
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {currentImage && currentImage.startsWith('http') ? (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: currentImage }}
            style={styles.preview}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemoveImage}
            disabled={loading}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : currentImage && currentImage.startsWith('data:') ? (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: currentImage }}
            style={styles.preview}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemoveImage}
            disabled={loading}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.button, (disabled || loading) && styles.buttonDisabled]}
        onPress={handlePickImage}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Text style={styles.buttonIcon}>📷</Text>
            <Text style={styles.buttonText}>
              {currentImage ? 'Change Image' : 'Add Product Image'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.helperText}>
        Max size: {maxSizeMB}MB • Formats: JPG, PNG
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  previewContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  preview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  helperText: {
    marginTop: SPACING.sm,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
