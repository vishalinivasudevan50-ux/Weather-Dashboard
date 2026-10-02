/**
 * ==============================================================================
 * SKYPULSE WEATHER DASHBOARD - CORE APPLICATION LOGIC
 * ==============================================================================
 * Demonstrates:
 * 1. Modern Fetch API & async/await for RESTful API communication.
 * 2. Comprehensive error handling (network failure, 404, rate limits, geolocation).
 * 3. Deep nested JSON parsing & WMO weather code mapping.
 * 4. State management, unit toggling (°C/°F), and localStorage caching.
 * 5. Dynamic DOM manipulation with responsive transitions and weather themes.
 * ==============================================================================
 */

'use strict';

// ==============================================================================
// 1. CONFIGURATION & CONSTANTS
// ==============================================================================

const CONFIG = {
  GEOCODING_API: 'https://geocoding-api.open-meteo.com/v1/search',
  REVERSE_GEO_API: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
  WEATHER_API: 'https://api.open-meteo.com/v1/forecast',
  STORAGE_KEYS: {
    RECENT_SEARCHES: 'skypulse_recent_searches',
    UNIT: 'skypulse_temp_unit',
    LAST_CITY: 'skypulse_last_city'
  },
  MAX_RECENT_SEARCHES: 6,
  DEFAULT_CITY: 'London'
};

/**
 * WMO Weather Interpretation Codes (WW) mapping
 * Maps WMO code to human-readable description, icon, and dynamic theme class.
 */
const WMO_WEATHER_MAP = {
  0: { desc: 'Clear Sky', icon: '☀️', iconNight: '🌙', theme: 'theme-clear' },
  1: { desc: 'Mainly Clear', icon: '🌤️', iconNight: '🌤️', theme: 'theme-clear' },
  2: { desc: 'Partly Cloudy', icon: '⛅', iconNight: '☁️', theme: 'theme-clouds' },
  3: { desc: 'Overcast', icon: '☁️', iconNight: '☁️', theme: 'theme-clouds' },
  45: { desc: 'Foggy', icon: '🌫️', iconNight: '🌫️', theme: 'theme-clouds' },
  48: { desc: 'Depositing Rime Fog', icon: '🌫️', iconNight: '🌫️', theme: 'theme-clouds' },
  51: { desc: 'Light Drizzle', icon: '🌦️', iconNight: '🌧️', theme: 'theme-rain' },
  53: { desc: 'Moderate Drizzle', icon: '🌧️', iconNight: '🌧️', theme: 'theme-rain' },
  55: { desc: 'Dense Drizzle', icon: '🌧️', iconNight: '🌧️', theme: 'theme-rain' },
  56: { desc: 'Light Freezing Drizzle', icon: '🌨️', iconNight: '🌨️', theme: 'theme-snow' },
  57: { desc: 'Dense Freezing Drizzle', icon: '🌨️', iconNight: '🌨️', theme: 'theme-snow' },
  61: { desc: 'Slight Rain', icon: '🌦️', iconNight: '🌧️', theme: 'theme-rain' },
  63: { desc: 'Moderate Rain', icon: '🌧️', iconNight: '🌧️', theme: 'theme-rain' },
  65: { desc: 'Heavy Rain', icon: '🌧️', iconNight: '🌧️', theme: 'theme-rain' },
  66: { desc: 'Light Freezing Rain', icon: '🌨️', iconNight: '🌨️', theme: 'theme-snow' },
  67: { desc: 'Heavy Freezing Rain', icon: '🌨️', iconNight: '🌨️', theme: 'theme-snow' },
  71: { desc: 'Slight Snowfall', icon: '🌨️', iconNight: '🌨️', theme: 'theme-snow' },
  73: { desc: 'Moderate Snowfall', icon: '❄️', iconNight: '❄️', theme: 'theme-snow' },
  75: { desc: 'Heavy Snowfall', icon: '❄️', iconNight: '❄️', theme: 'theme-snow' },
  77: { desc: 'Snow Grains', icon: '❄️', iconNight: '❄️', theme: 'theme-snow' },
  80: { desc: 'Slight Rain Showers', icon: '🌦️', iconNight: '🌧️', theme: 'theme-rain' },
  81: { desc: 'Moderate Rain Showers', icon: '🌧️', iconNight: '🌧️', theme: 'theme-rain' },
  82: { desc: 'Violent Rain Showers', icon: '⛈️', iconNight: '⛈️', theme: 'theme-thunder' },
  85: { desc: 'Slight Snow Showers', icon: '🌨️', iconNight: '🌨️', theme: 'theme-snow' },
  86: { desc: 'Heavy Snow Showers', icon: '❄️', iconNight: '❄️', theme: 'theme-snow' },
  95: { desc: 'Thunderstorm', icon: '⛈️', iconNight: '⛈️', theme: 'theme-thunder' },
  96: { desc: 'Thunderstorm with Slight Hail', icon: '⛈️', iconNight: '⛈️', theme: 'theme-thunder' },
  99: { desc: 'Thunderstorm with Heavy Hail', icon: '⛈️', iconNight: '⛈️', theme: 'theme-thunder' }
};

