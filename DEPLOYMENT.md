# Deployment

Deploy the frontend and backend together, or configure `VITE_API_BASE_URL` to the backend's public `/api` base URL.

Required production secrets:

- `MONGO_URI`
- `JWT_SECRET` (at least 32 random characters)
- `CORS_ORIGIN` (comma-separated trusted frontend origins)

The backend deliberately refuses to start in production unless MongoDB is reachable and the required security configuration is present.
