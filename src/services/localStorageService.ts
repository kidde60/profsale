import AsyncStorage from '@react-native-async-storage/async-storage';

interface Product {
  id: number;
  name: string;
  description?: string;
  barcode?: string;
  buying_price?: number;
  selling_price?: number;
  current_stock?: number;
  min_stock_level?: number;
  unit?: string;
  category_id?: number;
  product_image?: string;
  [key: string]: any;
}

interface LocalProduct extends Product {
  _localId: string;
  _synced: boolean;
  _lastModified: number;
  _pendingAction?: 'create' | 'update' | 'delete';
}

interface LocalUser {
  id: number;
  name: string;
  email: string;
  businessId: number;
  _localId: string;
  _synced: boolean;
  _lastModified: number;
}

class LocalStorageService {
  private readonly PRODUCTS_KEY = '@local_products';
  private readonly USERS_KEY = '@local_users';
  private readonly PENDING_CHANGES_KEY = '@pending_changes';

  // Products
  async cacheProducts(products: Product[]) {
    const localProducts: LocalProduct[] = products.map(p => ({
      ...p,
      _localId: `product_${p.id}`,
      _synced: true,
      _lastModified: Date.now(),
    }));
    await AsyncStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(localProducts));
  }

  async getProducts(): Promise<LocalProduct[]> {
    const productsJson = await AsyncStorage.getItem(this.PRODUCTS_KEY);
    return productsJson ? JSON.parse(productsJson) : [];
  }

  async getProduct(id: number): Promise<LocalProduct | null> {
    const products = await this.getProducts();
    return products.find(p => p.id === id) || null;
  }

  async updateProduct(id: number, updates: Partial<Product>) {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = {
        ...products[index],
        ...updates,
        _synced: false,
        _lastModified: Date.now(),
        _pendingAction: 'update',
      };
      await AsyncStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
      
      // Track this change for sync
      await this.trackChange('product', 'update', id, updates);
    }
  }

  async createProduct(product: Product) {
    const products = await this.getProducts();
    const newProduct: LocalProduct = {
      ...product,
      _localId: `local_${Date.now()}`,
      _synced: false,
      _lastModified: Date.now(),
      _pendingAction: 'create',
      id: -Date.now(), // Temporary negative ID until synced
    };
    products.push(newProduct);
    await AsyncStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
    
    // Track this change for sync
    await this.trackChange('product', 'create', newProduct.id, product);
    
    return newProduct;
  }

  async deleteProduct(id: number) {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index]._synced = false;
      products[index]._lastModified = Date.now();
      products[index]._pendingAction = 'delete';
      await AsyncStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
      
      // Track this change for sync
      await this.trackChange('product', 'delete', id, {});
    }
  }

  // Users
  async cacheUsers(users: any[]) {
    const localUsers: LocalUser[] = users.map(u => ({
      ...u,
      _localId: `user_${u.id}`,
      _synced: true,
      _lastModified: Date.now(),
    }));
    await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(localUsers));
  }

  async getUsers(): Promise<LocalUser[]> {
    const usersJson = await AsyncStorage.getItem(this.USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  // Change Tracking
  async trackChange(type: 'product' | 'user', action: 'create' | 'update' | 'delete', id: number, data: any) {
    const changesJson = await AsyncStorage.getItem(this.PENDING_CHANGES_KEY);
    const changes = changesJson ? JSON.parse(changesJson) : [];
    
    changes.push({
      type,
      action,
      id,
      data,
      timestamp: Date.now(),
    });
    
    await AsyncStorage.setItem(this.PENDING_CHANGES_KEY, JSON.stringify(changes));
  }

  async getPendingChanges(): Promise<any[]> {
    const changesJson = await AsyncStorage.getItem(this.PENDING_CHANGES_KEY);
    return changesJson ? JSON.parse(changesJson) : [];
  }

  async clearPendingChanges() {
    await AsyncStorage.removeItem(this.PENDING_CHANGES_KEY);
  }

  async markAsSynced(type: 'product' | 'user', id: number) {
    if (type === 'product') {
      const products = await this.getProducts();
      const index = products.findIndex(p => p.id === id);
      if (index !== -1) {
        products[index]._synced = true;
        products[index]._pendingAction = undefined;
        await AsyncStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
      }
    } else {
      const users = await this.getUsers();
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
        users[index]._synced = true;
        await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      }
    }
  }

  async updateLocalId(oldId: number, newId: number) {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === oldId);
    if (index !== -1) {
      products[index].id = newId;
      products[index]._localId = `product_${newId}`;
      await AsyncStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
    }
  }
}

export const localStorageService = new LocalStorageService();
