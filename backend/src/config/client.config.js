const DEFAULT_FRONTEND_ORIGIN = "http://localhost:5173";
const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

function normalizeOrigin(origin = "") {
  return origin.trim().replace(/\/$/, "");
}

function getAllowedOrigins() {
  const configuredOrigins =
    process.env.FRONTEND_ORIGIN || DEFAULT_FRONTEND_ORIGIN;

  return [...new Set(configuredOrigins.split(",").map(normalizeOrigin).filter(Boolean))];
}

function corsOrigin(origin, callback) {
  if (!origin) {
    return callback(null, true);
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (getAllowedOrigins().includes(normalizedOrigin)) {
    return callback(null, true);
  }

  return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
}

const COOKIE_OPTIONS = Object.freeze({
  httpOnly: true,
  maxAge: ONE_WEEK_IN_MS,
  path: "/",
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
});

const CLEAR_COOKIE_OPTIONS = Object.freeze({
  httpOnly: true,
  path: "/",
  sameSite: COOKIE_OPTIONS.sameSite,
  secure: COOKIE_OPTIONS.secure,
});

module.exports = {
  COOKIE_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
  corsOptions: {
    credentials: true,
    origin: corsOrigin,
  },
  getAllowedOrigins,
};
