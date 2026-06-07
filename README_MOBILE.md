# Tusic Mobile & Tablet App

This is the mobile version of Tusic, built with React Native (Expo) and a FastAPI backend.

## 1. Backend Deployment (Render)

The backend is designed to be hosted on [Render](https://render.com).

### Steps to host on Render:
1.  Create a new **Web Service** on Render.
2.  Connect this GitHub repository.
3.  Set the **Root Directory** to `backend`.
4.  Render will automatically detect the `Dockerfile`.
5.  If not using Docker, set:
    - **Build Command:** `pip install -r requirements.txt`
    - **Start Command:** `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000`
6.  Once deployed, copy your Render URL (e.g., `https://tusic-api.onrender.com`).

### Local Backend Start:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 2. Mobile App Setup

### Configure API URL:
Open `mobile/src/api/index.js` and update `API_BASE_URL` with your Render URL or your local machine's IP address.

### Install dependencies:
```bash
cd mobile
npm install
```

### Start the app:
```bash
npx expo start
```
-   **Android:** Press `a` to open in an Android Emulator or use the **Expo Go** app on your device.
-   **Tablet:** Use an Android Tablet emulator or device for the optimized layout.

## 3. Features
-   **Search:** Find any song or artist.
-   **Streaming:** High-quality audio streaming.
-   **Lyrics:** Synchronized lyrics for supported tracks.
-   **Library:** Save songs to your playlist and track your history.
-   **Responsive:** Optimized for both mobile phones and tablets.
