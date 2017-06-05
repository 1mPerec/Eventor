export default class Location {
  constructor(App) {
    this.App = App;
    document.addEventListener('deviceready', this.init.bind(this), false);
  }
  
  init() {
    const ref = this;
    // cordova.plugins.notification.local.promptForPermission();

    var bgGeo = window.BackgroundGeolocation;

    //This callback will be executed every time a geolocation is recorded in the background.
    var callbackFn = function(location, taskId) {
      var coords = location.coords;
      var lat    = coords.latitude;
      var lng    = coords.longitude;

      ref.App.onPositionResived(location);

      // Must signal completion of your callbackFn.
      bgGeo.finish(taskId);
    };

    // This callback will be executed if a location-error occurs.  Eg: this will be called if user disables location-services.
    var failureFn = function(errorCode) {
      console.warn('- BackgroundGeoLocation error: ', errorCode);
    };

    // Listen to location events & errors.
    bgGeo.on('location', callbackFn, failureFn);

    // Fired whenever state changes from moving->stationary or vice-versa.
    bgGeo.on('motionchange', function(isMoving) {

    });

    bgGeo.configure({
      // Geolocation config
      desiredAccuracy: 0,
      distanceFilter: 10,
      stationaryRadius: 50,
      locationUpdateInterval: 10000,
      fastestLocationUpdateInterval: 5000,

      // Activity Recognition config
      activityType: 'AutomotiveNavigation',
      activityRecognitionInterval: 5000,
      stopTimeout: 5,

      // Application config
      debug: false,
      stopOnTerminate: false,
      startOnBoot: false,

    }, function(state) {
      // This callback is executed when the plugin is ready to use.
      if (!state.enabled) {
        bgGeo.start();
      }
    });
  }
}
