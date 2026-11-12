"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

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
    <div className="pointer-events-none fixed inset-x-4 top-[88px] z-50 flex justify-end sm:inset-x-6">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto w-full max-w-[360px] rounded-card border border-border bg-surface-elevated p-4 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <img
            src={sender?.profilePicture || "/default-avatar.png"}
            alt={sender?.name || "User"}
            className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
          />

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-text">
              {notificationTitles[notification.type] || "Notification"}
            </h4>

            <p className="mt-0.5 line-clamp-2 break-words text-xs leading-5 text-muted">
              {notification.message || "You have a new notification."}
            </p>

            {sender?.name && (
              <span className="mt-1 block truncate text-xs font-medium text-text">
                {sender.name}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-text"
          >
            <X size={15} />
          </button>
        </div>

        <button
          type="button"
          onClick={onView}
          className="mt-3 flex h-9 w-full items-center justify-center rounded-control border border-border bg-surface text-xs font-semibold text-text transition hover:border-primary/40 hover:text-primary"
        >
          View notifications
        </button>
      </div>
    </div>
  );
}
