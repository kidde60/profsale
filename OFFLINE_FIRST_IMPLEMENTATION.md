# Offline-First Architecture Implementation Guide

## Overview
ProfSale now has a complete offline-first architecture that allows users to work seamlessly even without internet connectivity. All changes are automatically synced when the device comes back online.

## Key Components

### 1. **SyncService** (`src/services/syncService.ts`)
- Manages synchronization of local changes with the server
- Automatically initializes on login
- Auto-syncs every 60 seconds when online
- Handles product, sales, customer, and expense changes
- Tracks pending changes and sync status

**Key Methods:**
- `initialize()` - Initializes device ID and loads products
- `startAutoSync(intervalMs)` - Starts automatic sync interval
- `stopAutoSync()` - Stops automatic sync
- `syncNow()` - Manually trigger sync
- `queueChange(change)` - Queue a change for sync
- `getSyncStatus()` - Get current sync status

### 2. **LocalStorageService** (`src/services/localStorageService.ts`)
- Stores products, users, and pending changes locally
- Provides offline access to cached data
- Tracks which items have been synced
- Manages pending changes for sync

**Key Methods:**
- `cacheProducts(products)` - Cache products locally
- `getProducts()` - Retrieve cached products
- `updateProduct(id, updates)` - Update product locally
- `createProduct(product)` - Create product locally
- `deleteProduct(id)` - Mark product for deletion
- `getPendingChanges()` - Get all pending changes

### 3. **NetworkService** (`src/services/networkService.ts`)
- Monitors network connectivity
- Queues requests when offline
- Processes queue when back online
- Notifies listeners of network state changes

**Key Methods:**
- `isNetworkAvailable()` - Check if online
- `subscribe(listener)` - Listen for network changes
- `addToQueue(request)` - Queue a request
- `processQueue()` - Process queued requests

### 4. **OfflineIndicator** (`src/components/OfflineIndicator.tsx`)
- Visual indicator showing offline status
- Displays pending changes count
- Auto-dismisses when all changes synced
- Shows sync status with emoji indicators

## How It Works

### Login Flow
```
1. User logs in
2. AuthContext calls syncService.initialize()
3. syncService.startAutoSync(60000) - starts 60-second sync interval
4. Products are cached locally
```

### Offline Usage
```
1. User creates/updates/deletes data offline
2. Changes are stored in localStorageService
3. Changes are queued in AsyncStorage
4. OfflineIndicator shows pending changes
5. When online, auto-sync triggers every 60 seconds
```

### Sync Process
```
1. syncService.syncNow() is called
2. Pending changes are collected
3. Changes are sent to /sync/sync endpoint
4. Server processes changes in transaction
5. Server returns any conflicts
6. Local cache is updated with server data
7. Pending changes are cleared
```

### Network Recovery
```
1. Device comes back online
2. networkService detects connectivity
3. Automatically triggers syncService.syncNow()
4. Queued API requests are processed
5. OfflineIndicator updates status
```

## Data Sync Strategy

### Products
- Cached on login via `initialProductSync()`
- Updated locally when offline
- Synced to server when online
- Conflict resolution: Server data wins

### Sales
- Queued locally with unique sale numbers
- Synced with items and customer info
- Conflict detection: Duplicate sale numbers
- Stored with synced flag

### Customers
- Queued for sync
- Synced with contact information
- Conflict detection: Duplicate emails/phones

### Expenses
- Queued for sync
- Synced with category and amount
- Conflict detection: Duplicate entries

## Implementation in Screens

### ProductsScreen Example
```typescript
const fetchProducts = useCallback(async () => {
  // If offline, load from local storage
  if (!networkService.isNetworkAvailable()) {
    const localProducts = await localStorageService.getProducts();
    setAllProducts(localProducts);
    return;
  }

  // Fetch from API
  const response = await productService.getProducts({ all: true });
  const productsData = response.data;
  
  // Cache locally
  await localStorageService.cacheProducts(productsData);
  setAllProducts(productsData);
}, []);
```

### Pattern for All Screens
1. Check if online with `networkService.isNetworkAvailable()`
2. If offline, load from `localStorageService`
3. If online, fetch from API
4. Cache data in `localStorageService`
5. Handle errors by falling back to cache

## Sync Status Monitoring

### Check Sync Status
```typescript
const status = await syncService.getSyncStatus();
console.log(status);
// { lastSync: "2024-01-15T10:30:00Z", pendingChanges: 3 }
```

