var mymap = L.map('mapid').setView([31.778124579640565, 35.232188701629646], 18);

var DELAY = 175, clicks = 0, timer = null;

var maplayer = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiMW1wZXJlYyIsImEiOiJjaXpuemgwN2MwMzMxMndrNzhxODJsN2toIn0.Uo549WrORGOAySucvwubsg'
).addTo(mymap);

var currentPosition;
var lastSeenOn;

// Adding Rout-machine

var routing = L.Routing.control({
    createMarker: function() { return null; },
    // geocoder: L.Control.Geocoder.nominatim(),
    draggableWaypoints: false,
    geocodersClassName: 'hidden',
    addWaypoints: false
}).addTo(mymap);

var markersList = {};

maplayer.id = 'mainLayer';

init();

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
        confirmButtonText: 'Yes, delete it!'
    }).then(function () {

        mymap.eachLayer(function (layer) {

            if(layer.id != 'mainLayer' && layer.id != 'YourLocation') {
                mymap.removeLayer(layer);
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
        markersList = {};

        swal(
            'Deleted!',
            'Your file has been deleted.',
            'success'
        )
    })
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
            addMarker(marker, marker.description, id);
        }
    }

}


/////////////////////////////////////////////////////////////////////////////////
//////////////////////////   Create Button func   //////////////////////////////
///////////////////////////////////////////////////////////////////////////////


function createButton(label, container) {
    var btn = L.DomUtil.create('button', '', container);
    btn.setAttribute('type', 'button');
    btn.innerHTML = label;
    return btn;
}

/////////////////////////////////////////////////////////////////////////////////
////////////////////////////  is on the List func  /////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function  isOnTheList(myArr, myItem) {
    for(item in myArr) {
        if(item == myItem) {
            return true;
        }
    }
    return false;
}


/////////////////////////////////////////////////////////////////////////////////
///////////////////////////   Add Marker func   ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////



function addMarker(latlng, description, markerId) {

    if(isOnTheList(markersList, markerId)) {
        mymap.removeLayer(markersList[markerId]);
    }

    var marker = L.marker(latlng).addTo(mymap);

    marker.id = markerId;

    marker.bindPopup(description);

    marker.on('click', function (e) {
        setDestination(e.latlng);
    });

    marker.on('contextmenu', function (e) {
        mymap.removeLayer(this);
        localStorage.removeItem(this.id);
    });

    var StorageObject = { 'lat': latlng.lat, 'lng': latlng.lng, 'description': description};

    if(markerId != 'YourLocation') {
        localStorage.setItem(markerId, JSON.stringify(StorageObject));
    }

    markersList[markerId] = marker;

    return marker;
}

function acceptableDescription(description) {
    if(description.length < 3) {
        return false;
    }
    else {
        return true;
    }
}

/////////////////////////////////////////////////////////////////////////////////
///////////////////////////   On Click Event   /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////



mymap.on("click", function(e) {

    clicks++;  //count clicks

    if(clicks === 1) {

        timer = setTimeout(function() {

            var container = L.DomUtil.create('div'),
                eventDescription = L.DomUtil.create('textarea', 'eventDescription', container),
                createEvent = createButton('Create the event', container);

            container.className = 'eventContainer';
            eventDescription.placeholder = "Write a description of the event here";

            createEvent.disabled = true;

            L.popup()
                .setContent(container)
                .setLatLng(e.latlng)
                .openOn(mymap);

            L.DomEvent.on(eventDescription, 'keydown', function (event) {

                if(event.which == 13 || event.keyCode == 13) {
                    event.preventDefault();
                    eventDescription.value += "\n";
                }

                if(event.keyCode == 13 && (event.metaKey || event.altKey || event.ctrlKey))
                {
                    createEvent.click();
                }

                if(validKey(event.keyCode)) {
                    createEvent.disabled = !acceptableDescription(eventDescription.value + event.key);
                }
                else if (event.keyCode == 8) {
                    var value = eventDescription.value.slice(0, -1);
                    createEvent.disabled = !acceptableDescription(value);
                }
            });

            L.DomEvent.on(createEvent, 'click', function() {

                addMarker(e.latlng, eventDescription.value, e.latlng.lat + '' + e.latlng.lng);
                mymap.closePopup();
            });

            clicks = 0;             //after action performed, reset counter

        }, DELAY);

    } else {

        clearTimeout(timer);    //prevent single-click action
        clicks = 0;             //after action performed, reset counter
    }

});

/////////////////////////////////////////////////////////////////////////////////
///////////////////////   Center on self func   ////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function CenterOnSelf() {
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

    if(document.getElementById('location-btn').className == 'spinning') {
        document.getElementById('location-btn').className = '';
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
////////////////////   Creating Your Location Icon   ///////////////////////////
///////////////////////////////////////////////////////////////////////////////

var You = L.icon({
    iconUrl: 'images/You.gif',
    iconSize:     [40, 42], // size of the icon
    popupAnchor:  [0, -16] // point from which the popup shoulCreating Your Location Icond open relative to the iconAnchor
});

