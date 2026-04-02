const DEFAULT_DEV_FRONTEND_ORIGIN = "http://localhost:5173";
const DEFAULT_PROD_FRONTEND_ORIGIN = "https://reelbites-wheat.vercel.app";
const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";
const ALLOWED_METHODS = Object.freeze([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
]);
const ALLOWED_HEADERS = Object.freeze([
  "Origin",
  "X-Requested-With",
  "Content-Type",
  "Accept",
  "Authorization",
]);

function normalizeOrigin(origin = "") {
  return origin.trim().replace(/\/$/, "");
}

function getDefaultFrontendOrigin() {
  return isProduction
    ? DEFAULT_PROD_FRONTEND_ORIGIN
    : DEFAULT_DEV_FRONTEND_ORIGIN;
}

function getAllowedOrigins() {
  const configuredOrigins =
    process.env.FRONTEND_ORIGIN || getDefaultFrontendOrigin();

  return [
    ...new Set(
      configuredOrigins.split(",").map(normalizeOrigin).filter(Boolean),
    ),
  ];
}

function isAllowedOrigin(origin = "") {
  return getAllowedOrigins().includes(normalizeOrigin(origin));
}

function getAllowedHeaders(requestHeaders = "") {
  const requestedHeaders = requestHeaders
    .split(",")
    .map((header) => header.trim())
    .filter(Boolean);

  if (requestedHeaders.length > 0) {
    return requestedHeaders.join(", ");
  }

  return ALLOWED_HEADERS.join(", ");
}

function applyCorsHeaders(req, res) {
  const requestOrigin = normalizeOrigin(req.headers.origin || "");

  if (!requestOrigin || !isAllowedOrigin(requestOrigin)) {
    return;
  }

  res.header("Access-Control-Allow-Origin", requestOrigin);
  res.header("Access-Control-Allow-Methods", ALLOWED_METHODS.join(", "));
  res.header(
    "Access-Control-Allow-Headers",
    getAllowedHeaders(req.headers["access-control-request-headers"] || ""),
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.append("Vary", "Origin");
  res.append("Vary", "Access-Control-Request-Headers");
}

function corsOrigin(origin, callback) {
  if (!origin) {
    return callback(null, true);
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (isAllowedOrigin(normalizedOrigin)) {
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
  ALLOWED_HEADERS,
  ALLOWED_METHODS,
  COOKIE_OPTIONS,
  CLEAR_COOKIE_OPTIONS,
  applyCorsHeaders,
  corsOptions: {
    credentials: true,
    origin: corsOrigin,
    methods: ALLOWED_METHODS,
    allowedHeaders: ALLOWED_HEADERS,
    optionsSuccessStatus: 204,
  },
  getAllowedOrigins,
  isAllowedOrigin,
};
