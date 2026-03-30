import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import socket from "../utlis/socket";

function formatCommentTime(timestamp) {
  if (!timestamp) {
    return "";
  }

  const parsedDate = new Date(timestamp);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const diffMs = Date.now() - parsedDate.getTime();

  if (diffMs < 60 * 1000) {
    return "Just now";
  }

  if (diffMs < 60 * 60 * 1000) {
    return `${Math.floor(diffMs / (60 * 1000))}m ago`;
  }

  if (diffMs < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diffMs / (60 * 60 * 1000))}h ago`;
  }

  if (diffMs < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diffMs / (24 * 60 * 60 * 1000))}d ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}

const ReelFeed = ({
  items = [],
  onLike,
  onSave,
  emptyMessage = "No videos yet.",
  isLoggedIn = false,
  canComment = false,
}) => {
  const videoRefs = useRef(new Map());
  const currentRoomRef = useRef(null);
  const itemsRef = useRef(items);

  const [comments, setComments] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [currentReel, setCurrentReel] = useState(null);
  const [text, setText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;

          if (!(video instanceof HTMLVideoElement)) {
            return;
          }

          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            video.play().catch(() => {});
            return;
          }

          video.pause();
        });
      },
      { threshold: [0, 0.25, 0.6, 0.9, 1] },
    );

    videoRefs.current.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    setCommentCounts((prev) => {
      const nextCounts = { ...prev };

      items.forEach((item) => {
        const incomingCount =
          item.commentsCount ??
          (Array.isArray(item.comments) ? item.comments.length : 0);

        nextCounts[item._id] = Math.max(
          nextCounts[item._id] ?? 0,
          incomingCount,
        );
      });

      return nextCounts;
    });
  }, [items]);

  useEffect(() => {
    const handleReceiveComment = (comment) => {
      if (!comment?.reel) {
        return;
      }

      setCommentCounts((prev) => {
        const matchingItem = itemsRef.current.find(
          (item) => item._id === comment.reel,
        );
        const baseCount =
          typeof prev[comment.reel] === "number"
            ? prev[comment.reel]
            : (matchingItem?.commentsCount ??
              (Array.isArray(matchingItem?.comments)
                ? matchingItem.comments.length
                : 0));

        return {
          ...prev,
          [comment.reel]: baseCount + 1,
        };
      });

      if (comment.reel !== currentRoomRef.current) {
        return;
      }

      setComments((prev) =>
        prev.some((existingComment) => existingComment._id === comment._id)
          ? prev
          : [comment, ...prev],
      );
    };

    const handleCommentError = (payload) => {
      setCommentError(payload?.message || "Could not send comment.");
    };

    socket.on("receive_comment", handleReceiveComment);
    socket.on("comment_error", handleCommentError);

    return () => {
      socket.off("receive_comment", handleReceiveComment);
      socket.off("comment_error", handleCommentError);

      if (currentRoomRef.current) {
        socket.emit("leave_reel", currentRoomRef.current);
      }
    };
  }, []);

  const setVideoRef = (id) => (element) => {
    if (!element) {
      videoRefs.current.delete(id);
      return;
    }

    videoRefs.current.set(id, element);
  };

  async function openComments(reelId) {
    if (!reelId) {
      return;
    }

    setShowComments(true);
    setCurrentReel(reelId);
    setText("");
    setCommentError("");
    setIsLoadingComments(true);

    if (currentRoomRef.current && currentRoomRef.current !== reelId) {
      socket.emit("leave_reel", currentRoomRef.current);
    }

    currentRoomRef.current = reelId;
    socket.emit("join_reel", reelId);

    try {
      const response = await fetch(`/api/food/comments/${reelId}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load comments");
      }

      const nextComments = Array.isArray(data.comments) ? data.comments : [];
      setComments(nextComments);
      setCommentCounts((prev) => ({
        ...prev,
        [reelId]: nextComments.length,
      }));
    } catch (error) {
      console.error(error);
      setComments([]);
      setCommentError("Could not load comments right now.");
    } finally {
      setIsLoadingComments(false);
    }
  }

  function closeComments() {
    if (currentRoomRef.current) {
      socket.emit("leave_reel", currentRoomRef.current);
    }

    currentRoomRef.current = null;
    setShowComments(false);
    setCurrentReel(null);
    setComments([]);
    setText("");
    setCommentError("");
    setIsLoadingComments(false);
  }

  function sendComment() {
    if (!currentReel || !text.trim() || !canComment) {
      return;
    }

    socket.emit(
      "send_comment",
      {
        reelId: currentReel,
        text: text.trim(),
      },
      (response) => {
        if (response?.ok) {
          setText("");
          return;
        }

        setCommentError(response?.message || "Could not send comment.");
      },
    );
  }

  return (
    <div className="reels-page">
      <div className="reels-feed" role="list">
        {items.length === 0 && (
          <div className="empty-state">
            <p>{emptyMessage}</p>
          </div>
        )}

        {items.map((item) => (
          <section key={item._id} className="reel" role="listitem">
            <video
              ref={setVideoRef(item._id)}
              className="reel-video"
              src={item.video}
              muted
              playsInline
              loop
              preload="metadata"
            />

            <div className="reel-overlay">
              <div className="reel-overlay-gradient" aria-hidden="true" />

              <div className="reel-actions">
                <div className="reel-action-group">
                  <button
                    onClick={() => isLoggedIn && onLike && onLike(item)}
                    disabled={!isLoggedIn}
                    className="reel-action"
                    style={{
                      opacity: isLoggedIn ? 1 : 0.5,
                      cursor: isLoggedIn ? "pointer" : "not-allowed",
                    }}
                    aria-label="Like"
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                    </svg>
                  </button>
                  <div className="reel-action__count">
                    {item.likeCount ?? item.likesCount ?? item.likes ?? 0}
                  </div>
                </div>

                <div className="reel-action-group">
                  <button
                    onClick={() => isLoggedIn && onSave && onSave(item)}
                    disabled={!isLoggedIn}
                    className="reel-action"
                    style={{
                      opacity: isLoggedIn ? 1 : 0.5,
                      cursor: isLoggedIn ? "pointer" : "not-allowed",
                    }}
                    aria-label="Bookmark"
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
                    </svg>
                  </button>
                  <div className="reel-action__count">
                    {item.savesCount ?? item.bookmarks ?? item.saves ?? 0}
                  </div>
                </div>

                <button
                  type="button"
                  className="reel-action-group reel-action-group--button"
                  onClick={() => openComments(item._id)}
                  aria-label="Open comments"
                >
                  <span className="reel-action">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                    </svg>
                  </span>
                  <span className="reel-action__count">
                    {commentCounts[item._id] ??
                      item.commentsCount ??
                      (Array.isArray(item.comments) ? item.comments.length : 0)}
                  </span>
                </button>
              </div>

              <div className="reel-content">
                <p className="reel-description">{item.description}</p>

                {item.foodPartner && (
                  <Link
                    className="reel-btn"
                    to={`/food-partner/${item.foodPartner}`}
                  >
                    Visit store
                  </Link>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      {showComments && (
        <div className="comment-modal" onClick={closeComments}>
          <div
            className="comment-box"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="comment-box__header">
              <h3>Comments</h3>
              <button
                type="button"
                className="comment-close"
                onClick={closeComments}
              >
                Close
              </button>
            </div>

            <div className="comment-list">
              {isLoadingComments && (
                <p className="comment-empty">Loading comments...</p>
              )}

              {!isLoadingComments && comments.length === 0 && (
                <p className="comment-empty">
                  No comments yet. Start the conversation.
                </p>
              )}

              {!isLoadingComments &&
                comments.map((comment) => (
                  <article key={comment._id} className="comment-item">
                    <div className="comment-meta">
                      <strong>
                        {comment.username || comment.user?.username}
                      </strong>
                      <span className="comment-time">
                        {formatCommentTime(comment.createdAt)}
                      </span>
                    </div>
                    <p>{comment.text}</p>
                  </article>
                ))}
            </div>

            {commentError && <p className="comment-error">{commentError}</p>}

            <form
              className="comment-form"
              onSubmit={(event) => {
                event.preventDefault();
                sendComment();
              }}
            >
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={
                  canComment
                    ? "Add comment..."
                    : "Log in with a user account to comment"
                }
                disabled={!canComment}
              />
              <button type="submit" disabled={!canComment || !text.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReelFeed;
