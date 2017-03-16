var mymap = L.map('mapid').setView([31.778124579640565, 35.232188701629646], 18);

var DELAY = 175, clicks = 0, timer = null;

var maplayer = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiMW1wZXJlYyIsImEiOiJjaXpuemgwN2MwMzMxMndrNzhxODJsN2toIn0.Uo549WrORGOAySucvwubsg'
).addTo(mymap);

var currentPosition = {id: 'YourLocation'};
var lastSeenOn;

//adding search

mymap.addControl( new L.Control.Search({
    url: 'http://nominatim.openstreetmap.org/search?format=json&q={s}',
    jsonpParam: 'json_callback',
    propertyName: 'display_name',
    propertyLoc: ['lat','lon'],
    marker: L.circleMarker([0,0],{radius:0}),
    autoCollapse: true,
    autoType: false,
    minLength: 2
}) );

///////////////////////////////////////////////////////////////////////////////////////////////////////

// Adding Rout-machine

var routing = L.Routing.control({
    createMarker: function() { return null; },
    draggableWaypoints: false,
    geocodersClassName: 'hidden',
    addWaypoints: false
}).addTo(mymap);

var markersList = {};

maplayer.id = 'mainLayer';

init();

function notifyUser(message) {
    cordova.plugins.notification.local.schedule({
        id: 'ID-'+Date.now(),
        at: new Date(new Date().getTime() + 1000),// now + 1s
        title: 'TEST',
        text: message,
        sound: "file://sounds/beep.wav"
    });

    beep = new Media("sounds/beep.wav");
    beep.play();

    navigator.notification.vibrate(2500);
}

/////////////////////////////////////////////////////////////////////////////////
////////////////////////////   Valid key func   ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function validKey(key) {

    return (key > 47 && key < 58)   || // number keys
            key == 32 || key == 13   || // spacebar & return key(s) (if you want to allow carriage returns)
            (key > 64 && key < 91)   || // letter keys
            (key > 95 && key < 112)  || // numpad keys
            (key > 185 && key < 193) || // ;=,-./` (in order)
            (key > 218 && key < 223);   // [\]' (in order)
}

/////////////////////////////////////////////////////////////////////////////////
/////////////////////////   Is in the radius func   ////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function isInTheRadius(CurrentLocation, Event) {

    if(CurrentLocation) {
        return CurrentLocation.getLatLng().distanceTo(Event.getLatLng()) <= Event.getRadius();
    }

}

function overlappingWithEvents() {
    for(eventId in markersList) {

        var marker = markersList[eventId].marker;
        var radius = markersList[eventId].radius;

        if(marker.id != 'YourLocation' && marker.id != 'flag') {

            if (isInTheRadius(currentPosition, radius)) {
                if(!radius.intersects) {
                    radius.setStyle({fillColor: 'green'});
                    radius.intersects = true;
                    notifyUser('User has entered a void');
                }
            }
            else if(radius.intersects){
                radius.setStyle({fillColor: 'red'});
                radius.intersects = false;
                notifyUser('User has exited a void');
            }
        }
    }
}

/////////////////////////////////////////////////////////////////////////////////
//////////////////////////////   Clear func   //////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function clearMarkers() {

    swal({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, clear markers!'
    }).then(function () {

        mymap.eachLayer(function (layer) {

            if(layer.id != 'mainLayer' && layer.id != 'YourLocation') {
                mymap.removeLayer(layer);
                delete markersList[layer.id];
            }

        });
        localStorage.clear();
        if(lastSeenOn) {
            localStorage.setItem('lastSeenOn', JSON.stringify(lastSeenOn));
        }

        markerId = 0;

        var childNodes = document.getElementsByTagName("input");

        for (var i=0; i<childNodes.length; i++) {

            if (childNodes[i].type == 'text') {

                childNodes[i].value = '';
            }
        }

        routing.setWaypoints([]);

        swal(
            'Deleted!',
            'Your file has been deleted.',
            'success'
        );
        closeMenu();
    });
}


/////////////////////////////////////////////////////////////////////////////////
/////////////////////////   Initialisation func   //////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function init() {

    for(var i = 0; i < localStorage.length; i++){

        var id = localStorage.key(i);

        var marker = localStorage.getItem(id);

        marker = JSON.parse(marker);

        if(id == 'lastSeenOn') {
            mymap.setView(marker, 18);
        }
        else {
            var latlng = {lat: marker.lat, lng: marker.lng};
            addMarker(latlng, marker.description, id);
        }
    }
}

/////////////////////////////////////////////////////////////////////////////////
///////////////////////////   Add Marker func   ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////



