/** Thin client for /api/admin. Every call carries the session cookie; errors become ApiError. */
import type { Category, Photo, Stock, Zone } from '../shared/catalog';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: { error?: string; fields?: string[]; reasons?: string[]; detail?: string },
  ) {
    super(body.error ?? `HTTP ${status}`);
  }
}

export interface AdminPhoto extends Photo {
  altSq: string;
  altEn: string;
}

export interface AdminProduct {
  id: string;
  slug: string;
  nameSq: string;
  nameEn: string;
  descriptionSq: string;
  descriptionEn: string;
  price: number | null;
  comparePrice: number | null;
  color: string;
  categories: Category[];
  status: 'draft' | 'published';
  featured: boolean;
  instagramUrl: string;
  sort: number;
  stock: Stock;
  photos: AdminPhoto[];
  updatedAt: string;
}

export type OrderStatus = 'awaiting_payment' | 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderSummary {
  id: string;
  number: number;
  status: OrderStatus;
  payment_method: 'cod' | 'card';
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  customer_name: string;
  phone: string;
  city: string;
  total: number;
  delivery_fee: number | null;
  created_at: string;
  pieces: number;
}

export interface OrderDetail {
  order: OrderSummary & { email: string; zone: string; address: string; notes: string; subtotal: number; lang: string; payment_ref: string };
  items: { product_id: string | null; name: string; size: string; qty: number; price: number; image_key: string }[];
  next: OrderStatus[];
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new ApiError(res.status, data as never);
  return data;
}

export const api = {
  me: () => call<{ admin: boolean; devLogin: boolean; passwordSet: boolean }>('GET', '/me'),
  login: (password: string) => call<{ ok: true }>('POST', '/login', { password }),
  devLogin: () => call<{ ok: true }>('POST', '/dev-login'),
  logout: () => call<{ ok: true }>('POST', '/logout'),
  summary: () => call<{ published: number; drafts: number; newOrders: number; awaitingPayment: number; confirmed: number; soldOut: number }>('GET', '/summary'),
  products: () => call<AdminProduct[]>('GET', '/products'),
  product: (id: string) => call<AdminProduct>('GET', `/products/${id}`),
  create: (nameSq: string) => call<AdminProduct>('POST', '/products', { nameSq }),
  save: (id: string, patch: Partial<AdminProduct>) => call<AdminProduct>('PUT', `/products/${id}`, patch),
  remove: (id: string) => call<{ ok: true }>('DELETE', `/products/${id}`),
  reorder: (ids: string[]) => call<{ ok: true }>('POST', '/products/reorder', { ids }),
  photoOrder: (id: string, ids: string[]) => call<AdminProduct>('PUT', `/products/${id}/photos/order`, { ids }),
  photoAlt: (photoId: string, altSq: string, altEn: string) => call<AdminProduct>('PATCH', `/photos/${photoId}`, { altSq, altEn }),
  deletePhoto: (photoId: string) => call<AdminProduct>('DELETE', `/photos/${photoId}`),
  orders: (status?: string) => call<OrderSummary[]>('GET', `/orders${status ? `?status=${status}` : ''}`),
  order: (id: string) => call<OrderDetail>('GET', `/orders/${id}`),
  updateOrder: (id: string, patch: { status?: OrderStatus; paymentStatus?: string }) => call<OrderDetail>('PATCH', `/orders/${id}`, patch),
  settings: () => call<{ zones: Zone[]; shopPhone: string; card: boolean }>('GET', '/settings'),
  saveSettings: (zones: Zone[]) => call<{ zones: Zone[] }>('PUT', '/settings', { zones }),
};

/** Upload with progress (fetch has no upload progress). Resolves to the updated product. */
export function uploadPhoto(productId: string, form: FormData, onProgress: (f: number) => void): Promise<AdminProduct> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/admin/products/${productId}/photos`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let body: unknown = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* keep {} */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as AdminProduct);
      else reject(new ApiError(xhr.status, body as never));
    };
    xhr.onerror = () => reject(new ApiError(0, { error: 'network' }));
    xhr.send(form);
  });
}
