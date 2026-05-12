# UrbanBreath

UrbanBreath is a mobile-first air-quality companion for everyday movement through the city. It helps people see what they are breathing, choose cleaner walking moments, and understand their estimated pollution exposure after a walk.

The app is built around a simple idea: air quality should be visible at street level while you are actually outside, not buried inside a weather report after the fact.

## What UrbanBreath Does

UrbanBreath turns live air-quality data into a map, a walk tracker, and a personal exposure summary. It is designed for commuters, students, runners, cyclists, parents, and anyone who wants a clearer sense of outdoor air before and during movement.

## Core Features

### Global AQI Map

Explore AQI zones across the visible map, not just around your current GPS location. The map uses colored air-quality gradients so you can quickly scan cleaner and more polluted areas while panning around the world.

### Live Location Awareness

UrbanBreath centers on your current location when permission is granted and keeps the experience focused on where you actually are. The live map highlights your position and nearby air-quality conditions.

### Walk Mode

Start a walk session and track your outdoor exposure in real time. Walk Mode shows elapsed time, distance, current AQI, average AQI, PM2.5, and estimated inhaled particle load while you move.

### Activity Presets

Choose between rest, walk, brisk walk, jog, run, and cycling. Each preset uses a different breathing-rate estimate, so exposure calculations better match the intensity of your activity.

### Breath Load Estimate

UrbanBreath estimates how much air you inhaled and how much PM2.5 exposure you accumulated during a session. The goal is to make invisible pollution feel understandable without turning it into medical advice.

### Walk Summary

After each session, review your walk with total time, distance, average AQI, PM2.5 exposure, worst point, and simple health-oriented insights.

### AQI Trend

The app shows recent AQI history so users can see whether conditions are improving, worsening, or staying stable.

### Pollutant Details

UrbanBreath surfaces key pollutant readings including PM2.5, PM10, NO2, CO, and ozone, giving more context than a single AQI number.

### Privacy-Friendly Crowd Memory

Anonymous local walk points can be stored on your own device to create a lightweight crowd-style heatmap. This data stays local and does not leave your device.

### Mobile-First Interface

The interface is designed around quick outdoor use: large controls, a persistent bottom nav, walk-friendly metrics, and a map-first layout that works well on phones.

## Why It Matters

Air quality changes by place, time, weather, traffic, and activity. Two routes through the same city can expose you to very different conditions. UrbanBreath helps make those differences easier to see before and during a walk.

## Good To Know

- Exposure values are estimates based on modeled air-quality data and typical breathing rates.
- UrbanBreath is not a medical device.
- Location access is used to show local air quality and track walk sessions.
- On mobile devices, location permission may require HTTPS.
- If live AQI data is unreachable, the app can fall back to demo-style readings so the interface still works.

## Running Locally

Backend:

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by the frontend server and allow location access when prompted.
