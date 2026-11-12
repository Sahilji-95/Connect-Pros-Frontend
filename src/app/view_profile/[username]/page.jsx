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
import clientServer from "@/config";

import {
  Briefcase,
  Check,
  Clock3,
  Download,
  GraduationCap,
  LoaderCircle,
  MessageCircle,
  ThumbsUp,
  UserPlus,
  X,
} from "lucide-react";

// Shared style tokens
const actionBase =
  "inline-flex h-10 items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

const actionPrimary = `${actionBase} bg-primary text-white hover:bg-primary-hover dark:text-[#12141A]`;

const actionOutline = `${actionBase} border border-border bg-surface text-text hover:border-primary/40 hover:text-primary`;

const actionConnected = `${actionBase} border border-success/30 bg-success/10 text-success`;

const actionPending = `${actionBase} border border-border bg-surface-muted text-muted`;

const actionReject = `${actionBase} border border-danger/30 bg-surface text-danger hover:bg-danger/5`;

const sectionCard = "rounded-card border border-border bg-surface p-5 sm:p-6";

const sectionTitle = "font-serif text-xl font-bold text-text";

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
      <div
        role="status"
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-app text-text"
      >
        <LoaderCircle size={24} className="animate-spin text-primary" />
        <p className="text-sm text-muted">Loading profile...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div
        role="alert"
        className="flex min-h-screen items-center justify-center bg-app px-4 text-center text-sm text-danger"
      >
        {profileError}
      </div>
    );
  }

  if (!profileByUsername) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app px-4 text-center text-sm text-muted">
        Profile not found
      </div>
    );
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
    <main className="min-h-screen bg-app text-text">
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-5 px-4 py-8 sm:px-6 sm:py-12">
        {/* Profile header */}
        <section
          className={`${sectionCard} flex flex-col gap-6 sm:flex-row sm:items-center`}
        >
          <div className="shrink-0">
            {profileImage ? (
              <img
                src={profileImage}
                alt={userId?.username || "Profile"}
                className="h-24 w-24 rounded-full border border-border object-cover sm:h-28 sm:w-28"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-primary-soft text-3xl font-bold text-primary sm:h-28 sm:w-28">
                {userId?.username?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="break-words font-serif text-2xl font-bold tracking-tight text-text sm:text-3xl">
              {userId?.name || userId?.username || "User"}
            </h1>

            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted">@{userId?.username}</p>

              <button
                type="button"
                aria-label="Download resume"
                title="Download resume"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:border-primary/40 hover:text-primary"
                onClick={async () => {
                  const response = await clientServer.get(
                    `/user/dwonlaod_resume?id=${userId._id}`,
                  );
                  window.open(`${BASE_URl}/uploads/${response.data.message}`);
                }}
              >
                <Download size={16} />
              </button>
            </div>
          </div>

          {connectionStatus === "self" ? null : (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {connectionStatus === "none" && (
                <button
                  className={actionPrimary}
                  disabled={loading}
                  onClick={handleConnect}
                >
                  {!loading && <UserPlus size={16} />}
                  {loading ? "Sending..." : "Connect"}
                </button>
              )}

              {connectionStatus === "pending" && (
                <button className={actionPending} disabled>
                  <Clock3 size={16} />
                  Pending
                </button>
              )}

              {connectionStatus === "accepted" && (
                <>
                  <button className={actionConnected} disabled>
                    <Check size={16} />
                    Connected
                  </button>

                  <button
                    type="button"
                    className={actionOutline}
                    onClick={handleMessage}
                    disabled={messageLoading}
                  >
                    <MessageCircle size={16} />
                    {messageLoading ? "Opening..." : "Message"}
                  </button>
                </>
              )}

              {connectionStatus === "received" && (
                <>
                  <button
                    className={actionPrimary}
                    disabled={loading}
                    onClick={() => handleRequestAction("accept")}
                  >
                    <Check size={16} />
                    Accept
                  </button>

                  <button
                    className={actionReject}
                    disabled={loading}
                    onClick={() => handleRequestAction("reject")}
                  >
                    <X size={16} />
                    Reject
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        {/* About */}
        <section className={sectionCard}>
          <h2 className={sectionTitle}>About me</h2>

          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted">
            {bio ||
              "A short introduction about the developer, their interests and professional goals."}
          </p>
        </section>

        {/* Overview */}
        <section className="grid gap-5 sm:grid-cols-2">
          <article className={sectionCard}>
            <div className="flex items-center gap-2 text-muted">
              <Briefcase size={16} />
              <span className="text-xs font-semibold">Current work</span>
            </div>

            <h3 className="mt-3 break-words text-base font-semibold text-text">
              {currentPost || "Not specified"}
            </h3>
          </article>

          <article className={sectionCard}>
            <div className="flex items-center gap-2 text-muted">
              <GraduationCap size={17} />
              <span className="text-xs font-semibold">Education</span>
            </div>

            <h3 className="mt-3 break-words text-base font-semibold text-text">
              {firstEducation?.degree || "Not specified"}
            </h3>
          </article>
        </section>

        {/* Experience */}
        <section className={sectionCard}>
          <h2 className={sectionTitle}>Experience</h2>

          {pastWork.length > 0 ? (
            <div className="mt-5 ml-1.5 border-l border-border">
              {pastWork.map((work, index) => (
                <article
                  className="relative pb-6 pl-6 last:pb-0"
                  key={work._id || `${work.pastWork}-${index}`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-[5.5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-surface"
                  />

                  <h3 className="break-words text-base font-semibold text-text">
                    {work.pastWork}
                  </h3>

                  {work.position && (
                    <p className="mt-0.5 text-sm text-text">{work.position}</p>
                  )}

                  {work.years != null && (
                    <p className="mt-0.5 text-xs text-muted">
                      Duration: {work.years}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              No previous experience added.
            </p>
          )}
        </section>

        {/* Education */}
        <section className={sectionCard}>
          <h2 className={sectionTitle}>Education</h2>

          {education.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {education.map((edu, index) => (
                <article
                  className="rounded-control border border-border bg-app p-4"
                  key={edu._id || `${edu.degree}-${index}`}
                >
                  <h3 className="break-words text-sm font-semibold text-text">
                    {edu.degree || "Education"}
                  </h3>

                  {edu.school && (
                    <p className="mt-1 text-sm text-text">{edu.school}</p>
                  )}

                  {edu.fieldOfStudy && (
                    <p className="mt-0.5 text-xs text-muted">
                      {edu.fieldOfStudy}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">
              No education details added.
            </p>
          )}
        </section>

        {/* Posts */}
        <section>
          <h2 className={`${sectionTitle} mb-4`}>Posts</h2>

          {profilePosts.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {profilePosts.map((post) => (
                <article
                  key={post._id}
                  className="flex flex-col overflow-hidden rounded-card border border-border bg-surface"
                >
                  {post.media && (
                    <div className="aspect-[4/3] w-full overflow-hidden border-b border-border bg-surface-muted">
                      <Image
                        src={post.media}
                        alt="Post image"
                        width={800}
                        height={600}
                        className="h-full w-full object-cover"
                        loading="eager"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-text">
                      {post.body}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted">
                      <div className="flex items-center gap-1.5">
                        <ThumbsUp size={15} />
                        <span>{post.likes?.length ?? post.likes ?? 0}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MessageCircle size={15} />
                        <span>{post.comments?.length ?? 0}</span>
                      </div>

                      <span className="ml-auto">
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
            <div className="rounded-card border border-dashed border-border px-5 py-12 text-center">
              <p className="text-sm font-semibold text-text">No posts yet</p>
              <span className="mt-1 block text-xs text-muted">
                Posts shared by this user will appear here.
              </span>
            </div>
          )}
        </section>

        <footer className="pt-2 text-center text-xs text-muted">
          User profile · Public view
        </footer>
      </div>
    </main>
  );
}
