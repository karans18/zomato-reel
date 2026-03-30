import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import api from "../lib/api";
import socket from "../utlis/socket";

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-7-4.35-9.17-8.03A5.42 5.42 0 0 1 7.5 3c1.82 0 3.49.96 4.5 2.5A5.4 5.4 0 0 1 16.5 3a5.5 5.5 0 0 1 4.67 9.97C19 16.65 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 4.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V5.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 18.5H4.5A1.5 1.5 0 0 1 3 17V6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5V17a1.5 1.5 0 0 1-1.5 1.5H12l-5 3v-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatCommentTime(timestamp) {
  if (!timestamp) return "";

  const parsedDate = new Date(timestamp);
  if (Number.isNaN(parsedDate.getTime())) return "";

  const diffMs = Date.now() - parsedDate.getTime();

  if (diffMs < 60 * 1000) return "Just now";
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
  onAddToCart,
  onOpenCart,
  cartCount = 0,
  emptyMessage = "No videos yet.",
  isLoggedIn = false,
  canComment = false,
  onRequireLogin,
}) => {
  const videoRefs = useRef(new Map());
  const currentRoomRef = useRef(null);

  const [comments, setComments] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [currentReel, setCurrentReel] = useState(null);
  const [text, setText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);

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
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0, 0.25, 0.6, 0.9, 1] },
    );

    videoRefs.current.forEach((video) => observer.observe(video));

    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    setCommentCounts((prev) => {
      const next = { ...prev };

      items.forEach((item) => {
        const count =
          item.commentsCount ??
          (Array.isArray(item.comments) ? item.comments.length : 0);

        next[item._id] = Math.max(next[item._id] ?? 0, count);
      });

      return next;
    });
  }, [items]);

  useEffect(() => {
    const handleReceiveComment = (comment) => {
      if (!comment?.reel) {
        return;
      }

      setCommentCounts((prev) => ({
        ...prev,
        [comment.reel]: (prev[comment.reel] ?? 0) + 1,
      }));

      if (comment.reel !== currentRoomRef.current) {
        return;
      }

      setComments((prev) =>
        prev.some((existingComment) => existingComment._id === comment._id)
          ? prev
          : [comment, ...prev],
      );
    };

    socket.on("receive_comment", handleReceiveComment);

    return () => {
      socket.off("receive_comment", handleReceiveComment);
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
    if (!isLoggedIn) {
      if (typeof onRequireLogin === "function") {
        onRequireLogin();
      }
      return;
    }

    setShowComments(true);
    setCurrentReel(reelId);
    setIsLoadingComments(true);
    setCommentError("");

    if (currentRoomRef.current && currentRoomRef.current !== reelId) {
      socket.emit("leave_reel", currentRoomRef.current);
    }

    currentRoomRef.current = reelId;
    socket.emit("join_reel", reelId);

    try {
      const response = await api.get(`/api/food/comments/${reelId}`);
      const data = response.data;

      setComments(data.comments || []);
    } catch {
      setComments([]);
      setCommentError("Unable to load comments right now.");
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
  }

  function sendComment() {
    if (!text.trim()) {
      return;
    }

    if (!isLoggedIn) {
      if (typeof onRequireLogin === "function") {
        onRequireLogin();
      }
      setCommentError("Please log in as a user to comment.");
      return;
    }

    if (!canComment) {
      setCommentError("Only user accounts can comment.");
      return;
    }

    setCommentError("");

    socket.emit(
      "send_comment",
      {
        reelId: currentReel,
        text: text.trim(),
      },
      (result) => {
        if (!result?.ok) {
          setCommentError(result?.message || "Failed to send comment.");
          return;
        }

        setText("");
      },
    );
  }

  return (
    <div className="reels-page">
      {typeof onOpenCart === "function" && (
        <div className="reels-topbar">
          <button
            type="button"
            className="reels-cart-button"
            onClick={onOpenCart}
          >
            Cart
            <span className="reels-cart-badge">{cartCount}</span>
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="reels-feed">
          {items.map((item) => {
            const commentCount = commentCounts[item._id] ?? item.commentsCount ?? 0;

            return (
              <section key={item._id} className="reel">
                <video
                  ref={setVideoRef(item._id)}
                  className="reel-video"
                  src={item.video}
                  muted
                  loop
                  playsInline
                />

                <div className="reel-overlay-gradient" />

                <div className="reel-overlay">
                  <div className="reel-actions">
                    {typeof onLike === "function" && (
                      <button
                        type="button"
                        className="reel-action-group reel-action-group--button"
                        onClick={() => onLike(item)}
                        aria-label="Like this item"
                      >
                        <span className="reel-action">
                          <HeartIcon />
                        </span>
                        <span className="reel-action__count">
                          {item.likeCount ?? 0}
                        </span>
                      </button>
                    )}

                    {typeof onSave === "function" && (
                      <button
                        type="button"
                        className="reel-action-group reel-action-group--button"
                        onClick={() => onSave(item)}
                        aria-label="Save this item"
                      >
                        <span className="reel-action">
                          <BookmarkIcon />
                        </span>
                        <span className="reel-action__count">
                          {item.savesCount ?? 0}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="reel-action-group reel-action-group--button"
                      onClick={() => openComments(item._id)}
                      aria-label="Open comments"
                    >
                      <span className="reel-action">
                        <ChatIcon />
                      </span>
                      <span className="reel-action__count">{commentCount}</span>
                    </button>
                  </div>

                  <div className="reel-content">
                    <div className="reel-copy">
                      <h2 className="reel-title">{item.name || "Food item"}</h2>
                      <p className="reel-description">
                        {item.description || "Fresh food from this store."}
                      </p>
                    </div>

                    <div className="reel-cta-row">
                      {item.foodPartner && (
                        <Link
                          className="reel-btn"
                          to={`/food-partner/${item.foodPartner}`}
                          onClick={(event) => {
                            if (isLoggedIn) {
                              return;
                            }

                            event.preventDefault();

                            if (typeof onRequireLogin === "function") {
                              onRequireLogin();
                            }
                          }}
                        >
                          Visit store
                        </Link>
                      )}

                      {typeof onAddToCart === "function" && (
                        <button
                          type="button"
                          className="reel-btn reel-btn--secondary"
                          onClick={() => onAddToCart(item)}
                        >
                          Add to cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {showComments && (
        <div
          className="comment-modal"
          role="dialog"
          aria-modal="true"
          onClick={closeComments}
        >
          <div className="comment-box" onClick={(event) => event.stopPropagation()}>
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
              {isLoadingComments ? (
                <p className="comment-empty">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="comment-empty">No comments yet.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="comment-item">
                    <div className="comment-meta">
                      <strong>{comment.user?.username || "User"}</strong>
                      <span className="comment-time">
                        {formatCommentTime(comment.createdAt)}
                      </span>
                    </div>
                    <p>{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            {commentError ? (
              <p className="comment-error">{commentError}</p>
            ) : null}

            <div className="comment-form">
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={
                  canComment
                    ? "Write a comment"
                    : "Log in as a user to comment"
                }
                disabled={!isLoggedIn || !canComment}
              />
              <button
                type="button"
                onClick={sendComment}
                disabled={!text.trim() || !isLoggedIn || !canComment}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReelFeed;
