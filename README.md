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
