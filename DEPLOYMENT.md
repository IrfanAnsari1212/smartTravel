# Deployment

## Production model

This repo is set up to run as a single service:

- the backend serves the API under `/api`
- the frontend build is served from `frontend/dist`
- the frontend defaults to relative `/api` calls in production

## Root scripts

- `npm install`
- `npm run build`
- `npm start`

`postinstall` installs `backend` and `frontend` dependencies automatically.

## Environment variables

Backend values live in `backend/.env.example`.

Most important:

- `MONGO_URI`
- `CORS_ORIGIN`
- `PORT`

Optional third-party endpoint overrides:

- `NOMINATIM_BASE_URL`
- `OSRM_BASE_URL`
- `OVERPASS_URL`

Frontend values live in `frontend/.env.example`.

Usually you can leave `VITE_API_BASE_URL` empty when deploying the frontend and backend together.

## Example hosting setup

### Single web service

- Root directory: repo root
- Build command: `npm run build`
- Start command: `npm start`

### Health check

- `GET /api/health`
