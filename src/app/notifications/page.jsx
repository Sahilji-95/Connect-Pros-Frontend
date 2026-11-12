"use client";

import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import clientServer from "@/config";
import UserLayOut from "@/layout/UserLayout/Index";
import DashboardLayout from "@/layout/DashboardLayout/Index";

import {
  markNotificationRead,
  markAllNotificationsRead,
  setNotificationError,
} from "@/config/redux/reducer/NotiReducer/index.js";

import {
  Bell,
  BellOff,
  CheckCheck,
  FileText,
  Heart,
  LoaderCircle,
  MessageCircle,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";

// Only these 5 notification types are allowed.
const ALLOWED_NOTIFICATION_TYPES = [
  "post_like",
  "post_comment",
  "connection_request",
  "connection_accepted",
  "new_post",
];

const notificationLabels = {
  connection_request: "Connection request",
  connection_accepted: "Connection accepted",
  new_post: "New post",
  post_like: "Post liked",
  post_comment: "New comment",
};

// Icon + badge colour for each notification type.
const typeConfig = {
  connection_request: { Icon: UserPlus, badge: "bg-primary" },
  connection_accepted: { Icon: UserCheck, badge: "bg-primary" },
  new_post: { Icon: FileText, badge: "bg-accent" },
  post_like: { Icon: Heart, badge: "bg-danger" },
  post_comment: { Icon: MessageCircle, badge: "bg-primary" },
};

// Notification click par kahan jana hai.
const getPostLink = (notification, username) => {
  if (notification.relatedId) {
    return `/post/${notification.relatedId}`;
  }

  // relatedId na ho to sender ke profile par bhej do.
  return username ? `/view_profile/${username}` : null;
};

const getNotificationLink = (notification) => {
  const username = notification.sender?.username;

  switch (notification.type) {
    case "connection_request":
    case "connection_accepted":
      return "/connections";

    case "new_post":
    case "post_like":
    case "post_comment":
      return getPostLink(notification, username);

    default:
      return username ? `/view_profile/${username}` : null;
  }
};

const formatDate = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function TypeBadge({ type }) {
  const config = typeConfig[type] || typeConfig.new_post;
  const { Icon, badge } = config;

  return (
    <span
      aria-hidden="true"
      data-type={type}
      className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface text-white ${badge}`}
    >
      <Icon size={11} strokeWidth={2.4} />
    </span>
  );
}

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const notificationState = useSelector((state) => state.notification);

  const notifications = notificationState?.notifications ?? [];
  const unreadCount = notificationState?.unreadCount ?? 0;
  const loading = notificationState?.loading ?? false;
  const error = notificationState?.error ?? null;

  const [updatingId, setUpdatingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState("all");

  // Filter notifications by allowed types.
  const allowedNotifications = useMemo(() => {
    return notifications.filter((notification) =>
      ALLOWED_NOTIFICATION_TYPES.includes(notification.type),
    );
  }, [notifications]);

  // Apply All / Unread filter.
  const visibleNotifications = useMemo(() => {
    if (filter === "unread") {
      return allowedNotifications.filter(
        (notification) => !notification.isRead,
      );
    }

    return allowedNotifications;
  }, [allowedNotifications, filter]);

  const handleMarkRead = async (notification) => {
    if (notification.isRead || updatingId || markingAll) {
      return;
    }

    setUpdatingId(notification._id);

    try {
      await clientServer.patch(`/notification/${notification._id}/read`);

      dispatch(markNotificationRead(notification._id));
    } catch (err) {
      dispatch(
        setNotificationError(
          err.response?.data?.message || "Could not mark notification as read.",
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Row click: pehle navigate, read-mark background mein.
  const handleOpen = (notification) => {
    // Safety check: hidden notification types cannot be opened here.
    if (!ALLOWED_NOTIFICATION_TYPES.includes(notification.type)) {
      return;
    }

    const link = getNotificationLink(notification);

    if (!notification.isRead) {
      dispatch(markNotificationRead(notification._id));

      clientServer
        .patch(`/notification/${notification._id}/read`)
        .catch((err) => {
          dispatch(
            setNotificationError(
              err.response?.data?.message ||
                "Could not mark notification as read.",
            ),
          );
        });
    }

    if (link) {
      router.push(link);
    }
  };

  const handleRowKeyDown = (event, notification) => {
    if (event.target !== event.currentTarget) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen(notification);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll || updatingId) {
      return;
    }

    setMarkingAll(true);

    try {
      await clientServer.patch("/notification/read-all");

      dispatch(markAllNotificationsRead());
    } catch (err) {
      dispatch(
        setNotificationError(
          err.response?.data?.message ||
            "Could not mark all notifications as read.",
        ),
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const dismissError = () => {
    dispatch(setNotificationError(null));
  };

  const filterButtonClass = (active) =>
    `flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
      active
        ? "bg-primary-soft text-primary"
        : "text-muted hover:bg-app hover:text-text"
    }`;

  return (
    <UserLayOut>
      <DashboardLayout>
        <div className="min-w-0 text-text">
          {/* Header */}
          <section className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Bell size={20} />
              </div>

              <div>
                <p className="text-[10px] font-bold tracking-[1.5px] text-muted">
                  YOUR ACTIVITY
                </p>

                <h1 className="mt-0.5 text-xl font-bold tracking-tight text-text">
                  Notifications
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markingAll || Boolean(updatingId)}
              className="flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-border bg-surface px-4 text-xs font-semibold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
            >
              {markingAll ? (
                <LoaderCircle size={15} className="animate-spin" />
              ) : (
                <CheckCheck size={15} />
              )}

              {markingAll ? "Updating..." : "Mark all as read"}
            </button>
          </section>

          {/* Panel */}
          <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3 sm:px-5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className={filterButtonClass(filter === "all")}
                  onClick={() => setFilter("all")}
                  aria-pressed={filter === "all"}
                >
                  All
                </button>

                <button
                  type="button"
                  className={filterButtonClass(filter === "unread")}
                  onClick={() => setFilter("unread")}
                  aria-pressed={filter === "unread"}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white dark:text-[#12141A]">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <span className="text-[11px] text-muted">
                {allowedNotifications.length} loaded
              </span>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mx-3 mt-3 flex items-center justify-between gap-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[11px] text-danger sm:mx-5"
              >
                <span>{error}</span>

                <button
                  type="button"
                  onClick={dismissError}
                  aria-label="Dismiss error"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Content */}
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
                <LoaderCircle size={22} className="animate-spin text-primary" />
                <p className="text-xs text-muted">Loading notifications...</p>
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <BellOff size={26} strokeWidth={1.5} />
                </div>

                <h2 className="mt-4 text-base font-bold text-text">
                  {filter === "unread"
                    ? "You're all caught up!"
                    : "No notifications yet"}
                </h2>

                <p className="mt-1.5 max-w-xs text-xs leading-5 text-muted">
                  {filter === "unread"
                    ? "You have no unread notifications."
                    : "Connection requests, likes, comments and new posts will appear here."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {visibleNotifications.map((notification) => {
                  const sender =
                    notification.sender &&
                    typeof notification.sender === "object"
                      ? notification.sender
                      : null;

                  const senderName = sender?.name || "Connect Pros user";

                  const avatar = sender?.profilePicture;
                  const isUpdating = updatingId === notification._id;
                  const link = getNotificationLink(notification);

                  return (
                    <article
                      key={notification._id}
                      role="link"
                      tabIndex={0}
                      aria-label={`${senderName}: ${
                        notificationLabels[notification.type] || "Notification"
                      }`}
                      data-has-link={link ? "true" : "false"}
                      onClick={() => handleOpen(notification)}
                      onKeyDown={(event) =>
                        handleRowKeyDown(event, notification)
                      }
                      className={`relative flex cursor-pointer items-start gap-3.5 px-3 py-4 outline-none transition focus-visible:bg-app sm:px-5 ${
                        !notification.isRead
                          ? "bg-primary-soft/40 hover:bg-primary-soft/60"
                          : "hover:bg-app"
                      }`}
                    >
                      {/* Unread accent bar */}
                      {!notification.isRead && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 w-[3px] bg-primary"
                        />
                      )}

                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={senderName}
                            className="h-11 w-11 rounded-full border border-border object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-primary-soft text-sm font-bold text-primary"
                            aria-label={senderName}
                          >
                            {senderName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <TypeBadge type={notification.type} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-muted">
                            {notificationLabels[notification.type]}
                          </span>

                          {!notification.isRead && (
                            <span
                              title="Unread"
                              className="h-1.5 w-1.5 rounded-full bg-primary"
                            />
                          )}
                        </div>

                        <p className="mt-1 break-words text-[13px] leading-6 text-text">
                          <strong className="font-semibold">
                            {senderName}
                          </strong>
                          {notification.message
                            ? ` ${notification.message}`
                            : ""}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
                          {sender?.username && <span>@{sender.username}</span>}

                          {sender?.username && notification.createdAt && (
                            <span aria-hidden="true">·</span>
                          )}

                          <span>{formatDate(notification.createdAt)}</span>
                        </div>
                      </div>

                      {/* Mark read */}
                      {!notification.isRead && (
                        <button
                          type="button"
                          disabled={Boolean(updatingId) || markingAll}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleMarkRead(notification);
                          }}
                          className="shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-[11px] font-semibold text-muted transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isUpdating ? "Saving..." : "Mark read"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </DashboardLayout>
    </UserLayOut>
  );
}