// ==============================================================================
// 2. APPLICATION STATE
// ==============================================================================

const state = {
  currentUnit: localStorage.getItem(CONFIG.STORAGE_KEYS.UNIT) || 'C',
  currentLocation: null,
  weatherData: null,
  recentSearches: [],
  lastQuery: '',
  isLoading: false
};

// ==============================================================================
// 3. DOM ELEMENT REFERENCES
// ==============================================================================

const DOM = {
  body: document.body,
  liveClock: document.getElementById('liveClock'),
  searchForm: document.getElementById('searchForm'),
  cityInput: document.getElementById('cityInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  searchSubmitBtn: document.getElementById('searchSubmitBtn'),
  btnText: document.querySelector('.btn-text'),
  btnSpinner: document.querySelector('.btn-spinner'),
  geoBtn: document.getElementById('geoBtn'),
  unitCelsius: document.getElementById('unitCelsius'),
  unitFahrenheit: document.getElementById('unitFahrenheit'),
  
  // Status & Alerts
  offlineBanner: document.getElementById('offlineBanner'),
  errorCard: document.getElementById('errorCard'),
  errorTitle: document.getElementById('errorTitle'),
  errorMessage: document.getElementById('errorMessage'),
  retryBtn: document.getElementById('retryBtn'),
  dismissErrorBtn: document.getElementById('dismissErrorBtn'),
  loadingIndicator: document.getElementById('loadingIndicator'),
  loadingMessage: document.getElementById('loadingMessage'),
  
  // Recent Searches
  recentChips: document.getElementById('recentChips'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),

  // Hero Card Elements
  cityName: document.getElementById('cityName'),
  cityRegion: document.getElementById('cityRegion'),
  weatherUpdatedTime: document.getElementById('weatherUpdatedTime'),
  heroWeatherIcon: document.getElementById('heroWeatherIcon'),
  heroWeatherDescription: document.getElementById('heroWeatherDescription'),
  currentTemp: document.getElementById('currentTemp'),
  tempUnitDisplay: document.getElementById('tempUnitDisplay'),
  feelsLikeTemp: document.getElementById('feelsLikeTemp'),
  minMaxTemp: document.getElementById('minMaxTemp'),
  geoCoordinates: document.getElementById('geoCoordinates'),

  // Metric Cards
  humidityValue: document.getElementById('humidityValue'),
  humidityBar: document.getElementById('humidityBar'),
  humidityRating: document.getElementById('humidityRating'),
  
  windSpeedValue: document.getElementById('windSpeedValue'),
  windDirection: document.getElementById('windDirection'),
  windBeaufort: document.getElementById('windBeaufort'),
  
  pressureValue: document.getElementById('pressureValue'),
  pressureState: document.getElementById('pressureState'),
  
  uvValue: document.getElementById('uvValue'),
  uvBar: document.getElementById('uvBar'),
  uvLevel: document.getElementById('uvLevel'),
  
  sunriseTime: document.getElementById('sunriseTime'),
  sunsetTime: document.getElementById('sunsetTime'),
  
  precipValue: document.getElementById('precipValue'),
  precipProbability: document.getElementById('precipProbability'),
  daylightStatus: document.getElementById('daylightStatus'),

  // Forecast Tracks
  hourlyTrack: document.getElementById('hourlyTrack'),
  dailyForecastList: document.getElementById('dailyForecastList')
};

// ==============================================================================
// 4. UTILITY & HELPER FUNCTIONS
// ==============================================================================

/**
 * Convert temperature from Celsius to current user-selected unit
 */
function formatTemp(celsius) {
  if (celsius === null || celsius === undefined || isNaN(celsius)) return '--';
  if (state.currentUnit === 'F') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius);
}