function addMarker(latlng, description, markerId) {

    if(markersList[markerId]) {
        mymap.removeLayer(markersList[markerId].marker);
        delete markersList[markerId];
    }

    var marker = L.marker(latlng).addTo(mymap);

    marker.id = markerId;

    marker.bindPopup(description);

    marker.on('click', function (e) {
        setDestination(e.latlng);
    });

    marker.on('contextmenu', function (e) {
        mymap.removeLayer(this);
        mymap.removeLayer(markersList[this.id].radius);
        localStorage.removeItem(this.id);
        delete markersList[this.id];


        if( routing.getWaypoints()[1].latLng &&
            e.latlng.lat == routing.getWaypoints()[1].latLng.lat &&
            e.latlng.lng == routing.getWaypoints()[1].latLng.lng)  {

            routing.getPlan().setWaypoints([currentPosition.getLatLng()]);
        }
    });

    var StorageObject = { 'lat': latlng.lat, 'lng': latlng.lng, 'description': description};

    if(markerId != 'YourLocation') {
        localStorage.setItem(markerId, JSON.stringify(StorageObject));
        var radius = L.circle([latlng.lat, latlng.lng], {
            fillOpacity: 0.1,
            fillColor: 'red',
            color: 'none',
            radius: 100
        }).addTo(mymap);
        radius['intersects'] = false;
    }

    markersList[markerId] = {marker: marker, radius: radius};

    return marker;
}

function acceptableDescription(description) {
    return (description.length > 3);
}

/////////////////////////////////////////////////////////////////////////////////
///////////////////////////   On Click Event   /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////



mymap.on("click", function(e) {

    clicks++;  //count clicks

    if(clicks === 1) {

        timer = setTimeout(function() {

            var flag = L.marker(e.latlng).addTo(mymap);
            flag.id = 'flag';
            flag.setIcon(Flag);

            if(markersList['flag']) {
                mymap.removeLayer(markersList['flag'].marker);
            }

            markersList['flag'] = {marker: flag};

            document.getElementById('marker-description').focus();

            clicks = 0;             //after action performed, reset counter

        }, DELAY);

        openMenu();

    } else {

        clearTimeout(timer);    //prevent single-click action
        clicks = 0;             //after action performed, reset counter
    }

});

/////////////////////////////////////////////////////////////////////////////////
///////////////////////   Center on self func   ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function centerOnSelf() {
    mymap.setView(currentPosition.getLatLng());
}

/////////////////////////////////////////////////////////////////////////////////
////////////////////////////   Navigation   ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function onPositionResived(position) {

    var latlng = {'lat': position.coords.latitude, 'lng': position.coords.longitude};
    currentPosition = addMarker(latlng, 'Your current location', 'YourLocation');
    currentPosition.id = 'YourLocation';
    currentPosition.setIcon(You);
    lastSeenOn = {'lat': currentPosition.getLatLng().lat, 'lng': currentPosition.getLatLng().lng};
    localStorage.setItem('lastSeenOn', JSON.stringify(lastSeenOn));
    setOrigin(currentPosition.getLatLng());
    overlappingWithEvents();

    if(document.getElementById('location-btn').className.indexOf('spinning') > -1 ) {
        document.getElementById('location-btn').className = document.getElementById('location-btn').className.slice('spinning '.length);
        centerOnSelf();
    }
}

function onPositionNotResived(positionError) {
    console.log(positionError);
}

if(navigator.geolocation) {
    currentPosition = navigator.geolocation.watchPosition(onPositionResived, onPositionNotResived, {timeout: 10000});
}

/////////////////////////////////////////////////////////////////////////////////
//////////////////////////   Set origin func   /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function setOrigin(latlng) {
    routing.spliceWaypoints(0, 1, latlng);
}

function setDestination(latlng) {
    routing.spliceWaypoints(1, 1, latlng);
}

/////////////////////////////////////////////////////////////////////////////////
////////////////////////////   Menu Staff  /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function openMenu() {
    document.getElementById("menu").className = 'active';
}

function closeMenu() {
    document.getElementById("menu").className = "";
    document.getElementById("marker-description").value = "";
}

function showPopUp() {
    document.getElementById("overlay").className = 'active';
}

function hidePopUp() {
    document.getElementById("overlay").className = '';
}

document.getElementById("close-btn").onclick = function () {
    mymap.removeLayer(markersList['flag'].marker);
    delete markersList['flag'];
    closeMenu();
};

document.getElementById('overlay').onclick = function (e) {
    if(e.target == this) {
        hidePopUp();
    }
};

/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////   Add Pin   //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function savePin() {
    var latlng = markersList['flag'].marker.getLatLng();
    var description = document.getElementById('marker-description').value;
    var id = latlng.lat + '' + latlng.lng;
    addMarker(latlng, description, id);
    mymap.removeLayer(markersList['flag'].marker);
    delete markersList['flag'];
    closeMenu();
}

/////////////////////////////////////////////////////////////////////////////////
////////////////////   Creating Your Location Icon   ///////////////////////////
///////////////////////////////////////////////////////////////////////////////

var You = L.icon({
    iconUrl: 'images/You.gif',
    iconSize:     [40, 42], // size of the icon
    popupAnchor:  [0, -16] // point from which the popup shoulCreating Your Location Icond open relative to the iconAnchor
});

var Flag = L.icon({
    iconUrl: 'images/flag.png',
    iconSize:     [30, 50], // size of the icon
    popupAnchor:  [0, -16] // point from which the popup shoulCreating Your Location Icond open relative to the iconAnchor
});