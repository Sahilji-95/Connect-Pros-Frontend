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
import styles from "./page.module.css";

const ArrowLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
    aria-hidden="true"
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
    aria-hidden="true"
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
    aria-hidden="true"
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

  if (currentPostLoading) {
    return (
      <main className={styles.statusPage}>
        <div className={styles.loader}>
          <span className={styles.spinner} aria-hidden="true" />
          <p className={styles.statusText}>Loading post...</p>
        </div>
      </main>
    );
  }

  if (currentPostError || !currentPost) {
    return (
      <main className={styles.statusPage}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon} aria-hidden="true">
            !
          </div>
          <h2>Post unavailable</h2>
          <p>{currentPostError || "Post not found"}</p>
          <button className={styles.backButton} onClick={() => router.back()}>
            <ArrowLeftIcon />
            <span>Go back</span>
          </button>
        </div>
      </main>
    );
  }

  const author = currentPost.userId;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <button className={styles.backButton} onClick={() => router.back()}>
          <ArrowLeftIcon />
          <span>Back</span>
        </button>

        <article className={styles.postCard}>
          <div className={styles.authorSection}>
            <img
              className={styles.avatar}
              src={author?.profilePicture || "/default-avatar.png"}
              alt="Profile"
              width={48}
              height={48}
            />

            <div className={styles.authorInfo}>
              <strong className={styles.authorName}>
                {author?.name || "Unknown user"}
              </strong>

              <span className={styles.username}>
                @{author?.username || "unknown"}
              </span>
            </div>

            <span className={styles.date}>
              {currentPost.createdAt
                ? new Date(currentPost.createdAt).toLocaleString("en-IN")
                : ""}
            </span>
          </div>

          <p className={styles.postBody}>{currentPost.body}</p>

          {currentPost.media && (
            <div className={styles.mediaContainer}>
              <img
                className={styles.postMedia}
                src={currentPost.media}
                alt="Post media"
              />
            </div>
          )}

          <div className={styles.postStats}>
            <span>{currentPost.likes ?? 0} likes</span>
            <span>{comment?.length ?? 0} comments</span>
          </div>

          <div className={styles.postActions}>
            <button
              className={`${styles.actionButton} ${
                currentPost.isLiked ? styles.liked : ""
              }`}
              onClick={handleLike}
            >
              <HeartIcon />
              <span>{currentPost.isLiked ? "Unlike" : "Like"}</span>
            </button>

            <button
              className={styles.actionButton}
              onClick={() => document.getElementById("comment-input")?.focus()}
            >
              <CommentIcon />
              <span>Comment</span>
            </button>
          </div>

          <section className={styles.commentsSection}>
            <h3 className={styles.commentsTitle}>
              Comments
              <span className={styles.commentsCount}>
                {comment?.length ?? 0}
              </span>
            </h3>

            <form onSubmit={handleComment} className={styles.commentForm}>
              <textarea
                id="comment-input"
                className={styles.commentInput}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Write a comment..."
                rows={3}
                maxLength={2000}
              />

              {commentError && (
                <p className={styles.commentError} role="alert">
                  {commentError}
                </p>
              )}

              <div className={styles.formFooter}>
                <span className={styles.charCount}>
                  {commentText.length}/2000
                </span>

                <button
                  className={styles.submitButton}
                  type="submit"
                  disabled={commentLoading || !commentText.trim()}
                >
                  {commentLoading ? "Posting..." : "Post comment"}
                </button>
              </div>
            </form>

            <div className={styles.commentsList}>
              {comment?.length ? (
                comment.map((item) => (
                  <div className={styles.commentItem} key={item._id}>
                    <div className={styles.commentAvatar} aria-hidden="true">
                      {item.userId?.profilePicture ? (
                        <img
                          className={styles.commentAvatar}
                          src={item.userId.profilePicture}
                          alt={item.userId?.name || "User"}
                        />
                      ) : (
                        <div
                          className={styles.commentAvatar}
                          aria-hidden="true"
                        >
                          {(item.userId?.name || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className={styles.commentContent}>
                      <div className={styles.commentHeader}>
                        <strong className={styles.commentAuthor}>
                          {item.userId?.name || "User"}
                        </strong>

                        <span
                          className={styles.commentUsername}
                          onClick={() => {
                            router.push(
                              `/view_profile/${item.userId?.username}`,
                            );
                          }}
                        >
                          @{item.userId?.username || "user"}
                        </span>
                      </div>

                      <p className={styles.commentBody}>{item.body}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.noComments}>No comments yet.</p>
              )}
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
