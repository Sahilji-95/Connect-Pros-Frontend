"use client";

import React, { useEffect } from "react";
import styles from "./ActivityNotificationPopup.module.css";

const notificationTitles = {
  post_like: "New like",
  post_comment: "New comment",
  new_post: "New post",
  connection_request: "Connection request",
  connection_accepted: "Connection accepted",
};

export default function ActivityNotificationPopup({
  notification,
  onClose,
  onView,
}) {
  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(onClose, 5000);

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const sender = notification.sender;

  return (
    <div className={styles.popupWrapper}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <div className={styles.senderInfo}>
            <img
              src={sender?.profilePicture || "/default-avatar.png"}
              alt={sender?.name || "User"}
              className={styles.avatar}
            />

            <div className={styles.content}>
              <h4 className={styles.title}>
                {notificationTitles[notification.type] || "Notification"}
              </h4>

              <p className={styles.message}>
                {notification.message || "You have a new notification."}
              </p>

              {sender?.name && (
                <span className={styles.senderName}>{sender.name}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close notification"
          >
            &times;
          </button>
        </div>

        <button type="button" className={styles.viewButton} onClick={onView}>
          View notifications
        </button>
      </div>
    </div>
  );
}
