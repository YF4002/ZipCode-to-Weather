document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('zip-form');
	const input = document.getElementById('zip-code');
	const result = document.querySelector('.result');

	function showResult(html) {
		if (!result) return;
		result.innerHTML = html;
		if (input && typeof input.focus === 'function') input.focus();
	}

	function appendResult(html) {
		if (!result) return;
		result.innerHTML += html;
	}

	function showError(msg) {
		showResult(`<p class="error">${msg}</p>`);
	}

	//fetch Zippopotam
	function fetchPlace(zip) {
		return fetch(`https://api.zippopotam.us/us/${zip}`)
			.then((response) => {
				if (!response.ok) {
					if (response.status === 404) throw new Error('ZIP code not found.');
					throw new Error('Network response was not ok.');
				}
				return response.json();
			})
			.then((data) => {
				const place = (data.places && data.places[0]) || null;
				if (!place) throw new Error('No place information returned for this ZIP code.');
				return place;
			});
	}

	const params = new URLSearchParams(window.location.search);
	const zipParam = params.get('zip');

	if (zipParam) {
		showResult('<p>Loading&hellip;</p>');
		fetchPlace(zipParam)
			.then(place => {
				const html = `
					<p style="color:black; font-size: 0.8em;">${place['place name']}${place['state abbreviation'] ? `, ${place['state abbreviation']}` : ''}</p>
				`;
				showResult(html);

				const lat = place['latitude'].trim();
				const lon = place['longitude'].trim();
				return fetchWeather(lat, lon);
			})
			.then(weatherData => {
				if (!weatherData) return;
				const weatherHtml = `
					<p style="font-size:2.2em;">${weatherData.main.temp} °F</p>
				`;
				appendResult(weatherHtml);
				// change text color based on temperature
				if (typeof changeTextColorBasedOnTemperature === 'function') {
					changeTextColorBasedOnTemperature(weatherData.main.temp);
				}
			})
			.catch(err => {
				showError(err.message || 'An error occurred while looking up the ZIP code.');
			});
	}

	if (form && input) {
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			const zip = input.value.trim();
			if (!/^[0-9]{5}$/.test(zip)) {
				showError('Please enter a valid 5-digit ZIP code.');
				return;
			}
			window.location.href = `temp.html?zip=${encodeURIComponent(zip)}`;
		});
	}
});


//Grab the lat and Long from zippopotamus response and use it to fetch weather data from OpenWeatherMap API
function fetchWeather(lat, lon) {
	const apiKey = 'c092edd730ebb7c6c2270b478a8e0928';
	const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
	// Return the fetch promise so callers can chain and decide what to render.
	return fetch(url)
		.then(response => {
			if (!response.ok) {
				throw new Error('Failed to fetch weather data.');
			}
			return response.json();
		})
		.catch(err => {
			console.error(err.message);
			return null;
		});
}

function changeTextColorBasedOnTemperature(temp) {
	const resultDiv = document.querySelector('.result');
	if (temp <= 60) {
		resultDiv.style.color = 'rgba(116, 144, 199, 1)';
	} else {
		resultDiv.style.color = 'rgba(202, 85, 0, 1)';
	}
}
