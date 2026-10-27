import { createAsyncThunk } from "@reduxjs/toolkit";
import clientServer from "@/config";

// GET ALL CONVERSATIONS
export const getConversations = createAsyncThunk(
  "chat/getConversations",
  async (_, thunkAPI) => {
    try {
      const response = await clientServer.get("/chat/conversations");

      return response.data.conversations;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to fetch conversations",
        },
      );
    }
  },
);

// CREATE OR GET EXISTING CONVERSATION
export const createOrGetConversation = createAsyncThunk(
  "chat/createOrGetConversation",
  async ({ connectionId }, thunkAPI) => {
    try {
      const response = await clientServer.post("/chat/conversations", {
        connectionId,
      });

      return response.data.conversation;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to open conversation",
        },
      );
    }
  },
);

// GET MESSAGES WITH PAGINATION
export const getConversationMessages = createAsyncThunk(
  "chat/getConversationMessages",
  async ({ conversationId, limit = 30, before }, thunkAPI) => {
    try {
      const params = { limit };

      if (before) {
        params.before = before;
      }

      const response = await clientServer.get(
        `/chat/conversations/${conversationId}/messages`,
        { params },
      );

      return {
        conversationId,
        messages: response.data.messages,
        hasMore: response.data.hasMore,
        nextCursor: response.data.nextCursor,
        isOlderPage: Boolean(before),
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || {
          message: error.message || "Failed to fetch messages",
        },
      );
    }
  },
);
