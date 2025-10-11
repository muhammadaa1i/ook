import modernApiClient from "@/lib/modernApiClient";
import { API_ENDPOINTS } from "@/lib/constants";

// Server response shapes based on provided Swagger screenshots
export interface CartItemDTO {
  id: number; // cart_item_id
  slipper_id: number;
  quantity: number;
  name: string;
  price: number;
  total_price: number;
}

export interface CartDTO {
  id: number;
  items: CartItemDTO[];
  total_items: number; // number of distinct items
  total_quantity: number; // sum of quantities
  total_amount: number; // sum of total_price
}

export interface CartTotalsDTO {
  total_items: number;
  total_quantity: number;
  total_amount: number;
}

export interface AddCartItemRequest {
  slipper_id: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export const cartService = {
  normalizeCartResponse(raw: unknown): CartDTO {
    // Accept several shapes: { data: CartDTO }, { cart: CartDTO }, CartDTO directly
    const anyRaw = raw as Record<string, unknown> | undefined;
    const maybeData = (anyRaw?.["data"] as unknown) || (anyRaw?.["cart"] as unknown) || raw;
    const c = (maybeData || {}) as Partial<CartDTO> & { items?: Partial<CartItemDTO>[] };

    type LooseItem = Partial<CartItemDTO> & { total_price?: number };
    const items: CartItemDTO[] = (c.items || []).map((it: LooseItem) => ({
      id: Number(it.id || 0),
      slipper_id: Number(it.slipper_id || 0),
      quantity: Number(it.quantity || 0),
      name: String(it.name || ""),
      price: Number(it.price || 0),
      total_price: Number(it.total_price ?? (Number(it.price || 0) * Number(it.quantity || 0))),
    }));

    const total_items = c.total_items ?? items.length;
    const total_quantity = c.total_quantity ?? items.reduce((s, i) => s + (i.quantity || 0), 0);
    const total_amount = c.total_amount ?? items.reduce((s, i) => s + (i.total_price || 0), 0);

    return {
      id: Number(c.id || 0),
      items,
      total_items,
      total_quantity,
      total_amount,
    } as CartDTO;
  },

  async getCart(): Promise<CartDTO> {
    const res = await modernApiClient.get(API_ENDPOINTS.CART);
    return this.normalizeCartResponse(res);
  },

  async getTotals(): Promise<CartTotalsDTO> {
    return (await modernApiClient.get(API_ENDPOINTS.CART_TOTAL)) as CartTotalsDTO;
  },

  async addItem(payload: AddCartItemRequest): Promise<CartDTO> {
    const res = await modernApiClient.post(API_ENDPOINTS.CART_ITEMS, payload);
    return this.normalizeCartResponse(res);
  },

  async updateItem(cartItemId: number, payload: UpdateCartItemRequest): Promise<CartDTO> {
    const res = await modernApiClient.put(API_ENDPOINTS.CART_ITEM_BY_ID(cartItemId), payload);
    return this.normalizeCartResponse(res);
  },

  async deleteItem(cartItemId: number): Promise<CartDTO> {
    const res = await modernApiClient.delete(API_ENDPOINTS.CART_ITEM_BY_ID(cartItemId));
    return this.normalizeCartResponse(res);
  },

  async clear(): Promise<CartDTO> {
    const res = await modernApiClient.delete(API_ENDPOINTS.CART_CLEAR);
    return this.normalizeCartResponse(res);
  },
};

export default cartService;
