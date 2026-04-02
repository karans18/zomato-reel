require("dotenv").config();
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/db/db");
const Comment = require("./src/models/comments.model");
const Food = require("./src/models/food.model");
const User = require("./src/models/user.model");
const {
  ALLOWED_HEADERS,
  ALLOWED_METHODS,
  getAllowedOrigins,
  isAllowedOrigin,
} = require("./src/config/client.config");
const { normalizeComment } = require("./src/utils/comment.utils");

connectDB();

const server = http.createServer(app);

function getBearerToken(headerValue = "") {
  if (typeof headerValue !== "string") {
    return "";
  }

  const [scheme, token] = headerValue.trim().split(/\s+/, 2);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return "";
  }

  return token.trim();
}

function parseCookieHeader(cookieHeader = "") {
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

function getSocketToken(handshake = {}) {
  const authToken =
    typeof handshake.auth?.token === "string" ? handshake.auth.token.trim() : "";

  if (authToken) {
    return authToken;
  }

  const bearerToken = getBearerToken(handshake.headers?.authorization);

  if (bearerToken) {
    return bearerToken;
  }

  return parseCookieHeader(handshake.headers?.cookie || "").token || "";
}

function getReelRoom(reelId) {
  return `reel:${reelId}`;
}

const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ALLOWED_METHODS,
    allowedHeaders: ALLOWED_HEADERS,
  },
  allowRequest: (req, callback) => {
    const requestOrigin = req.headers.origin;

    if (!requestOrigin || isAllowedOrigin(requestOrigin)) {
      return callback(null, true);
    }

    return callback("Origin not allowed by Socket.IO CORS.", false);
  },
});

io.use(async (socket, next) => {
  try {
    const token = getSocketToken(socket.handshake);

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
