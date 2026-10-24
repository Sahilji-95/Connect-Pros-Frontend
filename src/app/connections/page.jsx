"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/layout/DashboardLayout/Index";
import UserLayOut from "@/layout/UserLayout/Index";
import {
  getAllConnections,
  getAllMyConnections,
  getAboutUser,
  getAllUsers,
  acceptConnectionRequest,
} from "@/config/redux/action/authAction/index.js";
import styles from "./connections.module.css";
import { Search, Users, Check, X, UserPlus } from "lucide-react";

export default function Connections() {
  const dispatch = useDispatch();
  const router = useRouter();

  const {
    connectionRequest = [],
    myConnections = [],
    all_profiles_fetched,
  } = useSelector((state) => state.auth);

  const [loadingRequestId, setLoadingRequestId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("requests");
  const [errorMessage, setErrorMessage] = useState("");

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

  const renderAvatar = (user) => {
    if (user.profilePicture) {
      return (
        <img
          className={styles.avatar}
          src={user.profilePicture}
          alt={user.name || "User"}
          loading="lazy"
        />
      );
    }

    return (
      <div className={styles.avatarFallback}>
        {(user.name || user.username || "U").trim().charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <UserLayOut>
      <DashboardLayout>
        <main className={styles.page}>
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>
                <Users size={15} />
                <span>YOUR NETWORK</span>
              </div>

              <h1>
                Your <span>Connections</span>
              </h1>

              <p className={styles.subtitle}>
                Manage incoming requests and stay connected with your network.
              </p>

              <div className={styles.heroStats}>
                <div className={styles.statIcon}>
                  <UserPlus size={22} />
                </div>

                <div>
                  <strong>{myConnections.length}</strong>
                  <span>Accepted connections</span>
                </div>
              </div>
            </div>

            <div className={styles.heroDecoration} aria-hidden="true">
              <div className={`${styles.orbit} ${styles.orbitOne}`} />
              <div className={`${styles.orbit} ${styles.orbitTwo}`} />
              <div className={styles.heroCircle}>
                <Users size={54} strokeWidth={1.4} />
              </div>
            </div>
          </section>

          <section className={styles.content}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Manage your network</h2>
                <p>View requests and people you are connected with.</p>
              </div>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.filters}>
                <button
                  type="button"
                  className={`${styles.filterBtn} ${
                    activeTab === "requests" ? styles.activeFilter : ""
                  }`}
                  onClick={() => {
                    setActiveTab("requests");
                    setSearchQuery("");
                  }}
                >
                  Requests
                  <span>{connectionRequest.length}</span>
                </button>

                <button
                  type="button"
                  className={`${styles.filterBtn} ${
                    activeTab === "connections" ? styles.activeFilter : ""
                  }`}
                  onClick={() => {
                    setActiveTab("connections");
                    setSearchQuery("");
                  }}
                >
                  My Connections
                  <span>{myConnections.length}</span>
                </button>
              </div>

              <div className={styles.searchBox}>
                <Search size={19} />

                <input
                  type="search"
                  placeholder={
                    activeTab === "requests"
                      ? "Search requests..."
                      : "Search connections..."
                  }
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  aria-label="Search people"
                />

                {searchQuery && (
                  <button
                    type="button"
                    className={styles.clearSearch}
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className={styles.errorMessage} role="alert">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage("")}
                  aria-label="Dismiss error"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {activeTab === "requests" && (
              <>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>Connection Requests</h2>
                    <p>People who want to connect with you.</p>
                  </div>

                  <span className={styles.requestCount}>
                    {connectionRequest.length} pending
                  </span>
                </div>

                {filteredRequests.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIllustration}>
                      <div className={styles.emptyIcon}>
                        <Users size={34} />
                      </div>
                    </div>

                    <h3>
                      {connectionRequest.length === 0
                        ? "No requests yet"
                        : "No matching requests"}
                    </h3>

                    <p>
                      {connectionRequest.length === 0
                        ? "New connection requests will appear here."
                        : "Try searching with a different name or username."}
                    </p>
                  </div>
                ) : (
                  <div className={styles.requestList}>
                    {filteredRequests.map((request) => {
                      const user = request.userId;
                      if (!user) return null;

                      const isLoading = loadingRequestId === request._id;

                      return (
                        <article
                          className={styles.requestCard}
                          key={request._id}
                        >
                          <div className={styles.cardAccent} />

                          <div className={styles.userInfo}>
                            <div className={styles.avatarWrapper}>
                              {renderAvatar(user)}
                              <span className={styles.avatarStatus} />
                            </div>

                            <div className={styles.userDetails}>
                              <h3>{user.name || "Unknown User"}</h3>

                              <div
                                onClick={() => {
                                  router.push(`/view_profile/${user.username}`);
                                }}
                                style={{ cursor: "pointer" }}
                              >
                                <p className={styles.username}>
                                  @{user.username || "username"}
                                </p>
                              </div>

                              <span className={styles.pendingLabel}>
                                <span />
                                Wants to connect
                              </span>
                            </div>
                          </div>

                          <div className={styles.actions}>
                            <button
                              type="button"
                              className={styles.acceptBtn}
                              disabled={loadingRequestId !== null}
                              onClick={() =>
                                handleRequestAction(request._id, "accept")
                              }
                            >
                              {isLoading ? (
                                <span className={styles.spinner} />
                              ) : (
                                <Check size={17} />
                              )}
                              <span>
                                {isLoading ? "Processing..." : "Accept"}
                              </span>
                            </button>

                            <button
                              type="button"
                              className={styles.rejectBtn}
                              disabled={loadingRequestId !== null}
                              onClick={() =>
                                handleRequestAction(request._id, "reject")
                              }
                            >
                              <X size={17} />
                              <span>Reject</span>
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {activeTab === "connections" && (
              <>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2>My Connections</h2>
                    <p>People you are connected with.</p>
                  </div>

                  <span className={styles.requestCount}>
                    {myConnections.length} connections
                  </span>
                </div>

                {filteredConnections.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIllustration}>
                      <div className={styles.emptyIcon}>
                        <Users size={34} />
                      </div>
                    </div>

                    <h3>
                      {myConnections.length === 0
                        ? "No connections yet"
                        : "No matching connections"}
                    </h3>

                    <p>
                      {myConnections.length === 0
                        ? "Accept a connection request to grow your network."
                        : "Try searching with a different name or username."}
                    </p>
                  </div>
                ) : (
                  <div className={styles.requestList}>
                    {filteredConnections.map((user) => (
                      <article className={styles.requestCard} key={user._id}>
                        <div className={styles.cardAccent} />

                        <div className={styles.userInfo}>
                          <div className={styles.avatarWrapper}>
                            {renderAvatar(user)}
                            <span className={styles.avatarStatus} />
                          </div>

                          <div className={styles.userDetails}>
                            <h3>{user.name || "Unknown User"}</h3>
                            <div
                              onClick={() => {
                                router.push(`/view_profile/${user.username}`);
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <p className={styles.username}>
                                @{user.username || "username"}
                              </p>
                            </div>
                            <span className={styles.pendingLabel}>
                              <span />
                              Connected
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}

            <footer className={styles.footer}>
              <span className={styles.footerDot} />
              <p>Your network, your community.</p>
            </footer>
          </section>
        </main>
      </DashboardLayout>
    </UserLayOut>
  );
}
