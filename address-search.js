/**
 * The PlaceResult class from Google Places API
 * @external PlaceResult
 * @see https://developers.google.com/maps/documentation/javascript/reference/3/places-service#PlaceResult
 */

/** AddressSearch Class used to handle the AddressSearch module */
class AddressSearch{

    /**
     * Creates an instance of AddressSearch
     * and checks for invalid parameters
     * @param {(Element|String)} target                   	The input targeted by the AddressSearch module
     * @param {Object}           [parameters]             	Additional optional parameters
     * @param {Object}           [delay]             		Delay to wait between keypresses before calling the API
     */
    constructor(target, parameters = {}, delay){
        /** @private */
		this._input = target instanceof Element ? target : document.querySelector(target);
		
		/** @private */
		this._errors = [];

        //Errors checking
        if(!this._input){
			this._errors.push('AddressSearch: '+(typeof target == 'string' ? 'The selector `'+target+'` didn\'t match any element.' : 'The element you provided was undefined'));
		}
		if(this._input && this._input.classList.contains('address-search-input')){
			this._errors.push('AddressSearch: The element has already been initialized.');
		}

		if(!this._errors.length){ // GOOD TO GO !
			/** @type {Number} */
			this.uniqueId = document.querySelectorAll('.address-search[data-unique-id]').length + 1;

			/** @private */
			this._fetchPredictions = new google.maps.places.AutocompleteService();
			/** @private */
			this._fetchPlace = new google.maps.places.PlacesService(document.createElement('div'));

			/** @private */
			this._token = '';

			/** @private */
			this._usedTokens = [];

			/** @private */
			this._economizer = {};

			/** @private */
			this._lure = this._input.cloneNode(true);

			/** @private */
			this._onSelect = [];
			/** @private */
			this._onPredict = [];
			/** @private */
			this._onError = [];

			/** @private */
			this._parameters = parameters;

			/** @private */
			this._delay = delay;
			/** @private */
			this._lastKeypress = null;
			/** @private */
			this._timeout = null;

			/** @private */
			this._apiFields = ['address_component', 'adr_address', 'alt_id', 'formatted_address', 'geometry', 'icon', 'id', 'name', 'business_status', 'photo', 'place_id', 'plus_code', 'scope', 'type', 'url', 'utc_offset_minutes', 'vicinity'];

			/** @type {PlaceResult} */
			this.value = {};

			/** @private */
			this._components = Object.entries(this._parameters).reduce((acc, [component, target]) => {
				const targetElement = document.querySelector(target);

				if(targetElement){
					acc[component] = targetElement;
				}else{
					console.warn('The selector `'+target+'` didn\'t match any element.');
				}

				return acc;
			}, {});

			this._generateToken();
			this._build();
			this._listen();
		}else{
			this._errors.forEach(error => {
				console.warn(error);
			});
		}
    }

    /**
     * Builds the AddressSearch DOM Tree around the element
     * @private
     */
    _build(){
        this._wrapper = document.createElement('div');
		this._wrapper.classList.add('address-search');
		this._wrapper.setAttribute('data-unique-id', this.uniqueId);
        this._input.parentNode.insertBefore(this._wrapper, this._input);

		this._typeahead = document.createElement('input');
		this._typeahead.setAttribute('class', this._input.getAttribute('class'));
		this._typeahead.setAttribute('tabindex', -1);
        this._typeahead.classList.add('address-search-typeahead');
        
        let typeaheadLure = this._typeahead.cloneNode(true);
        typeaheadLure.classList.add('lure');

        this._wrapper.appendChild(typeaheadLure);
        this._wrapper.appendChild(this._typeahead);

        this._lure.classList.add('address-search-lure');
		this._lure.setAttribute('tabindex', -1);
        this._wrapper.appendChild(this._lure);

        this._input.classList.add('address-search-input');
        this._input.removeAttribute('id');
        this._input.removeAttribute('name');
        this._wrapper.appendChild(this._input);

        this._predictions = document.createElement('ul');
        this._predictions.classList.add('address-search-predictions');
		this._wrapper.appendChild(this._predictions);
		
		// Add lures to every component
		Object.values(this._components).forEach(element => {
			let lure = element.cloneNode(true);

			lure.removeAttribute('id');
			lure.removeAttribute('class');
			lure.removeAttribute('name');
			lure.classList.add('address-search-lure');
			lure.setAttribute('data-refer-to', this.uniqueId);
			lure.setAttribute('tabindex', -1);

			element.parentNode.insertBefore(lure, element);
		});
    }

