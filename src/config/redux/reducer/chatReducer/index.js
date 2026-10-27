import { createSlice } from "@reduxjs/toolkit";
import {
  getConversations,
  createOrGetConversation,
  getConversationMessages,
} from "../../action/chatAction";

const initialState = {
  conversations: [],
  activeConversationId: null,

  messagesByConversation: {},

  conversationsLoading: false,
  messagesLoading: false,
  olderMessagesLoading: false,

  hasMoreByConversation: {},
  nextCursorByConversation: {},

  error: null,
};

const sortMessagesOldestFirst = (messages) => {
  return [...messages].sort((a, b) => {
    const timeDifference =
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    if (timeDifference !== 0) {
      return timeDifference;
    }

    return String(a._id).localeCompare(String(b._id));
  });
};

const mergeMessages = (existing = [], incoming = []) => {
  const messagesMap = new Map();

  [...existing, ...incoming].forEach((message) => {
    messagesMap.set(message._id, message);
  });

  return sortMessagesOldestFirst([...messagesMap.values()]);
};

const chatSlice = createSlice({
  name: "chat",
  initialState,

  reducers: {
    setActiveConversation(state, action) {
      state.activeConversationId = action.payload;
      state.error = null;
    },

    clearActiveConversation(state) {
      state.activeConversationId = null;
    },

    // Used when a new Socket.IO message arrives.
    addIncomingMessage(state, action) {
      const { conversationId, message } = action.payload;

      if (!conversationId || !message?._id) return;

      const existing = state.messagesByConversation[conversationId] || [];

      state.messagesByConversation[conversationId] = mergeMessages(existing, [
        message,
      ]);

      const conversation = state.conversations.find(
        (item) => item._id === conversationId,
      );

      if (conversation) {
        conversation.lastMessage = message;
        conversation.lastMessageAt = message.createdAt;
      }

      state.conversations.sort(
        (a, b) =>
          new Date(b.lastMessageAt || b.updatedAt || 0).getTime() -
          new Date(a.lastMessageAt || a.updatedAt || 0).getTime(),
      );
    },

    // Use when a conversation list needs to be reset.
    clearChatError(state) {
      state.error = null;
    },

    // Call after logout if you want to clear chat data.
    resetChatState() {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    builder

      // GET CONVERSATIONS
      .addCase(getConversations.pending, (state) => {
        state.conversationsLoading = true;
        state.error = null;
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.conversationsLoading = false;
        state.conversations = action.payload;
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.conversationsLoading = false;
        state.error =
          action.payload?.message || "Failed to fetch conversations";
      })

      // CREATE OR GET CONVERSATION
      .addCase(createOrGetConversation.pending, (state) => {
        state.error = null;
      })
      .addCase(createOrGetConversation.fulfilled, (state, action) => {
        const conversation = action.payload;

        const existingIndex = state.conversations.findIndex(
          (item) => item._id === conversation._id,
        );

        if (existingIndex !== -1) {
          state.conversations[existingIndex] = {
            ...state.conversations[existingIndex],
            ...conversation,
          };
        } else {
          state.conversations.unshift(conversation);
        }

        state.activeConversationId = conversation._id;

        if (!state.messagesByConversation[conversation._id]) {
          state.messagesByConversation[conversation._id] = [];
        }

        state.conversations.sort(
          (a, b) =>
            new Date(b.lastMessageAt || b.updatedAt || 0).getTime() -
            new Date(a.lastMessageAt || a.updatedAt || 0).getTime(),
        );
      })
      .addCase(createOrGetConversation.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to open conversation";
      })

      // GET MESSAGES / OLDER MESSAGES
      .addCase(getConversationMessages.pending, (state, action) => {
        const { before } = action.meta.arg;

        if (before) {
          state.olderMessagesLoading = true;
        } else {
          state.messagesLoading = true;
        }

        state.error = null;
      })
      .addCase(getConversationMessages.fulfilled, (state, action) => {
        const { conversationId, messages, hasMore, nextCursor, isOlderPage } =
          action.payload;

        state.messagesLoading = false;
        state.olderMessagesLoading = false;

        const existing = state.messagesByConversation[conversationId] || [];

        // Deduplicate and maintain oldest-first ordering.
        state.messagesByConversation[conversationId] = mergeMessages(
          existing,
          messages,
        );

        state.hasMoreByConversation[conversationId] = hasMore;
        state.nextCursorByConversation[conversationId] = nextCursor;

        // isOlderPage is returned for UI/debugging if needed.
        void isOlderPage;
      })
      .addCase(getConversationMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.olderMessagesLoading = false;

        state.error = action.payload?.message || "Failed to fetch messages";
      });
  },
});

export const {
  setActiveConversation,
  clearActiveConversation,
  addIncomingMessage,
  clearChatError,
  resetChatState,
} = chatSlice.actions;

export default chatSlice.reducer;
