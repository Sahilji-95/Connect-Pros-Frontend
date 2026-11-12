"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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

const navigation = [
  {
    label: "Home",
    href: "/dashboard",
    icon: "home",
  },
  {
    label: "Discover",
    href: "/search",
    icon: "search",
  },
  {
    label: "Connections",
    href: "/connections",
    icon: "users",
  },
  {
    label: "Messages",
    href: "/chat",
    icon: "message",
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: "bell",
  },
];

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    home: (
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    message: (
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-4-.98L3 21l1.98-5.5A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 1 1 21 11.5Z" />
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    arrow: <path d="M7 17 17 7M7 7h10v10" />,
    usersGroup: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20a6 6 0 0 1 12 0M15 16a5 5 0 0 1 6 4" />
      </>
    ),
  };

  return <svg {...common}>{icons[name]}</svg>;
}

export default function DashboardLayout({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const authState = useSelector((state) => state.auth);
  const notificationState = useSelector((state) => state.notification);

  const notificationCount = notificationState?.unreadCount ?? 0;

  const [chatPopup, setChatPopup] = useState(null);
  const [activityPopup, setActivityPopup] = useState(null);

  const isAuthenticated = Boolean(authState?.profileFetched);
  const isChat = pathname?.startsWith("/chat");

  const formatCount = (count) => (count > 99 ? "99+" : count);

  const isActive = (href) =>
    href === "/dashboard" ? pathname === href : pathname?.startsWith(href);

  // Load notifications
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

  // Auto-close chat popup
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

  // Socket and presence listeners
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

      // Shared socket intentionally remains connected.
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

  const SidebarLink = ({ item, mobile = false }) => {
    const active = isActive(item.href);

    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={
          mobile
            ? `relative flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 text-[10px] font-semibold transition-colors ${
                active ? "bg-primary-soft text-primary" : "text-muted"
              }`
            : `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:bg-surface-muted hover:text-text"
              }`
        }
      >
        <span className="relative">
          <Icon name={item.icon} size={mobile ? 21 : 20} />

          {mobile &&
            item.label === "Notifications" &&
            notificationCount > 0 && (
              <span className="absolute -right-2 -top-2 h-2 w-2 rounded-full bg-accent" />
            )}
        </span>

        <span>{item.label}</span>

        {!mobile && item.label === "Notifications" && notificationCount > 0 && (
          <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white dark:text-[#12141A]">
            {formatCount(notificationCount)}
          </span>
        )}

        {!mobile && active && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
        )}
      </Link>
    );
  };

  return (
    <>
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

      <div
        className={
          isChat
            ? "h-[calc(100dvh-140px)] overflow-hidden bg-app text-text lg:h-[calc(100dvh-76px)]"
            : "min-h-[calc(100vh-76px)] bg-app text-text"
        }
      >
        <div
          className={`mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:px-8 ${
            isChat
              ? "h-full min-h-0 overflow-hidden lg:grid-cols-[220px_minmax(0,1fr)]"
              : "lg:grid-cols-[220px_minmax(0,1fr)_270px]"
          }`}
        >
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            {/*
              FIX: On the chat page the grid has overflow-hidden, which makes it
              the sticky scroll container. `sticky top-[100px]` then pushed the
              menu ~76px down. Sticky is only needed on scrolling pages, so on
              chat the sidebar stays in normal flow (same spot as other pages).
            */}
            <div className={isChat ? "" : "sticky top-[100px]"}>
              <nav
                className="flex flex-col gap-1"
                aria-label="Dashboard navigation"
              >
                {navigation.map((item) => (
                  <SidebarLink key={item.href} item={item} />
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main
            className={
              isChat
                ? "h-full min-h-0 min-w-0 overflow-hidden pb-0"
                : "min-w-0 pb-24 lg:pb-8"
            }
          >
            {children}
          </main>

          {/* Right profile panel */}
          {!isChat && (
            <aside className="hidden lg:block">
              <div className="sticky top-[100px] rounded-card border border-border bg-surface p-5">
                <div className="mb-5">
                  <h2 className="mt-2 font-serif text-xl font-bold text-text">
                    People to know.
                  </h2>
                </div>

                <div className="flex flex-col">
                  {authState.all_profiles_fetched &&
                    authState.all_profiles?.map((profile) => {
                      const profileUser = profile.userId;

                      if (!profileUser) return null;

                      return (
                        <button
                          type="button"
                          key={profile._id}
                          onClick={() =>
                            router.push(`/view_profile/${profileUser.username}`)
                          }
                          className="group flex w-full items-center gap-3 border-t border-border py-3 text-left transition-colors first:border-t-0 hover:bg-surface-muted"
                        >
                          <img
                            src={
                              profileUser.profilePicture ||
                              "/default-avatar.png"
                            }
                            alt={profileUser.name || "Profile"}
                            className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
                          />

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-text">
                              {profileUser.name || "Unknown User"}
                            </span>

                            <span className="mt-0.5 block truncate text-xs text-muted">
                              @{profileUser.username || "username"}
                            </span>
                          </span>

                          <span className="text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary">
                            <Icon name="arrow" size={16} />
                          </span>
                        </button>
                      );
                    })}

                  {!authState.all_profiles?.length &&
                    authState.all_profiles_fetched && (
                      <p className="py-5 text-center text-xs text-muted">
                        No profiles available right now.
                      </p>
                    )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Mobile dashboard navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl lg:hidden"
      >
        {navigation.map((item) => (
          <SidebarLink key={item.href} item={item} mobile />
        ))}
      </nav>
    </>
  );
}
