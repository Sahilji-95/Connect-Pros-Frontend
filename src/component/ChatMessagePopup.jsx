"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

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
            <h4 className="truncate text-sm font-semibold text-text">
              {sender?.name || "New message"}
            </h4>

            <p className="mt-0.5 line-clamp-2 break-words text-xs leading-5 text-muted">
              {messageText}
            </p>
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
          onClick={() => onOpenChat(conversationId)}
          className="mt-3 flex h-9 w-full items-center justify-center rounded-control bg-primary text-xs font-semibold text-white transition hover:bg-primary-hover dark:text-[#12141A]"
        >
          Open conversation
        </button>
      </div>
    </div>
  );
}
