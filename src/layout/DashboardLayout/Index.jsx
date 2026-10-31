"use client";

import React, { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";

import clientServer from "@/config";
import { getChatSocket } from "@/config/socket";

import ChatMessagePopup from "@/component/ChatMessagePopup";
import ActivityNotificationPopup from "@/component/ActivityNotificationPopup";

import {
  setNotifications,
  addNotification,
  setNotificationLoading,
  setNotificationError,
} from "@/config/redux/reducer/NotiReducer";

import {
  setOnlineUsers,
  updateUserPresence,
} from "@/config/redux/reducer/chatReducer";

const ALLOWED_NOTIFICATION_TYPES = [
  "post_like",
  "post_comment",
  "connection_request",
  "connection_accepted",
  "new_post",
];

export default function DashboardLayout({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const authState = useSelector((state) => state.auth);
  const notificationState = useSelector((state) => state.notification);

  const notificationCount = notificationState?.unreadCount ?? 0;

  const [chatPopup, setChatPopup] = useState(null);
  const [activityPopup, setActivityPopup] = useState(null);

  const isNotifications = pathname?.startsWith("/notifications");
  const isAuthenticated = Boolean(authState?.profileFetched);

  const formatCount = (count) => (count > 99 ? "99+" : count);

  const isChat = pathname?.startsWith("/chat");
  const isHome = pathname === "/dashboard";
  const isSearch = pathname?.startsWith("/search");
  const isConnections = pathname?.startsWith("/connections");

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const loadNotifications = async () => {
      dispatch(setNotificationLoading(true));

      try {
        const response = await clientServer.get("/notification");

        if (cancelled) return;

        const data = response.data;

        dispatch(
          setNotifications({
            notifications: data.notifications ?? [],
            unreadCount: data.unreadCount ?? 0,
          }),
        );
      } catch (error) {
        if (cancelled) return;

        dispatch(
          setNotificationError(
            error.response?.data?.message || "Failed to load notifications",
          ),
        );
      }
    };

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!chatPopup) return;

    const timer = setTimeout(() => {
      setChatPopup(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [chatPopup]);

  const closeActivityPopup = () => {
    setActivityPopup(null);
  };

  const viewActivityNotifications = () => {
    setActivityPopup(null);
    router.push("/notifications");
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getChatSocket();

    const handleNewNotification = (notification) => {
      if (!notification?._id) return;

      if (!ALLOWED_NOTIFICATION_TYPES.includes(notification.type)) {
        return;
      }
      dispatch(addNotification(notification));
      setActivityPopup(notification);
    };
    const handleConnect = () => {
      socket.emit("presence:get");
    };
    const handlePresenceInitial = ({ onlineUserIds = [] } = {}) => {
      dispatch(setOnlineUsers(onlineUserIds));
    };
    const handlePresenceUpdate = (data) => {
      if (!data?.userId) return;

      dispatch(updateUserPresence(data));
    };
    const handleChatPopup = (data) => {
      if (!data?.conversationId || !data?.message || !data?.sender) {
        return;
      }

      setChatPopup({
        conversationId: data.conversationId,
        sender: data.sender,
        message: data.message,
      });
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("connect", handleConnect);
    socket.on("presence:initial", handlePresenceInitial);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("chat:popup", handleChatPopup);
    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("connect", handleConnect);
      socket.off("presence:initial", handlePresenceInitial);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("chat:popup", handleChatPopup);
    };
  }, [isAuthenticated, dispatch]);

  const openChatPopup = () => {
    if (!chatPopup?.conversationId) return;

    const conversationId = chatPopup.conversationId;

    setChatPopup(null);

    router.push(`/chat?conversationId=${encodeURIComponent(conversationId)}`);
  };

  const closeChatPopup = () => {
    setChatPopup(null);
  };

  return (
    <div>
      <ChatMessagePopup
        popup={chatPopup}
        onClose={closeChatPopup}
        onOpenChat={openChatPopup}
      />

      <ActivityNotificationPopup
        notification={activityPopup}
        onClose={closeActivityPopup}
        onView={viewActivityNotifications}
      />

      <div className={styles.container}>
        <div
          className={`${styles.homeContainer} ${isChat ? styles.chatMode : ""}`}
        >
          <div className={styles.left}>
            <div
              className={`${styles.sideBarOption} ${
                isHome ? styles.active : ""
              }`}
              onClick={() => router.push("/dashboard")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>

              <p>Home</p>
            </div>

            <div
              className={`${styles.sideBarOption} ${
                isSearch ? styles.active : ""
              }`}
              onClick={() => router.push("/search")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>

              <p>Discover</p>
            </div>

            <div
              className={`${styles.sideBarOption} ${
                isConnections ? styles.active : ""
              }`}
              onClick={() => router.push("/connections")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>

              <p>Connections</p>
            </div>

            <div
              className={`${styles.sideBarOption} ${
                isChat ? styles.active : ""
              }`}
              onClick={() => router.push("/chat")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                />
              </svg>

              <p>Messages</p>
            </div>

            <div
              className={`${styles.sideBarOption} ${
                isNotifications ? styles.active : ""
              }`}
              onClick={() => router.push("/notifications")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>

              <p>Notifications</p>

              {notificationCount > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    minWidth: "22px",
                    height: "22px",
                    padding: "0 6px",
                    borderRadius: "999px",
                    background: "#6366f1",
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {formatCount(notificationCount)}
                </span>
              )}
            </div>
          </div>

          <div className={styles.feed}>{children}</div>

          {!isChat && (
            <div className={styles.right}>
              <h1 className={styles.rightTitle}>Top Profiles</h1>

              <div className={styles.profileList}>
                {authState.all_profiles_fetched &&
                  authState.all_profiles?.map((profile) => (
                    <div
                      className={styles.profileCard}
                      key={profile._id}
                      onClick={() =>
                        router.push(`/view_profile/${profile.userId.username}`)
                      }
                    >
                      <img
                        className={styles.profileImage}
                        src={
                          profile.userId?.profilePicture
                            ? profile.userId.profilePicture
                            : "/default-avatar.png"
                        }
                        alt={profile.userId?.name || "Profile"}
                      />

                      <div className={styles.profileInfo}>
                        <p className={styles.profileName}>
                          {profile.userId?.name || "Unknown User"}
                        </p>

                        <p className={styles.profileUsername}>
                          @{profile.userId?.username || "username"}
                        </p>
                      </div>

                      <span className={styles.profileArrow}>↗</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
