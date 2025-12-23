// src/store/index.jsx
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import deliveryReducer from './slices/deliverySlice';
import cartReducer from './slices/cartSlice';
import checkoutReducer from './slices/checkoutSlice';
import authReducer from './slices/authSlice';

import { combineReducers } from 'redux';


// Persist configuration

const rootReducer = combineReducers({
  auth: authReducer,
  delivery: deliveryReducer,
  cart: cartReducer,
  checkout: checkoutReducer,
});

const persistConfig = {
  key: 'root', // Key for the persisted state
  storage, // Storage engine (localStorage)
  whitelist: ['cart'], // Only persist the 'cart' reducer
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'], // Ignore persist actions
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);