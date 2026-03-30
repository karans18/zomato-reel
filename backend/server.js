require("dotenv").config();
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/db/db");
const Comment = require("./src/models/comments.model");
const Food = require("./src/models/food.model");
const User = require("./src/models/user.model");
const { getAllowedOrigins } = require("./src/config/client.config");
const { normalizeComment } = require("./src/utils/comment.utils");

connectDB();

const server = http.createServer(app);

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((acc, cookie) => {
      const [name, ...valueParts] = cookie.split("=");

      if (!name) {
        return acc;
      }

      acc[name] = decodeURIComponent(valueParts.join("="));
      return acc;
    }, {});
}

function getReelRoom(reelId) {
  return `reel:${reelId}`;
}

const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const token = parseCookies(socket.handshake.headers.cookie || "").token;

    if (!token) {
      socket.data.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("fullName");

    socket.data.user = user
      ? {
          _id: user._id.toString(),
          username: user.fullName,
        }
      : null;

    return next();
  } catch (error) {
    socket.data.user = null;
    return next();
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_reel", (reelId) => {
    if (!reelId) {
      return;
    }

    socket.join(getReelRoom(reelId));
  });

  socket.on("leave_reel", (reelId) => {
    if (!reelId) {
      return;
    }

    socket.leave(getReelRoom(reelId));
  });

  socket.on("send_comment", async ({ reelId, text } = {}, callback) => {
    try {
      const trimmedText = text?.trim();

      if (!socket.data.user?._id) {
        const payload = { message: "Please log in as a user to comment." };

        if (typeof callback === "function") {
          callback({ ok: false, ...payload });
        }

        socket.emit("comment_error", payload);
        return;
      }

      if (!reelId || !trimmedText) {
        const payload = { message: "Comment text is required." };

        if (typeof callback === "function") {
          callback({ ok: false, ...payload });
        }

        socket.emit("comment_error", payload);
        return;
      }

      const reelExists = await Food.exists({ _id: reelId });

      if (!reelExists) {
        const payload = { message: "This food item no longer exists." };

        if (typeof callback === "function") {
          callback({ ok: false, ...payload });
        }

        socket.emit("comment_error", payload);
        return;
      }

      const comment = await Comment.create({
        reel: reelId,
        user: socket.data.user._id,
        username: socket.data.user.username,
        text: trimmedText,
      });

      const normalizedComment = normalizeComment(comment);

      io.to(getReelRoom(reelId)).emit("receive_comment", normalizedComment);

      if (typeof callback === "function") {
        callback({ ok: true, comment: normalizedComment });
      }
    } catch (err) {
      console.error("Comment error:", err);

      const payload = { message: "Failed to save comment" };

      if (typeof callback === "function") {
        callback({ ok: false, ...payload });
      }

      socket.emit("comment_error", payload);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
