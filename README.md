# SkyPulse - Real-Time Weather Dashboard

A production-grade, responsive, client-side **Weather Dashboard** web application designed to master **Asynchronous JavaScript, RESTful APIs, DOM manipulation, and local data persistence**.

Built to fulfill all core criteria of the **Asynchronous JavaScript & RESTful APIs** task:
- ✅ **Modern Fetch API & `async/await`**: Clean asynchronous requests to public REST APIs without external libraries.
- ✅ **Comprehensive Error Handling**: Handles network disconnection (offline detection), invalid/unrecognized city names (404/empty results), server HTTP errors, GPS geolocation errors, and user input validation with dismissible feedback banners and retry actions.
- ✅ **Complex Nested JSON Parsing**: Extracts and formats multi-level nested payloads: current metrics, hourly forecast array, daily forecast summaries, solar schedule, and WMO weather condition codes.
- ✅ **Interactive Search & Location**: Search by city name with `Enter` key/button trigger, instant input clearing, 1-click recent search chips backed by `localStorage`, and browser GPS Geolocation ("My Location").
- ✅ **Live Weather Telemetry Display**:
  - **Temperature**: Big bold display with dynamic °C / °F toggle and "Feels Like" index.
  - **Humidity**: Relative humidity percentage with a visual progress bar and comfort rating.
  - **Wind Speed & Direction**: Calculated speed (km/h or mph), 16-point cardinal compass direction, and Beaufort scale description.
  - **Atmospheric Pressure**: Barometric reading in hPa with pressure system classification.
  - **UV Index**: Daily maximum UV index with color-coded risk scale.
  - **Sun Schedule**: Sunrise and Sunset times formatted in local time.
  - **Precipitation**: Rain volume and probability percentage.
  - **24-Hour Forecast**: Horizontal scrolling carousel with time, weather icon, temperature, and rain chance.
  - **7-Day Extended Forecast**: Daily minimum/maximum temperature range bar and weather description.
- ✅ **Dynamic Weather-Adaptive Themes**: Automatic theme styling (`Clear`, `Cloudy`, `Rain`, `Snow`, `Thunderstorm`, `Night`) based on live weather condition codes.

---

## 🚀 Quick Start Guide

### Option 1: Direct Browser Launch
Simply double-click [`index.html`](file:///C:/Users/vijay/Desktop/Vish/Projects/weather-dashboard/index.html) or open it with any modern web browser (Google Chrome, Microsoft Edge, Firefox, Brave).

### Option 2: Local HTTP Server (Recommended)
You can run a lightweight local static server using Python or Node.js:

```powershell
# Using Python
cd "C:\Users\vijay\Desktop\Vish\Projects\weather-dashboard"
python -m http.server 8080

# Or using npx serve
npx serve .
```
Then visit: `http://localhost:8080`

---

## 📁 File Structure

```
weather-dashboard\
├── index.html        # Semantic HTML5 layout with glassmorphic cards and accessible widgets
├── style.css         # Modern responsive CSS, glassmorphism, animations, weather themes
├── app.js            # Asynchronous JavaScript: Fetch API, async/await, error handling, state
└── README.md         # Detailed documentation, API specifications, and architectural overview
```

---

## 🌐 Public REST APIs Used

1. **Open-Meteo Geocoding API** (Free, No API Key Required)
   - `GET https://geocoding-api.open-meteo.com/v1/search?name={city}&count=5&language=en&format=json`
   - Converts city names into coordinates (latitude, longitude, timezone, administrative region, country).

2. **Open-Meteo Weather Forecast API** (Free, No API Key Required)
   - `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=...&hourly=...&daily=...&timezone={timezone}`
   - Returns real-time current conditions, 24-hour hourly predictions, and 7-day daily forecasts.

3. **BigDataCloud Reverse Geocoding API** (Free, Client-Side)
   - `GET https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en`
   - Resolves GPS coordinates into friendly locality and city names.

---

## 🧪 Testing Scenarios & Verification

| Test Scenario | Steps to Test | Expected Behavior |
| :--- | :--- | :--- |
| **City Search** | Enter "Tokyo" and click **Get Weather** | Fetches live coordinates and displays Tokyo weather metrics with Tokyo local time. |
| **Error Handling (Invalid City)** | Enter "NonExistentCity9999" and click **Get Weather** | Red error card appears: *"Could not find any location matching..."* with a **Retry** button. |
| **Error Handling (Empty Input)** | Clear input and press **Enter** | Validation message appears prompt to enter a city name. |
| **Offline Mode** | Disconnect Wi-Fi / simulate Offline in DevTools | Warning banner appears: *"You are currently offline"*. |
| **Unit Toggle** | Click **°F** then click **°C** | Dynamically recalculates and updates all temperatures and wind speeds instantly without re-fetching. |
| **Recent Searches** | Search 2-3 cities | Chips appear below the search bar; clicking any chip instantly retrieves that city's weather. |
| **GPS Location** | Click **📍 My Location** | Requests browser location and loads weather for current coordinates. |
