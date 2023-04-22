'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const clearall = document.querySelector('.clear');
const deleteworkout = document.querySelector('.delete')
const sort = document.querySelector('.sort')

// Getting geolocation info from the user
// 
// let map , mapcoord
// navigator.geolocation.getCurrentPosition(function(e){
//     const {latitude,longitude} = e.coords
//     const coords = [latitude,longitude]
//     map = L.map('map').setView(coords, 9);

// L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);

// // attaching an event handler 
// map.on('click', function(mapEvent){
//     const {lat,lng} = mapEvent.latlng
//     mapcoord = [lat,lng]
//     // rendering the form when the user clicks on the map.

//     form.classList.remove('hidden')
//     inputDistance.focus()
    
// })



// }, function(){
//     console.log(`we can't get your position`)

// }) 

// inputType.addEventListener('change', function(){
//     inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
//     inputCadence.closest('.form__row').classList.toggle('form__row--hidden')

// })

// // adding the marker to the map after the user submits the form.
// form.addEventListener('submit', function(e){
//     e.preventDefault()
//     inputDistance.value = inputDuration.value = inputElevation.value = inputCadence.value = ''
// L.marker(mapcoord).addTo(map)
// .bindPopup(L.popup({
//     maxWidth: 450,
//     minWidth: 200,
//     autoClose: false,
//     closeOnClick: false,
//     className: 'running-popup',
// }))
// .setPopupContent('workout')
// .openPopup();
// })

// let map , mapEvent

// an applicatioon class consisting of all the methods that handle the events.

// a parent class to hold the data 
class workout{
    // public fields 
    date = new Date()
    id = (Date.now() + '').slice(-10)
    constructor(distance, duration, coords ){
        this.distance = distance;
        this.duration = duration;
        this.coords = coords;//[latitude, longtude]
    }
    _setdescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = ` ${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDay()}`
    }
}

// child classes
class running extends workout{
    constructor(distance, duration, coords, cadence){
        // dry
        super(distance,duration,coords)
        this.cadence = cadence
        this.type = 'running'
        this.calcpace()
        this._setdescription()
}
    // min/km
    calcpace(){
        this.pace = Math.trunc(this.duration/this.distance)
        return this.pace
    }
}
class cycling extends workout{
    constructor(distance, duration, coords, elevation){
        // dry
        super(distance,duration,coords)
        this.elevation = elevation
        this.type = 'cycling'
        this.calcspeed()
        this._setdescription()
}
    // km/hr
    calcspeed(){
        this.speed = Math.trunc(this.distance/(this.duration/60))
        return this.speed
    }
}

///////////////////////////////////////
// application architecture
class app{
    // private 
    #map;
    #mapEvent;
    #workout = [];
    #zoomlevel = 15;
    
    // the constructor is invoked as soon as the instance is initialized.
    constructor(){
        this._getposition();
        this._getlocalstorage()
        // handling form submission
            // this key word in addEventListener points to the attached dom element.
form.addEventListener('submit', this._newworkout.bind(this))

// handing the running/cycling form 
inputType.addEventListener('change', this._toggleelev)

// handling the move to popup

containerWorkouts.addEventListener('click', this._movetopopup.bind(this))
 // hadling the delete workout event
containerWorkouts.addEventListener('click', this._deleteworkout.bind(this))
// handling the clear workouts event
clearall.addEventListener('click',this._clearall.bind(this))

}

