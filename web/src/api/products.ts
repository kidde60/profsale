import apiClient from './client';

const parseNumber = (value: any) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const normalizeProductPayload = (data: any) => {
  const payload: any = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description;
  if (data.barcode !== undefined) payload.barcode = data.barcode;
  if (data.unit !== undefined) payload.unit = data.unit;

  const buyingPrice =
    data.buyingPrice !== undefined
      ? data.buyingPrice
      : data.buying_price !== undefined
        ? data.buying_price
        : data.cost_price;
  const parsedBuying = parseNumber(buyingPrice);
  if (parsedBuying !== undefined) payload.buyingPrice = parsedBuying;

  const sellingPrice =
    data.sellingPrice !== undefined
      ? data.sellingPrice
      : data.selling_price;
  const parsedSelling = parseNumber(sellingPrice);
  if (parsedSelling !== undefined) payload.sellingPrice = parsedSelling;

  const currentStock =
    data.currentStock !== undefined
      ? data.currentStock
      : data.current_stock;
  const parsedStock = parseNumber(currentStock);
  if (parsedStock !== undefined) payload.currentStock = parsedStock;

  const minStockLevel =
    data.minStockLevel !== undefined
      ? data.minStockLevel
      : data.min_stock_level !== undefined
        ? data.min_stock_level
        : data.min_stock;
  const parsedMinStock = parseNumber(minStockLevel);
  if (parsedMinStock !== undefined) payload.minStockLevel = parsedMinStock;

  const categoryId =
    data.categoryId !== undefined
      ? data.categoryId
      : data.category_id !== undefined
        ? data.category_id
        : data.category;
  const parsedCategory = parseNumber(categoryId);
  if (parsedCategory !== undefined) payload.categoryId = parsedCategory;

  if (data.productImage !== undefined) payload.productImage = data.productImage;

  return payload;
};

export const productService = {
  async getProducts(params?: any) {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  async getProduct(id: number) {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  async createProduct(data: any) {
    const payload = normalizeProductPayload(data);
    const response = await apiClient.post('/products', payload);
    return response.data;
  },

  async updateProduct(id: number, data: any) {
    const payload = normalizeProductPayload(data);
    const response = await apiClient.put(`/products/${id}`, payload);
    return response.data;
  },

  async getCategories() {
    const response = await apiClient.get('/products/categories/list');
    return response.data.data?.categories || [];
  },

  async deleteProduct(id: number) {
    await apiClient.delete(`/products/${id}`);
  },
};
