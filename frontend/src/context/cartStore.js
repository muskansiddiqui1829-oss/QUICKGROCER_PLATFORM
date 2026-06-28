import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,
      storeName: '',

      addItem: (product, storeId, storeName) => {
        const { items, storeId: currentStore } = get();

        // Different store - clear cart
        if (currentStore && currentStore !== storeId) {
          if (!window.confirm('Your cart has items from another store. Clear cart and add this item?')) return;
          set({ items: [], storeId: null, storeName: '' });
        }

        const existing = items.find(i => i._id === product._id);
        if (existing) {
          if (existing.quantity >= product.maxOrderQty) {
            toast.error(`Max ${product.maxOrderQty} allowed`);
            return;
          }
          set({ items: items.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i), storeId, storeName });
        } else {
          set({ items: [...items, { ...product, quantity: 1 }], storeId, storeName });
        }
        toast.success('Added to cart');
      },

      removeItem: (productId) => {
        const items = get().items.filter(i => i._id !== productId);
        set({ items, ...(items.length === 0 ? { storeId: null, storeName: '' } : {}) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) { get().removeItem(productId); return; }
        set({ items: get().items.map(i => i._id === productId ? { ...i, quantity } : i) });
      },

      clearCart: () => set({ items: [], storeId: null, storeName: '' }),

      getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      getCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getItemCount: (productId) => get().items.find(i => i._id === productId)?.quantity || 0,
    }),
    { name: 'cart-storage' }
  )
);

export default useCartStore;
