/**
 * The Autocomplete class from Google Places API
 * @external Autocomplete
 * @see https://developers.google.com/maps/documentation/javascript/reference/3/places-widget#Autocomplete
 */

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
        this._onSelect = [];
        /** @private */
        this._onPredict = [];

        /** @private */
        this._parameters = parameters;

        /** @type {PlaceResult} The currently selected item */
        this.value = '';

        this._build();
        this._listen();
    }

    /**
     * Builds the AddressSearch DOM Tree around the element
     * @private
     */
    _build(){

    }

    /**
     * Creates event listeners
     * @private
     */
    _listen(){

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
     * Function called after a selection.
     * Using <code>this</code> inside it will return the current {@link AddressSearch}
     *
     * @callback onPredictCallback
     * @param {String}              value      The user's input
     * @param {String}              typeahead  The typeahead
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
     * Refreshes the input's display
     * @returns {AddressSearch} The current {@link AddressSearch}
     */
    refresh(){

    }

    /**
     * Removes any AddressSearch mutation from the DOM
     */
    destroy(){

    }
}