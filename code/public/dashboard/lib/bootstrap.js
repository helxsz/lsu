var app = angular.module('Dashboard', ['ui.bootstrap', 'ngCookies','ngRoute']);

/**
 * Loading Directive
 * @see http://tobiasahlin.com/spinkit/
 */
app.directive('loading', function () {
    return {
        restrict: 'AE',
        replace: 'false',
        template: '<div class="loading"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>'
    }
});

app.controller('MasterCtrl', function($scope, $cookieStore) {
    var mobileView = 992;
    $scope.getWidth = function() { return window.innerWidth; };
    $scope.$watch($scope.getWidth, function(newValue, oldValue)
    {
        if(newValue >= mobileView)
        {
            if(angular.isDefined($cookieStore.get('toggle')))
            {
                if($cookieStore.get('toggle') == false)
                {
                    $scope.toggle = false;
                }            
                else
                {
                    $scope.toggle = true;
                }
            }
            else 
            {
                $scope.toggle = true;
            }
        }
        else
        {
            $scope.toggle = false;
        }

    });

    $scope.toggleSidebar = function() 
    {
        $scope.toggle = ! $scope.toggle;

        $cookieStore.put('toggle', $scope.toggle);
    };

    window.onresize = function() { $scope.$apply(); };
});


angular.module('myApp', [
  'ngRoute','ngCookies', 'ui.bootstrap' //
])
.config(function($locationProvider, $routeProvider , $httpProvider) {

  $routeProvider.when('/login', {templateUrl: 'partials/login.html', controller: 'LoginCtrl'});
  $routeProvider.when('/signup', {templateUrl: 'partials/signup.html', controller: 'RegisterCtrl', public: true});
  $routeProvider.when('/reset-password', {templateUrl: 'partials/reset-password.html', public: true});
  $routeProvider.otherwise({redirectTo: '/'});

  $httpProvider.defaults.timeout = 5000;
    
  $httpProvider.interceptors.push(function($q, $location) {
        return {
            'responseError': function(response) {
                if(response.status === 401 || response.status === 403) {
                    $location.path('/login');
                }
                return $q.reject(response);
            }
        };
    });

  //$locationProvider.html5Mode(true);  // error

});