# Offline Error Handling - Silent Cache Fallback

## Problem
When the app goes offline, API requests fail and show error alerts/toasts. This creates a poor user experience because:
- Users see error messages even though the app is working fine (using cache)
- Multiple error toasts appear when loading different screens
- Users get confused thinking something is broken

## Solution
Implemented **silent cache fallback** for offline GET requests:

### How It Works

#### 1. API Interceptor (`src/services/api.ts`)
When a GET request fails due to no network:
```typescript
// For GET requests when offline, don't show error alert
// Screens will handle loading from cache
console.log('Offline - GET request, will use cache');
return Promise.reject({ isOffline: true, isGetRequest: true });
```

**Key**: Returns error object with `isOffline: true` and `isGetRequest: true` flags

#### 2. Error Handler (`src/utils/errorHandler.ts`)
Checks for offline GET requests and suppresses error toast:
```typescript
// Don't show error toast for offline GET requests - cache will be used
if (error?.isOffline && error?.isGetRequest) {
  console.log('Offline GET request - using cache silently');
  return;
}
```

**Key**: Silently returns without showing toast

#### 3. Screens (ProductsScreen, SalesScreen, CustomersScreen)
Already implemented to handle offline gracefully:
```typescript
if (!networkService.isNetworkAvailable()) {
  const localProducts = await localStorageService.getProducts();
  setAllProducts(localProducts);
  return;
}
```

**Key**: Loads from cache without showing errors

---

## Error Handling Matrix

| Scenario | Action | User Sees |
|----------|--------|-----------|
| **Online, API Success** | Return data | Data loads normally |
| **Online, API Error** | Show error toast | "Failed to load..." message |
| **Offline, GET Request** | Load from cache | Data loads from cache (silent) |
| **Offline, POST/PUT/DELETE** | Queue request | "Request saved. Will sync..." alert |
| **No Cache Available** | Show error toast | "Failed to load..." message |

---

## User Experience Flow

### Scenario 1: Normal Offline Usage
```
1. User goes offline (airplane mode)
2. User navigates to Products screen
3. App silently loads from cache
4. Products display normally
5. No error messages shown
6. OfflineIndicator shows "Offline Mode"
```

### Scenario 2: Creating Data Offline
```
1. User goes offline
2. User creates a new product
3. App shows: "Request saved. Will sync when online."
4. Data stored locally
5. User can continue working
6. OfflineIndicator shows "1 pending change"
```

### Scenario 3: Coming Back Online
```
1. User comes back online
2. App automatically syncs pending changes
3. OfflineIndicator disappears
4. No error messages
5. Data seamlessly synced
```

---

## When Errors ARE Shown

Error toasts are still shown for:

1. **Actual Network Errors** (not just offline)
   - Connection timeout
   - DNS resolution failure
   - SSL certificate error

2. **API Errors** (server returns error)
   - 400 Bad Request
   - 403 Forbidden
   - 500 Server Error

3. **No Cache Available**
   - First time loading data offline
   - Cache expired or cleared
   - No internet and no cached data

4. **Write Operations Offline**
   - POST/PUT/DELETE when offline
   - Shows: "Request saved. Will sync when online."

---

## Technical Details

### Error Object Structure

**Offline GET Request**:
```typescript
{
  isOffline: true,
  isGetRequest: true,
  message: "Network Error",
  // ... other error properties
}
```

**Online API Error**:
```typescript
{
  response: {
    status: 400,
    data: { message: "Invalid input" }
  },
  // ... other error properties
}
```

**Offline Write Operation**:
```typescript
{
  isOffline: true,
  isGetRequest: false,
  // ... other error properties
}
```

---

## Console Logs for Debugging

When offline, you'll see in console:
```
Offline - GET request, will use cache
Offline GET request - using cache silently
```

When error is shown:
```
Error: Failed to load products
```

---

## Testing

### Test 1: Silent Cache Fallback
```
1. Go online and load Products
2. Toggle airplane mode ON
3. Refresh Products screen
4. ✅ Products load from cache
5. ✅ No error toast shown
6. ✅ OfflineIndicator shows "Offline Mode"
```

### Test 2: Error Still Shown When No Cache
```
1. Clear app data
2. Toggle airplane mode ON
3. Try to load Products
4. ✅ Error toast shown: "Failed to load products"
5. ✅ No cached data available
```

### Test 3: Write Operations Show Alert
```
1. Go offline
2. Create a new product
3. ✅ Alert shown: "Request saved. Will sync when online."
4. ✅ Data stored locally
5. ✅ OfflineIndicator shows pending changes
```

### Test 4: Actual Network Error
```
1. Go online
2. Simulate network error (throttle/block)
3. Try to load data
4. ✅ Error toast shown: "Network Error"
5. ✅ Not confused with offline mode
```

---

## Benefits

✅ **Better UX**: No error messages when app is working fine
✅ **Silent Fallback**: Cache used without user knowing
✅ **Seamless Offline**: App feels normal when offline
✅ **Clear Errors**: Real errors still shown clearly
✅ **Reduced Noise**: Fewer error messages overall

---

## Implementation Checklist

- ✅ API interceptor returns `isOffline: true, isGetRequest: true` for offline GET
- ✅ Error handler suppresses toast for offline GET requests
- ✅ Screens load from cache silently
- ✅ Write operations still show "Request saved" alert
- ✅ Real errors still shown to user
- ✅ OfflineIndicator shows status

---

## Future Enhancements

1. **Configurable Error Suppression**
   - Allow screens to opt-in/out of silent cache fallback
   - Different behavior for different data types

2. **Smart Error Messages**
   - Show "Using cached data from X minutes ago" when offline
   - Indicate data freshness to user

3. **Partial Sync Errors**
   - Handle conflicts gracefully
   - Show which items failed to sync

4. **Offline Metrics**
   - Track offline usage patterns
   - Monitor cache hit rates
   - Identify frequently offline users

---

## Files Modified

1. **`src/services/api.ts`**
   - Added `isOffline: true, isGetRequest: true` for offline GET requests
   - Suppresses network error alert for GET requests

2. **`src/utils/errorHandler.ts`**
   - Added check for offline GET requests
   - Suppresses error toast silently

---

## Summary

The app now handles offline gracefully:
- **GET requests offline**: Load from cache silently (no errors)
- **Write operations offline**: Show "Request saved" alert
- **Real errors**: Still shown clearly to user
- **User experience**: Seamless and intuitive

Users can work offline without seeing error messages, while still being informed about pending changes and actual errors.
