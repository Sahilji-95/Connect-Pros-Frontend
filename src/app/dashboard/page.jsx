"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

import {
  createPost,
  deletePost,
  getAllComments,
  getAllPost,
  incrementPostLike,
  postComment,
} from "@/config/redux/action/postAction";

import { getAboutUser, getAllUsers } from "@/config/redux/action/authAction";

import UserLayOut from "@/layout/UserLayout/Index";
import DashboardLayout from "@/layout/DashboardLayout/Index";
import { setPostId } from "@/config/redux/reducer/postReducer/index.js";
import DashboardSkeleton from "./DashboardSkeleton";

const TRASH_PATH = "M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 11v5m4-5v5";

function Icon({ name, size = 19, className = "" }) {
  const icons = {
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),
    like: (
      <path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Zm0 0 4-7a3 3 0 0 1 2 3v4h5a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 2H7" />
    ),
    comment: (
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-4-.98L3 21l1.98-5.5A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 1 1 21 11.5Z" />
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.7 10.7 6.6-4.4m-6.6 7 6.6 4.4" />
      </>
    ),
    trash: <path d={TRASH_PATH} />,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    arrow: <path d="M7 17 17 7M7 7h10v10" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [postContent, setPostContent] = useState("");
  const [media, setMedia] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [toast, setToast] = useState("");

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);

  const authState = useSelector((state) => state.auth);
  const postState = useSelector((state) => state.post);

  const currentUser = authState.user?.userId;
  const firstName = currentUser?.name?.split(" ")[0] || "there";

  // Load user
  useEffect(() => {
    dispatch(getAboutUser());
  }, [dispatch]);

  // Load posts
  useEffect(() => {
    if (authState.isTokenThere) {
      dispatch(getAllPost());
    }
  }, [authState.isTokenThere, dispatch]);

  // Load profiles
  useEffect(() => {
    if (!authState.all_profiles_fetched) {
      dispatch(getAllUsers());
    }
  }, [authState.all_profiles_fetched, dispatch]);

  // Create post
  const handlePost = () => {
    if (!postContent.trim() && !media) return;

    dispatch(createPost({ file: media, body: postContent }));
    setMedia(null);
    setPostContent("");
  };

  // Toast
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2000);
  };

  // Share post
  const handleShare = async (post) => {
    const url = `${window.location.origin}/post/${post._id}`;

    const shareData = {
      title: `${post.userId?.name || "User"} on ConnectPros`,
      text: post.body?.slice(0, 100) || "Check out this post",
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(url);
      showToast("Link copied!");
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Share failed:", error);
        showToast("Unable to share");
      }
    }
  };

  // Delete post
  const handleDeleteClick = (post) => {
    setPostToDelete(post);
    setShowDeletePopup(true);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;

    setShowDeletePopup(false);
    setPostToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      await dispatch(deletePost({ post_id: postToDelete._id }));
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
      setShowDeletePopup(false);
      setPostToDelete(null);
    }
  };

  // Image preview
  useEffect(() => {
    if (!media) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(media);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [media]);

  // Like
  const handleLike = async (postId) => {
    try {
      await dispatch(incrementPostLike({ post_id: postId })).unwrap();
    } catch (error) {
      console.error("Like failed:", error);
    }
  };

  // Comments
  const handleCommentToggle = (postId) => {
    if (postState.postId === postId) {
      dispatch(setPostId(""));
      return;
    }

    setCommentText("");
    dispatch(getAllComments({ post_id: postId }));
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !postState.postId) return;

    try {
      await dispatch(
        postComment({
          body: commentText,
          post_id: postState.postId,
        }),
      ).unwrap();

      setCommentText("");

      await dispatch(
        getAllComments({
          post_id: postState.postId,
        }),
      ).unwrap();
    } catch (error) {
      console.error("Comment failed:", error);
    }
  };

  const openPost = (postId) => {
    router.push(`/post/${postId}`);
  };

  return (
    <UserLayOut>
      <DashboardLayout>
        <div className="mx-auto w-full max-w-[820px] space-y-7">
          {/* Create post */}
          <section className="overflow-hidden rounded-card border border-border bg-surface">
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <img
                  src={currentUser?.profilePicture || "/default-avatar.png"}
                  alt="Your profile"
                  className="h-11 w-11 shrink-0 rounded-full border border-border object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-sm font-semibold text-text">
                    Share something with your community
                  </p>

                  <textarea
                    placeholder="What's on your mind?"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    rows={3}
                    className="w-full resize-y border-0 bg-transparent text-sm leading-7 text-text outline-none placeholder:text-muted focus:ring-0"
                  />
                </div>
              </div>

              {previewUrl && (
                <div className="relative mt-4 overflow-hidden rounded-xl border border-border bg-surface-muted">
                  <img
                    src={previewUrl}
                    alt="Selected image preview"
                    className="max-h-[360px] w-full object-contain"
                  />

                  <button
                    type="button"
                    onClick={() => setMedia(null)}
                    aria-label="Remove selected image"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-text/80 text-white transition-colors hover:bg-danger"
                  >
                    <Icon name="close" size={17} />
                  </button>
                </div>
              )}

              {media && (
                <p className="mt-2 truncate text-xs text-muted">
                  Selected: {media.name}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-muted/50 px-4 py-3 sm:px-5">
              <label
                htmlFor="fileupload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-primary-soft hover:text-primary"
              >
                <Icon name="image" />
                Add photo
              </label>

              <input
                type="file"
                hidden
                id="fileupload"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => {
                  setMedia(e.target.files?.[0] || null);
                  e.target.value = "";
                }}
              />

              <button
                type="button"
                onClick={handlePost}
                disabled={!postContent.trim() && !media}
                className="rounded-control bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#12141A]"
              >
                Share post
              </button>
            </div>
          </section>

          {/* Feed heading */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="mt-1 font-serif text-2xl font-bold text-text">
                Recent posts
              </h2>
            </div>
          </div>

          {/* Feed */}
          {postState.isLoading ? (
            <DashboardSkeleton />
          ) : (
            <div className="space-y-5">
              {(postState.posts ?? [])
                .filter((post) => post && post.userId)
                .map((post) => {
                  const isOwnPost = post.userId._id === currentUser?._id;

                  const isCommentsOpen = postState.postId === post._id;

                  const commentCount = isCommentsOpen
                    ? (postState.comment?.length ?? 0)
                    : post.commentsCount;

                  return (
                    <article
                      key={post._id}
                      className="overflow-hidden rounded-card border border-border bg-surface transition-colors hover:border-primary/30"
                    >
                      {/* Author */}
                      <div className="flex items-center gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/view_profile/${post.userId.username}`)
                          }
                          className="shrink-0"
                          aria-label={`View ${post.userId.name}'s profile`}
                        >
                          <img
                            src={
                              post.userId.profilePicture ||
                              "/default-avatar.png"
                            }
                            alt={post.userId.name || "Profile"}
                            className="h-11 w-11 rounded-full border border-border object-cover"
                          />
                        </button>

                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/view_profile/${post.userId.username}`,
                              )
                            }
                            className="block max-w-full truncate text-left text-sm font-bold text-text hover:text-primary"
                          >
                            {post.userId.name || "Unknown User"}
                          </button>

                          <p className="mt-0.5 truncate text-xs text-muted">
                            @{post.userId.username || "username"}
                          </p>
                        </div>

                        {isOwnPost && (
                          <button
                            type="button"
                            aria-label="Delete post"
                            title="Delete post"
                            onClick={() => handleDeleteClick(post)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                          >
                            <Icon name="trash" size={18} />
                          </button>
                        )}
                      </div>

                      {/* Post body */}
                      <button
                        type="button"
                        onClick={() => openPost(post._id)}
                        className="block w-full px-4 pb-3 pt-4 text-left sm:px-5"
                      >
                        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-text">
                          {post.body}
                        </p>
                      </button>

                      {/* Post media */}
                      {post.media && (
                        <button
                          type="button"
                          onClick={() => openPost(post._id)}
                          className="block w-full overflow-hidden bg-surface-muted"
                          aria-label="Open post"
                        >
                          <Image
                            src={post.media}
                            alt="Post image"
                            width={800}
                            height={600}
                            loading="eager"
                            sizes="(max-width: 768px) 100vw, 600px"
                            className="mx-auto max-h-[560px] w-full object-contain"
                          />
                        </button>
                      )}

                      {/* Post actions */}
                      <div className="mx-4 flex items-center gap-2 border-t border-border py-3 sm:mx-5 sm:gap-4">
                        <button
                          type="button"
                          onClick={() => handleLike(post._id)}
                          aria-label={
                            post.isLiked ? "Unlike post" : "Like post"
                          }
                          aria-pressed={Boolean(post.isLiked)}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                            post.isLiked
                              ? "bg-primary-soft text-primary"
                              : "text-muted hover:bg-surface-muted hover:text-primary"
                          }`}
                        >
                          <Icon name="like" />
                          <span>{post.likes ?? 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCommentToggle(post._id)}
                          aria-expanded={isCommentsOpen}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                            isCommentsOpen
                              ? "bg-primary-soft text-primary"
                              : "text-muted hover:bg-surface-muted hover:text-primary"
                          }`}
                        >
                          <Icon name="comment" />
                          <span>{commentCount ?? 0}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShare(post)}
                          className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-muted hover:text-primary"
                        >
                          <Icon name="share" />
                          <span className="hidden sm:inline">Share</span>
                        </button>
                      </div>

                      {/* Comments */}
                      {isCommentsOpen && (
                        <section className="border-t border-border bg-surface-muted/40 px-4 py-4 sm:px-5">
                          <h3 className="mb-4 text-sm font-bold text-text">
                            Comments
                          </h3>

                          <div className="max-h-[300px] space-y-3 overflow-y-auto overscroll-contain pr-1">
                            {postState.comment?.length > 0 ? (
                              postState.comment.map((comment) => (
                                <div
                                  key={comment._id}
                                  className="flex min-w-0 items-start gap-2.5"
                                >
                                  {/* Avatar */}
                                  {comment.userId?.profilePicture ? (
                                    <img
                                      src={comment.userId.profilePicture}
                                      alt={comment.userId?.name || "User"}
                                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                                      {(comment.userId?.name || "U")
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>
                                  )}

                                  {/* Comment details */}
                                  <div className="min-w-0 flex-1 rounded-xl bg-app px-3 py-2">
                                    {/* Name and date */}
                                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                                      <p className="max-w-full truncate text-xs font-semibold text-text">
                                        {comment.userId?.name || "User"}
                                      </p>

                                      <span className="text-[10px] text-muted">
                                        {comment.createdAt
                                          ? new Date(
                                              comment.createdAt,
                                            ).toLocaleString("en-IN", {
                                              day: "2-digit",
                                              month: "short",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })
                                          : "Date unavailable"}
                                      </span>
                                    </div>

                                    {/* Username */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        comment.userId?.username &&
                                        router.push(
                                          `/view_profile/${comment.userId.username}`,
                                        )
                                      }
                                      className="mt-0.5 block max-w-full truncate text-[11px] text-primary hover:underline"
                                    >
                                      @{comment.userId?.username || "User"}
                                    </button>

                                    {/* Comment text */}
                                    <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-[1.45rem] text-text">
                                      {comment.body}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="py-4 text-center text-xs text-muted">
                                No comments yet. Be the first to comment!
                              </p>
                            )}
                          </div>

                          <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                            <input
                              type="text"
                              placeholder="Write a comment..."
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleCommentSubmit();
                                }
                              }}
                              className="min-w-0 flex-1 rounded-control border border-border bg-surface px-4 py-3 text-sm text-text outline-none placeholder:text-muted focus:border-primary"
                            />

                            <button
                              type="button"
                              disabled={!commentText.trim()}
                              onClick={handleCommentSubmit}
                              className="shrink-0 rounded-control bg-primary px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#12141A]"
                            >
                              Send
                            </button>
                          </div>
                        </section>
                      )}
                    </article>
                  );
                })}

              {!postState.posts?.length && (
                <div className="rounded-card border border-dashed border-border bg-surface px-5 py-12 text-center">
                  <p className="font-serif text-xl font-bold text-text">
                    Your community starts here.
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    Share your first update with the community.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div
              role="status"
              className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-text px-5 py-3 text-sm font-semibold text-surface shadow-lg"
            >
              {toast}
            </div>
          )}

          {/* Delete confirmation */}
          {showDeletePopup && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              onClick={handleCancelDelete}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-post-title"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[400px] rounded-2xl border border-border bg-surface p-6 shadow-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
                  <Icon name="trash" size={22} />
                </div>

                <h2
                  id="delete-post-title"
                  className="mt-5 font-serif text-2xl font-bold text-text"
                >
                  Delete post?
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Are you sure you want to delete this post? This action cannot
                  be undone.
                </p>

                <div className="mt-7 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    disabled={isDeleting}
                    className="rounded-control border border-border px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-muted disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="rounded-control bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete post"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </UserLayOut>
  );
}
