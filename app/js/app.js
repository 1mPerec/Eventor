import Location from './location';

class App {
  constructor() {
    this.init();
    this.initHandlers();
  }

  markersList = {};
  DELAY = 175;
  clicks = 0;
  timer = null;
  imgUrl = null;
  burgerMenu = null;
  backgroundLocation = false;
  flag = null;

  //server variables


  path = 'http://perceptionbox.io:9001';

  ajax(url, type, data) {
    const header = new Headers({
      'Content-Type': 'application/json',
      'Accept' : 'application/json'
    });

    const token = window.localStorage.getItem('authToken');
    const userID = window.localStorage.getItem('userID');

    if (token) {
      header.append('authorization', 'Bearer ' + token);
      header.append('userID', userID);
    }
    return fetch(url, {
      method: type,
      mode: 'cors',
      headers: header,
      body: JSON.stringify(data)
    }).then((response) => response.json());
  }

  init() {

    const ref = this;
    new Location(this);
    
    this.mymap = L.map('mapid').setView([31.778124579640565, 35.232188701629646], 18);

    var maplayer = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiMW1wZXJlYyIsImEiOiJjaXpuemgwN2MwMzMxMndrNzhxODJsN2toIn0.Uo549WrORGOAySucvwubsg')
      .addTo(ref.mymap);

    this.currentPosition = {id: 'YourLocation'};

//adding search

    ref.mymap.addControl( new L.Control.Search({
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

    this.routing = L.Routing.control({
      createMarker: function() { return null; },
      draggableWaypoints: false,
      geocodersClassName: 'hidden',
      addWaypoints: false
    }).addTo(ref.mymap);

    maplayer.id = 'mainLayer';

    this.run();

    if (navigator.geolocation) {
      ref.currentPosition = navigator.geolocation.watchPosition(this.onPositionResived.bind(this), onPositionNotResived, {timeout: 10000});
    }


    function onPositionNotResived(positionError) {
      console.log(positionError);
    }

/////////////////////////////////////////////////////////////////////////////////
////////////////////////////   Menu Staff  /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
    

    document.getElementById("close-btn").onclick = function () {
      ref.mymap.removeLayer(this.flag);
      this.flag = null;
      ref.closeMenu();
    };


/////////////////////////////////////////////////////////////////////////////////
////////////////////   Creating Your Location Icon   ///////////////////////////
///////////////////////////////////////////////////////////////////////////////

    this.You = L.icon({
      iconUrl: 'images/you.png',
      iconSize:     [38, 50]
    });

    this.FlagIco = L.icon({
      iconUrl: 'images/flag.png',
      iconSize:     [30, 50], // size of the icon
      popupAnchor:  [0, -16] // point from which the popup shoulCreating Your Location Icond open relative to the iconAnchor
    });
  }

  placePins() {

    if(window.localStorage.getItem('userID')) {

      this.ajax(this.path + '/pins','get').then((res) => {

        var pins = res;

        for (var i = 0; i < pins.length; i++) {

            var latlng = {lat: pins[i].lat, lng: pins[i].lng};
            this.addMarker(latlng, pins[i].description, pins[i].id);
        }
      });
    }
  }

  logedInScreen() {
    document.getElementById('logedIn').style.display = 'block';
    document.getElementById('logedOut').style.display = 'none';
    document.getElementById('facebook').style.display = 'none';
    document.getElementById('userName').innerHTML = window.localStorage.getItem('userName');
    document.getElementById('numberOfEvents').innerHTML = Object.keys(this.markersList).length - 1;
  }
  logedOutScreen() {
    document.getElementById('logedIn').style.display = 'none';
    document.getElementById('logedOut').style.display = 'block';
    document.getElementById('facebook').style.display = 'block';
  }

  run() {

    if(localStorage.getItem('toggle')) {
      window.BackgroundGeolocation.start();
    }

    this.burgerMenu = L.easyButton({
      id: 'burgerMenu',  // an id for the generated button
      position: 'topright',      // inherited from L.Control -- the corner it goes in
      type: 'replace',          // set to animate when you're comfy with css
      leafletClasses: true,     // use leaflet classes to style the button?
      states:[{                 // specify different icons and responses for your button
        stateName: 'openMenu',
        title: 'open menu',
        icon: 'burger',
        onClick: (button, map) =>{

          document.getElementById('bgGeolocation').toggle = window.localStorage.getItem('bgGeo');
          document.getElementById('sidebar').className += ' active';
          if(!window.localStorage.getItem('userID')) {
            this.logedOutScreen();
          }
          else {
            this.logedInScreen();
          }
          button.state('closeMenu');
        }
      },
        {
          stateName: 'closeMenu',
          title: 'close menu',
          icon: 'close',
          onClick: function(button, map){
            document.getElementById('sidebar').className = 'sidebar';
            button.state('openMenu');
          }
        }
      ]
    });

    this.burgerMenu.addTo( this.mymap );

    if(window.localStorage.getItem('userID')) {
      this.placePins();
    }
  }

  initHandlers() {

    document.
        getElementById('from')
        .addEventListener('click', this.outputDateFrom.bind(this));

    document.
    getElementById('until')
        .addEventListener('click', this.outputDateUntil.bind(this));

    document.
    getElementById('create')
        .addEventListener('click', this.createCustomPin.bind(this));

    document.
       getElementById('popup-input-file')
        .addEventListener('change', this._handleImageChange.bind(this));

    document
        .getElementById('save-pin')
        .addEventListener('click', this.savePin.bind(this));

    document
        .getElementById('options')
        .addEventListener('click', this.showPopUp.bind(this));

    document
        .getElementById('closePopup')
        .addEventListener('click', this.hidePopUp.bind(this));

    document
      .getElementById('location-btn')
      .addEventListener('click', this.centerOnSelf.bind(this));

    document
        .getElementById('logout')
        .addEventListener('click', this.logoutFacebook.bind(this));


    // sidebar

    document
        .getElementById('facebook')
        .addEventListener('click', this.authFacebook.bind(this));

    document
        .getElementById('clear')
        .addEventListener('click', this.clearMarkers.bind(this));

    document
        .getElementById('bgGeolocation')
        .addEventListener('click', this.toggleGeolocation.bind(this));

    document
        .getElementById('info')
        .addEventListener('click', this.info.bind(this));

    document
        .getElementById('closeSideMenu')
        .addEventListener('click', this.closeSideMenu.bind(this));



    this.mymap.on('click', (e) => {

      this.clicks++;  //count clicks

      if (this.clicks === 1) {

        // TODO finish off

        if(window.localStorage.getItem('userID')) {

          this.timer = setTimeout(() => {

            var flag = L.marker(e.latlng).addTo(this.mymap);
            flag.id = 'flag';
            flag.setIcon(this.FlagIco);

            if (this.flag) {
              this.mymap.removeLayer(this.flag);
            }

            this.flag = flag;

            document.getElementById('marker-description').focus();

            this.clicks = 0;             //after action performed, reset counter

          }, this.DELAY);

          this.openMenu();

        }
        else {
          swal({
            title: 'You have to log in first',
            html: $('<div>')
                .text('login with your facebook account'),
            animation: false,
            customClass: 'animated tada'
          })
        }

      } else {

        clearTimeout(this.timer);    //prevent single-click action
        this.clicks = 0;             //after action performed, reset counter
      }

    });

    document.getElementById("close-btn").onclick = () => {
      this.mymap.removeLayer(this.flag);
      this.flag = null;
      this.closeMenu();
    };
  }

  calendarOutput(id){

  try {
    var options = {
      date: new Date(),
      mode: 'date',
      allowOldDates: true,
      allowFutureDates: true
    };

    datePicker.show(options, function (date) {
        document.getElementById(id).value = ('0' + date.getDate()).slice(-2) + "/" + ('0' + (date.getMonth() + 1)).slice(-2) + "/" + date.getFullYear();
    });

  }
  catch(e) {
    console.log('Data picker not for browsers. DA!');
  }

}

  outputDateFrom(event) {
    event.preventDefault();
    this.calendarOutput('from');
  }
  outputDateUntil(event) {
    event.preventDefault();
    this.calendarOutput('until');
  }

  notifyUser(message) {
    try {
      cordova.plugins.notification.local.schedule({
        id: Date.now(),
        at: new Date(new Date().getTime() + 1000),// now + 1s
        title: 'Notification',
        text: message
      });

      navigator.notification.vibrate(2500);

      const beep = new Media("sounds/beep.wav");
      console.log(beep);
      beep.play();
    }
    catch(e) {
      console.log("error: ", e);
    }
  }

  overlappingWithEvents() {
    for (let eventId in this.markersList) {

      var marker = this.markersList[eventId].marker;
      var radius = this.markersList[eventId].radius;

      if (marker.id != 'YourLocation' && marker.id != 'flag') {

        if (this.isInTheRadius(this.currentPosition, radius)) {
          if (!radius.intersects) {
            radius.setStyle({fillColor: 'green'});
            radius.intersects = true;
            this.notifyUser('User has entered a void');
          }
        } else if (radius.intersects) {
          radius.setStyle({fillColor: 'red'});
          radius.intersects = false;
          this.notifyUser('User has exited a void');
        }
      }
    }
  }

  isInTheRadius(CurrentLocation, Event) {
    if (CurrentLocation) {
      return CurrentLocation.getLatLng().distanceTo(Event.getLatLng()) <= Event.getRadius();
    }
  }

  onPositionResived(position) {
    const ref = this;
    const latlng = {'lat': position.coords.latitude, 'lng': position.coords.longitude};
    this.currentPosition = this.addMarker(latlng, 'Your current location', 'YourLocation');
    this.currentPosition.id = 'YourLocation';
    this.currentPosition.setIcon(this.You);
    this.lastSeenOn = {'lat': ref.currentPosition.getLatLng().lat, 'lng': ref.currentPosition.getLatLng().lng};
    localStorage.setItem('lastSeenOn', JSON.stringify(this.lastSeenOn));
    this.setOrigin(ref.currentPosition.getLatLng());
    this.overlappingWithEvents();

    if (document.getElementById('location-btn').className.indexOf('spinning') > -1 ) {
      document.getElementById('location-btn').className = document.getElementById('location-btn').className.slice('spinning '.length);
      this.centerOnSelf();
    }
  }

  setOrigin(latlng) {
    this.routing.spliceWaypoints(0, 1, latlng);
  }

  addMarker(latlng, description, markerId) {
    const ref = this;
    const descriptionHtml = document.createElement('div');
    descriptionHtml.innerHTML = description;
    if (this.markersList[markerId]) {
      this.mymap.removeLayer(this.markersList[markerId].marker);
      delete this.markersList[markerId];
    }

    var marker = L.marker(latlng).addTo(this.mymap);

    marker.id = markerId;

    if (markerId != "YourLocation" && markerId != "flag") {
      const wrapper = document.createElement("div");
      var btn = document.createElement("button");
      btn.innerHTML = "create";
      btn.className = "popup-btn";
      btn.onclick = function (id, e) {}.bind(this, markerId);
      wrapper.appendChild(descriptionHtml);

      var popup = marker.bindPopup(wrapper);

      popup.on('popupclose', (e) => {
        ref.routing.getPlan().setWaypoints([ref.currentPosition.getLatLng()]);
      });

      marker.on('click', (e) => {
        this.setDestination(e.latlng);
      });
    }

    marker.on('contextmenu', function(e) {

      ref.ajax(ref.path + "/removepin/" + this.id, 'post', {});

      ref.mymap.removeLayer(this);
      ref.mymap.removeLayer(ref.markersList[this.id].radius);

      delete ref.markersList[this.id];

      if (ref.routing.getWaypoints()[1].latLng &&
        e.latlng.lat == ref.routing.getWaypoints()[1].latLng.lat &&
        e.latlng.lng == ref.routing.getWaypoints()[1].latLng.lng) {

        ref.routing.getPlan().setWaypoints([ref.currentPosition.getLatLng()]);
      }
    });

    if (markerId != 'YourLocation') {
      var radius = L.circle([latlng.lat, latlng.lng], {
        fillOpacity: 0.1,
        fillColor: 'red',
        color: 'none',
        radius: 100
      }).addTo(this.mymap);
      radius['intersects'] = false;
    }

    this.markersList[markerId] = {marker: marker, radius: radius};

    return marker;
  }

  setDestination(latlng) {
    this.routing.spliceWaypoints(1, 1, latlng);
  }

  // Add Pin

  savePin() {

    if(window.localStorage.getItem('userID')) {

      var latlng = this.flag.getLatLng();
      var description = document.getElementById('marker-description').value;
      var id = latlng.lat + '' + latlng.lng;
      this.addMarker(latlng, description, id);
      this.mymap.removeLayer(this.flag);
      this.flag = null;

      this.ajax(this.path + '/addpin', 'post', {
        lat: latlng.lat,
        lng: latlng.lng,
        description: description,
        id: id,
        author: window.localStorage.getItem('userID')
      });

      this.closeMenu();
    }

    else {
      swal({
        title: 'You have to log in first',
        html: $('<div>')
            .text('login with your facebook account'),
        animation: false,
        customClass: 'animated tada'
      })
    }
  }


  showPopUp() {
    document.getElementById("overlay").className = 'active';
  }

  hidePopUp() {
    document.getElementById("title").value   = '';
    document.getElementById("from").value =    '';
    document.getElementById("until").value =   '';
    document.getElementById("event-description").value = '';
    document.getElementById("overlay").className = '';
    document.getElementById('popup-file-img').src = "";
    document.getElementById('file-add-ditails').className = '';
    document.getElementById('popup-input-file').value = "";
    this.imgUrl = undefined;
  }

  closeMenu() {
      document.getElementById("menu").className = "";
      document.getElementById("marker-description").value = "";
  }

  centerOnSelf() {
    this.mymap.setView(this.currentPosition.getLatLng());
  }

  clearMarkers() {

    let ref = this;
    swal({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, clear markers!'
    }).then(() => {

      ref.mymap.eachLayer((layer) => {

        if (layer.id != 'mainLayer' && layer.id != 'YourLocation') {
          ref.mymap.removeLayer(layer);
          delete ref.markersList[layer.id];
        }

      });

      for(var i = 0; i < window.localStorage.length; i++) {
        if( (window.localStorage.key(i) != 'lastSeenOn')
            && (window.localStorage.key(i) != 'authToken')
            && (window.localStorage.key(i) != 'userID')
            && (window.localStorage.key(i) != 'userName')
            && (window.localStorage.key(i) != 'bgGeo')
        )  {
          delete window.localStorage[i];
        }
      }

      if (ref.lastSeenOn) {
        window.localStorage.setItem('lastSeenOn', JSON.stringify(ref.lastSeenOn));
      }

      var childNodes = document.getElementsByTagName("input");

      for (var i = 0; i<childNodes.length; i++) {

        if (childNodes[i].type == 'text') {

          childNodes[i].value = '';
        }
      }

      ref.routing.setWaypoints([]);

      this.ajax(this.path + '/clearAll', 'post', {});

      swal(
        'Deleted!',
        'Your file has been deleted.',
        'success'
      );
      ref.closeMenu();
    });
  }

  closeSideMenu() {
    document.getElementById('sidebar').className = 'sidebar';
    this.burgerMenu.state('openMenu');
  }

  toggleInfo() {

  }

  toggleGeolocation() {

    var bgGeo = window.BackgroundGeolocation;
    var toggle = document.getElementById('bgGeolocation');

    if (toggle.checked) {
      bgGeo.start();
      window.localStorage.setItem('bgGeo', true);
    } else {
      bgGeo.stop();
      window.localStorage.setItem('bgGeo', false);
    }

    cordova.plugins.diagnostic.getLocationAuthorizationStatus((result)=>{

      if(result != cordova.plugins.diagnostic.permissionStatus.GRANTED) {
        toggle.checked = false;
      }
      else {

      }
    }, (err)=> {
      console.log(err);
    });

    window.localStorage.setItem('bgGeoEnabled', toggle);

  }

  authFacebook() {

    if(!window.localStorage.getItem('userID')) {

      facebookConnectPlugin.login(['public_profile'], (data) => {

        facebookConnectPlugin.api('me/?fields=id,name', ['public_profile'], (res) => {

              window.localStorage.setItem('userID', res.id);
              window.localStorage.setItem('userName', res.name);

              this.ajax(this.path + '/adduser', 'post', {
                userID: res.id,
                name: res.name
              }).then((res) => {

                window.localStorage.setItem('authToken', res.token);

                this.placePins();
                this.logedInScreen();
              });

            },
            (error) => {
              console.log('error', error);

            });
      }, (error) => {
        console.log('error', error);
      });
    }
  }

  logoutFacebook() {
    window.localStorage.removeItem('userID');
    window.localStorage.removeItem('authToken');

    swal({
      title: 'You have loged out successfully'
    });

    facebookConnectPlugin.logout();
    this.logedOutScreen();
  }

  _handleImageChange(event) {
    event.preventDefault();
    const reader = new FileReader();
    const file = event.target.files[0];

    reader.onloadend = () => {
      document.getElementById('popup-file-img').style.backgroundImage = 'url("' + reader.result + '")';
      document.getElementById('popup-file-img').style.backgroundRepeat = "no-repeat";
      document.getElementById('popup-file-img').style.backgroundPosition = "center";
      document.getElementById('file-add-ditails').className = 'hidden';
      this.imgUrl = reader.result;
    };

    reader.readAsDataURL(file);
  }

  info() {
    swal({
      title: 'info',
      html: $('<div>')
          .addClass('info-note')
          .text('This app is designed to help thous who want to be reminded when they reach a certain location. It also can notify you when you walk nearby some cool event, that you might be interested in!'),
      animation: false,
      customClass: 'animated pulse'
    })
  }

  createCustomPin(event) {

    if(window.localStorage.getItem('userID')) {
      var photo = "";
      var startsAt = "";
      var endsAt = "";
      var decodedImg = "";

      if( document.getElementById('from').value != "") {
        startsAt =
            "<p class='popup-date-start'>"        +
            "Starts at: "                         +
            document.getElementById('from').value +
            "</p>";
      }

      if( document.getElementById('until').value != "") {
        endsAt =
            "<p class='popup-date-end'>"           +
            "Ends at: "                            +
            document.getElementById('until').value +
            "</p>"
      }

      if(this.imgUrl) {
        photo =
            "<div class='img-wrapper'>"         +
            "<img src='"+ this.imgUrl + "'/>"   +
            "</div>" ;
      }

      var popupContent =
          "<div class='popup-wrapper'>"             +
          "<div class='popup-header'>"            +
          photo                               +
          "<div class='popup-header-content'>"  +
          "<h2 class='popup-title'>"          +
          document.getElementById('title').value +
          "</h2>"                             +
          startsAt                            +
          endsAt                              +
          "</div>"                              +
          "</div>"                                +
          "<div class='popup-content'>"           +
          "<p class='popup-description'>"       +
          document.getElementById('event-description').value +
          "</p>"                                +
          "</div>"                                +
          "</div>";

      this.addMarker(this.flag.getLatLng(), popupContent, this.flag.getLatLng().lat + "" + this.flag.getLatLng().lng);

      this.ajax(this.path + "/addpin", 'post', {

        id:  this.flag.getLatLng().lat + "" + this.flag.getLatLng().lng,
        lat: this.flag.getLatLng().lat,
        lng: this.flag.getLatLng().lng,
        title: document.getElementById('title').value,
        dateFrom: document.getElementById('from').value,
        dateUntil: document.getElementById('until').value,
        description: document.getElementById('event-description').value,
        img: this.imgUrl,
        author: window.localStorage.getItem('userID')
      });

      this.hidePopUp();

      this.mymap.removeLayer(this.flag);
      this.flag = null;
    }
    else {
      this.hidePopUp();
      swal({
        title: 'You have to log in first',
        html: $('<div>')
            .text('login with your facebook account'),
        animation: false,
        customClass: 'animated tada'
      })
    }
  }

  openMenu() {
    document.getElementById("menu").className = 'active';
  }
}

new App();


