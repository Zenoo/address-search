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
     * @param {(Element|String)} target                   The input targeted by the AddressSearch module
     * @param {Object}           [parameters]             Additional optional parameters
     */
    constructor(target, parameters = {}){
        /** @private */
        this._input = target instanceof Element ? target : document.querySelector(target);

        //Errors checking
        if(!this._input) throw new Error('AddressSearch: '+(typeof target == 'string' ? 'The selector `'+target+'` didn\'t match any element.' : 'The element you provided was undefined'));
        if(this._input.classList.contains('address-search-input')) throw new Error('AddressSearch: The element has already been initialized.');

        /** @private */
        this._fetchPredictions = new google.maps.places.AutocompleteService();
        /** @private */
        this._fetchPlace = new google.maps.places.PlacesService(document.createElement('div'));

        /** @private */
        this._economizer = {};

        /** @private */
        this._onSelect = [];
        /** @private */
        this._onPredict = [];

        /** @private */
        this._parameters = parameters;

        /** @type {PlaceResult} */
        this.value = {};

        this._build();
        this._listen();
    }

    /**
     * Builds the AddressSearch DOM Tree around the element
     * @private
     */
    _build(){
        this._wrapper = document.createElement('div');
        this._wrapper.classList.add('address-search');
        this._input.parentNode.insertBefore(this._wrapper, this._input);

        this._typeahead = document.createElement('input');
        this._typeahead.classList.add('address-search-typeahead');
        this._wrapper.appendChild(this._typeahead);

        this._input.classList.add('address-search-input');
        this._wrapper.appendChild(this._input);

        this._predictions = document.createElement('ul');
        this._predictions.classList.add('address-search-predictions');
        this._wrapper.appendChild(this._predictions);
    }

    /**
     * Creates event listeners
     * @private
     */
    _listen(){
        this._input.addEventListener('input',() => {
            if(this._input.value.length){
                this._input.value = this._capitalize(this._input.value);

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
                    this._fetchPredictions.getPlacePredictions({ input: this._input.value }, (predictions, status) => {
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

                this._select(this._predictions.firstElementChild.getAttribute('data-place-id'));
            }
        });

        this._input.addEventListener('blur',() => {
            if(Object.keys(this.value).length === 0 && this.value.constructor === Object){
                setTimeout(() => {
                    this._input.value = '';
                    this._typeahead.value = '';
                    this._togglePredictions('off');
                },1);
            }

            //AUTOCOMPLETE HACK
            let inputName = this._input.getAttribute('data-old-name')
            if(inputName){
                this._input.setAttribute('name',inputName);
                this._input.removeAttribute('data-old-name');
            }

            let inputId = this._input.getAttribute('data-old-id')
            if(inputId){
                this._input.setAttribute('id',inputId);
                this._input.removeAttribute('data-old-id');
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

        //AUTOCOMPLETE HIDING HACK
        this._input.addEventListener('mousedown', e => {
            let inputName = this._input.getAttribute('name');
            if(inputName){
                this._input.setAttribute('data-old-name',inputName);
                this._input.removeAttribute('name');
            }

            let inputId = this._input.getAttribute('id');
            if(inputId){
                this._input.setAttribute('data-old-id',inputId);
                this._input.removeAttribute('id');
            }

            // for(let attribute of this._input.attributes){
            //     if(attribute.name != 'type') this._input.removeAttribute(attribute.name);
            // }
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
     * Capitalize a String
     * @private
     */
    _select(placeId){
        this._fetchPlace.getDetails({placeId: placeId}, (place, status) => {
            if(status == google.maps.places.PlacesServiceStatus.OK){
                this._togglePredictions('off');
                this._resetPredictions();

                this.value = place;
                this._input.value = place.formatted_address;
                this._typeahead.value = '';

                if(Object.keys(this._parameters).length !== 0){
                    for(let prop in this._parameters){
                        let target = document.querySelector(this._parameters[prop]);
                        if(target){
                            target.value = prop.endsWith('_short') ? this._getPlaceComponent(prop.slice(0, -6), true) : this._getPlaceComponent(prop);
                        }
                    }
                }

                this._input.blur();

                //onSelect callbacks
                for(let callback of this._onSelect) callback.call(this,this.value);
            }else{
                console.log(status);
            }
        });
    }

    /**
     * Capitalize a String
     * @private
     */
    _getPlaceComponent(component,isShort){
        let target = this.value.address_components.filter(c => c.types.includes(component));
        if(target.length){
            return isShort ? target[0].short_name : target[0].long_name
        }else return '';
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
        this._onSelect.push(callback);
        return this;
    }

    /**
     * Removes every callback previously added with {@link AddressSearch#onSelect}
     * @returns {AddressSearch} The current {@link AddressSearch}
     */
    offSelect(){
        this._onSelect = [];
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
        this._onPredict.push(callback);
        return this;
    }

    /**
     * Removes every callback previously added with {@link AddressSearch#onPredict}
     * @returns {AddressSearch} The current {@link AddressSearch}
     */
    offPredict(){
        this._onPredict = [];
        return this;
    }

    /**
     * Manually sets the AddressSearch value
     * @param {String|PlaceResult} value New value
     */
    setValue(value){
        if(typeof value === 'string'){
            //ASYNC STUFF, HOW TO DEAL WITH THE CHAINABILITY ?
            this._fetchPredictions.getPlacePredictions({ input: value }, (predictions, status) => {
                if(status == google.maps.places.PlacesServiceStatus.OK){
                    let prediction = predictions[0];
                    this._select(prediction.place_id);
                }else{
                    console.log(status);
                }
            });
        }else{
            this.value = value;
            this._input.value = value.formatted_address;
            this._typeahead.value = '';
        }
    }

    /**
     * Removes any AddressSearch mutation from the DOM
     */
    destroy(){
        this._input.parentNode.parentNode.insertBefore(this._input, this._wrapper);
        this._wrapper.remove();
        this._input.classList.remove('address-search-input');

        //Remove event listeners
        let cleanInput = this._input.cloneNode(true);
        this._input.parentNode.replaceChild(cleanInput, this._input);
    }

    /**
     * Removes any AddressSearch mutation from the DOM
     * @param {String} selector The AddressSearch input selector
     * @static
     */
    static destroy(selector){
        let element = document.querySelector(selector);

        element.parentNode.parentNode.insertBefore(element, element.parentNode);
        element.nextElementSibling.remove();
        element.classList.remove('address-search-input');

        //Remove event listeners
        let cleanInput = element.cloneNode(true);
        element.parentNode.replaceChild(cleanInput, element);
    }
}