    /**
     * Creates event listeners
     * @private
     */
    _listen(){
        this._input.addEventListener('input',() => {
			clearTimeout(this._timeout);
            this._lure.value = this._input.value;

			// Input not empty
            if(this._input.value.length){
                this._input.value = this._capitalize(this._input.value);
				this._lure.value = this._input.value;
				
				// Clean typeahead on delay
				if(this._delay){
					this._typeahead.value = '';
				}

                if(this._economizer[this._input.value]){
                    this._predictions.innerHTML = this._economizer[this._input.value];

                    if(this._predictions.firstElementChild.getAttribute('data-place-description').startsWith(this._input.value)){
                        this._typeahead.value = this._predictions.firstElementChild.getAttribute('data-place-description');
                    }else{
                        this._typeahead.value = '';
                    }

                    this._togglePredictions('on');

                    for(let callback of this._onPredict) callback.call(this,this._input.value,this._predictions);
                }else{
					if(this._delay){
						this._timeout = setTimeout(() => {
							this._getPredictions();
						}, this._delay);
					}else{
						this._getPredictions();
					}
                    
                }
            }else{
                this._typeahead.value = '';
                this._togglePredictions('off');
            }

            this.value = {};
        });

        this._input.addEventListener('keydown', e => {
            let key = e.keyCode || e.which;

            if(key == 9 || key == 13){ //TAB || ENTER
                e.preventDefault();

                if(this._input.value.length) this._select(this._predictions.firstElementChild.getAttribute('data-place-id'));
                else this._input.blur();
            }
        });

        this._input.addEventListener('blur',() => {
            if(Object.keys(this.value).length === 0 && this.value.constructor === Object){
                setTimeout(() => {
                    this._input.value = '';
                    this._lure.value = this._input.value;
                    this._typeahead.value = '';
                    this._togglePredictions('off');
                },1);
            }
            
        });

        this._predictions.addEventListener('mousedown', e => {
            this._predictions.classList.add('clicked');
        });

        this._predictions.addEventListener('click', e => {
            this._predictions.classList.remove('clicked');

            if(e.target && (e.target.nodeName == 'LI' || e.target.nodeName == 'SPAN')){
                let li = e.target.closest('li');
                this._select(li.getAttribute('data-place-id'))
            }
        });
	}
	
