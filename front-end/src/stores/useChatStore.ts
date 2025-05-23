import { create } from "zustand";

interface ChatStoreProps {
  id: string | null;
  conversationId: string | null;
  fetchData: boolean
  hasFetchedMessageHistoryList: boolean
  setId: (newId: string | null) => void;
  setConversationId: (newId: string | null) => void;
  setFetchData: (option: boolean) => void;
  setHasFetchedMessageHistoryList: (option: boolean) => void;
  resetConversationId: () => void
  resetId: () => void
  resetFetchData: () => void
  resetAllChatData: () => void
}

export const useChatStore = create<ChatStoreProps>((set) => ({
  id: null,
  conversationId: null,
  fetchData: false,
  hasFetchedMessageHistoryList: false,
  setId: (newId) => set({ id: newId }),
  setConversationId: (newId) => set({ conversationId: newId }),
  setFetchData: (option) => set({ fetchData: option }),
  setHasFetchedMessageHistoryList: (option) => set({ hasFetchedMessageHistoryList: option }),
  resetConversationId: () => set({ conversationId: null }),
  resetId: () => set({ id: null }),
  resetFetchData: () => set({ fetchData: false }),
  resetAllChatData: () => set({
    id: null,
    conversationId: null,
    fetchData: false,
    hasFetchedMessageHistoryList: false
  })
}));
