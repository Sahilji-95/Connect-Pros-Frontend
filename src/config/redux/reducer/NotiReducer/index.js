import { createSlice } from "@reduxjs/toolkit";

const ALLOWED_NOTIFICATION_TYPES = [
  "post_like",
  "post_comment",
  "connection_request",
  "connection_accepted",
  "new_post",
];

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,

  reducers: {
    setNotifications: (state, action) => {
      const incomingNotifications = action.payload?.notifications || [];

      state.notifications = incomingNotifications
        .filter((notification) =>
          ALLOWED_NOTIFICATION_TYPES.includes(notification.type),
        )
        .slice(0, 50);

      // API ka unreadCount authoritative rahega.
      state.unreadCount = action.payload?.unreadCount || 0;

      state.loading = false;
      state.error = null;
    },

    addNotification: (state, action) => {
      const notification = action.payload;

      // Ignore unsupported notification types.
      if (
        !notification ||
        !ALLOWED_NOTIFICATION_TYPES.includes(notification.type)
      ) {
        return;
      }

      const exists = state.notifications.some(
        (item) => item._id === notification._id,
      );

      if (exists) return;

      state.notifications.unshift(notification);

      if (!notification.isRead) {
        state.unreadCount += 1;
      }

      state.notifications = state.notifications.slice(0, 50);
    },

    markNotificationRead: (state, action) => {
      const notification = state.notifications.find(
        (item) => item._id === action.payload,
      );

      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    markAllNotificationsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.isRead = true;
      });

      state.unreadCount = 0;
    },

    setNotificationLoading: (state, action) => {
      state.loading = action.payload;
    },

    setNotificationError: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  setNotificationLoading,
  setNotificationError,
} = notificationSlice.actions;

export default notificationSlice.reducer;