/**
 * Convert wind speed (km/h) to mph if Fahrenheit is selected
 */
function formatWindSpeed(kmh) {
  if (kmh === null || kmh === undefined || isNaN(kmh)) return '-- km/h';
  if (state.currentUnit === 'F') {
    const mph = Math.round(kmh * 0.621371);
    return `${mph} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

/**
 * Convert degree bearing into 16-point cardinal direction
 */
function getWindDirectionCardinal(degrees) {
  if (degrees === null || degrees === undefined) return '--';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Return human-friendly Beaufort scale description
 */
function getBeaufortScale(kmh) {
  if (kmh < 1) return 'Calm';
  if (kmh <= 5) return 'Light air';
  if (kmh <= 11) return 'Light breeze';
  if (kmh <= 19) return 'Gentle breeze';
  if (kmh <= 28) return 'Moderate breeze';
  if (kmh <= 38) return 'Fresh breeze';
  if (kmh <= 49) return 'Strong breeze';
  if (kmh <= 61) return 'Near gale';
  if (kmh <= 74) return 'Gale';
  if (kmh <= 88) return 'Strong gale';
  return 'Storm / Hurricane';
}

/**
 * Return humidity assessment
 */
function getHumidityRating(humidity) {
  if (humidity < 30) return 'Dry • Low moisture';
  if (humidity <= 60) return 'Comfortable • Ideal';
  if (humidity <= 75) return 'Moderate • Humid';
  return 'High humidity • Sticky';
}

/**
 * Return UV level assessment
 */
function getUVLevel(uv) {
  if (uv <= 2) return 'UV Risk: Low (Safe)';
  if (uv <= 5) return 'UV Risk: Moderate';
  if (uv <= 7) return 'UV Risk: High (Use Sunscreen)';
  if (uv <= 10) return 'UV Risk: Very High';
  return 'UV Risk: Extreme (Seek shade)';
}

/**
 * Format ISO datetime string to local 12h or 24h time string
 */
function formatTime(isoString) {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Live ticking system clock in the header
 */
function initClock() {
  const update = () => {
    const now = new Date();
    DOM.liveClock.textContent = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };
  update();
  setInterval(update, 1000);
}

// ==============================================================================
// 5. ASYNCHRONOUS API DATA FETCHING (Fetch API & async/await)
// ==============================================================================

/**
 * Search city coordinates using Open-Meteo Geocoding REST API
 * Handles 404, empty results, network errors
 */
async function searchCityCoordinates(cityName) {
  const sanitizedCity = cityName.trim();
  if (!sanitizedCity) {
    throw new Error('Please enter a valid city name.');
  }

  const endpoint = `${CONFIG.GEOCODING_API}?name=${encodeURIComponent(sanitizedCity)}&count=5&language=en&format=json`;

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Geocoding server responded with HTTP error ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error(`Could not find any location matching "${sanitizedCity}". Please check the spelling.`);
    }

    const match = data.results[0];
    return {
      name: match.name,
      admin1: match.admin1 || '',
      country: match.country || '',
      countryCode: match.country_code || '',
      latitude: match.latitude,
      longitude: match.longitude,
      timezone: match.timezone || 'auto'
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network connection failed. Please check your internet connectivity.');
    }
    throw error;
  }
}

/**
 * Reverse geocode latitude/longitude to a city name
 */
async function reverseGeocode(latitude, longitude) {
  try {
    const endpoint = `${CONFIG.REVERSE_GEO_API}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('Reverse geocoding failed');
    const data = await response.json();
    return {
      name: data.city || data.locality || data.principalSubdivision || 'Current Location',
      admin1: data.principalSubdivision || '',
      country: data.countryName || '',
      countryCode: data.countryCode || '',
      latitude,
      longitude,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto'
    };
  } catch (e) {
    console.warn('Reverse geocoding fallback triggered:', e);
    return {
      name: 'Current Location',
      admin1: '',
      country: '',
      latitude,
      longitude,
      timezone: 'auto'
    };
  }
}

/**
 * Fetch comprehensive weather telemetry from Open-Meteo REST API
 * Retrieves current, hourly, and daily metrics in a single nested payload
 */
