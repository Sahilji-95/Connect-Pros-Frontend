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
        <p className={styles.statusText}>Loading post...</p>
      </main>
    );
  }

  if (currentPostError || !currentPost) {
    return (
      <main className={styles.statusPage}>
        <div className={styles.errorCard}>
          <h2>Post unavailable</h2>
          <p>{currentPostError || "Post not found"}</p>
          <button className={styles.backButton} onClick={() => router.back()}>
            ← Go back
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
          ← Back
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

              <span className={styles.date}>
                {currentPost.createdAt
                  ? new Date(currentPost.createdAt).toLocaleString("en-IN")
                  : ""}
              </span>
            </div>
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
              ♡ {currentPost.isLiked ? "Unlike" : "Like"}
            </button>

            <button
              className={styles.actionButton}
              onClick={() => document.getElementById("comment-input")?.focus()}
            >
              ◯ Comment
            </button>
          </div>

          <section className={styles.commentsSection}>
            <h3 className={styles.commentsTitle}>Comments</h3>

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

              <button
                className={styles.submitButton}
                type="submit"
                disabled={commentLoading || !commentText.trim()}
              >
                {commentLoading ? "Posting..." : "Post comment"}
              </button>
            </form>

            <div className={styles.commentsList}>
              {comment?.length ? (
                comment.map((item) => (
                  <div className={styles.commentItem} key={item._id}>
                    <strong className={styles.commentAuthor}>
                      {item.userId?.name || "User"}
                    </strong>

                    <p className={styles.commentUsername}>
                      @{item.userId?.username || "user"}
                    </p>

                    <p className={styles.commentBody}>{item.body}</p>
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
