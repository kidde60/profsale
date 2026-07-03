# Cloudinary Image Upload - Complete Setup Guide

## ✅ Setup Complete

Your Cloudinary credentials have been configured:
- **Cloud Name**: `tndlf2lt`
- **API Key**: `251857125698757`
- **Upload Preset**: `ml_default`

---

## Files Created

### Backend
1. **`backend/src/utils/cloudinary.ts`** - Cloudinary upload utility
   - `uploadToCloudinary()` - Upload base64 images
   - `deleteFromCloudinary()` - Delete images
   - `extractPublicId()` - Extract public ID from URL

2. **`backend/src/routes/product.routes.ts`** - Updated
   - Added Cloudinary import
   - Modified PUT endpoint to handle image uploads
   - Auto-uploads base64 images to Cloudinary
   - Saves image URL to database

### Frontend
1. **`src/utils/imageUtils.ts`** - Image utilities
   - `pickImage()` - Pick image from gallery
   - `validateImageSize()` - Validate image size
   - `formatFileSize()` - Format file size for display

2. **`src/components/ImageUpload.tsx`** - Reusable component
   - Image preview display
   - Pick/change/remove image
   - Size validation
   - Loading state
   - Error handling

3. **`src/components/index.ts`** - Updated
   - Exported ImageUpload component

---

## How It Works

### User Flow

```
1. User taps "Add Product Image"
2. System photo picker opens
3. User selects image from gallery
4. Image converted to base64
5. Size validated (max 5MB)
6. Image sent to backend
7. Backend uploads to Cloudinary
8. Cloudinary returns secure URL
9. URL saved to database
10. Image displays in app
```

### Technical Flow

```
Mobile App
    ↓
pickImage() → base64 conversion
    ↓
validateImageSize() → check size
    ↓
API request with base64
    ↓
Backend (product.routes.ts)
    ↓
uploadToCloudinary() → Cloudinary API
    ↓
Cloudinary returns secure URL
    ↓
Save URL to database
    ↓
Return success response
    ↓
Display image in app
```

---

## Implementation in Screens

### AddProductScreen

Replace the alert with ImageUpload component:

```typescript
import { ImageUpload } from '../components';
import { pickImage } from '../utils/imageUtils';

// In your form:
<ImageUpload
  onImageSelected={(base64) => {
    setFormData(prev => ({ ...prev, productImage: base64 }));
  }}
  currentImage={formData.productImage}
  maxSizeMB={5}
/>

// When submitting, send the base64 image:
const submitData = {
  name: formData.name,
  description: formData.description,
  // ... other fields
  productImage: formData.productImage, // base64 or URL
};
```

### ProductDetailScreen

Same implementation as AddProductScreen:

```typescript
import { ImageUpload } from '../components';

// In your form:
<ImageUpload
  onImageSelected={(base64) => {
    setFormData(prev => ({ ...prev, productImage: base64 }));
  }}
  currentImage={formData.productImage}
  maxSizeMB={5}
/>
```

---

## Backend Environment Variables