async function fetchWeatherData(latitude, longitude, timezone = 'auto') {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m'
    ].join(','),
    hourly: [
      'temperature_2m',
      'precipitation_probability',
      'weather_code',
      'is_day'
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_probability_max'
    ].join(','),
    timezone: timezone,
    forecast_days: '7'
  });

  const endpoint = `${CONFIG.WEATHER_API}?${params.toString()}`;

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Weather API returned HTTP status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.current || !data.daily || !data.hourly) {
      throw new Error('Received malformed weather telemetry from server.');
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to the weather service. Check your network connection.');
    }
    throw error;
  }
}

// ==============================================================================
// 6. MAIN COORDINATOR / TELEMETRY CONTROLLER
// ==============================================================================

/**
 * Complete workflow to search a city and update the dashboard
 */
async function loadWeatherForCity(cityName) {
  state.lastQuery = cityName;
  showLoading(`Locating and fetching weather data for "${cityName}"...`);
  hideError();

  try {
    // 1. Geocode city name to coordinates
    const location = await searchCityCoordinates(cityName);
    state.currentLocation = location;

    // 2. Fetch full weather data
    const weather = await fetchWeatherData(location.latitude, location.longitude, location.timezone);
    state.weatherData = weather;

    // 3. Render Dashboard
    renderDashboard();

    // 4. Save to Recent Searches and Cache
    addRecentSearch(location.name);
    localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_CITY, location.name);

  } catch (error) {
    console.error('Weather load error:', error);
    showError('Weather Lookup Failed', error.message || 'An unexpected error occurred while fetching weather data.');
  } finally {
    hideLoading();
  }
}

/**
 * Workflow to fetch weather using browser GPS Geolocation
 */
async function loadWeatherForCurrentLocation() {
  if (!navigator.geolocation) {
    showError('Geolocation Unsupported', 'Your browser does not support GPS Geolocation.');
    return;
  }

  showLoading('Requesting GPS location telemetry...');
  hideError();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        showLoading('Resolving your coordinates...');
        
        const location = await reverseGeocode(latitude, longitude);
        state.currentLocation = location;

        const weather = await fetchWeatherData(latitude, longitude, location.timezone);
        state.weatherData = weather;

        renderDashboard();
        addRecentSearch(location.name);
        localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_CITY, location.name);
      } catch (error) {
        showError('Location Weather Error', error.message || 'Failed to fetch weather for your location.');
      } finally {
        hideLoading();
      }
    },
    (geoError) => {
      hideLoading();
      let msg = 'Failed to retrieve location.';
      switch (geoError.code) {
        case geoError.PERMISSION_DENIED:
          msg = 'Location permission was denied. Please allow location access or search manually.';
          break;
        case geoError.POSITION_UNAVAILABLE:
          msg = 'Location information is currently unavailable.';
          break;
        case geoError.TIMEOUT:
          msg = 'Location request timed out. Please try again.';
          break;
      }
      showError('GPS Access Error', msg);
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
  );
}

// ==============================================================================
// 7. DYNAMIC DOM RENDERING & PARSING
// ==============================================================================

/**
 * Top-level dashboard render function
 */
