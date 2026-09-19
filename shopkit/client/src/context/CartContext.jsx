import { createContext, useContext, useReducer, useEffect, useMemo } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'shopkit_cart';

/**
 * Cart items are stored as a flat array of
 * { _id, name, price, image, stock, qty }.
 * We denormalise the product fields on purpose so the cart still renders
 * correctly even if the product list has not been fetched yet.
 */
const initialState = { items: [] };

function cartReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.payload };

    case 'ADD_ITEM': {
      const { product, qty } = action.payload;
      const existing = state.items.find((i) => i._id === product._id);

      // Never let the cart quantity exceed what is actually in stock.
      const cap = product.stock ?? Infinity;

      if (existing) {
        return {
          items: state.items.map((i) =>
            i._id === product._id ? { ...i, qty: Math.min(i.qty + qty, cap) } : i
          ),
        };
      }

      return {
        items: [
          ...state.items,
          {
            _id: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            stock: product.stock,
            qty: Math.min(qty, cap),
          },
        ],
      };
    }

    case 'SET_QTY': {
      const { id, qty } = action.payload;
      if (qty <= 0) {
        return { items: state.items.filter((i) => i._id !== id) };
      }
      return {
        items: state.items.map((i) =>
          i._id === id ? { ...i, qty: Math.min(qty, i.stock ?? Infinity) } : i
        ),
      };
    }

    case 'REMOVE_ITEM':
      return { items: state.items.filter((i) => i._id !== action.payload) };

    case 'CLEAR_CART':
      return { items: [] };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Restore the cart once on mount. Wrapped in try/catch because
  // localStorage can be unavailable or hold corrupted JSON.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) dispatch({ type: 'HYDRATE', payload: JSON.parse(saved) });
    } catch {
      /* ignore — start with an empty cart */
    }
  }, []);

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      /* quota or private mode — the cart still works for this session */
    }
  }, [state.items]);

  const value = useMemo(() => {
    const totalItems = state.items.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);

    return {
      items: state.items,
      totalItems,
      subtotal,
      addToCart: (product, qty = 1) =>
        dispatch({ type: 'ADD_ITEM', payload: { product, qty } }),
      setQty: (id, qty) => dispatch({ type: 'SET_QTY', payload: { id, qty } }),
      removeFromCart: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
      getQty: (id) => state.items.find((i) => i._id === id)?.qty ?? 0,
    };
  }, [state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside a <CartProvider>');
  return ctx;
}
