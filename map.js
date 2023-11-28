"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.setTime();
  }
  setTime() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    this.month = months[this.date.getMonth()];
    this.day = this.date.getDate();
  }
}

class running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    ////min/km
    this.pace = this.duration / this.distance;
  }
}

class cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }
  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
  }
}

class app {
  #map;
  #latx;
  #lngx;
  #Workouts = [];
  constructor() {
    this.#getposition();
    form.addEventListener("submit", this.#newWorkout.bind(this));
    inputType.addEventListener("change", this.#togglefield);
    containerWorkouts.addEventListener("click", this.#moveToCenter.bind(this));
  }

  #getposition() {
    navigator.geolocation.getCurrentPosition(
      this.#loadmap.bind(this),
      function () {
        alert("cant access this location");
      }
    );
  }

  #loadmap(position) {
    const { latitude, longitude } = position.coords;
    let coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 14);

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.fr/hot/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    /////////////// clicking on map
    this.#map.on("click", this.#showForm.bind(this));
  }

  #showForm(e) {
    form.classList.remove("hidden");
    let { lat, lng } = e.latlng;
    this.#latx = lat;
    this.#lngx = lng;
  }

  #togglefield() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  #newWorkout(e) {
    e.preventDefault();
    //////////  validation functions
    const validate1 = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const validate2 = (...inputs) => inputs.every((inp) => inp > 0);

    //////// inputs
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let Workout;
    /////// checking for running case
    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !validate1(distance, duration, cadence) ||
        !validate2(distance, duration, cadence)
      )
        return alert("This is not a positive number");
      Workout = new running(
        [this.#latx, this.#lngx],
        distance,
        duration,
        cadence
      );
    }

    /////// checking for cycling case
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !validate1(distance, duration, elevation) ||
        !validate2(distance, duration)
      )
        return alert("This is not a positive number");
      Workout = new cycling(
        [this.#latx, this.#lngx],
        distance,
        duration,
        elevation
      );
    }
    this.#Workouts.push(Workout);
    let html = `<li class="workout workout--${type}" data-id="${Workout.id}">
                <h2 class="workout__title">${type[0].toUpperCase()}${type.slice(
      1
    )} on ${Workout.month} ${Workout.day}</h2>
                <div class="workout__details">
                  <span class="workout__icon">${
                    type === "running" ? "🏃‍♂️" : "🚴‍♀️"
                  }</span>
                  <span class="workout__value">${Workout.distance}</span>
                  <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                  <span class="workout__icon">⏱</span>
                  <span class="workout__value">${Workout.duration}</span>
                  <span class="workout__unit">min</span>
                </div>`;

    if (type === "running") {
      html += `<div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${Workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${Workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;
    }
    if (type === "cycling") {
      html += `<div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${Workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/hr</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${Workout.elevationGain}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;
    }
    form.insertAdjacentHTML("afterend", html);

    //////////justify the form
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => {
      form.style.display = "grid";
    }, 1000);

    //////// clear singed data
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
    /////// sign new marker
    L.marker([this.#latx, this.#lngx])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 400,
          minWidth: 200,
          autoClose: false,
          closeOnClick: false,
          className: `${type}-popup`,
        })
      )
      .setPopupContent(
        `${
          type === "running" ? "🏃‍♂️" : "🚴‍♀️"
        } ${type[0].toUpperCase()}${type.slice(1)} on ${Workout.month} ${
          Workout.day
        }`
      )
      .openPopup();
  }
  #moveToCenter(e) {
    let target = e.target.closest(".workout");
    if (!target) return;
    let workout = this.#Workouts.find((ele) => ele.id === target.dataset.id);
    this.#map.setView(workout.coords, 14);
  }
}
const App = new app();
