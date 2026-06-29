// ============================================================
// APPLICATION STATE
// ============================================================
export const state = {
  isOpen: false,
  isProcessing: false,
  attachedFile: null,
  conversationHistory: []  // will be initialised with system prompt later
};

// Optional: update function to ensure immutability (if needed)
export function updateState(newState) {
  Object.assign(state, newState);
}

// For convenience, we can initialise history with system prompt from CONFIG
// but that requires importing CONFIG, which we avoid here to keep state pure.
// We'll set it in the main module or API module.