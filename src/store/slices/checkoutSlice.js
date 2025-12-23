import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  guestInfo: null, // { customer_email, customer_phone }
  customerEmail: null, // Email for authenticated users
  deliveryOption: null, // Selected delivery option (priority/standard)
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setGuestInfo: (state, action) => {
      state.guestInfo = action.payload;
    },
    clearGuestInfo: (state) => {
      state.guestInfo = null;
    },
    setCustomerEmail: (state, action) => {
      state.customerEmail = action.payload;
    },
    setDeliveryOption: (state, action) => {
      state.deliveryOption = action.payload;
    },
  },
});

export const { setGuestInfo, clearGuestInfo, setCustomerEmail, setDeliveryOption } = checkoutSlice.actions;
export default checkoutSlice.reducer;

