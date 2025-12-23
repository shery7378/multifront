// src/store/slices/deliverySlice.jsx
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mode: 'delivery', // 'delivery' or 'pickup'
  pickupLocation: null,
  deliveryAddress: null,
  isRightDrawerOpen: false,
  // Multi-store delivery slots: { storeId: { date, time } }
  deliverySlots: {},
};

const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    setDeliveryMode: (state, action) => {
      state.mode = action.payload;
      console.log('setDeliveryMode triggered, mode:', action.payload);
      localStorage.setItem('deliveryMode', action.payload); // sync localStorage
    },
    initializeMode: (state) => {
      const savedMode = localStorage.getItem('deliveryMode');
      if (savedMode) {
        state.mode = savedMode;
      }
    },
    setPickupLocation: (state, action) => {
      state.pickupLocation = action.payload;
    },
    setDeliveryAddress: (state, action) => {
      state.deliveryAddress = action.payload;
    },
    setRightDrawerOpen: (state, action) => {
      state.isRightDrawerOpen = action.payload;
    },
    // Set delivery slot for a specific store
    setStoreDeliverySlot: (state, action) => {
      const { storeId, date, time } = action.payload;
      state.deliverySlots[storeId] = { date, time };
    },
    // Clear delivery slot for a specific store
    clearStoreDeliverySlot: (state, action) => {
      const { storeId } = action.payload;
      delete state.deliverySlots[storeId];
    },
    // Clear all delivery slots
    clearAllDeliverySlots: (state) => {
      state.deliverySlots = {};
    },
  },
});

export const {
  setDeliveryMode,
  initializeMode,
  setPickupLocation,
  setDeliveryAddress,
  setRightDrawerOpen,
  setStoreDeliverySlot,
  clearStoreDeliverySlot,
  clearAllDeliverySlots,
} = deliverySlice.actions;

export default deliverySlice.reducer;