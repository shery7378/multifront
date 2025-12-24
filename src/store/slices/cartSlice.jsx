// src/store/slices/cartSlice.jsx
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  total: 0,
  appliedCoupon: null,
};

const matchItem = (item, { id, color, size }) =>
  item.id === id &&
  (item.color === color || (!item.color && !color)) &&
  (item.size === size || (!item.size && !size));

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const { id, size, color } = action.payload;
      const existingItem = state.items.find(item => matchItem(item, { id, size, color }));
      if (existingItem) {
        existingItem.quantity += action.payload.quantity || 1;
        // console.log(existingItem, 'existingItem at cartSlice');
      } else {
        state.items = [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }];
        // console.log(state.items, 'state.items else at cartSlice');
      }
      state.total = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      // console.log(state.total, 'state.total else at cartSlice');
    },
    removeItem: (state, action) => {
      const { id, color, size } = action.payload;
      const item = state.items.find(item => matchItem(item, { id, color, size }));
      if (item) {
        state.items = state.items.filter(item => !matchItem(item, { id, color, size }));
        // Recalculate total from remaining items to ensure accuracy
        state.total = state.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
      }
    },
    updateQuantity: (state, action) => {
      const { id, color, size, quantity } = action.payload;
      const item = state.items.find(item => matchItem(item, { id, color, size }));
      if (item) {
        state.total = state.total - (item.price * item.quantity) + (item.price * Math.max(1, quantity));
        item.quantity = Math.max(1, quantity);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.appliedCoupon = null;
    },
    setAppliedCoupon: (state, action) => {
      state.appliedCoupon = action.payload;
    },
    clearAppliedCoupon: (state) => {
      state.appliedCoupon = null;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, setAppliedCoupon, clearAppliedCoupon } = cartSlice.actions;
export default cartSlice.reducer;