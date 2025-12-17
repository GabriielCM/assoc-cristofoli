import { api } from './api';
import type { FridgeProduct, FridgeOrder, FridgeOrderItem } from '../types';

interface CreateProductData {
  name: string;
  description: string;
  category: 'Bebidas' | 'Snacks' | 'Refeicoes';
  pricePoints: number;
  stockQuantity: number;
  image: string;
  isActive?: boolean;
}

type UpdateProductData = Partial<CreateProductData>;

interface CreateOrderData {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

interface FridgeOrderWithItems extends FridgeOrder {
  items: FridgeOrderItem[];
  user?: { id: string; name: string; email: string };
}

export const fridgeService = {
  // Products
  async getProducts(): Promise<FridgeProduct[]> {
    return api.get<FridgeProduct[]>('/fridge/products');
  },

  async getAllProducts(): Promise<FridgeProduct[]> {
    return api.get<FridgeProduct[]>('/fridge/products/all');
  },

  async getProduct(id: string): Promise<FridgeProduct> {
    return api.get<FridgeProduct>(`/fridge/products/${id}`);
  },

  async createProduct(data: CreateProductData): Promise<FridgeProduct> {
    return api.post<FridgeProduct>('/fridge/products', data);
  },

  async updateProduct(id: string, data: UpdateProductData): Promise<FridgeProduct> {
    return api.put<FridgeProduct>(`/fridge/products/${id}`, data);
  },

  async deleteProduct(id: string): Promise<void> {
    return api.delete<void>(`/fridge/products/${id}`);
  },

  // Orders
  async getOrders(): Promise<FridgeOrderWithItems[]> {
    return api.get<FridgeOrderWithItems[]>('/fridge/orders');
  },

  async getOrder(id: string): Promise<FridgeOrderWithItems> {
    return api.get<FridgeOrderWithItems>(`/fridge/orders/${id}`);
  },

  async createOrder(data: CreateOrderData): Promise<FridgeOrderWithItems> {
    return api.post<FridgeOrderWithItems>('/fridge/orders', data);
  },

  async payOrder(id: string, secret: string): Promise<FridgeOrderWithItems> {
    return api.post<FridgeOrderWithItems>(`/fridge/orders/${id}/pay`, { secret });
  },

  async collectOrder(id: string): Promise<FridgeOrderWithItems> {
    return api.post<FridgeOrderWithItems>(`/fridge/orders/${id}/collect`);
  },

  async cancelOrder(id: string): Promise<FridgeOrderWithItems> {
    return api.post<FridgeOrderWithItems>(`/fridge/orders/${id}/cancel`);
  },
};
