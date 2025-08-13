import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import tradingReducer from './slices/tradingSlice';
import authReducer from './slices/authSlice';
import errorReducer from './slices/errorSlice';

const tradingPersistConfig = {
  key: 'trading',
  storage,
  whitelist: ['positions', 'balance', 'strategies']
};

const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['token']
};

export const store = configureStore({
  reducer: {
    trading: persistReducer(tradingPersistConfig, tradingReducer),
    auth: persistReducer(authPersistConfig, authReducer),
    error: errorReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;