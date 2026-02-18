const API_KEY = 'b17b506ee456720dbb982ce96d1e9fc5';
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

function WeatherApp() {
  this.searchBtn = document.getElementById('search-btn');
  this.cityInput = document.getElementById('city-input');
  this.weatherDisplay = document.getElementById('weather-display');

  this.recentSearchesSection = document.getElementById('recent-searches-section');
  this.recentSearchesContainer = document.getElementById('recent-searches-container');
  this.recentSearches = [];
  this.maxRecentSearches = 5;
}

WeatherApp.prototype.init = function () {
  this.searchBtn.addEventListener('click', this.handleSearch.bind(this));
  this.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') this.handleSearch();
  });

  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', this.clearHistory.bind(this));
  }

  this.loadRecentSearches();
  this.loadLastCity();
};

WeatherApp.prototype.showWelcome = function () {
  this.weatherDisplay.innerHTML = `
    <div class="welcome-message">
      <h2>🌤️ Welcome to SkyFetch</h2>
      <p>Search for a city to get started</p>
      <p>Try: London, Paris, Tokyo</p>
    </div>
  `;
};

WeatherApp.prototype.showLoading = function () {
  this.weatherDisplay.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Loading weather...</p>
    </div>
  `;
};

WeatherApp.prototype.showError = function (message) {
  this.weatherDisplay.innerHTML = `
    <div class="error-message">
      ⚠️ <strong>Oops!</strong>
      <p>${message}</p>
    </div>
  `;
};

WeatherApp.prototype.handleSearch = function () {
  const city = this.cityInput.value.trim();

  if (!city) {
    this.showError('Please enter a city name.');
    return;
  }

  if (city.length < 2) {
    this.showError('City name is too short.');
    return;
  }

  this.getWeather(city);
  this.cityInput.value = '';
};

WeatherApp.prototype.getWeather = async function (city) {
  this.showLoading();
  this.searchBtn.disabled = true;
  this.searchBtn.textContent = 'Searching...';

  try {
    const [weatherRes, forecastRes] = await Promise.all([
      axios.get(`${WEATHER_URL}?q=${city}&appid=${API_KEY}&units=metric`),
      axios.get(`${FORECAST_URL}?q=${city}&appid=${API_KEY}&units=metric`)
    ]);

    this.displayWeather(weatherRes.data);
    const dailyForecasts = this.processForecastData(forecastRes.data.list);
    this.displayForecast(dailyForecasts);

    this.saveRecentSearch(city);
    localStorage.setItem('lastCity', city);

  } catch (error) {
    if (error.response && error.response.status === 404) {
      this.showError('City not found. Please check the spelling.');
    } else {
      this.showError('Something went wrong. Try again later.');
    }
  } finally {
    this.searchBtn.disabled = false;
    this.searchBtn.textContent = '🔍 Search';
  }
};

WeatherApp.prototype.displayWeather = function (data) {
  const cityName = data.name;
  const temperature = Math.round(data.main.temp);
  const description = data.weather[0].description;
  const icon = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

  this.weatherDisplay.innerHTML = `
    <div class="weather-info">
      <h2 class="city-name">${cityName}</h2>
      <img src="${iconUrl}" alt="${description}" class="weather-icon">
      <div class="temperature">${temperature}°C</div>
      <p class="description">${description}</p>
      <h3>5-Day Forecast</h3>
      <div class="forecast-container"></div>
    </div>
  `;
};

WeatherApp.prototype.processForecastData = function (list) {
  return list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);
};

WeatherApp.prototype.displayForecast = function (forecastList) {
  const container = document.querySelector('.forecast-container');
  container.innerHTML = '';

  forecastList.forEach(day => {
    const date = new Date(day.dt_txt);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const temp = Math.round(day.main.temp);
    const desc = day.weather[0].description;
    const icon = day.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    container.innerHTML += `
      <div class="forecast-card">
        <h4>${dayName}</h4>
        <img src="${iconUrl}" alt="${desc}">
        <p>${temp}°C</p>
        <small>${desc}</small>
      </div>
    `;
  });
};

WeatherApp.prototype.loadRecentSearches = function () {
  const saved = localStorage.getItem('recentSearches');
  if (saved) {
    this.recentSearches = JSON.parse(saved);
  }
  this.displayRecentSearches();
};

WeatherApp.prototype.saveRecentSearch = function (city) {
  const cityName = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

  const index = this.recentSearches.indexOf(cityName);
  if (index > -1) {
    this.recentSearches.splice(index, 1);
  }

  this.recentSearches.unshift(cityName);

  if (this.recentSearches.length > this.maxRecentSearches) {
    this.recentSearches.pop();
  }

  localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
  this.displayRecentSearches();
};

WeatherApp.prototype.displayRecentSearches = function () {
  this.recentSearchesContainer.innerHTML = '';

  if (this.recentSearches.length === 0) {
    this.recentSearchesSection.style.display = 'none';
    return;
  }

  this.recentSearchesSection.style.display = 'block';

  this.recentSearches.forEach(function (city) {
    const btn = document.createElement('button');
    btn.className = 'recent-search-btn';
    btn.textContent = city;

    btn.addEventListener('click', function () {
      this.cityInput.value = city;
      this.getWeather(city);
    }.bind(this));

    this.recentSearchesContainer.appendChild(btn);
  }.bind(this));
};

WeatherApp.prototype.loadLastCity = function () {
  const lastCity = localStorage.getItem('lastCity');
  if (lastCity) {
    this.getWeather(lastCity);
  } else {
    this.showWelcome();
  }
};

WeatherApp.prototype.clearHistory = function () {
  if (confirm('Clear all recent searches?')) {
    this.recentSearches = [];
    localStorage.removeItem('recentSearches');
    this.displayRecentSearches();
  }
};

const app = new WeatherApp();
app.init();
