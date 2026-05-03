import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getSettings } from '@/lib/api';

export interface SettingsState {
  shopName: string;
  upiId: string;
  themeColor: string;
  ownerWhatsapp: string;
  logoUrl: string | null;
  loading: boolean;
}

const initialState: SettingsState = {
  shopName: "",
  upiId: "",
  themeColor: "#1e40af",
  ownerWhatsapp: "",
  logoUrl: null,
  loading: false,
};

export const fetchSettings = createAsyncThunk('settings/fetchSettings', async () => {
  const data = await getSettings();
  return data;
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettingsState(state, action: PayloadAction<Partial<SettingsState>>) {
      return { ...state, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSettings.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchSettings.fulfilled, (state, action) => {
      state.loading = false;
      state.shopName = action.payload.shopName || "";
      state.upiId = action.payload.upiId || "";
      state.themeColor = action.payload.themeColor || "#1e40af";
      state.ownerWhatsapp = action.payload.ownerWhatsapp || "";
      state.logoUrl = action.payload.logoUrl || null;
    });
    builder.addCase(fetchSettings.rejected, (state) => {
      state.loading = false;
    });
  }
});

export const { updateSettingsState } = settingsSlice.actions;
export default settingsSlice.reducer;
