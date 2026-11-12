"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  getPostById,
  getAllComments,
  incrementPostLike,
  postComment,
} from "@/config/redux/action/postAction";

const ArrowLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
    className="h-4 w-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
    />
  </svg>
);

const HeartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.7}
    stroke="currentColor"
    className="h-[18px] w-[18px]"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
    />
  </svg>
);

const CommentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.7}
    stroke="currentColor"
    className="h-[18px] w-[18px]"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
    />
  </svg>
);

export default function PostDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const id = params?.id;

  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState("");

  const { currentPost, currentPostLoading, currentPostError, comment } =
    useSelector((state) => state.post);

  useEffect(() => {
    if (!id) return;

    dispatch(getPostById(id));
    dispatch(getAllComments({ post_id: id }));
  }, [id, dispatch]);

  const handleLike = async () => {
    if (!currentPost?._id) return;

    try {
      await dispatch(incrementPostLike({ post_id: currentPost._id })).unwrap();
    } catch (error) {
      console.error("Like failed:", error);
    }
  };

  const handleComment = async (event) => {
    event.preventDefault();

    if (!commentText.trim() || !currentPost?._id) return;

    setCommentLoading(true);
    setCommentError("");

    try {
      await dispatch(
        postComment({
          body: commentText.trim(),
          post_id: currentPost._id,
        }),
      ).unwrap();

      setCommentText("");

      await dispatch(getAllComments({ post_id: currentPost._id })).unwrap();
    } catch (error) {
      setCommentError(
        typeof error === "string"
          ? error
          : error?.message || "Unable to post comment",
      );
    } finally {
      setCommentLoading(false);
    }
  };

  const handleBack = () => router.back();

  if (currentPostLoading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-app px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
          <p className="text-sm text-muted">Loading post...</p>
        </div>
      </main>
    );
  }

  if (currentPostError || !currentPost) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-app px-4 py-10">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-danger/10 text-xl font-bold text-danger">
            !
          </div>

          <h2 className="mt-4 text-lg font-semibold text-text">
            Post unavailable
          </h2>

          <p className="mt-2 break-words text-sm text-muted">
            {currentPostError || "Post not found"}
          </p>

          <button
            onClick={handleBack}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ArrowLeftIcon />
            Go back
          </button>
        </div>
      </main>
    );
  }

  const author = currentPost.userId;

  return (
    <main className="min-h-screen bg-app px-3 py-5 sm:px-5 sm:py-8">
      <div className="mx-auto w-full max-w-3xl">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-muted transition hover:bg-surface hover:text-text"
        >
          <ArrowLeftIcon />
          Back
        </button>

        {/* Post card */}
        <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          {/* Author section */}
          <div className="flex min-w-0 items-center gap-3 px-4 py-4 sm:px-5">
            <img
              src={author?.profilePicture || "/default-avatar.png"}
              alt={author?.name || "Profile"}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">
                {author?.name || "Unknown user"}
              </p>

              <p className="truncate text-xs text-muted">
                @{author?.username || "unknown"}
              </p>
            </div>

            <span className="max-w-[110px] shrink-0 text-right text-[10px] leading-4 text-muted sm:max-w-none sm:text-xs">
              {currentPost.createdAt
                ? new Date(currentPost.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </span>
          </div>

          {/* Post body */}
          {currentPost.body && (
            <div className="px-4 pb-4 sm:px-5">
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-text sm:text-[15px]">
                {currentPost.body}
              </p>
            </div>
          )}

          {/* Post media */}
          {currentPost.media && (
            <div className="w-full overflow-hidden bg-app">
              <img
                src={currentPost.media}
                alt="Post media"
                className="mx-auto max-h-[650px] w-full object-contain"
              />
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-muted sm:px-5">
            <span>{currentPost.likes ?? 0} likes</span>
            <span>{comment?.length ?? 0} comments</span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 px-3 py-2 sm:px-5">
            <button
              onClick={handleLike}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition hover:bg-app ${
                currentPost.isLiked
                  ? "text-primary"
                  : "text-muted hover:text-text"
              }`}
            >
              <HeartIcon />
              {currentPost.isLiked ? "Unlike" : "Like"}
            </button>

            <button
              onClick={() => document.getElementById("comment-input")?.focus()}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-muted transition hover:bg-app hover:text-text"
            >
              <CommentIcon />
              Comment
            </button>
          </div>

          {/* Comments section */}
          <section className="border-t border-border px-4 py-5 sm:px-5">
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-base font-semibold text-text">Comments</h3>

              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                {comment?.length ?? 0}
              </span>
            </div>

            {/* Comment form */}
            <form onSubmit={handleComment} className="mb-5">
              <textarea
                id="comment-input"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Write a comment..."
                rows={2}
                maxLength={2000}
                className="min-h-[76px] w-full resize-y rounded-xl border border-border bg-app px-3 py-3 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
              />

              {commentError && (
                <p className="mt-2 text-xs text-danger" role="alert">
                  {commentError}
                </p>
              )}

              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[11px] text-muted">
                  {commentText.length}/2000
                </span>

                <button
                  type="submit"
                  disabled={commentLoading || !commentText.trim()}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                >
                  {commentLoading ? "Posting..." : "Post comment"}
                </button>
              </div>
            </form>

            {/* Comments list */}
            <div className="max-h-[420px] space-y-3 overflow-y-auto overscroll-contain pr-1">
              {comment?.length ? (
                comment.map((item) => (
                  <div
                    key={item._id}
                    className="flex min-w-0 items-start gap-2.5"
                  >
                    {item.userId?.profilePicture ? (
                      <img
                        src={item.userId.profilePicture}
                        alt={item.userId?.name || "User"}
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                        {(item.userId?.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1 rounded-xl bg-app px-3 py-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="max-w-full truncate text-xs font-semibold text-text">
                          {item.userId?.name || "User"}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            item.userId?.username &&
                            router.push(`/view_profile/${item.userId.username}`)
                          }
                          className="max-w-full truncate text-[11px] text-primary hover:underline"
                        >
                          @{item.userId?.username || "user"}
                        </button>
                      </div>

                      <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-5 text-text">
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-muted">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
