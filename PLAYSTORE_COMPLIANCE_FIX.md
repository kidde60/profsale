# Google Play Store Compliance Fix ✅

## Problem

Google Play Store rejected the app with the following issue:

```
Issue found: Permission use is not directly related to your app's core purpose.
We found that your app is not compliant with how the READ_MEDIA_IMAGES/READ_MEDIA_VIDEO
permissions are allowed to be used.

Your app only requires one-time or infrequent access to media files on the device.
Only apps with a core use case that require persistent access to photo and video files
located in shared storage on devices are allowed to use photo and video permissions.
```

## Root Cause

The `react-native-image-picker` library was declaring restricted permissions:

- `READ_MEDIA_IMAGES`
- `READ_MEDIA_VIDEO`
- `READ_EXTERNAL_STORAGE`

These permissions are restricted by Google Play and require a core use case justification. Since ProfSale only needs one-time image selection for product uploads, these permissions are not appropriate.

## Solution

Use the **Android System Photo Picker** instead of requesting broad media access permissions.

### Why System Photo Picker?

✅ **No Permissions Required** - System picker doesn't need READ_MEDIA_IMAGES
✅ **Play Store Compliant** - Approved for one-time/infrequent media access
✅ **User Friendly** - Native Android/iOS interface
✅ **Secure** - User explicitly grants access per selection
✅ **Modern** - Recommended by Google

## Implementation

### 1. AndroidManifest.xml

**File**: `android/app/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Internet access -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Explicitly remove restricted media permissions for Play Store compliance -->
    <!-- We use system photo picker instead (no permissions needed) -->
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" tools:node="remove" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" tools:node="remove" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" tools:node="remove" />

    <application>
        <!-- ... rest of manifest ... -->
    </application>
</manifest>
```

**Key Points**:

- Added `xmlns:tools` namespace for manifest merge tools
- Used `tools:node="remove"` to explicitly remove restricted permissions
- This overrides any permissions declared by dependencies

### 2. Image Picker Implementation

**File**: `src/utils/imageUtils.ts`

```typescript
import {
  launchImageLibrary,
  ImageLibraryOptions,
} from 'react-native-image-picker';

export async function pickImage(): Promise<string | null> {
  return new Promise(resolve => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: true,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        resolve(null);
        return;
      }

      if (response.errorCode) {
        console.error('Image picker error:', response.errorCode);
        resolve(null);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.base64) {
          const type = asset.type || 'image/jpeg';
          const base64Image = `data:${type};base64,${asset.base64}`;
          resolve(base64Image);
          return;
        }
      }

      resolve(null);
    });
  });
}
```

**How It Works**:

- `launchImageLibrary()` opens system photo picker
- No permissions requested - user grants access via system dialog
- Returns base64 encoded image
- Works on Android 13+ (system picker) and iOS

### 3. ImageUpload Component

**File**: `src/components/ImageUpload.tsx`

- Reusable component for image selection
- Size validation (max 5MB)
- Image preview display
- Remove/change functionality
- Error handling

### 4. Screen Integration

**Files**:

- `src/screens/AddProductScreen.tsx`
- `src/screens/ProductDetailScreen.tsx`

Both screens use `ImageUpload` component for image selection.

## How System Photo Picker Works

### Android Flow

```
User taps "Add Image"
    ↓
launchImageLibrary() called
    ↓
System photo picker opens
    ↓
User selects image
    ↓
System grants access for that image only
    ↓
Image returned to app
    ↓
No persistent permissions needed
```

### Permissions

- **No permissions declared** in app manifest
- **System handles access** via photo picker
- **User controls** which images to share
- **One-time access** per selection

## Play Store Compliance Checklist

✅ **No Restricted Permissions**

- ✅ No READ_MEDIA_IMAGES
- ✅ No READ_MEDIA_VIDEO
- ✅ No READ_EXTERNAL_STORAGE

✅ **System Photo Picker**

- ✅ Uses native Android/iOS picker
- ✅ No custom file browser
- ✅ No direct file access

✅ **User Control**

- ✅ User explicitly chooses image
- ✅ User can cancel anytime
- ✅ One-time access per selection

✅ **Core Functionality**

- ✅ Image upload is optional feature
- ✅ App works without images
- ✅ Not core to app purpose

## Testing

### Test 1: Image Upload Works

```
1. Open AddProductScreen
2. Tap "Add Product Image"
3. System photo picker opens
4. Select image from gallery
5. Verify image preview displays
6. Verify no permission dialogs shown
```

### Test 2: No Permission Requests

```
1. Install app on Android 13+ device
2. Open image picker
3. Verify NO permission dialog shown
4. System picker opens directly
5. Select image
6. Verify image loads
```

### Test 3: Image Upload Completes

```
1. Add product with image
2. Tap "Add Product"
3. Verify product created
4. Verify image uploaded to Cloudinary
5. Verify image displays in product list
```

### Test 4: Play Store Compliance

```
1. Build release APK
2. Upload to Google Play Console
3. Check for permission warnings
4. Verify no restricted permission issues
5. Submit for review
```

## Build & Deploy

### Build Release APK

```bash
cd android
./gradlew assembleRelease
```

### Upload to Play Store

```
1. Go to Google Play Console
2. Select app
3. Go to "Internal Testing" or "Production"
4. Upload new APK/AAB
5. Fill in release notes
6. Submit for review
```

### Expected Review Time

- Initial review: 24-48 hours
- Resubmission: 24-48 hours

## Files Modified

| File                                       | Changes                            |
| ------------------------------------------ | ---------------------------------- |
| `android/app/src/main/AndroidManifest.xml` | Remove restricted permissions      |
| `src/utils/imageUtils.ts`                  | System photo picker implementation |
| `src/components/ImageUpload.tsx`           | Reusable image upload component    |
| `src/screens/AddProductScreen.tsx`         | Integrated ImageUpload             |
| `src/screens/ProductDetailScreen.tsx`      | Integrated ImageUpload             |

## Benefits

✅ **Play Store Compliant** - No restricted permissions
✅ **User Friendly** - Native system picker
✅ **Secure** - User controls access
✅ **Fast** - No permission dialogs
✅ **Modern** - Recommended approach
✅ **Reliable** - Works on all Android versions

## Troubleshooting

### Issue: Permission dialog still appears

**Solution**: Clear app cache, reinstall app, rebuild APK

### Issue: Image picker doesn't open

**Solution**: Verify `launchImageLibrary()` is called correctly

### Issue: Play Store still shows permission warning

**Solution**:

1. Rebuild APK with updated manifest
2. Wait 24 hours for Play Store cache to clear
3. Resubmit for review

## References

- [Google Play Photo and Video Permissions Policy](https://play.google.com/about/restricted-permissions/photo-video/)
- [Android Photo Picker Documentation](https://developer.android.com/training/data-storage/shared/photopicker)
- [react-native-image-picker Documentation](https://github.com/react-native-image-picker/react-native-image-picker)

## Summary

✅ **Restricted permissions removed**
✅ **System photo picker implemented**
✅ **Play Store compliant**
✅ **Ready for resubmission**

---

## Version

v1.0 - July 10, 2026
Google Play Store Compliance Fix
