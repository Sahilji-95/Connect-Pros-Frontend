"use client";

import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import clientServer from "@/config";
import styles from "./notification.module.css";
import UserLayOut from "@/layout/UserLayout/Index";
import DashboardLayout from "@/layout/DashboardLayout/Index";

import {
  markNotificationRead,
  markAllNotificationsRead,
  setNotificationError,
} from "@/config/redux/reducer/NotiReducer/index.js";

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

// Small icon (12px) shown on the avatar corner for each type.
const typeIconPaths = {
  connection_request:
    "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z",

  connection_accepted: "m4.5 12.75 6 6 9-13.5",

  new_post: "M12 4.5v15m7.5-7.5h-15",

  post_like:
    "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z",

  post_comment:
    "M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z",
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

function TypeIcon({ type }) {
  const path = typeIconPaths[type] || typeIconPaths.new_post;

  return (
    <span className={styles.typeIcon} data-type={type} aria-hidden="true">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={path} />
      </svg>
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

  return (
    <UserLayOut>
      <DashboardLayout>
        <main className={styles.page}>
          <section className={styles.header}>
            <div>
              <h1 className={styles.title}>Notifications</h1>

              <p className={styles.subtitle}>
                Stay updated with your Connect Pros activity.
              </p>
            </div>

            <button
              type="button"
              className={styles.markAllButton}
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markingAll || Boolean(updatingId)}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m4.5 12.75 6 6 9-13.5" />
              </svg>

              {markingAll ? "Updating..." : "Mark all as read"}
            </button>
          </section>

          <section className={styles.panel}>
            <div className={styles.toolbar}>
              <div className={styles.filters}>
                <button
                  type="button"
                  className={`${styles.filterButton} ${
                    filter === "all" ? styles.activeFilter : ""
                  }`}
                  onClick={() => setFilter("all")}
                  aria-pressed={filter === "all"}
                >
                  All
                </button>

                <button
                  type="button"
                  className={`${styles.filterButton} ${
                    filter === "unread" ? styles.activeFilter : ""
                  }`}
                  onClick={() => setFilter("unread")}
                  aria-pressed={filter === "unread"}
                >
                  Unread
                  {unreadCount > 0 && (
                    <span className={styles.countBadge}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <span className={styles.totalText}>
                {allowedNotifications.length} loaded
              </span>
            </div>

            {error && (
              <div role="alert" className={styles.error}>
                <span>{error}</span>

                <button
                  type="button"
                  onClick={dismissError}
                  className={styles.dismissButton}
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            )}

            {loading && notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>Loading notifications...</p>
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.967 8.967 0 0 1-2.311 6.022 23.848 23.848 0 0 0 5.454 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                    />
                  </svg>
                </div>

                <h2 className={styles.emptyTitle}>
                  {filter === "unread"
                    ? "You're all caught up!"
                    : "No notifications yet"}
                </h2>

                <p className={styles.emptyText}>
                  {filter === "unread"
                    ? "You have no unread notifications."
                    : "Connection requests, likes, comments and new posts will appear here."}
                </p>
              </div>
            ) : (
              <div>
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
                      className={`${styles.notification} ${
                        !notification.isRead ? styles.unreadNotification : ""
                      } ${styles.clickable}`}
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
                    >
                      <div className={styles.avatarWrapper}>
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={senderName}
                            className={styles.avatar}
                          />
                        ) : (
                          <div
                            className={styles.avatarFallback}
                            aria-label={senderName}
                          >
                            {senderName.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <TypeIcon type={notification.type} />
                      </div>

                      <div className={styles.notificationContent}>
                        <div className={styles.notificationTop}>
                          <span className={styles.typeLabel}>
                            {notificationLabels[notification.type]}
                          </span>

                          {!notification.isRead && (
                            <span title="Unread" className={styles.unreadDot} />
                          )}
                        </div>

                        <p className={styles.message}>
                          <strong>{senderName}</strong>
                          {notification.message
                            ? ` ${notification.message}`
                            : ""}
                        </p>

                        {sender?.username && (
                          <p className={styles.username}>@{sender.username}</p>
                        )}

                        <p className={styles.date}>
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>

                      {!notification.isRead && (
                        <button
                          type="button"
                          className={styles.markReadButton}
                          disabled={Boolean(updatingId) || markingAll}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleMarkRead(notification);
                          }}
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
        </main>
      </DashboardLayout>
    </UserLayOut>
  );
}
