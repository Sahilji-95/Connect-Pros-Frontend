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

import {
  Search,
  MessageCircle,
  Send,
  ArrowLeft,
  CheckCheck,
  Check,
  Clock3,
  LoaderCircle,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

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
  if (minutes < 60) return `Last seen ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `Last seen ${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `Last seen ${days}d ago`;

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

  // Fetch profile
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

  // Mark messages as read
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

  // Socket connection, presence and messages
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

      // Shared socket lifecycle remains managed by the parent.
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

  // Mark active messages as read
  useEffect(() => {
    if (!activeId || !socketConnected) return;
    if (document.visibilityState !== "visible") return;

    markMessagesRead(activeId, messages);
  }, [activeId, messages, socketConnected, markMessagesRead]);

  // Scroll to latest message
  useEffect(() => {
    if (!activeId || olderMessagesLoading) return;

    const container = messagesContainerRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
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

  const renderAvatar = (user, size = "h-11 w-11") => (
    <div
      className={`relative ${size} shrink-0 overflow-hidden rounded-full border border-border bg-primary-soft`}
    >
      {user?.profilePicture ? (
        <img
          src={user.profilePicture}
          alt={user.name || "User"}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary">
          {(user?.name || "U").charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );

  return (
    <UserLayOut>
      <DashboardLayout>
        {/*
          FIX: DashboardLayout already renders the <main> (with the correct
          height for /chat). The old nested <main> with min-h-screen, padding
          and a hard-coded section height fought with it and shifted the
          layout. Now the chat simply fills the space DashboardLayout gives it.
        */}
        <div className="h-full min-h-0 min-w-0 bg-app text-text">
          <section className="flex h-full min-h-0 w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            {/* Conversation list */}
            <aside
              className={`${
                activeId ? "hidden md:flex" : "flex"
              } w-full shrink-0 flex-col border-r border-border md:w-[290px] lg:w-[340px]`}
            >
              {/* Sidebar heading */}
              <div className="border-b border-border px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold tracking-[1.5px] text-muted">
                      YOUR INBOX
                    </p>
                    <h1 className="mt-1 text-xl font-bold tracking-tight text-text">
                      Messages
                    </h1>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <MessageCircle size={19} />
                  </div>
                </div>

                {/* Socket status */}
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      socketConnected ? "bg-primary" : "bg-danger"
                    }`}
                  />
                  <span className="text-[11px] text-muted">
                    {socketConnected
                      ? "Chat connected"
                      : "Connecting to chat..."}
                  </span>
                </div>
              </div>

              {/* Conversation search */}
              <div className="border-b border-border p-3 sm:p-4">
                <div className="flex h-10 items-center gap-2.5 rounded-xl border border-border bg-app px-3">
                  <Search size={16} className="shrink-0 text-muted" />

                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-xs text-text outline-none placeholder:text-muted"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="text-muted hover:text-text"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Conversation list */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {conversationsLoading &&
                  normalizedConversations.length === 0 && (
                    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                      <LoaderCircle
                        size={22}
                        className="animate-spin text-primary"
                      />
                      <p className="text-xs text-muted">
                        Loading conversations...
                      </p>
                    </div>
                  )}

                {!conversationsLoading &&
                  filteredConversations.length === 0 && (
                    <div className="flex flex-col items-center px-5 py-12 text-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <Users size={21} />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-text">
                        No conversations found
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        Your accepted connections will appear here.
                      </p>
                    </div>
                  )}

                <div className="space-y-1 p-2">
                  {filteredConversations.map((conversation) => {
                    const isActive = conversation._id === activeId;

                    return (
                      <button
                        key={conversation._id}
                        type="button"
                        onClick={() =>
                          handleSelectConversation(conversation._id)
                        }
                        className={`flex w-full min-w-0 items-center gap-3 rounded-xl p-3 text-left transition ${
                          isActive ? "bg-primary-soft" : "hover:bg-app"
                        }`}
                      >
                        <div className="relative shrink-0">
                          {renderAvatar(conversation.user, "h-11 w-11")}

                          <span
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface ${
                              conversation.online ? "bg-primary" : "bg-muted/40"
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center justify-between gap-2">
                            <p
                              className={`truncate text-xs font-semibold ${
                                isActive ? "text-primary" : "text-text"
                              }`}
                            >
                              {conversation.user.name || "User"}
                            </p>

                            <span className="shrink-0 text-[10px] text-muted">
                              {formatListTime(conversation.lastMessageAt)}
                            </span>
                          </div>

                          <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                            <p className="truncate text-[11px] text-muted">
                              {conversation.lastMessage ||
                                "Start a conversation"}
                            </p>

                            {conversation.unread > 0 && (
                              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                                {conversation.unread}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-[10px] text-muted">
                            {conversation.online
                              ? "Online"
                              : formatLastSeen(conversation.user.lastSeen)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Chat window */}
            <section
              className={`${
                activeId ? "flex" : "hidden md:flex"
              } min-w-0 flex-1 flex-col bg-app`}
            >
              {!activeChat ? (
                <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <MessageCircle size={30} strokeWidth={1.5} />
                  </div>

                  <h2 className="mt-5 text-lg font-bold text-text">
                    Your messages
                  </h2>

                  <p className="mt-2 max-w-xs text-xs leading-5 text-muted">
                    Select a conversation to start chatting with your
                    connections.
                  </p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-3 py-3 sm:px-5">
                    <button
                      type="button"
                      onClick={handleBack}
                      aria-label="Back to conversations"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-app hover:text-text md:hidden"
                    >
                      <ArrowLeft size={19} />
                    </button>

                    <div className="relative shrink-0">
                      {renderAvatar(activeChat.user, "h-10 w-10")}

                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface ${
                          activeChat.online ? "bg-primary" : "bg-muted/40"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-bold text-text">
                        {activeChat.user.name || "User"}
                      </h2>

                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {!socketConnected
                          ? "Connecting..."
                          : activeChat.online
                            ? "Online"
                            : formatLastSeen(activeChat.user.lastSeen)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {socketConnected ? (
                        <Wifi size={16} className="text-primary" />
                      ) : (
                        <WifiOff size={16} className="text-danger" />
                      )}

                      <span className="hidden text-[10px] text-muted sm:inline">
                        {socketConnected ? "Connected" : "Offline"}
                      </span>
                    </div>
                  </header>

                  {/* Messages */}
                  <div
                    className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5"
                    ref={messagesContainerRef}
                  >
                    {/* Load older messages */}
                    {hasMoreByConversation[activeId] && (
                      <div className="mb-5 flex justify-center">
                        <button
                          type="button"
                          onClick={handleLoadOlderMessages}
                          disabled={olderMessagesLoading}
                          className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-[11px] font-medium text-muted transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
                        >
                          {olderMessagesLoading ? (
                            <>
                              <LoaderCircle
                                size={14}
                                className="animate-spin"
                              />
                              Loading messages...
                            </>
                          ) : (
                            "↑ Load older messages"
                          )}
                        </button>
                      </div>
                    )}

                    {messagesLoading && messages.length === 0 && (
                      <div className="flex flex-col items-center gap-2 py-10">
                        <LoaderCircle
                          size={22}
                          className="animate-spin text-primary"
                        />
                        <p className="text-xs text-muted">
                          Loading messages...
                        </p>
                      </div>
                    )}

                    {!messagesLoading && messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                          <MessageCircle size={22} />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-text">
                          No messages yet
                        </p>

                        <p className="mt-1 text-xs text-muted">
                          Say hello and start the conversation.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {messages.map((message) => {
                        const mine = getId(message.senderId) === currentUserId;

                        return (
                          <div
                            key={message._id}
                            className={`flex w-full ${
                              mine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[72%] sm:px-4 ${
                                mine
                                  ? "rounded-br-md bg-primary text-white"
                                  : "rounded-bl-md border border-border bg-surface text-text"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words text-[13px] leading-6">
                                {message.text}
                              </p>

                              <div
                                className={`mt-1.5 flex items-center justify-end gap-1.5 text-[9px] ${
                                  mine ? "text-white/70" : "text-muted"
                                }`}
                              >
                                <span>{formatTime(message.createdAt)}</span>

                                {mine &&
                                  (message.readAt ? (
                                    <CheckCheck size={13} />
                                  ) : (
                                    <Check size={13} />
                                  ))}

                                {mine && message.readAt && <span>Read</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div ref={bottomRef} />
                  </div>

                  {/* Message composer */}
                  <footer className="shrink-0 border-t border-border bg-surface p-3 sm:px-5 sm:py-4">
                    {sendError && (
                      <div
                        role="alert"
                        className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[11px] text-danger"
                      >
                        <span>{sendError}</span>

                        <button
                          type="button"
                          onClick={() => setSendError("")}
                          aria-label="Dismiss error"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    <div className="flex items-end gap-2 rounded-xl border border-border bg-app p-2 transition focus-within:border-primary/40">
                      <textarea
                        ref={inputRef}
                        rows={1}
                        placeholder={
                          socketConnected
                            ? "Write a message..."
                            : "Connecting to chat..."
                        }
                        value={text}
                        maxLength={5000}
                        onChange={(event) => setText(event.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!socketConnected || sending}
                        className="max-h-32 min-h-9 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-xs leading-5 text-text outline-none placeholder:text-muted disabled:opacity-50 sm:text-sm"
                      />

                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!text.trim() || !socketConnected || sending}
                        aria-label="Send message"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {sending ? (
                          <LoaderCircle size={17} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between px-1">
                      <p className="text-[10px] text-muted">
                        Enter to send · Shift + Enter for new line
                      </p>

                      <p className="text-[10px] text-muted">
                        {text.length}/5000
                      </p>
                    </div>
                  </footer>
                </>
              )}
            </section>
          </section>
        </div>
      </DashboardLayout>
    </UserLayOut>
  );
}

export default function Chat() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-app">
          <LoaderCircle size={26} className="animate-spin text-primary" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