### Listen for Network Changes
```typescript
const unsubscribe = networkService.subscribe((isOnline) => {
  console.log('Network status:', isOnline ? 'Online' : 'Offline');
});
```

## Auto-Sync Configuration

### Current Settings
- **Interval**: 60 seconds
- **Trigger**: Every 60 seconds when online
- **On Network Recovery**: Immediately
- **On App Focus**: Next scheduled sync

### Customizing Interval
```typescript
// In AuthContext.tsx login method
syncService.startAutoSync(30000); // 30 seconds
```

## Conflict Resolution

### Server Wins Strategy
- If conflict detected during sync
- Server data overwrites local data
- Conflict logged for debugging
- User notified via toast

### Conflict Detection
- Sales: Duplicate sale numbers
- Products: Duplicate barcodes
- Customers: Duplicate emails/phones
- Expenses: Duplicate entries

## Testing Offline Mode

### Simulate Offline
1. **iOS**: Xcode → Debug → Network Link Conditioner → Offline
2. **Android**: Android Studio → Extended Controls → Network → Offline
3. **Both**: Toggle airplane mode

### Test Scenarios
1. **Create offline**: Create product → Go offline → Create another → Go online → Verify both synced
2. **Edit offline**: Edit product → Go offline → Edit again → Go online → Verify latest version synced
3. **Delete offline**: Delete product → Go offline → Verify deleted locally → Go online → Verify deleted on server
4. **Conflict**: Edit same product on device and server → Go offline → Edit locally → Go online → Verify server version wins

## Logging & Debugging

### Enable Debug Logs
```typescript
// In development, logs are automatically enabled
// Check console for:
// - "Sync service initialized"
// - "Starting sync"
// - "Sync completed"
// - "Auto-sync triggered"
```

### Common Issues

**Issue**: Products not loading offline
- **Solution**: Ensure products were cached on login
- **Check**: `await localStorageService.getProducts()`

**Issue**: Changes not syncing
- **Solution**: Check network connectivity
- **Check**: `networkService.isNetworkAvailable()`
- **Check**: `await syncService.getSyncStatus()`

**Issue**: Sync stuck
- **Solution**: Restart app to reset sync state
- **Check**: Logs for sync errors

## Future Enhancements

1. **Selective Sync**: Allow users to choose what to sync
2. **Bandwidth Optimization**: Compress data before sync
3. **Conflict UI**: Show conflicts to user for resolution
4. **Sync History**: Track all syncs with timestamps
5. **Data Validation**: Validate data before sync
6. **Partial Sync**: Resume interrupted syncs
7. **Background Sync**: Use background tasks for sync
8. **Encryption**: Encrypt sensitive data locally

## Security Considerations

1. **Local Storage**: Data stored in AsyncStorage (encrypted on iOS, cleartext on Android)
2. **Sync Validation**: All changes validated on server
3. **Authentication**: Sync requires valid JWT token
4. **Data Integrity**: Transactions ensure consistency
5. **Conflict Resolution**: Server data is authoritative

## Performance Tips

1. **Batch Operations**: Group changes together
2. **Lazy Loading**: Load data on demand
3. **Cache Expiration**: Set TTL for cached data
4. **Sync Frequency**: Adjust interval based on needs
5. **Data Size**: Limit local cache size

## Monitoring

### Metrics to Track
- Sync success rate
- Average sync time
- Pending changes count
- Network availability
- Conflict frequency

### Logs to Review
- Sync errors
- Network state changes
- Cache misses
- Conflict resolutions

## Support & Troubleshooting

### Common Questions

**Q: Will my data be lost if I go offline?**
A: No, all data is cached locally and synced when online.

**Q: What if I make conflicting changes?**
A: Server data wins. Your local changes are preserved in sync logs.

**Q: How long can I work offline?**
A: Indefinitely, as long as you have local storage space.

**Q: Can I sync manually?**
A: Yes, call `syncService.syncNow()` anytime.

**Q: What if sync fails?**
A: Changes remain queued and will retry automatically.

## Files Modified

- `src/context/AuthContext.tsx` - Added auto-sync start/stop
- `src/components/OfflineIndicator.tsx` - New offline status indicator
- `src/screens/ProductsScreen.tsx` - Implemented offline-first pattern
- `App.tsx` - Added OfflineIndicator to app root

## Next Steps

1. Apply offline-first pattern to all data-fetching screens
2. Add offline-first pattern to sales, customers, expenses screens
3. Implement conflict resolution UI
4. Add sync history tracking
5. Implement background sync
6. Add data encryption for sensitive fields
