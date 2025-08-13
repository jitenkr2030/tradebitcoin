import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { User } from '../../types/trading';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  sessionExpiry: number | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  sessionExpiry: null
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email,
      password
    });
    return response.data;
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState }) => {
    const { auth } = getState() as { auth: AuthState };
    const response = await axios.post('http://localhost:3000/api/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    return response.data;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.sessionExpiry = null;
    },
    updateUser: (state, action) => {
      state.user = action.payload;
    },
    setSessionExpiry: (state, action) => {
      state.sessionExpiry = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.sessionExpiry = Date.now() + 3600000; // 1 hour
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.sessionExpiry = Date.now() + 3600000;
      });
  }
});

export const { logout, updateUser, setSessionExpiry } = authSlice.actions;

export default authSlice.reducer;