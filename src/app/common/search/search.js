angular.module('ordercloud-search', []);
angular.module('ordercloud-search')

    .directive('ordercloudSearch', ordercloudSearch)
    .controller('ordercloudSearchCtrl', ordercloudSearchCtrl)
    .factory('TrackSearch', trackSearchService)
    ;

function ordercloudSearch() {
    return {
        scope: {
            placeholder: '@',
            servicename: "@",
            controlleras: "="
        },
        restrict: 'E',
        templateUrl: 'common/search/templates/search.tpl.html',
        controller: 'ordercloudSearchCtrl',
        controllerAs: 'ocSearch',
        replace: true
    }
}

function ordercloudSearchCtrl($timeout, $scope, OrderCloud, TrackSearch) {
    $scope.searchTerm = null;
    if ($scope.servicename) {
        var var_name = $scope.servicename.replace(/([a-z])([A-Z])/g, '$1 $2');
        $scope.placeholder = "Search " + var_name + '...';
        var Service = OrderCloud[$scope.servicename];
    }
    var searching;
    $scope.$watch('searchTerm', function (n, o) {
        if (n == o) {
            if (searching) $timeout.cancel(searching);
        } else {
            if (searching) $timeout.cancel(searching);
            searching = $timeout(function () {
                n == '' ? n = null : angular.noop();
                TrackSearch.SetTerm(n);
                if ($scope.servicename === 'Orders') {
                    if (!$scope.controlleras.searchfunction) {
                        Service.List('incoming', null, null, n)
                            .then(function (data) {
                                $scope.controlleras.list = data;
                            });
                    }
                    else {
                        $scope.controlleras.searchfunction($scope.searchTerm)
                            .then(function (data) {
                                $scope.controlleras.list = data;
                            });
                    }
                }
                else if ($scope.servicename === 'SpendingAccounts') {
                    if (!$scope.controlleras.searchfunction) {
                        Service.List(n, null, null, null, null, { 'RedemptionCode': '!*' })
                            .then(function (data) {
                                $scope.controlleras.list = data;
                            });
                    }
                    else {
                        $scope.controlleras.searchfunction($scope.searchTerm)
                            .then(function (data) {
                                $scope.controlleras.list = data;
                            });
                    }
                }
                else if ($scope.servicename === 'Shipments') {
                    if (!$scope.controlleras.searchfunction) {
                        Service.List(null, n, null, null)
                            .then(function (data) {
                                $scope.controlleras.list = data;
                            });
                    }
                    else {
                        $scope.controlleras.searchfunction($scope.searchTerm)
                            .then(function (data) {
                                $scope.controlleras.list = data;
                            });
                    }
                }
                else if ($scope.servicename === 'Hospital') {
                    OrderCloud.UserGroups.List("Hospitals").then(function (res) {
                        $scope.hospitals = [];
                        console.log(res.Items.ID);
                        OrderCloud.Addresses.ListAssignments(null, null, res.Items[0].ID).then(function (data) {
                            angular.forEach(data.Items, function (val, key) {
                                OrderCloud.Addresses.Get(val.AddressID).then(function (res) {
                                    $scope.hospitals.push(res); 
                                    $scope.controlleras.hospitals=$scope.hospitals;

                                });
                            });

                        });
                    })
                }
                else if ($scope.servicename === 'Funeral') {
                    OrderCloud.UserGroups.List('Funeral').then(function (res) {
                        $scope.funeralHomes = [];
                        console.log(res.Items.ID);
                        OrderCloud.Addresses.ListAssignments(null, null, res.Items[0].ID).then(function (data) {
                            angular.forEach(data.Items, function (val, key) {
                                OrderCloud.Addresses.Get(val.AddressID).then(function (res) {
                                    $scope.funeralHomes.push(res);
                                     $scope.controlleras.funeralHomes= $scope.funeralHomes;
                                });
                            });

                        });
                    })
                }
                else if ($scope.servicename === 'Church') {
                    OrderCloud.UserGroups.List('Church').then(function (res) {
                        $scope.churchs = [];
                        console.log(res.Items.ID);
                        OrderCloud.Addresses.ListAssignments(null, null, res.Items[0].ID).then(function (data) {
                            angular.forEach(data.Items, function (val, key) {
                                OrderCloud.Addresses.Get(val.AddressID).then(function (res) {
                                    $scope.churchs.push(res);
                                    $scope.controlleras.churchs=$scope.churchs;
                                });
                            });

                        });
                    })
                }
                else if ($scope.servicename === 'School') {
                    OrderCloud.UserGroups.List('School').then(function (res) {
                        $scope.schools = [];
                        console.log(res.Items.ID);
                        OrderCloud.Addresses.ListAssignments(null, null, res.Items[0].ID).then(function (data) {
                            angular.forEach(data.Items, function (val, key) {
                                OrderCloud.Addresses.Get(val.AddressID).then(function (res) {
                                    $scope.schools.push(res);
                                    $scope.controlleras.schools=$scope.schools;
                                });
                            });

                        });
                    })
                }
                else {
                    if (!$scope.controlleras.searchfunction) {
                        Service.List(n)
                            .then(function (data) {
                                $scope.controlleras.list = data;
                            });
                    }
                    else {
                        $scope.controlleras.searchfunction($scope.searchTerm)
                            .then(function (data) {
                                $scope.controlleras.list = data;
                            });
                    }
                }

            }, 300);
        }
    });
}

function trackSearchService() {
    var service = {
        SetTerm: _setTerm,
        GetTerm: _getTerm
    };

    var term = null;

    function _setTerm(value) {
        term = value;
    }

    function _getTerm() {
        return term;
    }

    return service;
}

