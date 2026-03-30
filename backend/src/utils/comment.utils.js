function getCommentUsername(comment = {}) {
  return (
    comment.username ||
    comment.user?.username ||
    comment.user?.fullName ||
    comment.user?.name ||
    "User"
  );
}

function normalizeComment(comment = {}) {
  const reelId =
    typeof comment.reel === "object" && comment.reel !== null
      ? comment.reel._id?.toString?.() || comment.reel.toString?.() || ""
      : comment.reel?.toString?.() || "";

  const username = getCommentUsername(comment);

  return {
    _id: comment._id?.toString?.() || String(comment._id || ""),
    reel: reelId,
    text: comment.text || "",
    username,
    createdAt: comment.createdAt || null,
    user: {
      username,
    },
  };
}

module.exports = {
  getCommentUsername,
  normalizeComment,
};
