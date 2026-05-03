import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  matchedItemId: string | null;
  matchedItemName: string | null;
  confidence: number;
}

interface BillingState {
  aiExtractedItems: ExtractedItem[];
}

const initialState: BillingState = {
  aiExtractedItems: [],
};

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setAiExtractedItems(state, action: PayloadAction<ExtractedItem[]>) {
      state.aiExtractedItems = action.payload;
    },
    clearAiExtractedItems(state) {
      state.aiExtractedItems = [];
    },
  },
});

export const { setAiExtractedItems, clearAiExtractedItems } = billingSlice.actions;

export default billingSlice.reducer;