function renderDashboard() {
  if (!state.weatherData || !state.currentLocation) return;

  const current = state.weatherData.current;
  const daily = state.weatherData.daily;
  const hourly = state.weatherData.hourly;
  const isDay = current.is_day === 1;

  // Resolve WMO condition
  const wmo = WMO_WEATHER_MAP[current.weather_code] || {
    desc: 'Unknown Condition',
    icon: '🌤️',
    iconNight: '🌙',
    theme: 'theme-default'
  };

  const activeIcon = isDay ? wmo.icon : (wmo.iconNight || wmo.icon);

  // 1. Dynamic Body Theme
  updateTheme(isDay ? wmo.theme : 'theme-night');

  // 2. Render Hero Overview Card
  DOM.cityName.textContent = state.currentLocation.name;
  const regionParts = [state.currentLocation.admin1, state.currentLocation.country].filter(Boolean);
  DOM.cityRegion.textContent = regionParts.length > 0 ? regionParts.join(', ') : 'Global Coordinates';
  
  DOM.weatherUpdatedTime.textContent = `Updated: ${new Date().toLocaleTimeString()} (Local)`;
  DOM.heroWeatherIcon.textContent = activeIcon;
  DOM.heroWeatherDescription.textContent = wmo.desc;
  
  DOM.currentTemp.textContent = formatTemp(current.temperature_2m);
  DOM.tempUnitDisplay.textContent = `°${state.currentUnit}`;
  DOM.feelsLikeTemp.textContent = `${formatTemp(current.apparent_temperature)}°${state.currentUnit}`;

  const maxTemp = daily.temperature_2m_max[0];
  const minTemp = daily.temperature_2m_min[0];
  DOM.minMaxTemp.textContent = `${formatTemp(maxTemp)}° / ${formatTemp(minTemp)}°`;

  const latSign = state.currentLocation.latitude >= 0 ? 'N' : 'S';
  const lonSign = state.currentLocation.longitude >= 0 ? 'E' : 'W';
  DOM.geoCoordinates.textContent = `${Math.abs(state.currentLocation.latitude).toFixed(2)}°${latSign}, ${Math.abs(state.currentLocation.longitude).toFixed(2)}°${lonSign}`;

  // 3. Render Detailed Metric Cards
  // Humidity
  const humidity = current.relative_humidity_2m;
  DOM.humidityValue.textContent = `${humidity}%`;
  DOM.humidityBar.style.width = `${Math.min(100, Math.max(0, humidity))}%`;
  DOM.humidityRating.textContent = getHumidityRating(humidity);

  // Wind Speed & Direction
  const windKmh = current.wind_speed_10m;
  DOM.windSpeedValue.textContent = formatWindSpeed(windKmh);
  const cardinal = getWindDirectionCardinal(current.wind_direction_10m);
  DOM.windDirection.textContent = `Direction: ${cardinal} (${current.wind_direction_10m}°)`;
  DOM.windBeaufort.textContent = getBeaufortScale(windKmh);

  // Pressure
  const pressure = Math.round(current.surface_pressure);
  DOM.pressureValue.textContent = `${pressure} hPa`;
  DOM.pressureState.textContent = pressure > 1013 ? 'High pressure system' : 'Low pressure system';

  // UV Index
  const uvMax = daily.uv_index_max[0] || 0;
  DOM.uvValue.textContent = uvMax.toFixed(1);
  const uvPercent = Math.min(100, (uvMax / 12) * 100);
  DOM.uvBar.style.width = `${uvPercent}%`;
  DOM.uvLevel.textContent = getUVLevel(uvMax);

  // Sun Schedule
  DOM.sunriseTime.textContent = formatTime(daily.sunrise[0]);
  DOM.sunsetTime.textContent = formatTime(daily.sunset[0]);

  // Precipitation
  const precip = current.precipitation !== undefined ? current.precipitation : 0;
  const precipProb = daily.precipitation_probability_max[0] || 0;
  DOM.precipValue.textContent = `${precip.toFixed(1)} mm`;
  DOM.precipProbability.textContent = `Rain Chance: ${precipProb}%`;
  DOM.daylightStatus.textContent = isDay ? '☀️ Daytime Conditions' : '🌙 Nighttime Conditions';

  // 4. Render Hourly 24h Forecast Track
  renderHourlyForecast(hourly);

  // 5. Render 7-Day Extended Forecast List
  renderDailyForecast(daily);
}

/**
 * Render 24-hour horizontal forecast cards
 */
function renderHourlyForecast(hourly) {
  DOM.hourlyTrack.innerHTML = '';

  const currentTime = new Date();
  const currentHourISO = currentTime.toISOString().slice(0, 13); // "YYYY-MM-DDTHH"

  // Find index closest to current hour
  let startIndex = hourly.time.findIndex(t => t.startsWith(currentHourISO));
  if (startIndex === -1) startIndex = 0;

  const next24Hours = hourly.time.slice(startIndex, startIndex + 24);

  next24Hours.forEach((timeStr, idx) => {
    const dataIndex = startIndex + idx;
    const time = new Date(timeStr);
    const hourLabel = idx === 0 ? 'Now' : time.toLocaleTimeString([], { hour: 'numeric' });
    const code = hourly.weather_code[dataIndex];
    const isDay = hourly.is_day[dataIndex] === 1;
    const wmo = WMO_WEATHER_MAP[code] || { icon: '🌤️', iconNight: '🌙' };
    const icon = isDay ? wmo.icon : (wmo.iconNight || wmo.icon);
    const temp = formatTemp(hourly.temperature_2m[dataIndex]);
    const pop = hourly.precipitation_probability[dataIndex] || 0;

    const card = document.createElement('div');
    card.className = `hourly-card ${idx === 0 ? 'current-hour' : ''}`;
    card.innerHTML = `
      <span class="hourly-time">${hourLabel}</span>
      <span class="hourly-icon">${icon}</span>
      <span class="hourly-temp">${temp}°</span>
      <span class="hourly-pop">${pop > 0 ? `💧 ${pop}%` : ''}</span>
    `;
    DOM.hourlyTrack.appendChild(card);
  });
}

