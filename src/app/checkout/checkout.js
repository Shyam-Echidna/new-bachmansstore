angular.module('orderCloud')

	.config(CheckoutConfig)
	.controller('CheckoutCtrl', CheckoutController)
	.controller('editCtrl', EditController)
	.factory('checkOutService', checkOutService);


function CheckoutConfig($stateProvider) {
	$stateProvider
		.state('checkout', {
			parent: 'base',
			url: '/checkout',
			templateUrl: 'checkout/templates/checkout.tpl.html',
			controller: 'CheckoutCtrl',
			controllerAs: 'checkout',
			resolve: {
                LineItems: function (OrderCloud, $rootScope, $q, CurrentOrder, toastr, $state, LineItemHelpers) {
					var deferred = $q.defer();
					CurrentOrder.Get()
						.then(function (order) {
							var order = order;
							OrderCloud.LineItems.List(order.ID).then(function (res) {
								LineItemHelpers.GetProductInfo(res.Items)
                                    .then(function () {
                                        deferred.resolve(res);
                                    });
							}).catch(function () {
								deferred.resolve(null);
							});

						}).catch(function () {
                            toastr.error('You do not have an active open order.', 'Error');
                            if ($state.current.name.indexOf('checkout') > -1) {
                                $state.go('home');
                            }
                            deferred.reject();
                        });
					return deferred.promise;
                },
                Order: function ($rootScope, $q, $state, toastr, CurrentOrder) {
                    var dfd = $q.defer();
                    CurrentOrder.Get()
                        .then(function (order) {
                            dfd.resolve(order)
                        })
                        .catch(function () {
                            dfd.resolve(null);
                        });
                    return dfd.promise;
                },
				Buyers: function (OrderCloud, $q) {
					var deferred = $q.defer();
					OrderCloud.Buyers.Get().then(function (res) {
						deferred.resolve(res);
					}).catch(function () {
						deferred.resolve(null);
					});
					return deferred.promise;
				}
			}
		})
}
function checkOutService($q, $http) {
	var service = {
		getCityState: _getCityState,
		getSetLineItem:_getSetLineItem
	}
	function _getCityState(zip) {
		var defered = $q.defer();
		$http.defaults.headers.common['Authorization'] = undefined;
		$http.get('http://maps.googleapis.com/maps/api/geocode/json?address=' + zip).then(function (res) {
			var city, state;
			angular.forEach(res.data.results[0].address_components, function (component, index) {
				var types = component.types;
				angular.forEach(types, function (type, index) {
					if (type == 'locality') {
						city = component.long_name;
					}
					if (type == 'administrative_area_level_1') {
						state = component.short_name;
					}
				});
			});
			defered.resolve({ "City": city, "State": state });
		});
		return defered.promise;
	}
	function _getSetLineItem(line){
		return { lineitem:line
		}
	}
	return service
}
function CheckoutController($scope, $window, HomeFact, PlpService, $q, $sce, alfcontenturl, CategoryService, Underscore, $rootScope, LineItems, Order, OrderCloud, Buyers) {

	var vm = this;
	var date = new Date();
	vm.lineItems = [];
	vm.signin = true;
	vm.delivery = false;
	vm.selected = false;
	vm.limit = 3;
	vm.more = true;
	vm.edit=false;
	vm.recipient = [];
	vm.recipient[0] = true;
	vm.message = false;
	vm.today = new Date();;
	vm.tomorrow = date.setDate(date.getDate() + 1);
	vm.payment = false;
	vm.DeliveryRuns = Buyers.xp.DeliveryRuns[0];
	vm.changedeliveryDate = changedeliveryDate;
	vm.getGuestLineItems = getGuestLineItems
	vm.changePreference = changePreference;
	vm.gotoNext = gotoNext;
	vm.ordersummarydata = LineItems;
	vm.orderdata = Order;
	vm.init = init;
	vm.updateLinedetails = updateLinedetails
	vm.init();

    $rootScope.$on("ChangedDetails",function(events,lineitem){
        vm.editedShippingaddress=lineitem;
	});
	function getGuestLineItems(user) {
		vm.user = user;
		if (user == 'Guest') {
			vm.signin = false;
			vm.delivery = true;
			vm.lineItems = LineItems.Items;
			angular.forEach(vm.lineItems, function (val, key, obj) {
				if (val.xp.deliveryDate)
					val.xp.deliveryDate = new Date(val.xp.deliveryDate);
			});
			var data;
			vm.lineItems = _.groupBy(vm.lineItems, function (value) {
				if (value.ShippingAddress != null) {
					//totalCost += value.xp.TotalCost;
					return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + value.ShippingAddress.Street1 + ' ' + value.ShippingAddress.Street2;
				}


			});
			console.log("lineItems", vm.lineItems);
		}
	}

	function changedeliveryDate(line, date) {
		line.xp.deliveryDate = new Date(date);
	}
	function changePreference(line, preference) {
		line.xp.DeliveryRuns = preference;

	}
	function gotoNext(index) {
		for (var i = 0; i < LineItems.Items.length; i++) {
			if (i == index + 1) {
				vm.recipient[i] = true;
			}
			else {
				vm.recipient[i] = false;
			}
		}
	}
	function init() {
		var data = _.groupBy(vm.ordersummarydata.Items, function (value) {
			if (value.ShippingAddress != null) {
				//totalCost += value.xp.TotalCost;
				return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName;
			}
		});
		console.log(vm.orderdata);
		vm.groups = data;
		vm.linetotalvalue = 0;
		vm.lineVal = [];
		vm.lineTotal = {};
		for (var n in data) {
			vm.lineVal.push(n);
			vm.lineTotal[n] = _.reduce(_.pluck(data[n], 'LineTotal'), function (memo, num) { return memo + num; }, 0);
		}
	}
	function updateLinedetails(newline, last) {
		///todo line item edited and shoud update correct line item;
		if (last) {
			vm.signin = false;
			vm.delivery = false;
			vm.payment = true;
		}
		if (newline.length > 1) {
			for (var i = 0; i < newline.length; i++) {
				if (i != 0) {
					newline[i].ShippingAddress = newline[0].ShippingAddress
					newline[i].xp = newline[0].xp;
				}

				OrderCloud.LineItems.Update(Order.ID, newline[i].ID, newline[i]).then(function (dat) {
					console.log("LineItems Data", dat);
					OrderCloud.LineItems.SetShippingAddress(Order.ID, newline[i].ID, newline[i].ShippingAddress).then(function (data) {
						console.log("1234567890", data);
						alert("Data submitted successfully");

					});
				});
			}
		}
		else {
			OrderCloud.LineItems.Update(Order.ID, newline[0].ID, newline[0]).then(function (dat) {
				console.log("LineItems Data", dat);
				OrderCloud.LineItems.SetShippingAddress(Order.ID, newline[0].ID, newline[0].ShippingAddress).then(function (data) {
					console.log("1234567890", data);
					alert("Data submitted successfully");

				});
			});
		}

	}
	vm.editPopUp = function (lineitem) {
		vm.edit=true;
		var modalInstance = $uibModal.open({
			animation: false,
			backdropClass: 'edittModal',
			windowClass: 'editModal',
			templateUrl: 'checkout/templates/edit.tpl.html',
			controller: 'editCtrl',
			controllerAs: 'edit',
			resolve: {
				Order: function ($q,CurrentOrder) {
                    var dfd = $q.defer();
                    CurrentOrder.Get()
                        .then(function (order) {
                            dfd.resolve(order)
                        })
                        .catch(function () {
                            dfd.resolve(null);
                        });
                    return dfd.promise;
                },
				LineItem: function () {
                    return lineitem;
				}

			}
		});

		modalInstance.result.then(function () {
          
		}, function () {
			angular.noop();
		});
	}

}
function EditController($uibModalInstance, LineItem, Order, checkOutService,$rootScope) {
	var vm = this;
	vm.getCityState = getCityState;
	vm.changeDetails=changeDetails;
	vm.init = init;
	init();
	vm.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
	function getCityState(line, zip) {
		checkOutService.getCityState(zip).then(function (res) {
			line.ShippingAddress.City = res.City;
			line.ShippingAddress.State = res.State;
		});
	}
	function init() {
		if (LineItem) {
			vm.lineitem = LineItem;
			if (lineitem.ShippingAddress.Phone) {
				lineitem.ShippingAddress.Phone1 = lineitem.ShippingAddress.Phone.slice(0, 3);
				lineitem.ShippingAddress.Phone2 = lineitem.ShippingAddress.Phone.slice(3, 6);
				lineitem.ShippingAddress.Phone3 = lineitem.ShippingAddress.Phone.slice(6);
			}
		}
	}
	function changeDetails(lineitem){
		if (lineitem.ShippingAddress.Phone1 && lineitem.ShippingAddress.Phone2 && lineitem.ShippingAddress.Phone3) {
				
				 lineitem.ShippingAddress.Phone=lineitem.ShippingAddress.Phone1+lineitem.ShippingAddress.Phone2+lineitem.ShippingAddress.Phone3;
			}
		return $rootScope.$emit("ChangedDetails",lineitem)
         
	}
}