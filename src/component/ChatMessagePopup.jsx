"use client";

import React, { useEffect } from "react";
import styles from "./ChatMessagePopup.module.css";

export default function ChatMessagePopup({ popup, onClose, onOpenChat }) {
  useEffect(() => {
    if (!popup) return;

    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [popup, onClose]);

  if (!popup) return null;

  const { sender, message, conversationId } = popup;

  const messageText =
    typeof message === "string"
      ? message
      : message?.text || message?.content || "Sent you a message";

  return (
    <div className={styles.popupWrapper}>
      <div className={styles.popup}>
        <div className={styles.popupHeader}>
          <div className={styles.senderInfo}>
            <img
              src={sender?.profilePicture || "/default-avatar.png"}
              alt={sender?.name || "User"}
              className={styles.avatar}
            />

            <div className={styles.messageInfo}>
              <h4 className={styles.senderName}>
                {sender?.name || "New message"}
              </h4>

              <p className={styles.messagePreview}>{messageText}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close notification"
          >
            &times;
          </button>
        </div>

        <button
          className={styles.openChatButton}
          onClick={() => onOpenChat(conversationId)}
        >
          Open conversation
        </button>
      </div>
    </div>
  );
}
