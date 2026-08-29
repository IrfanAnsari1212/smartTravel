# SmartTravel

SmartTravel plans driving routes, surfaces nearby travel stops, and supports offline route packs. Accounts keep saved trips private to their owner.

## Local setup

1. Copy `backend/.env.example` to `backend/.env` and provide a MongoDB URI, a long random JWT secret, and the allowed frontend origin.
2. Copy `frontend/.env.example` to `frontend/.env` only when the frontend is hosted separately from the backend.
3. Run `npm install`, then `npm run build` and `npm start` from the repository root. For development, start `npm run dev` in `frontend` and `npm run dev` in `backend`.

## Security

Never commit `.env` files. Database credentials and JWT secrets must be stored in the deployment provider's secret manager and rotated if exposed.

## Health checks

- `GET /api/health` reports whether the database is connected.
- `GET /api/ready` is only successful when required production dependencies are available.

## API access

- `POST /api/auth/register` and `POST /api/auth/login` accept an email and a password of at least 12 characters.
- Requests to `/api/trip/*` require `Authorization: Bearer <token>`.
- Location autocomplete remains public, rate-limited, and input-validated.
