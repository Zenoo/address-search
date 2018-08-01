# AddressSearch [(Demo)](https://jsfiddle.net/Zenoo0/tqo1mxsc/)

![Dependencies](https://david-dm.org/Zenoo/address-search.svg)

Address searching with typeaheads and multiple choices

### Doc

* **Installation**

Simply import Google Places API & AddressSearch into your HTML.
```

<link rel="stylesheet" href="address-search.css">
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
<script src="address-search.js"></script>
```
* **How to use**

Create a new [`AddressSearch`](https://zenoo.github.io/address-search/AddressSearch.html) object with a query String or an Element as the first parameter :
```
let address = new AddressSearch('div.with[any="selector"]', options);
// OR
let element = document.querySelector('li.terally[any="thing"]');
let address = new AddressSearch(element, options);
```
* **Options**

```
{
  //TODO
}
```
* **Methods**

See the [documentation](https://zenoo.github.io/address-search/AddressSearch.html) for the method definitions.  

* **Example**

See this [JSFiddle](https://jsfiddle.net/Zenoo0/tqo1mxsc/) for a working example


## Authors

* **Zenoo** - *Initial work* - [Zenoo.fr](https://zenoo.fr)
