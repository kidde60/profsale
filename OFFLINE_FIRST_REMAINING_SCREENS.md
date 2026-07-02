# Offline-First Implementation for Remaining Screens

## Overview
This guide shows how to implement offline-first pattern in the remaining screens that haven't been updated yet.

---

## High Priority Screens

### 1. ReportsScreen

**Current Issue**: No offline support, reports fail to load offline

**Implementation**:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkService } from '../services/networkService';

const fetchReports = async () => {
  try {
    // If offline, load from cache
    if (!networkService.isNetworkAvailable()) {
      const cachedReports = await AsyncStorage.getItem('cached_reports');
      if (cachedReports) {
        const parsedReports = JSON.parse(cachedReports);
        setReports(parsedReports);
      }
      return;
    }

    const response = await reportService.getReports();
    const reportsData = response.data;
    setReports(reportsData);
    
    // Cache the reports
    await AsyncStorage.setItem('cached_reports', JSON.stringify(reportsData));
  } catch (error) {
    console.error('Error fetching reports:', error);
    // Try to load from cache if API fails
    try {
      const cachedReports = await AsyncStorage.getItem('cached_reports');
      if (cachedReports) {
        const parsedReports = JSON.parse(cachedReports);
        setReports(parsedReports);
      }
    } catch (cacheError) {
      console.error('Failed to load from cache:', cacheError);
    }
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
```

**Changes Required**:
1. Add imports: `AsyncStorage`, `networkService`
2. Add network check in `fetchReports()`
3. Add cache fallback on error
4. Cache reports after successful API call

---

### 2. StockRecordsScreen

**Current Issue**: No offline support, inventory records fail to load offline

**Implementation**:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkService } from '../services/networkService';

const fetchStockRecords = async () => {
  try {
    // If offline, load from cache
    if (!networkService.isNetworkAvailable()) {
      const cachedRecords = await AsyncStorage.getItem('cached_stock_records');
      if (cachedRecords) {
        const parsedRecords = JSON.parse(cachedRecords);
        setRecords(parsedRecords);
      }
      return;
    }

    const response = await inventoryService.getStockRecords();
    const recordsData = response.data;
    setRecords(recordsData);
    
    // Cache the stock records
    await AsyncStorage.setItem('cached_stock_records', JSON.stringify(recordsData));
  } catch (error) {
    console.error('Error fetching stock records:', error);
    // Try to load from cache if API fails
    try {
      const cachedRecords = await AsyncStorage.getItem('cached_stock_records');
      if (cachedRecords) {
        const parsedRecords = JSON.parse(cachedRecords);
        setRecords(parsedRecords);
      }
    } catch (cacheError) {
      console.error('Failed to load from cache:', cacheError);
    }
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
```

**Changes Required**:
1. Add imports: `AsyncStorage`, `networkService`
2. Add network check in `fetchStockRecords()`
3. Add cache fallback on error
4. Cache stock records after successful API call

---

### 3. RestockReportScreen

**Current Issue**: No offline support, restock reports fail to load offline

**Implementation**:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkService } from '../services/networkService';

const fetchRestockReport = async () => {
  try {
    // If offline, load from cache
    if (!networkService.isNetworkAvailable()) {
      const cachedReport = await AsyncStorage.getItem('cached_restock_report');
      if (cachedReport) {
        const parsedReport = JSON.parse(cachedReport);
        setReport(parsedReport);
      }
      return;
    }

    const response = await reportService.getRestockReport();
    const reportData = response.data;
    setReport(reportData);
    
    // Cache the restock report
    await AsyncStorage.setItem('cached_restock_report', JSON.stringify(reportData));
  } catch (error) {
    console.error('Error fetching restock report:', error);
    // Try to load from cache if API fails
    try {
      const cachedReport = await AsyncStorage.getItem('cached_restock_report');
      if (cachedReport) {
        const parsedReport = JSON.parse(cachedReport);
        setReport(parsedReport);
      }
    } catch (cacheError) {
      console.error('Failed to load from cache:', cacheError);
    }
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
```

**Changes Required**:
1. Add imports: `AsyncStorage`, `networkService`
2. Add network check in `fetchRestockReport()`
3. Add cache fallback on error
4. Cache restock report after successful API call

---

## Medium Priority Screens

### 4. ProductDetailScreen

**Current Issue**: Product details fail to load offline

**Implementation**:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkService } from '../services/networkService';

const fetchProductDetails = async (productId: number) => {
  try {
    // If offline, load from cache
    if (!networkService.isNetworkAvailable()) {
      const cachedProduct = await AsyncStorage.getItem(`cached_product_${productId}`);
      if (cachedProduct) {
        const parsedProduct = JSON.parse(cachedProduct);
        setProduct(parsedProduct);
      }
      return;
    }

    const response = await productService.getProductById(productId);
    const productData = response.data;
    setProduct(productData);
    
    // Cache the product details
    await AsyncStorage.setItem(`cached_product_${productId}`, JSON.stringify(productData));
  } catch (error) {
    console.error('Error fetching product details:', error);
    // Try to load from cache if API fails
    try {
      const cachedProduct = await AsyncStorage.getItem(`cached_product_${productId}`);
      if (cachedProduct) {
        const parsedProduct = JSON.parse(cachedProduct);
        setProduct(parsedProduct);
      }
    } catch (cacheError) {
      console.error('Failed to load from cache:', cacheError);
    }
  } finally {
    setLoading(false);
  }
};
```

**Key Difference**: Cache key includes product ID for individual caching

---

### 5. SaleDetailScreen

**Current Issue**: Sale details fail to load offline

**Implementation**:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkService } from '../services/networkService';

const fetchSaleDetails = async (saleId: number) => {
  try {
    // If offline, load from cache
    if (!networkService.isNetworkAvailable()) {
      const cachedSale = await AsyncStorage.getItem(`cached_sale_${saleId}`);
      if (cachedSale) {
        const parsedSale = JSON.parse(cachedSale);
        setSale(parsedSale);
      }
      return;
    }

    const response = await salesService.getSaleById(saleId);
    const saleData = response.data;
    setSale(saleData);
    
    // Cache the sale details
    await AsyncStorage.setItem(`cached_sale_${saleId}`, JSON.stringify(saleData));
  } catch (error) {
    console.error('Error fetching sale details:', error);
    // Try to load from cache if API fails
    try {
      const cachedSale = await AsyncStorage.getItem(`cached_sale_${saleId}`);
      if (cachedSale) {
        const parsedSale = JSON.parse(cachedSale);
        setSale(parsedSale);
      }
    } catch (cacheError) {
      console.error('Failed to load from cache:', cacheError);
    }
  } finally {
    setLoading(false);
  }
};
```

**Key Difference**: Cache key includes sale ID for individual caching

---

### 6. CustomerDetailScreen

**Current Issue**: Customer details fail to load offline

**Implementation**:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkService } from '../services/networkService';

const fetchCustomerDetails = async (customerId: number) => {
  try {
    // If offline, load from cache
    if (!networkService.isNetworkAvailable()) {
      const cachedCustomer = await AsyncStorage.getItem(`cached_customer_${customerId}`);
      if (cachedCustomer) {
        const parsedCustomer = JSON.parse(cachedCustomer);
        setCustomer(parsedCustomer);
      }
      return;
    }

    const response = await customerService.getCustomerById(customerId);
    const customerData = response.data;
    setCustomer(customerData);
    
    // Cache the customer details
    await AsyncStorage.setItem(`cached_customer_${customerId}`, JSON.stringify(customerData));
  } catch (error) {
    console.error('Error fetching customer details:', error);
    // Try to load from cache if API fails
    try {
      const cachedCustomer = await AsyncStorage.getItem(`cached_customer_${customerId}`);
      if (cachedCustomer) {
        const parsedCustomer = JSON.parse(cachedCustomer);
        setCustomer(parsedCustomer);
      }
    } catch (cacheError) {
      console.error('Failed to load from cache:', cacheError);
    }
  } finally {
    setLoading(false);
  }
};
```

**Key Difference**: Cache key includes customer ID for individual caching

---

## Low Priority Screens

### 7. AddProductScreen
**Status**: ✅ Already supports offline
- Changes queued via syncService
- No API call needed until sync
- No changes required

### 8. AddStaffScreen
**Status**: ✅ Already supports offline
- Changes queued via syncService
- No API call needed until sync
- No changes required

### 9. CheckoutScreen
**Status**: ✅ Already supports offline
- Uses ProductsScreen cache
- Sales queued for sync
- No changes required

### 10. POSScreen
**Status**: ✅ Already supports offline
- Uses ProductsScreen cache
- Sales queued for sync
- No changes required

### 11. SettingsScreen
**Status**: ✅ No data fetching
- Settings stored locally
- No API calls
- No changes required

### 12. SubscriptionScreen
**Status**: ⚠️ Subscription data cached in AuthContext
- Consider adding cache fallback
- Low priority

---

## Implementation Checklist

### For Each Screen

- [ ] Add `AsyncStorage` import
- [ ] Add `networkService` import
- [ ] Add network check in fetch function
- [ ] Add cache loading if offline
- [ ] Add cache fallback on error
- [ ] Cache data after successful API call
- [ ] Update error handling
- [ ] Test offline mode
- [ ] Test cache fallback
- [ ] Test error handling

---

## Cache Key Naming Convention

```typescript
// List screens (all items)
'cached_products'
'cached_sales'
'cached_customers'
'cached_expenses'
'cached_reports'
'cached_stock_records'
'cached_restock_report'
'cached_dashboard'

// Detail screens (individual items)
'cached_product_${id}'
'cached_sale_${id}'
'cached_customer_${id}'
'cached_staff_${id}'
```

---

## Testing Each Screen

### Test Pattern
```
1. Go online and load screen
2. Verify data displays
3. Go offline (airplane mode)
4. Refresh screen
5. Verify data loads from cache
6. Go online
7. Verify data refreshes from API
```

---

## Priority Order for Implementation

### Phase 1 (This Week)
1. ReportsScreen
2. StockRecordsScreen
3. RestockReportScreen

### Phase 2 (Next Week)
1. ProductDetailScreen
2. SaleDetailScreen
3. CustomerDetailScreen

### Phase 3 (Future)
1. SubscriptionScreen
2. Other detail screens

---

## Performance Considerations

### Cache Size
- Each screen caches ~10-100KB
- Total cache: ~1-2MB per user
- AsyncStorage limit: 5-10MB per app

### Cache Cleanup
- Consider implementing cache expiration
- Clear old caches periodically
- Monitor cache size growth

### Sync Frequency
- Auto-sync every 60 seconds
- Manual refresh available
- Network recovery triggers sync

---

## Monitoring & Debugging

### Console Logs
```typescript
console.log('Offline - loading from cache');
console.log('Cache hit for products');
console.log('Failed to load from cache');
```

### AsyncStorage Inspection
```typescript
// Check what's cached
const keys = await AsyncStorage.getAllKeys();
console.log('Cached keys:', keys);

// Get cache size
const cached = await AsyncStorage.getItem('cached_products');
console.log('Cache size:', cached?.length);
```

---

## Common Patterns

### Pattern 1: Simple List Cache
```typescript
if (!networkService.isNetworkAvailable()) {
  const cached = await AsyncStorage.getItem('cached_items');
  if (cached) setItems(JSON.parse(cached));
  return;
}
```

### Pattern 2: Detail Cache with ID
```typescript
if (!networkService.isNetworkAvailable()) {
  const cached = await AsyncStorage.getItem(`cached_item_${id}`);
  if (cached) setItem(JSON.parse(cached));
  return;
}
```

### Pattern 3: Error Fallback
```typescript
} catch (error) {
  const cached = await AsyncStorage.getItem('cached_items');
  if (cached) setItems(JSON.parse(cached));
}
```

---

## Summary

### Already Implemented (5 screens)
✅ ProductsScreen
✅ SalesScreen
✅ CustomersScreen
✅ DashboardScreen
✅ ExpensesScreen

### Ready to Implement (6 screens)
⏳ ReportsScreen
⏳ StockRecordsScreen
⏳ RestockReportScreen
⏳ ProductDetailScreen
⏳ SaleDetailScreen
⏳ CustomerDetailScreen

### No Changes Needed (6 screens)
✅ AddProductScreen
✅ AddStaffScreen
✅ CheckoutScreen
✅ POSScreen
✅ SettingsScreen
✅ Auth Screens

### Total Coverage
- 5 screens implemented
- 6 screens ready to implement
- 6 screens don't need changes
- **17 of 23 screens covered**

---

## Next Steps

1. **Implement high priority screens** (ReportsScreen, StockRecordsScreen, RestockReportScreen)
2. **Test offline mode** on each screen
3. **Monitor cache size** and performance
4. **Gather user feedback** on offline experience
5. **Implement medium priority screens** (detail screens)
6. **Optimize cache management** for production

---

## Support

For questions or issues:
1. Check `OFFLINE_FIRST_IMPLEMENTATION.md` for technical details
2. Review console logs for debugging
3. Test with airplane mode toggle
4. Verify AsyncStorage has cached data
5. Check network service status

---

## Version
v1.0 - July 1, 2026
Complete offline-first implementation guide for remaining screens