/**
 * Render 7-Day Daily Forecast List
 */
function renderDailyForecast(daily) {
  DOM.dailyForecastList.innerHTML = '';

  const count = Math.min(daily.time.length, 7);

  for (let i = 0; i < count; i++) {
    const date = new Date(daily.time[i] + 'T00:00:00');
    const dayName = i === 0 ? 'Today' : (i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' }));
    const dateFormatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const code = daily.weather_code[i];
    const wmo = WMO_WEATHER_MAP[code] || { desc: 'Scattered clouds', icon: '🌤️' };
    const min = formatTemp(daily.temperature_2m_min[i]);
    const max = formatTemp(daily.temperature_2m_max[i]);

    const item = document.createElement('div');
    item.className = 'daily-item';
    item.innerHTML = `
      <div class="daily-day">
        ${dayName}
        <small>${dateFormatted}</small>
      </div>
      <div class="daily-icon" title="${wmo.desc}">${wmo.icon}</div>
      <div class="daily-desc">${wmo.desc}</div>
      <div class="daily-temp-range">
        <span class="daily-low">${min}°</span>
        <div class="daily-bar-mini" aria-hidden="true">
          <div class="daily-bar-mini-fill" style="left: 15%; right: 15%;"></div>
        </div>
        <span class="daily-high">${max}°</span>
      </div>
    `;
    DOM.dailyForecastList.appendChild(item);
  }
}

/**
 * Update dynamic theme class on body
 */
function updateTheme(themeName) {
  DOM.body.className = '';
  DOM.body.classList.add(themeName);
}

// ==============================================================================
// 8. ERROR & LOADING STATE MANAGEMENT
// ==============================================================================

function showLoading(message) {
  state.isLoading = true;
  DOM.loadingMessage.textContent = message || 'Fetching live weather telemetry...';
  DOM.loadingIndicator.classList.remove('hidden');
  DOM.btnText.classList.add('hidden');
  DOM.btnSpinner.classList.remove('hidden');
  DOM.searchSubmitBtn.disabled = true;
}

function hideLoading() {
  state.isLoading = false;
  DOM.loadingIndicator.classList.add('hidden');
  DOM.btnText.classList.remove('hidden');
  DOM.btnSpinner.classList.add('hidden');
  DOM.searchSubmitBtn.disabled = false;
}

function showError(title, message) {
  DOM.errorTitle.textContent = title;
  DOM.errorMessage.textContent = message;
  DOM.errorCard.classList.remove('hidden');
}

function hideError() {
  DOM.errorCard.classList.add('hidden');
}

// ==============================================================================
// 9. RECENT SEARCHES (localStorage State Persistence)
// ==============================================================================

function loadRecentSearches() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.RECENT_SEARCHES);
    state.recentSearches = raw ? JSON.parse(raw) : ['London', 'New York', 'Tokyo', 'Chennai', 'Paris'];
    if (!Array.isArray(state.recentSearches)) {
      state.recentSearches = [];
    }
  } catch (e) {
    state.recentSearches = [];
  }
  renderRecentChips();
}

function addRecentSearch(cityName) {
  if (!cityName) return;
  const clean = cityName.trim();
  state.recentSearches = state.recentSearches.filter(c => c.toLowerCase() !== clean.toLowerCase());
  state.recentSearches.unshift(clean);
  if (state.recentSearches.length > CONFIG.MAX_RECENT_SEARCHES) {
    state.recentSearches.pop();
  }
  try {
    localStorage.setItem(CONFIG.STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(state.recentSearches));
  } catch (e) {
    console.warn('Failed to save recent searches:', e);
  }
  renderRecentChips();
}

function removeRecentSearch(cityName) {
  state.recentSearches = state.recentSearches.filter(c => c.toLowerCase() !== cityName.toLowerCase());
  try {
    localStorage.setItem(CONFIG.STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(state.recentSearches));
  } catch (e) {
    console.warn('Failed to update recent searches:', e);
  }
  renderRecentChips();
}