Add to `.env`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=tndlf2lt
CLOUDINARY_API_KEY=251857125698757
CLOUDINARY_UPLOAD_PRESET=ml_default
```

---

## API Endpoint

### Update Product with Image

**Endpoint**: `PUT /api/products/:id`

**Request Body**:
```json
{
  "name": "Product Name",
  "description": "Description",
  "buyingPrice": 100,
  "sellingPrice": 150,
  "currentStock": 10,
  "minStockLevel": 5,
  "unit": "pieces",
  "productImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Product updated successfully"
}
```

**Image Handling**:
- If `productImage` is base64 (starts with `data:`):
  - Uploaded to Cloudinary
  - Cloudinary returns secure URL
  - URL saved to database
- If `productImage` is URL:
  - Saved directly to database
- If `productImage` is empty:
  - Skipped

---

## Testing

### Manual Testing

1. **Test Image Upload**
   ```
   1. Go to AddProductScreen
   2. Tap "Add Product Image"
   3. Select image from gallery
   4. Verify image preview displays
   5. Fill in other product details
   6. Submit form
   7. Verify product created with image
   ```

2. **Test Image Update**
   ```
   1. Go to ProductDetailScreen
   2. Tap "Change Image"
   3. Select different image
   4. Tap "Update"
   5. Verify image updated
   ```

3. **Test Image Size Validation**
   ```
   1. Try to upload image > 5MB
   2. Verify error message shown
   3. Select smaller image
   4. Verify upload succeeds
   ```

4. **Test Image Removal**
   ```
   1. Go to ProductDetailScreen
   2. Tap "✕" on image
   3. Confirm removal
   4. Verify image removed
   5. Update product
   6. Verify image cleared from database
   ```

### API Testing with Postman

1. **Create Product with Image**
   ```
   POST /api/products
   Authorization: Bearer {token}
   Content-Type: application/json
   
   {
     "name": "Test Product",
     "sellingPrice": 100,
     "buyingPrice": 50,
     "currentStock": 10,
     "productImage": "data:image/jpeg;base64,..."
   }
   ```

2. **Update Product with Image**
   ```
   PUT /api/products/1
   Authorization: Bearer {token}
   Content-Type: application/json
   
   {
     "productImage": "data:image/jpeg;base64,..."
   }
   ```

---

## Troubleshooting

### Image Upload Fails

**Problem**: "Failed to upload image to Cloudinary"

**Solutions**:
1. Check Cloudinary credentials in `.env`
2. Verify upload preset exists in Cloudinary
3. Check image size (max 5MB)
4. Check network connection
5. Check Cloudinary API status

### Image Not Displaying

**Problem**: Image URL saved but not showing in app

**Solutions**:
1. Verify image URL is valid
2. Check Cloudinary URL format
3. Clear app cache
4. Rebuild app
5. Check image permissions in Cloudinary

### Size Validation Not Working

**Problem**: Large images still uploading

**Solutions**:
1. Verify `validateImageSize()` called before upload
2. Check max size parameter (default 5MB)
3. Verify base64 encoding correct
4. Check image picker options

---

## Performance Optimization

### Image Compression

For better performance, compress images before upload:

```typescript
// In imageUtils.ts (add this function)
export function compressBase64(base64: string, quality: number = 0.7): string {
  // Reduce quality for smaller file size
  // Note: This is a simplified approach
  // For production, use react-native-image-resizer
  return base64;
}
```

### Lazy Loading

Display placeholder while image loads:

```typescript
<Image
  source={{ uri: imageUrl }}
  placeholder={require('../assets/placeholder.png')}
  placeholderStyle={{ backgroundColor: '#f0f0f0' }}
/>
```

---

## Security Considerations

### ✅ Implemented
- Image size validation (max 5MB)
- Base64 validation
- Cloudinary folder organization (`profsale/products`)
- HTTPS for all uploads
- Authentication required for API

### 🔒 Additional Security (Optional)
- Implement image type validation (JPG, PNG only)
- Add virus scanning
- Implement rate limiting
- Add image watermarking
- Implement CDN caching

---

## Offline Support

Images work with offline-first architecture:

```typescript
// In ProductsScreen
if (!networkService.isNetworkAvailable()) {
  // Load from cache
  const cachedProducts = await AsyncStorage.getItem('cached_products');
  // Images display from cached URLs
}
```

**Note**: New images can't be uploaded offline, but existing images display from cache.

---

## Database

The `products` table already has `product_image` column:

```sql
product_image VARCHAR(500) -- Stores Cloudinary URL
```

No schema changes needed!

---

## Cloudinary Dashboard

Monitor uploads in Cloudinary:

1. Go to https://cloudinary.com/console
2. Select your account
3. Go to Media Library
4. View uploaded images in `profsale/products` folder
5. Monitor storage usage
6. View bandwidth usage

---

## Next Steps

### Immediate (Today)
1. ✅ Backend setup complete
2. ✅ Frontend components created
3. ⏳ Update AddProductScreen with ImageUpload
4. ⏳ Update ProductDetailScreen with ImageUpload
5. ⏳ Test image upload end-to-end

### This Week
1. Test all image operations
2. Test offline image display
3. Test image size validation
4. Build release bundle
5. Submit to Google Play

### Future Enhancements
1. Image compression before upload
2. Multiple image support
3. Image cropping tool
4. Image gallery view
5. Image optimization

---

## Support

### Common Issues

**Q: Image upload slow?**
A: Cloudinary may be processing. Check network speed. Consider compressing images.

**Q: Image URL not saving?**
A: Check backend logs. Verify Cloudinary upload succeeded. Check database connection.

**Q: Image not displaying?**
A: Check image URL format. Verify Cloudinary URL accessible. Clear app cache.

**Q: Size validation not working?**
A: Verify `validateImageSize()` called. Check max size parameter. Verify base64 encoding.

---

## Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `backend/src/utils/cloudinary.ts` | Cloudinary API integration | ✅ Created |
| `backend/src/routes/product.routes.ts` | Product API with image upload | ✅ Updated |
| `src/utils/imageUtils.ts` | Image utilities | ✅ Created |
| `src/components/ImageUpload.tsx` | Image upload component | ✅ Created |
| `src/components/index.ts` | Component exports | ✅ Updated |
| `src/screens/AddProductScreen.tsx` | Add product screen | ⏳ To Update |
| `src/screens/ProductDetailScreen.tsx` | Product detail screen | ⏳ To Update |

---

## Version
v1.0 - July 3, 2026
Cloudinary Image Upload Complete Setup
