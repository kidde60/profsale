# Offline-First Quick Start Guide

## What Was Fixed

### 1. ✅ Auto-Sync Now Starts on Login
- `syncService.startAutoSync(60000)` added to AuthContext login
- Auto-sync stops on logout
- Syncs every 60 seconds automatically

### 2. ✅ Offline Indicator Added
- Shows when device is offline
- Shows pending changes count
- Auto-hides when synced
- Appears at top of app

### 3. ✅ ProductsScreen Now Works Offline
- Checks network status before fetching
- Falls back to localStorageService if offline
- Caches products in both AsyncStorage and localStorageService
- Handles errors gracefully

## How to Test

### Test 1: Offline Mode
```
1. Open app and login
2. Go to Products screen
3. Toggle airplane mode ON
4. Products should still display from cache
5. Toggle airplane mode OFF
6. Products should refresh from server
```

### Test 2: Auto-Sync
```
1. Login to app
2. Go offline (airplane mode)
3. Create/edit a product
4. Watch OfflineIndicator show pending changes
5. Go online
6. Wait 60 seconds or less
7. OfflineIndicator should disappear (synced)
```

### Test 3: Manual Sync
```
1. Go offline
2. Create a product
3. Go online
4. Call syncService.syncNow() manually
5. Changes should sync immediately
```

## Implementing Offline-First in Other Screens

### Step 1: Import Required Services
```typescript
import { networkService } from '../services/networkService';
import { localStorageService } from '../services/localStorageService';
```

### Step 2: Check Network Status
```typescript
const fetchData = async () => {
  // Check if online
  if (!networkService.isNetworkAvailable()) {
    // Load from local storage
    const cachedData = await localStorageService.getProducts();
    setData(cachedData);
    return;
  }
  
  // Fetch from API
  const response = await apiService.getData();
  setData(response.data);
};
```

### Step 3: Cache Data Locally
```typescript
// After successful API call
await localStorageService.cacheProducts(response.data);
```

### Step 4: Handle Errors with Fallback
```typescript
try {
  const response = await apiService.getData();
  setData(response.data);
} catch (error) {
  // Try to load from cache
  const cachedData = await localStorageService.getProducts();
  if (cachedData.length > 0) {
    setData(cachedData);
  } else {
    handleError(error, 'Failed to load data');
  }
}
```

## Complete Example: SalesScreen

```typescript
import React, { useState, useCallback } from 'react';
import { View, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { networkService } from '../services/networkService';
import { localStorageService } from '../services/localStorageService';
import { salesService } from '../services/salesService';

const SalesScreen = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      // If offline, load from local storage
      if (!networkService.isNetworkAvailable()) {
        const localSales = await localStorageService.getSales();
        setSales(localSales);
        return;
      }

      // Fetch from API
      const response = await salesService.getSales();
      const salesData = response.data;
      
      // Cache locally
      await localStorageService.cacheSales(salesData);
      setSales(salesData);
    } catch (error) {
      console.error('Error fetching sales:', error);
      
      // Fallback to cache
      try {
        const localSales = await localStorageService.getSales();
        if (localSales.length > 0) {
          setSales(localSales);
        }
      } catch (cacheError) {
        console.error('Failed to load from cache:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSales();
    }, [fetchSales]),
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={sales}
        renderItem={({ item }) => <SaleItem sale={item} />}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

export default SalesScreen;
```

## Screens That Need Offline-First Implementation

1. **SalesScreen** - Show cached sales offline
2. **CustomersScreen** - Show cached customers offline
3. **ExpensesScreen** - Show cached expenses offline
4. **DashboardScreen** - Show cached metrics offline
5. **ReportsScreen** - Show cached reports offline
6. **InventoryScreen** - Show cached inventory offline

## Sync Queue Status

### Check Pending Changes
```typescript
const status = await syncService.getSyncStatus();
console.log(`Pending changes: ${status.pendingChanges}`);
console.log(`Last sync: ${status.lastSync}`);
```

### Listen for Network Changes
```typescript
useEffect(() => {
  const unsubscribe = networkService.subscribe((isOnline) => {
    console.log('Network status:', isOnline ? 'Online' : 'Offline');
    if (isOnline) {
      // Refresh data when coming online
      fetchData();
    }
  });

  return unsubscribe;
}, []);
```

## Offline Indicator Behavior

### When Visible
- Device is offline, OR
- There are pending changes to sync

### When Hidden
- Device is online AND
- All changes are synced

### Emoji Indicators
- 📡 = Offline mode
- 🔄 = Syncing changes

## Common Patterns

### Pattern 1: Simple Offline Cache
```typescript
const fetchData = async () => {
  if (!networkService.isNetworkAvailable()) {
    const cached = await localStorageService.getProducts();
    setData(cached);
    return;
  }
  
  const response = await apiService.getProducts();
  await localStorageService.cacheProducts(response.data);
  setData(response.data);
};
```

### Pattern 2: With Error Handling
```typescript
const fetchData = async () => {
  try {
    if (!networkService.isNetworkAvailable()) {
      const cached = await localStorageService.getProducts();
      setData(cached);
      return;
    }
    
    const response = await apiService.getProducts();
    await localStorageService.cacheProducts(response.data);
    setData(response.data);
  } catch (error) {
    const cached = await localStorageService.getProducts();
    if (cached.length > 0) {
      setData(cached);
    } else {
      handleError(error);
    }
  }
};
```

### Pattern 3: With Loading States
```typescript
const fetchData = async () => {
  setLoading(true);
  try {
    if (!networkService.isNetworkAvailable()) {
      const cached = await localStorageService.getProducts();
      setData(cached);
      return;
    }
    
    const response = await apiService.getProducts();
    await localStorageService.cacheProducts(response.data);
    setData(response.data);
  } catch (error) {
    const cached = await localStorageService.getProducts();
    if (cached.length > 0) {
      setData(cached);
    } else {
      handleError(error);
    }
  } finally {
    setLoading(false);
  }
};
```

## Troubleshooting

### Products Not Loading Offline
1. Check if products were cached on login
2. Verify `localStorageService.getProducts()` returns data
3. Check AsyncStorage for 'cached_products' key

### Changes Not Syncing
1. Check network connectivity
2. Verify `networkService.isNetworkAvailable()` returns true
3. Check `syncService.getSyncStatus()` for pending changes
4. Check console logs for sync errors

### Offline Indicator Not Showing
1. Verify OfflineIndicator is in App.tsx
2. Check if networkService is initialized
3. Verify network state listener is working

## Next Steps

1. Implement offline-first in SalesScreen
2. Implement offline-first in CustomersScreen
3. Implement offline-first in ExpensesScreen
4. Add offline-first to DashboardScreen
5. Test all screens in offline mode
6. Monitor sync status in production

## Support

For issues or questions:
1. Check OFFLINE_FIRST_IMPLEMENTATION.md for detailed docs
2. Review console logs for sync errors
3. Test with airplane mode toggle
4. Verify network service is initialized
