import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/format.js';

export default function CartDrawer({ open, onClose }) {
  const { items, subtotal, totalItems, setQty, removeFromCart, clearCart } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Your Cart {totalItems > 0 && `(${totalItems})`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="font-medium text-slate-700">Your cart is empty</p>
            <p className="text-sm text-slate-500">
              Add a few products and they will show up here.
            </p>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item._id} className="flex gap-3 py-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 shrink-0 rounded-lg border border-slate-200 object-cover"
                  />

                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{formatPrice(item.price)} each</p>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setQty(item._id, item.qty - 1)}
                          aria-label="Decrease quantity"
                          className="px-3 py-1 text-slate-600 transition hover:bg-slate-50"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(item._id, item.qty + 1)}
                          disabled={item.qty >= item.stock}
                          aria-label="Increase quantity"
                          className="px-3 py-1 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item._id)}
                        className="text-xs font-medium text-red-600 transition hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <p className="shrink-0 font-semibold text-slate-900">
                    {formatPrice(item.price * item.qty)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-slate-200 px-5 py-4">
              <div className="flex items-center justify-between text-base">
                <span className="font-medium text-slate-600">Subtotal</span>
                <span className="text-xl font-bold text-slate-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Shipping and taxes are calculated at checkout.
              </p>

              <button
                type="button"
                className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Checkout
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="w-full rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
