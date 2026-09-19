import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/format.js';

export default function ProductCard({ product }) {
  const { addToCart, getQty } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const inCart = getQty(product._id);
  const outOfStock = product.stock <= 0;
  const maxedOut = inCart >= product.stock;

  const handleAdd = () => {
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%23e2e8f0"/><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="%2394a3b8" text-anchor="middle">No image</text></svg>';
          }}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />

        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-slate-900/85 px-3 py-1 text-xs font-medium text-white">
            Out of stock
          </span>
        )}
        {!outOfStock && product.stock <= 5 && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white">
            Only {product.stock} left
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {product.category}
        </p>

        <h3 className="line-clamp-2 font-semibold leading-snug text-slate-900">
          {product.name}
        </h3>

        {product.description && (
          <p className="line-clamp-2 text-sm text-slate-500">{product.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-bold text-slate-900">
            {formatPrice(product.price)}
          </span>
          {inCart > 0 && (
            <span className="text-xs font-medium text-blue-600">{inCart} in cart</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock || maxedOut}
          className={`mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            outOfStock || maxedOut
              ? 'cursor-not-allowed bg-slate-100 text-slate-400'
              : justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
          }`}
        >
          {outOfStock
            ? 'Out of stock'
            : maxedOut
              ? 'Max quantity reached'
              : justAdded
                ? 'Added ✓'
                : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
