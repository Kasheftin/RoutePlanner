New Version: route-planner-vue
=====

Please check the new version of my route planner: [route-planner-vue](https://github.com/Kasheftin/route-planner-vue).

It's build on top of [vue.js](https://vuejs.org), [vuex](https://vuex.vuejs.org), [vue2-google-maps](https://github.com/xkjyeah/vue-google-maps) and [sortablejs](https://github.com/RubaXa/Sortable). It includes more features than the current project: draggable directions, polygons, custom icons, poi, reverse geocoding, readonly and collaborate sharing etc. 


Old Version: Route Planner v0.1
=====

This is simple, free and open source tool for planning routes, that is based on the [Google Maps Api](https://developers.google.com/maps/). 
It uses [Google Places Api](https://developers.google.com/maps/documentation/javascript/places) - [SearchBox](https://developers.google.com/maps/documentation/javascript/examples/places-searchbox), [AutoComplete](https://developers.google.com/maps/documentation/javascript/places-autocomplete), [DirectionsService](https://developers.google.com/maps/documentation/javascript/examples/directions-draggable) and other. It's built on top of [knockout](http://knockoutjs.com), [require](http://requirejs.org) and [jquery](http://jquery.com) libraries.
In fact, this is clone of the [Google Maps Engine](https://mapsengine.google.com/map/), and the key differences are:

* Unlimited layers, directions and markers per map
* Export/Import map to simple JSON object
* Setup does not require own hosting - it's possible just to copy files and open index.html locally in browser

[Demo](http://kasheftin.github.io/RoutePlanner/)

[Habrahabr article](http://habrahabr.ru/post/214743/)

I've spent about 20 hours for developing the v0.1, and implemented only the necessary functionality. There're a lot of things to do, but the current prototype suits me. So I decided that in case of any interest I'll spend some more time and:

* Refactor the code and switch google.mapsInfoWindow to the custom one, that works better with knockout
* Add draggable ability to directions service
* Add custom marker icons
* Add polylines and shapes
* Add image's uploader and parse POI photos and street view

And if You appreciate my work, feel free to [contact me](http://ragneta.com).  
