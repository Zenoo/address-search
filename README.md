# AddressSearch [(Demo)](https://jsfiddle.net/Zenoo0/tqo1mxsc/)

![Dependencies](https://david-dm.org/Zenoo/address-search.svg)

Address searching with typeaheads and multiple choices

### Doc

* **Installation**

Simply import Google Places API & AddressSearch into your HTML.
```

<link rel="stylesheet" href="address-search.min.css">
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
<script src="address-search.min.js"></script>
```
* **How to use**

Create a new [`AddressSearch`](https://zenoo.github.io/address-search/AddressSearch.html) object with a query String or an Element as the first parameter :
```
let address = new AddressSearch('div.with[any="selector"]', options, delay);
// OR
let element = document.querySelector('li.terally[any="thing"]');
let address = new AddressSearch(element, options, delay);
```
* **Options**

You can automatically fill inputs with address informations when the user selects an address.  
To do that, simply add the information type you want and the selector for the input to fill.


The `options` object works as follows
```
// GET THE COMPONENT FULL NAME
typename : 'targetInput[selector]'
// GET THE COMPONENT SHORT NAME
typename_short : 'targetInput[selector]'
```

Available components:
```
{
  street_number: '...',
  route: '...',
  country: '...',
  administrative_area_level_1: '...',
  administrative_area_level_2: '...',
  administrative_area_level_3: '...',
  administrative_area_level_4: '...',
  administrative_area_level_5: '...',
  colloquial_area: '...',
  locality: '...',
  sublocality: '...',
  neighborhood: '...',
  premise: '...',
  subpremise: '...',
  postal_code: '...',
  point_of_interest: '...'
}
```
* **Delay**

You can use the third parameter to enter a delay (ms).  
This delay will be used before displaying Google API predictions after each keypress.  
This can help you mitigate the amount of requests made on your account.


The `delay` parameter works as follows
```
new AddressSearch(element, options, 500);
```
* **Methods**

See the [documentation](https://zenoo.github.io/address-search/AddressSearch.html) for the method definitions.  

* **Example**

See this [JSFiddle](https://jsfiddle.net/Zenoo0/tqo1mxsc/) for a working example


## Authors

* **Zenoo** - *Initial work* - [Zenoo.fr](https://zenoo.fr)
