"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/layout/DashboardLayout/Index";
import UserLayOut from "@/layout/UserLayout/Index";
import clientServer from "@/config";
import {
  getAllConnections,
  getAllMyConnections,
  getAboutUser,
  getAllUsers,
  acceptConnectionRequest,
  deleteConnection,
} from "@/config/redux/action/authAction/index.js";
import {
  Search,
  Users,
  Check,
  X,
  MessageCircle,
  Trash2,
  UserRound,
  LoaderCircle,
  ArrowUpRight,
  UserCheck,
  Clock3,
} from "lucide-react";

export default function Connections() {
  const dispatch = useDispatch();
  const router = useRouter();

  const {
    connectionRequest = [],
    myConnections = [],
    all_profiles_fetched,
  } = useSelector((state) => state.auth);

  const [loadingRequestId, setLoadingRequestId] = useState(null);
  const [messageLoadingId, setMessageLoadingId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("requests");
  const [errorMessage, setErrorMessage] = useState("");

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);

  useEffect(() => {
    dispatch(getAboutUser());
    dispatch(getAllConnections());
    dispatch(getAllMyConnections());
  }, [dispatch]);

  useEffect(() => {
    if (!all_profiles_fetched) {
      dispatch(getAllUsers());
    }
  }, [all_profiles_fetched, dispatch]);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return connectionRequest.filter((request) => {
      const user = request.userId;
      if (!user) return false;

      return (
        (user.name || "").toLowerCase().includes(query) ||
        (user.username || "").toLowerCase().includes(query)
      );
    });
  }, [connectionRequest, searchQuery]);

  const filteredConnections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return myConnections.filter((user) => {
      if (!user) return false;

      return (
        (user.name || "").toLowerCase().includes(query) ||
        (user.username || "").toLowerCase().includes(query)
      );
    });
  }, [myConnections, searchQuery]);

  const handleRequestAction = async (requestId, action) => {
    try {
      setErrorMessage("");
      setLoadingRequestId(requestId);

      await dispatch(acceptConnectionRequest({ requestId, action })).unwrap();

      await Promise.all([
        dispatch(getAllConnections()).unwrap(),
        dispatch(getAllMyConnections()).unwrap(),
      ]);
    } catch (error) {
      console.error(`${action} connection request failed:`, error);

      setErrorMessage(
        typeof error === "string"
          ? error
          : error?.message ||
              `Unable to ${action} this request. Please try again.`,
      );
    } finally {
      setLoadingRequestId(null);
    }
  };

  const handleMessage = async (connectionId) => {
    if (!connectionId || messageLoadingId) return;

    try {
      setErrorMessage("");
      setMessageLoadingId(connectionId);

      const response = await clientServer.post("/chat/conversations", {
        connectionId,
      });

      const conversationId = response.data?.conversation?._id;

      if (!conversationId) {
        throw new Error("Conversation could not be opened.");
      }

      router.push(`/chat?conversationId=${encodeURIComponent(conversationId)}`);
    } catch (error) {
      console.error("Failed to open chat:", error);

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to open chat. Please try again.",
      );
    } finally {
      setMessageLoadingId(null);
    }
  };

  const handleDeleteConnection = async (connectionId) => {
    if (!connectionId || deleteLoadingId) return false;

    try {
      setErrorMessage("");
      setDeleteLoadingId(connectionId);

      await dispatch(deleteConnection(connectionId)).unwrap();
      await dispatch(getAllMyConnections()).unwrap();

      return true;
    } catch (error) {
      console.error("Failed to delete connection:", error);

      setErrorMessage(
        typeof error === "string"
          ? error
          : error?.message ||
              "Unable to delete this connection. Please try again.",
      );

      return false;
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleDeleteClick = (user) => {
    setSelectedConnection(user);
    setShowDeletePopup(true);
  };

  const handleCancelDelete = () => {
    if (deleteLoadingId) return;

    setShowDeletePopup(false);
    setSelectedConnection(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedConnection) return;

    const ok = await handleDeleteConnection(selectedConnection._id);

    setShowDeletePopup(false);
    setSelectedConnection(null);

    if (!ok) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const openProfile = (username) => {
    if (!username) return;

    router.push(`/view_profile/${encodeURIComponent(username)}`);
  };

  const renderAvatar = (user) => (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-sm font-semibold text-primary sm:h-12 sm:w-12">
      {user.profilePicture ? (
        <img
          src={user.profilePicture}
          alt={user.name || "User"}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        (user.name || user.username || "U").trim().charAt(0).toUpperCase()
      )}
    </div>
  );

  const isRequestsTab = activeTab === "requests";
  const activeCount = isRequestsTab
    ? connectionRequest.length
    : myConnections.length;

  const visibleCount = isRequestsTab
    ? filteredRequests.length
    : filteredConnections.length;

  return (
    <UserLayOut>
      <DashboardLayout>
        <main className="min-h-screen min-w-0 bg-app px-3 py-5 text-text sm:px-5 sm:py-7 lg:px-7">
          {/* Page heading */}
          <header className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-[10px] font-bold tracking-[1.5px] text-muted">
                YOUR NETWORK
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Your Connections<span className="text-accent">.</span>
            </h1>

            <p className="mt-2 max-w-xl text-xs leading-6 text-muted sm:text-sm">
              Manage your requests and stay connected with your network.
            </p>

            {/* Network stats */}
            <div className="mt-5 inline-flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <UserCheck size={19} />
              </div>

              <div>
                <p className="text-lg font-bold leading-5 text-text">
                  {myConnections.length}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Accepted connections
                </p>
              </div>
            </div>
          </header>

          {/* Network content */}
          <section>
            <div className="mb-4">
              <h2 className="text-base font-bold text-text sm:text-lg">
                Manage your network
              </h2>
              <p className="mt-1 text-xs text-muted">
                View requests and people you are connected with.
              </p>
            </div>

            {/* Tabs */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full rounded-xl border border-border bg-surface p-1 sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("requests");
                    setSearchQuery("");
                    setErrorMessage("");
                  }}
                  className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition sm:flex-none sm:px-4 ${
                    isRequestsTab
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:bg-app hover:text-text"
                  }`}
                >
                  <Clock3 size={15} />
                  Requests
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                      isRequestsTab
                        ? "bg-white/20 text-white"
                        : "bg-app text-muted"
                    }`}
                  >
                    {connectionRequest.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("connections");
                    setSearchQuery("");
                    setErrorMessage("");
                  }}
                  className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition sm:flex-none sm:px-4 ${
                    !isRequestsTab
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:bg-app hover:text-text"
                  }`}
                >
                  <Users size={15} />
                  My Connections
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                      !isRequestsTab
                        ? "bg-white/20 text-white"
                        : "bg-app text-muted"
                    }`}
                  >
                    {myConnections.length}
                  </span>
                </button>
              </div>

              {/* Search */}
              <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 transition focus-within:border-border sm:max-w-[280px]">
                <Search size={17} className="shrink-0 text-muted" />

                <input
                  type="text"
                  placeholder={
                    isRequestsTab
                      ? "Search requests..."
                      : "Search connections..."
                  }
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  aria-label="Search people"
                  className="min-w-0 flex-1 bg-transparent text-xs text-text outline-none ring-0 placeholder:text-muted focus:outline-none focus:ring-0"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-app hover:text-text"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div
                className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-danger/20 bg-danger/5 px-3 py-3 text-xs text-danger"
                role="alert"
              >
                <span className="break-words">{errorMessage}</span>

                <button
                  type="button"
                  onClick={() => setErrorMessage("")}
                  aria-label="Dismiss error"
                  className="shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Section heading */}
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-text sm:text-base">
                  {isRequestsTab ? "Connection Requests" : "My Connections"}
                </h2>

                <p className="mt-1 text-[11px] text-muted">
                  {isRequestsTab
                    ? "People who want to connect with you."
                    : "People you are connected with."}
                </p>
              </div>

              <span className="shrink-0 rounded-lg bg-primary-soft px-2.5 py-1.5 text-[10px] font-semibold text-primary">
                {activeCount} {isRequestsTab ? "pending" : "connections"}
              </span>
            </div>

            {/* Requests list */}
            {isRequestsTab && (
              <>
                {filteredRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-5 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Users size={23} />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-text">
                      {connectionRequest.length === 0
                        ? "No requests yet"
                        : "No matching requests"}
                    </h3>

                    <p className="mt-1 max-w-sm text-xs leading-5 text-muted">
                      {connectionRequest.length === 0
                        ? "New connection requests will appear here."
                        : "Try searching with a different name or username."}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mb-2 text-[11px] text-muted">
                      Showing {visibleCount} of {activeCount} requests
                    </p>

                    <div className="space-y-2.5">
                      {filteredRequests.map((request) => {
                        const user = request.userId;
                        if (!user) return null;

                        const isLoading = loadingRequestId === request._id;

                        return (
                          <article
                            key={request._id}
                            className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              {renderAvatar(user)}

                              <div className="min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => openProfile(user.username)}
                                  className="block max-w-full truncate text-left text-sm font-semibold text-text hover:text-primary"
                                >
                                  {user.name || "Unknown User"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openProfile(user.username)}
                                  className="mt-0.5 block max-w-full truncate text-xs text-muted hover:text-primary"
                                >
                                  @{user.username || "username"}
                                </button>

                                <span className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-medium text-accent">
                                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                  Wants to connect
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                              <button
                                type="button"
                                disabled={loadingRequestId !== null}
                                onClick={() =>
                                  handleRequestAction(request._id, "accept")
                                }
                                className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[100px]"
                              >
                                {isLoading ? (
                                  <LoaderCircle
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Check size={15} />
                                )}
                                {isLoading ? "Processing..." : "Accept"}
                              </button>

                              <button
                                type="button"
                                disabled={loadingRequestId !== null}
                                onClick={() =>
                                  handleRequestAction(request._id, "reject")
                                }
                                className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-app px-3 py-2 text-xs font-semibold text-muted transition hover:border-danger/40 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[95px]"
                              >
                                <X size={15} />
                                Reject
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {/* My connections list */}
            {!isRequestsTab && (
              <>
                {filteredConnections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-5 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <Users size={23} />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-text">
                      {myConnections.length === 0
                        ? "No connections yet"
                        : "No matching connections"}
                    </h3>

                    <p className="mt-1 max-w-sm text-xs leading-5 text-muted">
                      {myConnections.length === 0
                        ? "Accept a connection request to grow your network."
                        : "Try searching with a different name or username."}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mb-2 text-[11px] text-muted">
                      Showing {visibleCount} of {activeCount} connections
                    </p>

                    <div className="space-y-2.5">
                      {filteredConnections.map((user) => (
                        <article
                          key={user._id}
                          className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {renderAvatar(user)}

                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => openProfile(user.username)}
                                className="block max-w-full truncate text-left text-sm font-semibold text-text hover:text-primary"
                              >
                                {user.name || "Unknown User"}
                              </button>

                              <button
                                type="button"
                                onClick={() => openProfile(user.username)}
                                className="mt-0.5 block max-w-full truncate text-xs text-muted hover:text-primary"
                              >
                                @{user.username || "username"}
                              </button>

                              <span className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-medium text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Connected
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                            <button
                              type="button"
                              disabled={messageLoadingId !== null}
                              onClick={() => handleMessage(user._id)}
                              className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[105px]"
                            >
                              {messageLoadingId === user._id ? (
                                <LoaderCircle
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : (
                                <MessageCircle size={15} />
                              )}
                              {messageLoadingId === user._id
                                ? "Opening..."
                                : "Message"}
                            </button>

                            <button
                              type="button"
                              disabled={deleteLoadingId !== null}
                              onClick={() => handleDeleteClick(user)}
                              className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-app px-3 py-2 text-xs font-semibold text-muted transition hover:border-danger/40 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[95px]"
                            >
                              <Trash2 size={15} />
                              Delete
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Footer */}
            <footer className="mt-8 flex items-center justify-center gap-2 border-t border-border pt-5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <p className="text-[11px] text-muted">
                Your network, your community.
              </p>
            </footer>
          </section>

          {/* Delete confirmation modal */}
          {showDeletePopup && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
              onClick={handleCancelDelete}
            >
              <div
                className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
                  <Trash2 size={22} />
                </div>

                <h2
                  id="delete-modal-title"
                  className="mt-4 text-lg font-bold text-text"
                >
                  Delete Connection?
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Are you sure you want to delete{" "}
                  <strong className="text-text">
                    {selectedConnection?.name || "this connection"}
                  </strong>
                  ? This action cannot be undone.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    disabled={deleteLoadingId !== null}
                    className="flex min-h-10 items-center justify-center rounded-lg border border-border bg-app px-4 py-2 text-xs font-semibold text-text transition hover:bg-surface disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={deleteLoadingId !== null}
                    className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-danger px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {deleteLoadingId ? (
                      <LoaderCircle size={15} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                    {deleteLoadingId ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </DashboardLayout>
    </UserLayOut>
  );
}
