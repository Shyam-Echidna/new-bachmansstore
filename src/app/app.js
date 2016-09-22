angular.module( 'orderCloud', [
        'ngSanitize',
        'ngAnimate',
        'ngMessages',
        'ngTouch',
        'ui.tree',
        'ui.router',
        'ui.bootstrap',
        'orderCloud.sdk',
	    'LocalForageModule',
        'toastr',
        'jcs-autoValidate',
        'ordercloud-infinite-scroll',
        'ordercloud-buyer-select',
        'ordercloud-search',
        'ordercloud-assignment-helpers',
        'ordercloud-paging-helpers',
        'ordercloud-auto-id',
        'ordercloud-credit-card',
        'ordercloud-tax',
        'ordercloud-address-validation',
        'ordercloud-current-order',
        'ordercloud-address',
        'ordercloud-lineitems',
        'ordercloud-geography',
        'algoliasearch',
        'ui.bootstrap-slider',
        'cb.x2js',
        'ngScrollbar',
        'ngScrollable',
         'cgBusy',
         'ncy-angular-breadcrumb',
         'ui.calendar'
    ])

    .run( SetBuyerID )
    .config( Routing )
    .config( ErrorHandling )
    .config( Interceptor )
    .controller( 'AppCtrl', AppCtrl )
    .config(DatePickerConfig)
    .constant('urls', {
       constantContactBaseUrl:"https://Four51TRIAL104401.jitterbit.net/Bachmans_Dev/"
    })
;

function DatePickerConfig(uibDatepickerConfig, uibDatepickerPopupConfig){
    uibDatepickerConfig.showWeeks = false;
    uibDatepickerPopupConfig.showButtonBar = false;
}

function SetBuyerID( OrderCloud, buyerid ) {
    OrderCloud.BuyerID.Get() ? angular.noop() : OrderCloud.BuyerID.Set(buyerid);
}

function Routing( $urlRouterProvider, $urlMatcherFactoryProvider, $locationProvider ) {
    $urlMatcherFactoryProvider.strictMode(false);
    $urlRouterProvider.otherwise( '/home' );
    $locationProvider.html5Mode(true);
}

function ErrorHandling( $provide ) {
    $provide.decorator('$exceptionHandler', handler);

    function handler( $delegate, $injector ) {
        return function( ex, cause ) {
            $delegate(ex, cause);
            //$injector.get('toastr').error(ex.data ? (ex.data.error || (ex.data.Errors ? ex.data.Errors[0].Message : ex.data)) : ex.message, 'Error');
        };
    }
}

