"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";

import DashboardLayout from "@/layout/DashboardLayout/Index";
import UserLayOut from "@/layout/UserLayout/Index";
import styles from "./chat.module.css";

import {
  getConversations,
  getConversationMessages,
} from "@/config/redux/action/chatAction";

import {
  setActiveConversation,
  clearActiveConversation,
  addIncomingMessage,
} from "@/config/redux/reducer/chatReducer";

import { getAboutUser } from "@/config/redux/action/authAction";
import { getChatSocket } from "@/config/socket";

const getId = (value) => {
  if (!value) return null;

  if (typeof value === "object") {
    return String(value._id || value.id || "") || null;
  }

  return String(value);
};

const formatTime = (iso) => {
  if (!iso) return "";

  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatListTime = (iso) => {
  if (!iso) return "";

  const date = new Date(iso);
  const today = new Date();

  return date.toDateString() === today.toDateString()
    ? formatTime(iso)
    : date.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
      });
};

const formatLastSeen = (value) => {
  if (!value) return "Offline";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Offline";

  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Last seen just now";

  if (minutes < 60) {
    return `Last seen ${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `Last seen ${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `Last seen ${days}d ago`;
  }

  return `Last seen ${date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
  })}`;
};

const getOtherParticipant = (conversation, currentUserId) => {
  const participants = conversation?.participants || [];

  return (
    participants.find((participant) => getId(participant) !== currentUserId) ||
    null
  );
};

const getErrorMessage = (error) => {
  if (typeof error === "string") return error;

  return (
    error?.message || error?.error || "Something went wrong. Please try again."
  );
};

function ChatContent() {
  const dispatch = useDispatch();

  const searchParams = useSearchParams();
  const targetConversationId = searchParams.get("conversationId");

  const authUser = useSelector((state) => state.auth.user);
  const profileFetched = useSelector((state) => state.auth.profileFetched);

  const {
    conversations,
    activeConversationId,
    messagesByConversation,
    conversationsLoading,
    messagesLoading,
    olderMessagesLoading,
    hasMoreByConversation,
    nextCursorByConversation,
    onlineUserIds,
    lastSeenByUser,
    error,
  } = useSelector((state) => state.chat);

  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const activeConversationRef = useRef(null);
  const pendingReadRef = useRef(new Set());
  const sendingRef = useRef(false);
  const loadingOlderRef = useRef(false);

  const currentUserId = useMemo(() => {
    const user = authUser?.userId || authUser?.user || authUser;

    return getId(user);
  }, [authUser]);

  const activeId = activeConversationId;

  const messages = useMemo(() => {
    return activeId ? messagesByConversation[activeId] || [] : [];
  }, [activeId, messagesByConversation]);

  const normalizedConversations = useMemo(() => {
    if (!currentUserId) return [];

    return conversations
      .map((conversation) => {
        const otherUser = getOtherParticipant(conversation, currentUserId);

        if (!otherUser || typeof otherUser !== "object") {
          return null;
        }

        const otherUserId = getId(otherUser);

        return {
          ...conversation,

          user: {
            ...otherUser,
            lastSeen: lastSeenByUser[otherUserId] || otherUser.lastSeen || null,
          },

          lastMessage: conversation.lastMessage?.text || "",

          unread: conversation.unreadCount || 0,

          online: onlineUserIds.includes(otherUserId),
        };
      })
      .filter(Boolean);
  }, [conversations, currentUserId, onlineUserIds, lastSeenByUser]);

  const activeChat = normalizedConversations.find(
    (conversation) => conversation._id === activeId,
  );

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return normalizedConversations;

    return normalizedConversations.filter((conversation) => {
      const name = conversation.user?.name || "";
      const username = conversation.user?.username || "";

      return (
        name.toLowerCase().includes(query) ||
        username.toLowerCase().includes(query)
      );
    });
  }, [normalizedConversations, search]);

  // Fetch user profile
  useEffect(() => {
    if (!profileFetched || !currentUserId) {
      dispatch(getAboutUser());
    }
  }, [dispatch, profileFetched, currentUserId]);

  // Fetch conversations
  useEffect(() => {
    if (!currentUserId) return;

    dispatch(getConversations());
  }, [dispatch, currentUserId]);

  // Mark received messages as read
  const markMessagesRead = useCallback(
    (conversationId, conversationMessages) => {
      if (!conversationId || !currentUserId) return;

      const socket = getChatSocket();

      if (!socket.connected) return;

      const unreadIds = conversationMessages
        .filter(
          (message) =>
            getId(message.recipientId) === currentUserId && !message.readAt,
        )
        .map((message) => getId(message._id))
        .filter((id) => id && !pendingReadRef.current.has(id));

      if (unreadIds.length === 0) return;

      unreadIds.forEach((id) => pendingReadRef.current.add(id));

      socket.emit(
        "chat:read",
        {
          conversationId,
          messageIds: unreadIds,
        },
        (ack) => {
          unreadIds.forEach((id) => pendingReadRef.current.delete(id));

          if (ack?.success === false || ack?.ok === false) {
            console.error("Read receipt failed:", ack);
          }
        },
      );
    },
    [currentUserId],
  );

  // Socket connection, presence and real-time messages
  useEffect(() => {
    if (!currentUserId) return;

    const socket = getChatSocket();

    const emitActiveConversation = () => {
      const selectedId = activeConversationRef.current;

      if (
        socket.connected &&
        selectedId &&
        document.visibilityState === "visible"
      ) {
        socket.emit("chat:active", {
          conversationId: selectedId,
        });
      }
    };

    const handleConnect = () => {
      setSocketConnected(true);

      dispatch(getConversations());

      const selectedId = activeConversationRef.current;

      if (selectedId) {
        emitActiveConversation();

        dispatch(
          getConversationMessages({
            conversationId: selectedId,
          }),
        );
      }
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    const handleConnectError = (error) => {
      console.error("Chat socket connection error:", error.message);

      setSocketConnected(false);
    };

    // Incoming messages
    const handleIncomingMessage = (payload) => {
      const message = payload?.message || payload;

      const conversationId = getId(
        message?.conversationId || payload?.conversationId,
      );

      if (!conversationId || !message?._id) return;

      dispatch(
        addIncomingMessage({
          conversationId,
          message,
        }),
      );

      dispatch(getConversations());
    };

    // Read receipts
    const handleReadReceipt = (payload) => {
      const conversationId = getId(payload?.conversationId);

      if (conversationId && conversationId === activeConversationRef.current) {
        dispatch(
          getConversationMessages({
            conversationId,
          }),
        );
      }
    };

    // Browser tab visibility
    const handleVisibilityChange = () => {
      if (!socket.connected) return;

      if (document.visibilityState === "hidden") {
        socket.emit("chat:inactive");
      } else {
        emitActiveConversation();
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    socket.on("chat:message", handleIncomingMessage);

    socket.on("chat:read_receipt", handleReadReceipt);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.emit("chat:inactive");

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);

      socket.off("chat:message", handleIncomingMessage);

      socket.off("chat:read_receipt", handleReadReceipt);

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Do not disconnect the shared socket here.
    };
  }, [currentUserId, dispatch]);

  // Select conversation
  const handleSelectConversation = useCallback(
    async (conversationId) => {
      if (!conversationId) return;

      activeConversationRef.current = conversationId;

      const socket = getChatSocket();

      if (socket.connected && document.visibilityState === "visible") {
        socket.emit("chat:active", {
          conversationId,
        });
      }

      dispatch(setActiveConversation(conversationId));

      setSendError("");
      setText("");

      try {
        await dispatch(
          getConversationMessages({
            conversationId,
            limit: 30,
          }),
        ).unwrap();
      } catch (error) {
        console.error("Failed to load messages:", getErrorMessage(error));
      }
    },
    [dispatch],
  );

  // Open conversation from URL
  useEffect(() => {
    if (!targetConversationId || conversations.length === 0) {
      return;
    }

    const conversationExists = conversations.some(
      (conversation) => conversation._id === targetConversationId,
    );

    if (!conversationExists) return;

    if (activeConversationRef.current === targetConversationId) {
      return;
    }

    handleSelectConversation(targetConversationId);
  }, [targetConversationId, conversations, handleSelectConversation]);

  // Back button
  const handleBack = () => {
    const socket = getChatSocket();

    if (socket.connected) {
      socket.emit("chat:inactive");
    }

    activeConversationRef.current = null;

    dispatch(clearActiveConversation());

    setSendError("");
  };

  // Mark messages read when active conversation messages load
  useEffect(() => {
    if (!activeId || !socketConnected) return;

    if (document.visibilityState !== "visible") return;

    markMessagesRead(activeId, messages);
  }, [activeId, messages, socketConnected, markMessagesRead]);

  // Scroll to latest message
  useEffect(() => {
    if (!activeId || olderMessagesLoading) return;

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [activeId, messages.length, olderMessagesLoading]);

  // Load older messages
  const handleLoadOlderMessages = async () => {
    if (
      !activeId ||
      olderMessagesLoading ||
      loadingOlderRef.current ||
      !hasMoreByConversation[activeId]
    ) {
      return;
    }

    const before = nextCursorByConversation[activeId];

    if (!before) return;

    loadingOlderRef.current = true;

    const container = messagesContainerRef.current;

    const previousHeight = container?.scrollHeight || 0;
    const previousTop = container?.scrollTop || 0;

    try {
      await dispatch(
        getConversationMessages({
          conversationId: activeId,
          limit: 30,
          before,
        }),
      ).unwrap();

      requestAnimationFrame(() => {
        if (!container) return;

        const heightDifference = container.scrollHeight - previousHeight;

        container.scrollTop = previousTop + heightDifference;
      });
    } catch (error) {
      console.error("Failed to load older messages:", getErrorMessage(error));
    } finally {
      loadingOlderRef.current = false;
    }
  };

  // Send message
  const handleSend = () => {
    const clean = text.trim();

    if (!clean || !activeId || !socketConnected || sendingRef.current) {
      return;
    }

    const socket = getChatSocket();

    if (!socket.connected) {
      setSendError("Chat disconnected. Please reconnect.");
      return;
    }

    sendingRef.current = true;

    setSending(true);
    setSendError("");

    const clientMessageId = crypto.randomUUID();

    socket.timeout(10000).emit(
      "chat:send",
      {
        conversationId: activeId,
        clientMessageId,
        text: clean,
      },
      (error, ack) => {
        sendingRef.current = false;

        setSending(false);

        if (
          error ||
          ack?.success === false ||
          ack?.ok === false ||
          ack?.error
        ) {
          setSendError(
            ack?.message ||
              ack?.error ||
              "Message could not be sent. Please try again.",
          );

          return;
        }

        const sentMessage = ack?.message;

        if (sentMessage?._id) {
          dispatch(
            addIncomingMessage({
              conversationId: activeId,
              message: sentMessage,
            }),
          );
        }

        setText("");

        inputRef.current?.focus();
      },
    );
  };

  // Enter to send
  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <UserLayOut>
      <DashboardLayout>
        <div
          className={`${styles.chatWrapper} ${
            activeId ? styles.windowOpen : ""
          }`}
        >
          {/* Conversation list */}
          <aside className={styles.listPanel}>
            <div className={styles.listHeader}>
              <h2 className={styles.title}>Messages</h2>
            </div>

            <div className={styles.searchBox}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>

              <input
                type="text"
                placeholder="Search conversations"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className={styles.conversationList}>
              {conversationsLoading && normalizedConversations.length === 0 && (
                <p className={styles.emptyList}>Loading conversations...</p>
              )}

              {!conversationsLoading && filteredConversations.length === 0 && (
                <p className={styles.emptyList}>No conversations found</p>
              )}

              {filteredConversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`${styles.conversationItem} ${
                    conversation._id === activeId ? styles.activeItem : ""
                  }`}
                  onClick={() => handleSelectConversation(conversation._id)}
                >
                  <div className={styles.avatarWrap}>
                    <img
                      className={styles.avatar}
                      src={
                        conversation.user.profilePicture ||
                        "/default-avatar.png"
                      }
                      alt={conversation.user.name || "User"}
                    />

                    {conversation.online && (
                      <span className={styles.onlineDot} />
                    )}
                  </div>

                  <div className={styles.conversationInfo}>
                    <div className={styles.conversationTop}>
                      <p className={styles.conversationName}>
                        {conversation.user.name || "User"}
                      </p>

                      <span className={styles.conversationTime}>
                        {formatListTime(conversation.lastMessageAt)}
                      </span>
                    </div>

                    <div className={styles.conversationBottom}>
                      <div>
                        <p className={styles.lastMessage}>
                          {conversation.lastMessage || "Start a conversation"}
                        </p>

                        <p className={styles.headerStatus}>
                          {conversation.online
                            ? "Online"
                            : formatLastSeen(conversation.user.lastSeen)}
                        </p>
                      </div>

                      {conversation.unread > 0 && (
                        <span className={styles.unreadBadge}>
                          {conversation.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Chat window */}
          <section className={styles.windowPanel}>
            {!activeChat ? (
              <div className={styles.placeholder}>
                <div className={styles.placeholderIcon}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                    />
                  </svg>
                </div>

                <h3>Your messages</h3>
                <p>Select a conversation to start chatting</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <header className={styles.windowHeader}>
                  <button
                    className={styles.backButton}
                    onClick={handleBack}
                    aria-label="Back"
                  >
                    ←
                  </button>

                  <div className={styles.avatarWrap}>
                    <img
                      className={styles.avatar}
                      src={
                        activeChat.user.profilePicture || "/default-avatar.png"
                      }
                      alt={activeChat.user.name || "User"}
                    />

                    {activeChat.online && <span className={styles.onlineDot} />}
                  </div>

                  <div className={styles.headerInfo}>
                    <p className={styles.headerName}>
                      {activeChat.user.name || "User"}
                    </p>

                    <p className={styles.headerStatus}>
                      {!socketConnected
                        ? "Connecting..."
                        : activeChat.online
                          ? "Online"
                          : formatLastSeen(activeChat.user.lastSeen)}
                    </p>
                  </div>
                </header>

                {/* Messages */}
                <div className={styles.messages} ref={messagesContainerRef}>
                  {hasMoreByConversation[activeId] && (
                    <div className={styles.loadOlderWrapper}>
                      <button
                        type="button"
                        className={styles.loadOlderButton}
                        onClick={handleLoadOlderMessages}
                        disabled={olderMessagesLoading}
                      >
                        {olderMessagesLoading ? (
                          <>
                            <span className={styles.loadingSpinner} />
                            Loading messages...
                          </>
                        ) : (
                          "↑ Load older messages"
                        )}
                      </button>
                    </div>
                  )}

                  {messagesLoading && messages.length === 0 && (
                    <p className={styles.noMessages}>Loading messages...</p>
                  )}

                  {!messagesLoading && messages.length === 0 && (
                    <p className={styles.noMessages}>
                      No messages yet. Say hi 👋
                    </p>
                  )}

                  {messages.map((message) => {
                    const mine = getId(message.senderId) === currentUserId;

                    return (
                      <div
                        key={message._id}
                        className={`${styles.messageRow} ${
                          mine ? styles.mine : styles.theirs
                        }`}
                      >
                        <div className={styles.bubble}>
                          <p className={styles.messageText}>{message.text}</p>

                          <span className={styles.messageTime}>
                            {formatTime(message.createdAt)}
                            {mine && message.readAt ? " · Read" : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={bottomRef} />
                </div>

                {/* Message composer */}
                <footer className={styles.composer}>
                  <textarea
                    ref={inputRef}
                    rows={1}
                    placeholder={
                      socketConnected
                        ? "Type a message..."
                        : "Connecting to chat..."
                    }
                    value={text}
                    maxLength={5000}
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!socketConnected || sending}
                  />

                  <button
                    className={styles.sendButton}
                    onClick={handleSend}
                    disabled={!text.trim() || !socketConnected || sending}
                    aria-label="Send"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                      />
                    </svg>
                  </button>
                </footer>

                {sendError && (
                  <p
                    role="alert"
                    style={{
                      color: "#f87171",
                      fontSize: 12,
                      padding: "4px 16px",
                    }}
                  >
                    {sendError}
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      </DashboardLayout>
    </UserLayOut>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}
