// mapToken is a variable within show.ejs that can be seen by this script when it is ran
mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: eateryPlace.geometry.coordinates, // starting position [lng, lat]
    zoom: 10 // starting zoom
});

new mapboxgl.Marker()
    .setLngLat(eateryPlace.geometry.coordinates)
    .setPopup(
        new mapboxgl.Popup({ offset: 25 })
            .setHTML(
                `<h3>${eateryPlace.title}</h3><p>${eateryPlace.location}</p>`
            )
    )
    .addTo(map)