function AppCtrl( $q, $scope, $rootScope, $state, appname,  toastr, $ocMedia, localdeliverytimeurl, OrderCloud ) {
    var vm = this;
    vm.name = appname;
    vm.title = appname;
    vm.showLeftNav = true;
    vm.$state = $state;
    vm.$ocMedia = $ocMedia;
    vm.datepickerOptions = {
        showWeeks: false,
        showButtonBar: false
    }
 function cleanLoadingIndicators() {
        if (vm.contentLoading && vm.contentLoading.promise && !vm.contentLoading.promise.$cgBusyFulfilled) vm.contentLoading.resolve(); //resolve leftover loading promises
    }
    vm.toggleLeftNav = function() {
        vm.showLeftNav = !vm.showLeftNav;
    };

    vm.logout = function() {
        OrderCloud.Auth.RemoveToken();
        OrderCloud.Auth.RemoveImpersonationToken();
       // LoginService.Logout();
        $state.go('home');
    };
    $rootScope.$on('$stateChangeStart', function(e, toState) {
        cleanLoadingIndicators();
        var defer = $q.defer();
        //defer.delay = 200;
        defer.wrapperClass = 'indicator-container';
        (toState.data && toState.data.loadingMessage) ? defer.message = toState.data.loadingMessage : defer.message = null;
        defer.templateUrl = 'common/loading-indicators/templates/view.loading.tpl.html';
        vm.contentLoading = defer;
    });

    $rootScope.$on('$stateChangeSuccess', function(e, toState) {
       cleanLoadingIndicators();
        if (toState.data && toState.data.componentName) {
            vm.title = appname + ' - ' + toState.data.componentName
        }
        if(toState.name == 'orderConfirmation' && toState.name == 'checkout'){
            angular.element('.base-header-inner').hide();
            angular.element('.orderConfirmationHeader').show();
        }
        else {
            vm.title = appname;
            angular.element('.base-header-inner').show();
            angular.element('.orderConfirmationHeader').hide();
        }
         $scope.$emit('CartUpdated');
    });

    $.ajax({
      method:"GET",
      dataType:"json",
      contentType: "application/json",
      url:localdeliverytimeurl
    }).success(function(data){
      console.log(data);
      vm.cstTime = new Date(data.datetime);
      var dd = data.date;
      var d = dd.split('-');
      vm.cstdate = new Date(d[2],d[0]-1,d[1]);
      getCsttime(data);
    }).error(function(data){
      console.log("error ==",data);
    })
      function getCsttime(data){


  // success example
  //$http.get('http://192.168.97.27:8010/Bachman/localdeliverytime')
       // .success(function(data, status){
            //window.alert(JSON.stringify(data.time).substring(12,17)+":00");



  function toSeconds(time_str) {
      // Extract hours, minutes and seconds
      var parts = time_str.split(':');
      // compute  and return total seconds
      return parts[0] * 3600 + // an hour has 3600 seconds
      parts[1] * 60 + // a minute has 60 seconds
      +
      parts[2]; // seconds
  }
  var dt = new Date();
  var a = "11:00:00";
  //var b = JSON.stringify(data.time).substring(12,17)+":00";
  var b = data.time;
  var aSec = toSeconds(a);
  var bSec = toSeconds(b);
  var difference = Math.abs(toSeconds(a) - toSeconds(b));

  // format time differnece
  var result = [
      Math.floor(difference / 3600), // an hour has 3600 seconds
      Math.floor((difference % 3600) / 60), // a minute has 60 seconds
      difference % 60
  ];
  // 0 padding and concatation
  result = result.map(function(v) {
      return v < 10 ? '0' + v : v;
  }).join(':');
  //document.getElementById("abc").innerHTML = result;
var a = result.split(':');
var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);


   var upgradeTime = seconds;
var seconds = upgradeTime;
function timer() {
    var days        = Math.floor(seconds/24/60/60);
    var hoursLeft   = Math.floor((seconds) - (days*86400));
    var hours       = Math.floor(hoursLeft/3600);
    var minutesLeft = Math.floor((hoursLeft) - (hours*3600));
    var minutes     = Math.floor(minutesLeft/60);
    var remainingSeconds = seconds % 60;
    if (remainingSeconds < 10) {
        remainingSeconds = "0" + remainingSeconds;
    }
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
   // console.log("time==",hours + ":" + minutes + ":" + remainingSeconds);
   if(aSec>=bSec){
     if(hours=="00")
        $scope.countdown = minutes+" Minutes Left For Same Day Delivery";
     else
        $scope.countdown = hours+" Day Hours Left For Same Day Delivery";
     $scope.$apply();
   }else{
        $scope.countdown = "Order For Next Day Delivery";
        $scope.$apply();
        clearInterval(countdownTimer);
    }
    //document.getElementById('abc').innerHTML = hours + ":" + minutes + ":" + remainingSeconds;
    if (seconds == 0 || (hours == "00" && minutes == "00")) {
        clearInterval(countdownTimer);
        $scope.countdown = "Order For Next Day Delivery";
        $scope.$apply();
    } else {
        seconds--;
    }
    }
    var countdownTimer = setInterval(timer, 1000);
//});
    }
    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        console.log(error);
    });

  /*  $rootScope.$on('OC:AccessInvalidOrExpired', function() {
        LoginService.RememberMe();
    });*/
    $rootScope.$on('OC:AccessForbidden', function(){
      //  toastr.warning("I'm sorry, it doesn't look like you have permission to access this page.", 'Warning:');
    })
}

function Interceptor( $httpProvider ) {
    $httpProvider.interceptors.push(function($q, $rootScope) {
        return {
            'responseError': function(rejection) {
                if (rejection.config && rejection.config.url.indexOf('ordercloud.io') > -1 && rejection.status == 401) {
                    $rootScope.$broadcast('OC:AccessInvalidOrExpired');
                }
                if (rejection.config && rejection.config.url.indexOf('ordercloud.io') > -1 && rejection.status == 403){
                    $rootScope.$broadcast('OC:AccessForbidden');
                }
                return $q.reject(rejection);
            }
        };
    });
}