	/**
	 * Gets the predictions from the API
	 * @private
	 */
	_getPredictions(){
		this._fetchPredictions.getPlacePredictions({ input: this._input.value, sessiontoken: this._token }, (predictions, status) => {
			this._resetPredictions();

			if(status == google.maps.places.PlacesServiceStatus.OK){
				for(let prediction of predictions){
					let li = document.createElement('li');
					li.setAttribute('data-place-id', prediction.place_id);
					li.setAttribute('data-place-description', this._capitalize(prediction.description).replace(/"/g,"'"));

					let mainText = document.createElement('span');
					mainText.innerText = prediction.structured_formatting.main_text;
					li.appendChild(mainText);

					if(prediction.structured_formatting.secondary_text){
						let secondaryText = document.createElement('span');
						secondaryText.innerText = prediction.structured_formatting.secondary_text;
						li.appendChild(secondaryText);
					}

					this._predictions.appendChild(li);
				}

				this._economizer[this._input.value] = this._predictions.innerHTML;

				if(this._capitalize(predictions[0].description.substring(0, predictions[0].matched_substrings[0].length)) == this._input.value){
					this._typeahead.value = this._capitalize(predictions[0].description);
				}else{
					this._typeahead.value = '';
				}

				this._togglePredictions('on');

				//onPredict callbacks
				for(let callback of this._onPredict) callback.call(this,this._input.value,this._predictions);
			}else{
				if(status == 'ZERO_RESULTS'){
					let li = document.createElement('li');
					li.classList.add('empty-results');
					li.innerText = 'No address found';
					this._predictions.appendChild(li);

					this._typeahead.value = '';
				}else{
					console.log(status);
				}
			}
		});
	}

    /**
     * Empty the predictions
     * @private
     */
    _resetPredictions(){
        this._predictions.innerHTML = '';
    }

    /**
     * Toggles the predictions
     * @private
     */
    _togglePredictions(state){
        if(state){
            if(state == 'on') this._predictions.classList.add('shown');
            else this._predictions.classList.remove('shown');
        }else this._predictions.classList.toggle('shown');
    }

    /**
     * Capitalize a String
     * @private
     */
    _capitalize(str){
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Handles a place selection
     * @param {String} placeId The place ID
     * @param {Boolean} [triggerCallbacks=true] Should the method trigger the select callbacks?
     * @returns {Promise} - Resolves when the place has been selected
     * @private
     */
    _select(placeId, triggerCallbacks = true){
        return new Promise((resolve, reject) => {
            this._fetchPlace.getDetails({placeId: placeId, fields: this._apiFields, sessiontoken: this._token}, (place, status) => {
                if(status == google.maps.places.PlacesServiceStatus.OK){
					this._generateToken();
                    this._togglePredictions('off');
                    this._resetPredictions();
    
                    this.value = place;
                    this._input.value = place.formatted_address;
                    this._lure.value = this._input.value;
                    this._typeahead.value = '';
	
					Object.entries(this._components).forEach(([component, element]) => {
						let value = component.endsWith('_short') ? this._getPlaceComponent(component.slice(0, -6), true) : this._getPlaceComponent(component);

						element.value = value;
						element.previousElementSibling.value = value;
						element.readOnly = !!element.value.length;
					});
    
                    this._input.blur();
    
                    //onSelect callbacks
                    if(triggerCallbacks){
                        for(let callback of this._onSelect) callback.call(this,this.value);
                    }

                    resolve();
                }else{
					console.log(status);
					for(let callback of this._onError) callback.call(this,status);
                    reject(status);
                }
            });
        });
    }

    /**
     * Get a component for the current place.
     * @private
     */
    _getPlaceComponent(component,isShort){
        let target = this.value.address_components.filter(c => c.types.includes(component));
        if(target.length){
            return isShort ? target[0].short_name : target[0].long_name
        }else return '';
	}
	
	/**
     * Generate a new unique token for Google Places API
     * @private
     */
	_generateToken(){
		let newToken = this._token;
		while(newToken == '' || this._usedTokens.includes(newToken)){
			newToken = (Math.random() + 1).toString(36).substring(7);
		}
		this._token = newToken;
		this._usedTokens.push(this._token);
	}

    /**
     * Function called after a selection.
     * Using <code>this</code> inside it will return the current {@link AddressSearch}
     *
     * @callback onSelectCallback
     * @param {PlaceResult} address The selected address
     */

    /**
     * Adds a callback to be used when the user selects an address
     * @param {onSelectCallback} callback Function to call after the user's selection
     * @returns {AddressSearch}   The current {@link AddressSearch}
     */
    onSelect(callback){
		if(!this._errors.length) this._onSelect.push(callback);
        return this;
    }

    /**
     * Removes every callback previously added with {@link AddressSearch#onSelect}
     * @returns {AddressSearch} The current {@link AddressSearch}
     */
    offSelect(){
        if(!this._errors.length) this._onSelect = [];
        return this;
    }

    /**
     * Function called after a prediction.
     * Using <code>this</code> inside it will return the current {@link AddressSearch}
     *
     * @callback onPredictCallback
     * @param {String}              value        The user's input
     * @param {HTMLUListElement}    predictions  The predictions UL element
     */

    /**
     * Adds a callback to be used when predictions are displayed
     * @param {onPredictCallback} callback Function to call after predictions
     * @returns {AddressSearch} The current {@link AddressSearch}
     */
    onPredict(callback){
        if(!this._errors.length) this._onPredict.push(callback);
        return this;
    }

    /**
     * Removes every callback previously added with {@link AddressSearch#onPredict}
     * @returns {AddressSearch} The current {@link AddressSearch}
     */
    offPredict(){
        if(!this._errors.length) this._onPredict = [];
        return this;
	}
	
	/**
     * Function called after an error.
     * Using <code>this</code> inside it will return the current {@link AddressSearch}
     *
     * @callback onErrorCallback
     * @param {Object} error The error
     */

    /**
     * Adds a callback to be used when an error occurs
     * @param {onErrorCallback} callback Function to call after an error
     * @returns {AddressSearch}   The current {@link AddressSearch}
     */
    onError(callback){
		if(!this._errors.length) this._onError.push(callback);
        return this;
    }

    /**
     * Removes every callback previously added with {@link AddressSearch#onError}
     * @returns {AddressSearch} The current {@link AddressSearch}
     */
    offError(){
        if(!this._errors.length) this._onError = [];
        return this;
    }

    /**
     * Manually sets the AddressSearch value
     * @param {String|PlaceResult} value New value
     * @param {Boolean} [triggerCallbacks=true] Should the method trigger the select callbacks?
     */
    setValue(value, triggerCallbacks = true){
		if(!this._errors.length){
			if(typeof value === 'string'){
				this._fetchPredictions.getPlacePredictions({ input: value }, (predictions, status) => {
					if(status == google.maps.places.PlacesServiceStatus.OK){
						let prediction = predictions[0];
						this._select(prediction.place_id, triggerCallbacks);
					}else{
						console.log(status);
						for(let callback of this._onError) callback.call(this,status);
					}
				});
			}else{
				this.value = value;
				this._input.value = value.formatted_address;
				this._lure.value = this._input.value;
				this._typeahead.value = '';
			}
		}
    }

    /**
     * Manually sets the AddressSearch value via a `place_id`
     * @param {Integer} place_id New place_id
     * @param {Boolean} [triggerCallbacks=true] Should the method trigger the select callbacks?
     * @returns {Promise} - Resolves when the place has been set
     */
    setPlace(place_id, triggerCallbacks = true){
		if(!this._errors.length){
			return this._select(place_id, triggerCallbacks);
		}else{
			return Promise.resolve();
		}
    }

    /**
     * Resets the AddressSearch
     * @returns {AddressSearch} The current {@link AddressSearch}
     */
    reset(){
		if(!this._errors.length){
			this.value = {};
			this._input.value = '';
			this._lure.value = '';
			this._typeahead.value = '';
		}

        return this;
    }

    /**
     * Refreshes the Google API fetchers
     * @returns {AddressSearch} The current {@link AddressSearch}
     */
    refreshService(){
		if(!this._errors.length){
			this._fetchPredictions = new google.maps.places.AutocompleteService();
			this._fetchPlace = new google.maps.places.PlacesService(document.createElement('div'));
			this._economizer = {};
		}

        return this;
    }

    /**
     * Use a different 'google' object to fetch data
     * @param {Object} googleService - The service to use
     * @returns {AddressSearch} The current {@link AddressSearch}
     */
    useService(googleService){
		if(!this._errors.length){
			this._fetchPredictions = googleService.maps.places.AutocompleteService();
			this._fetchPlace = googleService.maps.places.PlacesService(document.createElement('div'));
			this._economizer = {};
		}
        
        return this;
	}
	
	/**
     * Manually set which fields should be returned by the Google Places API
     * @param {String[]} fieldList List of field names
     * @returns {AddressSearch} The current {@link AddressSearch}
     */
    setFields(fieldList){
		this._apiFields = fieldList;

		return this;
    }

    /**
     * Removes any AddressSearch mutation from the DOM
     */
    destroy(){
		if(!this._errors.length){
			if(this._lure.id) this._input.setAttribute('id',this._lure.id);
			if(this._lure.getAttribute('name')) this._input.setAttribute('name',this._lure.getAttribute('name'));
	
			this._input.parentNode.parentNode.insertBefore(this._input, this._wrapper);
			this._wrapper.remove();
			this._input.classList.remove('address-search-input');
			
			document.querySelectorAll('.address-search-lure[data-refer-to="'+this.uniqueId+'"]').forEach(lure => lure.remove());
	
			//Remove event listeners
			let cleanInput = this._input.cloneNode(true);
			this._input.parentNode.replaceChild(cleanInput, this._input);
		}
    }

    /**
     * Removes any AddressSearch mutation from the DOM
     * @param {String} selector The AddressSearch input selector
     * @static
     */
    static destroy(selector){
		let lure = document.querySelector(selector);
		
		// If it exists
		if(lure){
			let element = lure.nextElementSibling;

			// If it has been initialized as an AddressSearch
			if(element && element.matches('.address-search-input')){
				// Remove outside lures
				let id = element.closest('.address-search[data-unique-id]').getAttribute('data-unique-id');
				document.querySelectorAll('.address-search-lure[data-refer-to="'+id+'"]').forEach(lure => lure.remove());
				
				if(lure.id) element.setAttribute('id',lure.id);
				if(lure.getAttribute('name')) element.setAttribute('name',lure.getAttribute('name'));
				
				element.parentNode.parentNode.insertBefore(element, element.parentNode);
				element.nextElementSibling.remove();
				element.classList.remove('address-search-input');

				

				//Remove event listeners
				let cleanInput = element.cloneNode(true);
				element.parentNode.replaceChild(cleanInput, element);
			}
		}
    }
}