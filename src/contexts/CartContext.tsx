import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';
import { Product, CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  cartLoaded: boolean;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  // Load cart from storage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await storage.get<CartItem[]>(STORAGE_KEYS.CART);
        if (savedCart) {
          setCart(savedCart);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setCartLoaded(true);
      }
    };
    loadCart();
  }, []);

  // Save cart when it changes
  useEffect(() => {
    if (cartLoaded) {
      storage.set(STORAGE_KEYS.CART, cart);
    }
  }, [cart, cartLoaded]);

  const addToCart = (product: Product, quantity: number = 1): void => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.product._id === product._id);
      if (existingItem) {
        return currentCart.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...currentCart, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string): void => {
    setCart(currentCart => currentCart.filter(item => item.product._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number): void => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(currentCart =>
      currentCart.map(item =>
        item.product._id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = (): void => {
    setCart([]);
  };

  const getCartTotal = (): number => {
    return cart.reduce((total, item) => {
      const price = item.product.estimatedPrice || 0;
      return total + price * item.quantity;
    }, 0);
  };

  const getItemCount = (): number => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const isInCart = (productId: string): boolean => {
    return cart.some(item => item.product._id === productId);
  };

  const value: CartContextType = {
    cart,
    cartLoaded,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
