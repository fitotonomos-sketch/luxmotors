import { useEffect, useState } from 'react';

const key = 'khanedar-cart';
function countItems() {
  try {
    const rows = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(rows) ? rows.reduce((total: number, row: any) => total + (Number.isInteger(row.quantity) && row.quantity > 0 ? row.quantity : 0), 0) : 0;
  } catch { return 0; }
}
export default function CartBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(countItems());
    update();
    window.addEventListener('cart-updated', update);
    window.addEventListener('storage', update);
    return () => { window.removeEventListener('cart-updated', update); window.removeEventListener('storage', update); };
  }, []);
  return <span className="header-cart-content"><svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 1.9-1.5L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span data-copy-key="nav.cart">سبد سفارش</span>{count > 0 && <b className="cart-count" aria-label={`${count} قلم در سبد`}>{new Intl.NumberFormat('fa-IR').format(count)}</b>}</span>;
}
