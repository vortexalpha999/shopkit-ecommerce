import { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import { useCart } from './context/CartContext.jsx';

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <div className="min-h-screen">
      <Navbar cartCount={totalItems} onCartClick={() => setCartOpen(true)} />
      <ProductsPage />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        ShopKit — React + Express + MongoDB starter
      </footer>
    </div>
  );
}
