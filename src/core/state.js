export const state = {
  isOpen: false,
  isProcessing: false,
  attachedFile: null,
  conversationHistory: [],
  abortController: null,
  lastUserMessage: null,
  lastBotMessageEl: null,
  lastErrorMessageEl: null
};

export function updateState(newState) {
  Object.assign(state, newState);
}