    _getposition(){
        // get position
        // on a regular function call this key word is set to undefined.
        navigator.geolocation.getCurrentPosition(this._loadmap.bind(this), function(){
            console.log(`Soory we can't get your position`)
        })

    }
    _loadmap(position){
        // loadmap
            const {latitude,longitude} = position.coords
            const coords = [latitude, longitude]
            this.#map = L.map('map').setView(coords, this.#zoomlevel);
            
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        
        // curret position of use
        L.marker(coords).addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth: 150,
            autoClose: false,
            closeOnClick: false
        }))
        .setPopupContent('Current location 📍')
        .openPopup();
        // map click event 
        this.#map.on('click',this._showform.bind(this))

        this.#workout.forEach(workout => {
            //  rendering the workout marker in the map from the loacl storage data. we can't invoke this function inside the getlocalworkout function because the map has to load first.
            this._renderworkoutmarker(workout)
        })
    }

    _showform(e){
            this.#mapEvent = e
            form.classList.remove('hidden')
            form.focus()    
        }
    
    _hideform(){
    
    inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = ''

    form.style.display = 'none'
    // hiding the form ui
    form.classList.add('hidden')

    setTimeout(()=>{
        form.style.display = 'grid'
    }, 1000)

    }

    _toggleelev(){
            inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
            inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
    }
    _newworkout(e){
        const distance = +inputDistance.value
        const duration = +inputDuration.value
        const type = inputType.value
        // a function to put workout marker in the map
            e.preventDefault()
            const {lat,lng} = this.#mapEvent.latlng
            
            // a small helper function to check conditions
            const validnumbers = (...all) => all.every(input => 
                Number.isFinite(input))
            const allposetive = (...given) => given.every(entry => entry > 0)
            let workout
            
            // If workout is a running
            if(type === 'running'){
                const cadence = +inputCadence.value
                if(
                    !validnumbers(distance,duration,cadence) ||
                    !allposetive(distance,duration,cadence) ) 
                return alert('All Inputs should be numbers !!')
                
                // creating workout object
                workout = new running(distance,duration,[lat,lng], cadence)
                this.#workout.push(workout)
                
}              
            // If workout is cycling
            if(type === 'cycling'){
                const elevation = +inputElevation.value
                if(
                    !validnumbers(distance,duration,elevation) ||
                    !allposetive(distance,duration))
                return alert('All Inputs should be posetive numbers !!')

                // creating workout object
                workout = new cycling(distance,duration,[lat,lng], elevation)
                this.#workout.push(workout)

            }
            // rendering the workout marker on the map
            this._renderworkoutmarker(workout)
            // rendering the workout list in the DOM
            this._renderworkoutlist(workout)
            // hiding the form 
            this._hideform()
            // local storage
            this._setlocalStorage()

}
    
        // rendering the workout marker
    _renderworkoutmarker(workout)
        {
            L.marker(workout.coords).addTo(this.#map)
        .bindPopup(L.popup({
            className: `${workout.type}-popup`,
            maxWidth: 300,
            minWidth: 150,
            autoClose: false,
            closeOnClick: false
        }))
        .setPopupContent(`${workout.type === 'running' ? `🏃🏻‍♂️${workout.description}`: `🚴🏻${workout.description}`}`)
        .openPopup();
    }
    // rendering workout list
    _renderworkoutlist(workout){
        const html = `
        <li class="workout workout--${workout.type}" data-id= '${workout.id}'>
        
        <h2 class="workout__title">${workout.description}
        <span class = 'delete'> 🗑️ </span>
        </h2>
        
        <div class="workout__details">
        <span class="workout__icon">${workout.type === 'cycling'? '🚴🏻': '🏃🏻‍♂️'} </span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.type === 'cycling' ? workout.speed : workout.pace}</span>
        <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
        <span class="workout__icon">${workout.type === 'cycling'? '🏔️' : '🦶🏻'}</span>
        <span class="workout__value">${workout.type ==='cycling'? workout.elevation : workout.cadence}</span>
        <span class="workout__unit">spm</span>
        </div>
        
        `

         // rendering the workout html
        form.insertAdjacentHTML('afterend',html)
    }

    _movetopopup(e){
        const movetoworkout = e.target.closest('.workout')
        if(!movetoworkout) return
        const clickedworkout = this.#workout.find(wk => wk.id === movetoworkout.dataset.id)
        this.#map.setView(clickedworkout.coords, this.#zoomlevel, {
            animate: true,
            autoPanOnFocus: true,
            pan: {
                duration: 1
            }
        })
    }
    _setlocalStorage(){
        // the local storage api.
        localStorage.setItem('workouts', JSON.stringify(this.#workout))
    }

    // the data retrieved from the local storage doesnot have any type of prototype chain link or relationsship with the running/cycling/workout classes. it is a stand alone object.
    _getlocalstorage(){
        const data = JSON.parse(localStorage.getItem('workouts'))
          // guard clause
        if(!data) return
        // if the workout array is empty as the page loads, we have to set it to the local storage data.
        this.#workout = data
       // rendering the local storage workouts in the dom
        this.#workout.forEach(workout => {
            this._renderworkoutlist(workout)
        })
        
    }
    _clearall(){
        if(this.#workout.length >= 1){
        // removing the workout lists from the dom
        containerWorkouts.innerHTML = ''
        // delete all elements from the array
        this.#workout = []
        // delete all workouts from the local storage
        localStorage.removeItem('workouts')
        //
        location.reload()
        }
        else{
            alert('Nothing to be cleared !!')
        }
    }
    
    _deleteworkout(e){
        if(e.target.classList.contains('delete')){
            const target = e.target.closest('.workout')
            const targetworkout = this.#workout.find(workout => workout.id === target.dataset.id)
            // delete the target workout
            this.#workout = this.#workout.filter(workouts => workouts.id !== targetworkout.id)
            // delete the workout from the list
                target.style.display = 'none'
            // delete the workout from the local storage
            this._setlocalStorage()
            // delete the marker from the list.
            setTimeout(()=>{
                // map fade-out for smooth reload
                document.body.classList.add('fade-out')
                // delete the marker from the list.
            location.reload()
            },600)
        }
    }
    
}
const harun = new app()
