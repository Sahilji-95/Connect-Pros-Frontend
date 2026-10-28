"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

import {
  getProfileByUsername,
  getAboutUser,
} from "@/config/redux/action/authAction";
import { getPostsByUsername } from "@/config/redux/action/postAction";

import { BASE_URl } from "@/config";
import styles from "./page.module.css";
import clientServer from "@/config";

export default function ViewProfile() {
  const router = useRouter();
  const [messageLoading, setMessageLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("none");
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(false);

  const { username } = useParams();
  const dispatch = useDispatch();

  const { profileByUsername, profileLoading, profileError } = useSelector(
    (state) => state.auth,
  );
  const authState = useSelector((state) => state.auth);

  const currentUserId = authState.user?.userId?._id;
  const profileUserId = profileByUsername?.userId?._id;

  const { profilePosts = [] } = useSelector((state) => state.post);

  useEffect(() => {
    dispatch(getAboutUser());
  }, [dispatch]);

  useEffect(() => {
    const fetchConnectionStatus = async () => {
      try {
        if (!profileUserId || !currentUserId) return;

        // Apni hi profile hai
        if (profileUserId === currentUserId) {
          setConnectionStatus("self");
          return;
        }

        const response = await clientServer.get("/user/connection_status", {
          params: {
            connectionId: profileUserId,
          },
        });

        setConnectionStatus(response.data.status);
        setRequestId(response.data.requestId || null);
      } catch (error) {
        console.error(
          "Failed to fetch connection status:",
          error.response?.data || error.message,
        );
      }
    };

    fetchConnectionStatus();
  }, [profileUserId, currentUserId]);

  const handleConnect = async () => {
    try {
      setLoading(true);

      const response = await clientServer.post(
        "/user/send_connection_request",
        {
          connectionId: profileUserId,
        },
      );

      setConnectionStatus(response.data.status || "pending");
      setRequestId(response.data.requestId || null);
    } catch (error) {
      console.error(
        "Connection request failed:",
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (action) => {
    try {
      setLoading(true);

      await clientServer.post("/user/accept_connection_request", {
        requestId,
        action_type: action,
      });

      setConnectionStatus(action === "accept" ? "accepted" : "none");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      dispatch(getProfileByUsername(username));
      dispatch(getPostsByUsername(username));
    }
  }, [username, dispatch]);

  const handleMessage = async () => {
    if (!profileUserId || messageLoading) return;

    try {
      setMessageLoading(true);

      const response = await clientServer.post("/chat/conversations", {
        connectionId: profileUserId,
      });

      const conversationId = response.data?.conversation?._id;

      if (!conversationId) {
        throw new Error("Conversation ID was not returned.");
      }

      router.push(`/chat?conversationId=${encodeURIComponent(conversationId)}`);
    } catch (error) {
      console.error(
        "Failed to open conversation:",
        error.response?.data || error.message,
      );
    } finally {
      setMessageLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className={styles.status}>
        <span className={styles.loader} />
        Loading profile...
      </div>
    );
  }

  if (profileError) {
    return <div className={styles.status}>{profileError}</div>;
  }

  if (!profileByUsername) {
    return <div className={styles.status}>Profile not found</div>;
  }

  const {
    userId,
    bio,
    currentPost,
    pastWork = [],
    education = [],
  } = profileByUsername;

  const profileImage = userId?.profilePicture
    ? userId.profilePicture.startsWith("http")
      ? userId.profilePicture
      : `${BASE_URl}/uploads/${userId.profilePicture}`
    : null;

  const firstEducation = education[0];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            {profileImage ? (
              <img
                src={profileImage}
                alt={userId?.username || "Profile"}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarFallback}>
                {userId?.username?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          <div className={styles.profileInfo}>
            <span className={styles.profileLabel}>USER PROFILE</span>

            <h1>{userId?.name || userId?.username || "User"}</h1>

            <div className={styles.cv}>
              <p className={styles.username}>@{userId?.username}</p>
              <div
                onClick={async () => {
                  const response = await clientServer.get(
                    `/user/dwonlaod_resume?id=${userId._id}`,
                  );
                  window.open(`${BASE_URl}/uploads/${response.data.message}`);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
              </div>
            </div>
          </div>

          {connectionStatus === "self" ? null : (
            <div className={styles.connectionActions}>
              {connectionStatus === "none" && (
                <button
                  className={`${styles.connectionBtn} ${styles.connectBtn}`}
                  disabled={loading}
                  onClick={handleConnect}
                >
                  {loading ? "Sending..." : "+ Connect"}
                </button>
              )}

              {connectionStatus === "pending" && (
                <button
                  className={`${styles.connectionBtn} ${styles.pendingBtn}`}
                  disabled
                >
                  ◷ Pending
                </button>
              )}

              {connectionStatus === "accepted" && (
                <>
                  <button
                    className={`${styles.connectionBtn} ${styles.connectedBtn}`}
                    disabled
                  >
                    ✓ Connected
                  </button>

                  <button
                    type="button"
                    className={`${styles.connectionBtn} ${styles.messageBtn}`}
                    onClick={handleMessage}
                    disabled={messageLoading}
                  >
                    {messageLoading ? "Opening..." : "✉ Message"}
                  </button>
                </>
              )}

              {connectionStatus === "received" && (
                <>
                  <button
                    className={`${styles.connectionBtn} ${styles.acceptBtn}`}
                    disabled={loading}
                    onClick={() => handleRequestAction("accept")}
                  >
                    ✓ Accept
                  </button>

                  <button
                    className={`${styles.connectionBtn} ${styles.rejectBtn}`}
                    disabled={loading}
                    onClick={() => handleRequestAction("reject")}
                  >
                    ✕ Reject
                  </button>
                </>
              )}
            </div>
          )}
        </section>
        <div className={styles.divider} />

        <section className={styles.aboutSection}>
          <h2>About me</h2>

          <p className={styles.bio}>
            {bio ||
              "A short introduction about the developer, their interests and professional goals."}
          </p>
        </section>

        <section className={styles.overviewGrid}>
          <article className={styles.overviewCard}>
            <div className={styles.cardIcon} aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="3" y="7" width="18" height="14" rx="2" />
                <path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2" />
              </svg>
            </div>

            <span className={styles.cardLabel}>CURRENT WORK</span>

            <h3>{currentPost || "Not specified"}</h3>
          </article>

          <article className={styles.overviewCard}>
            <div className={styles.cardIcon} aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="m2 9 10-5 10 5-10 5L2 9Z" />
                <path d="M6 11v5c4 4 8 4 12 0v-5M22 9v6" />
              </svg>
            </div>

            <span className={styles.cardLabel}>EDUCATION</span>

            <h3>{firstEducation?.degree || "Not specified"}</h3>
          </article>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Experience</h2>

          {pastWork.length > 0 ? (
            <div className={styles.timeline}>
              {pastWork.map((work, index) => (
                <article
                  className={styles.timelineItem}
                  key={work._id || `${work.pastWork}-${index}`}
                >
                  <span className={styles.experienceLabel}>
                    PROFESSIONAL EXPERIENCE
                  </span>
                  <h3>Company - {work.pastWork}</h3>

                  {work.position && (
                    <p className={styles.position}>
                      Position - {work.position}
                    </p>
                  )}

                  {work.years != null && (
                    <p className={styles.duration}>Duration - {work.years} </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No previous experience added.</p>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Education</h2>

          {education.length > 0 ? (
            <div className={styles.educationList}>
              {education.map((edu, index) => (
                <article
                  className={styles.educationCard}
                  key={edu._id || `${edu.degree}-${index}`}
                >
                  <h3>{edu.degree || "Education"}</h3>

                  {edu.school && (
                    <p className={styles.position}>{edu.school}</p>
                  )}

                  {edu.fieldOfStudy && (
                    <p className={styles.duration}>{edu.fieldOfStudy}</p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No education details added.</p>
          )}
        </section>
        <div className={styles.postsSection}>
          <h3 className={styles.sectionTitle}>Posts</h3>

          {profilePosts.length > 0 ? (
            <div className={styles.postsGrid}>
              {profilePosts.map((post) => (
                <article key={post._id} className={styles.postCard}>
                  {post.media && (
                    <div className={styles.postImageWrapper}>
                      {post.media && (
                        <Image
                          src={post.media}
                          alt="Post image"
                          width={800}
                          height={600}
                          className={styles.postImage}
                          loading="eager"
                        />
                      )}
                    </div>
                  )}

                  <div className={styles.postContent}>
                    <p className={styles.postBody}>{post.body}</p>

                    <div className={styles.postFooter}>
                      <div className={styles.likes}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.7}
                          className={styles.likeIcon}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
                          />
                        </svg>
                        <span>{post.likes?.length ?? post.likes ?? 0}</span>
                      </div>
                      <div className={styles.commentInfo}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.7}
                          className={styles.commentIcon}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                          />
                        </svg>

                        <span>{post.comments?.length ?? 0}</span>
                      </div>

                      <span className={styles.postDate}>
                        {new Date(post.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyPosts}>
              <p>No posts yet</p>
              <span>Posts shared by this user will appear here.</span>
            </div>
          )}
        </div>
        <footer className={styles.footer}>User profile · Public view</footer>
      </div>
    </main>
  );
}