function clearAllRecentSearches() {
  state.recentSearches = [];
  try {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.RECENT_SEARCHES);
  } catch (e) {
    console.warn('Failed to clear recent searches:', e);
  }
  renderRecentChips();
}

function renderRecentChips() {
  DOM.recentChips.innerHTML = '';
  
  if (state.recentSearches.length === 0) {
    DOM.recentChips.innerHTML = '<span style="font-size:0.8rem; color:var(--text-dim);">No recent searches</span>';
    DOM.clearHistoryBtn.classList.add('hidden');
    return;
  }

  DOM.clearHistoryBtn.classList.remove('hidden');

  state.recentSearches.forEach(city => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `
      <span class="chip-text">${city}</span>
      <span class="chip-remove" data-city="${city}" title="Remove">✕</span>
    `;

    chip.querySelector('.chip-text').addEventListener('click', () => {
      DOM.cityInput.value = city;
      loadWeatherForCity(city);
    });

    chip.querySelector('.chip-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      removeRecentSearch(city);
    });

    DOM.recentChips.appendChild(chip);
  });
}

// ==============================================================================
// 10. TEMPERATURE UNIT TOGGLE (°C / °F)
// ==============================================================================

function setTemperatureUnit(unit) {
  if (state.currentUnit === unit) return;
  state.currentUnit = unit;
  try {
    localStorage.setItem(CONFIG.STORAGE_KEYS.UNIT, unit);
  } catch (e) {
    console.warn('Failed to save unit preference:', e);
  }

  DOM.unitCelsius.classList.toggle('active', unit === 'C');
  DOM.unitFahrenheit.classList.toggle('active', unit === 'F');

  // Dynamically re-render with cached telemetry without an extra API call!
  if (state.weatherData) {
    renderDashboard();
  }
}

// ==============================================================================
// 11. EVENT LISTENERS & INITIALIZATION
// ==============================================================================

function bindEvents() {
  // Form submission
  DOM.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = DOM.cityInput.value.trim();
    if (query) {
      loadWeatherForCity(query);
    } else {
      showError('Input Required', 'Please enter a city name to search.');
      DOM.cityInput.focus();
    }
  });

  // Input clear button
  DOM.cityInput.addEventListener('input', () => {
    DOM.clearSearchBtn.classList.toggle('hidden', !DOM.cityInput.value);
  });

  DOM.clearSearchBtn.addEventListener('click', () => {
    DOM.cityInput.value = '';
    DOM.clearSearchBtn.classList.add('hidden');
    DOM.cityInput.focus();
  });

  // Geolocation button
  DOM.geoBtn.addEventListener('click', () => {
    loadWeatherForCurrentLocation();
  });

  // Unit toggle buttons
  DOM.unitCelsius.addEventListener('click', () => setTemperatureUnit('C'));
  DOM.unitFahrenheit.addEventListener('click', () => setTemperatureUnit('F'));

  // Error banners
  DOM.dismissErrorBtn.addEventListener('click', hideError);
  DOM.retryBtn.addEventListener('click', () => {
    if (state.lastQuery) {
      loadWeatherForCity(state.lastQuery);
    } else {
      loadWeatherForCity(CONFIG.DEFAULT_CITY);
    }
  });

  // Clear search history
  DOM.clearHistoryBtn.addEventListener('click', clearAllRecentSearches);

  // Online / Offline detection
  window.addEventListener('online', () => {
    DOM.offlineBanner.classList.add('hidden');
  });

  window.addEventListener('offline', () => {
    DOM.offlineBanner.classList.remove('hidden');
  });

  // Initialize offline state if currently offline
  if (!navigator.onLine) {
    DOM.offlineBanner.classList.remove('hidden');
  }
}

/**
 * Application Entry Point
 */
function initApp() {
  initClock();
  loadRecentSearches();

  // Restore unit preference in UI
  DOM.unitCelsius.classList.toggle('active', state.currentUnit === 'C');
  DOM.unitFahrenheit.classList.toggle('active', state.currentUnit === 'F');

  bindEvents();

  // Load last saved city or default
  const savedLastCity = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_CITY) || CONFIG.DEFAULT_CITY;
  DOM.cityInput.value = savedLastCity;
  DOM.clearSearchBtn.classList.remove('hidden');
  loadWeatherForCity(savedLastCity);
}

// Start app once DOM is fully parsed
document.addEventListener('DOMContentLoaded', initApp);
