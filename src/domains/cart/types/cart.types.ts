import {
  Cart,
  CartItem,
  MenuItem,
  MenuItemVariant,
} from "../../../../prisma/generated/prisma";

export interface CartWithItems extends Cart {
  items: (CartItem & {
    menuItem: MenuItem & {
      images: Array<{ imageUrl: string; isPrimary: boolean }>;
      restaurant: {
        id: string;
        name: string;
        currency: string;
      };
    };
    variant?: MenuItemVariant | null;
  })[];
}

export interface AddToCartDto {
  menuItemId: string;
  variantId?: string | null;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export interface CartSummary {
  totalItems: number;
  subtotal: number;
  currency: string;
}

export interface CartResponse {
  cart: CartWithItems;
  summary: CartSummary;
}
