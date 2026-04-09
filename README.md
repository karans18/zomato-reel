## 1. 🎬 TikTok-Style Food Discovery Feed with Intersection Observer
-APIFoodView reimagines food discovery through a vertical video reel experience — similar to TikTok or Instagram Reels, but purpose-built for food. The ReelFeed component uses the browser's native Intersection Observer API to autoplay videos only when ≥60% of the video is in the viewport and pauses them automatically when scrolled away — zero polling, zero timers, pure scroll-driven playback. Food partners upload short video clips of their dishes via Multer + ImageKit cloud storage, which are served back with a UUID-based filename to prevent collisions. Each reel surfaces real-time engagement stats (likes, saves, comment count) inline on the video overlay.
## 2. 🔌 Real-Time Comments with Socket.IO + JWT-Authenticated WebSocket Rooms
Comments aren't polled — they're live. The server runs a custom Socket.IO handshake middleware that extracts the JWT from the auth header, cookie, or handshake.auth.token (in that priority order), verifies it, and attaches the user to socket.data before the connection is accepted. Each food item maps to a dedicated socket room (reel:<id>), and users join_reel / leave_reel dynamically as they scroll. Comment writes go through server-side validation (reel existence check, auth guard, text sanitization) before being persisted to MongoDB and broadcast via io.to(room).emit() — ensuring all viewers of the same reel see new comments instantly without any client-side polling.

## 3. 🔐 Dual-Entity Auth System with Role-Aware Middleware
The platform has two distinct account types — Users (consumers) and Food Partners (restaurants/vendors) — each with their own registration, login, and session flow, all sharing a single JWT secret. A smart authUserOrPartnerMiddleware fires parallel Promise.all lookups against both collections and attaches whichever entity matches to req.user or req.foodPartner — letting shared routes (likes, saves, comments) work across both account types without duplicating logic. HttpOnly cookies with environment-aware sameSite / secure flags handle session persistence, and the frontend AuthContext wraps a /api/auth/me session restore on mount so auth state survives page refreshes gracefully.

## 4. 🛒 Role-Gated Cart System with Optimistic Context State
The cart is exclusively a User feature — Food Partners cannot add to cart, and the CartContext enforces this by checking currentUser.accountType before ever firing a fetch. Cart state is managed via useCallback-memoized addToCart / removeFromCart actions that hit the REST API and immediately update local state from the server response — keeping the UI in sync without a full re-fetch. On the backend, cart operations use a find-or-create pattern: if no cart document exists for the user, one is created atomically; item quantities are incremented in-place if the food item already exists in the cart. All cart responses are passed through a normalizeCart helper on both client and server to guarantee a consistent shape regardless of DB state (e.g., null cart, empty items, or orphaned food references).

# Food View

Food View is a full-stack short-form food discovery app with:

- A React + Vite frontend
- An Express + Socket.IO backend
- MongoDB for persistence
- ImageKit for video hosting

## Deployment readiness

The app is now structured to support deployment with the frontend and backend on different domains:

- Frontend requests can point to a deployed API through `VITE_API_URL`
- Socket.IO can use `VITE_SOCKET_URL` if needed
- Backend CORS accepts the origins listed in `FRONTEND_ORIGIN`
- Auth cookies switch to `SameSite=None` and `Secure` in production
- A `/health` endpoint is available for backend health checks

## Environment variables

Backend variables are documented in [backend/.env.example](backend/.env.example).

Frontend variables are documented in [frontend/.env.example](frontend/.env.example).

## Local development

Backend:

```powershell
cd backend
node server.js
```

Frontend:

```powershell
cd frontend
npm run dev
```

## Recommended deployment setup

1. Deploy the backend to a Node-friendly host such as Render, Railway, or Fly.io.
2. Deploy the frontend to a static host such as Vercel or Netlify.
3. Set backend `FRONTEND_ORIGIN` to your deployed frontend URL.
4. Set frontend `VITE_API_URL` to your deployed backend URL.
5. If Socket.IO uses a different origin than the API, set `VITE_SOCKET_URL` too.
6. Make sure MongoDB and ImageKit credentials are configured in the backend environment.

## Backend environment example

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_ORIGIN=http://localhost:5173,https://your-frontend-domain.com
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

## Frontend environment example

```env
VITE_API_URL=https://your-backend-domain.com
VITE_SOCKET_URL=https://your-backend-domain.com
VITE_DEV_API_PROXY_TARGET=http://localhost:3000
```
