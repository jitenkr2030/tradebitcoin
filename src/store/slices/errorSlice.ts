import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ErrorState {
  errors: {
    id: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    timestamp: number;
  }[];
}

const initialState: ErrorState = {
  errors: []
};

const errorSlice = createSlice({
  name: 'error',
  initialState,
  reducers: {
    addError: (state, action: PayloadAction<{ message: string; type: 'error' | 'warning' | 'info' }>) => {
      state.errors.push({
        id: Date.now().toString(),
        message: action.payload.message,
        type: action.payload.type,
        timestamp: Date.now()
      });
    },
    removeError: (state, action: PayloadAction<string>) => {
      state.errors = state.errors.filter(error => error.id !== action.payload);
    },
    clearErrors: (state) => {
      state.errors = [];
    }
  }
});

export const { addError, removeError, clearErrors } = errorSlice.actions;

export default errorSlice.reducer;