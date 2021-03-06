angular.module('orderCloud')

	.config(PdpConfig)
	.factory('PdpService', PdpService)
	.controller('PdpCtrl', PdpController)
    .controller('MultipleRecipientCtrl', MultipleRecipientController)
    .controller('addedToCartCtrl1', addedToCartController1)
	.directive('numbersOnly', numbersOnly)
	.directive('usZipcode', usZipcode)
	.directive('noSunday', noSunday)
	;


function PdpConfig($stateProvider) {
	$stateProvider
		.state('pdp', {
			parent: 'base',
			url: '/pdp/:catId?prodId',
			templateUrl: 'pdp/templates/pdp.tpl.html',
			resolve: {
				productDetail: function (PlpService, PdpService, $q, $stateParams, $http, OrderCloud, $cookieStore) {
					var deferred = $q.defer();
					OrderCloud.Products.Get($stateParams.prodId).then(function (data) {
						PdpService.GetSeqProd(data.xp.SequenceNumber).then(function (res) {
							var inventoryFilteredList = []; // Array for Products with inventory
							angular.forEach(res, function (value, key) {
								var promise = PdpService.GetProdInventory(value.ID).then(function (res) {
									//if (res.Available > 1) {
									return value;
									//}
								});
								console.log(promise);
								inventoryFilteredList.push(promise);
							});
							$q.all(inventoryFilteredList).then(function (items) {
								var data = items.filter(function (element) {
									return element !== undefined;
								});
								deferred.resolve(data);
							});
						});
					});
					return deferred.promise;
				},
				CurrentCatgory: function ($stateParams, OrderCloud, $q) {
					return OrderCloud.Categories.Get($stateParams.catId, "bachmans").then(function (res) {
						return res;
					});

				},
				selectedProduct: function ($stateParams) {
					return $stateParams.prodId;
				},
				productImages: function (PdpService, $stateParams, $q, $http, productDetail, selectedProduct) {

					if (selectedProduct != undefined) { //Product selected
						return PdpService.GetProductCodeImages($stateParams.prodId);
					} else { // Default product landing
						return PdpService.GetProductCodeImages(productDetail[0].xp.ProductCode);
					}
				},
				extraProductImages: function (PlpService) {
					var ticket = localStorage.getItem("alf_ticket");
					return PlpService.GetProductImages(ticket).then(function (res) {
						return res.items;
					});
				},
				extraProducts: function (extraProductImages, Underscore, PdpService, alfcontenturl) {

					var imageData = PdpService.GetExtras()
					var res = Object.keys(imageData).map(function (key) { return imageData[key] });;
					var ticket = localStorage.getItem("alf_ticket");
					var imgcontentArray = [];
					for (var i = 0; i < res.length; i++) {
						for (var j = 0; j < res[i].length; j++) {
							angular.forEach(Underscore.where(extraProductImages, { title: res[i][j].Skuid }), function (node) {
								node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
								imgcontentArray.push(node);
							});
							res[i][j].imgContent = imgcontentArray;
							imgcontentArray = [];
						}
					}
					return res;

				},
				CstDateTime: function ($q, PdpService) {
					var dfr = $q.defer();
					PdpService.CompareDate().then(function (dt) {
						dfr.resolve(new Date(dt));
					});
					return dfr.promise;
				}
			},
			controller: 'PdpCtrl',
			controllerAs: 'pdp',
			ncyBreadcrumb: {

				label: "{{base.name3}}",
				parent: "secound"
			}
		})
}

var guest = {
    "ClientID": "8836BE8D-710A-4D2D-98BF-EDBE7227E3BB",
    "Claims": ["FullAccess"]
};

function PdpService($q, Underscore, OrderCloud, CurrentOrder, $http, $uibModal, x2js, alfrescourl, alfcontenturl, $rootScope, $cookieStore, localdeliverytimeurl, GetCstTime) {
	var service = {
		AddToWishList: _addToWishList,
		CreateOrder: _createOrder,
		addressValidation: _addressValidation,
		GetProductCodeImages: _getProductCodeImages,
		GetHelpAndPromo: _getHelpAndPromo,
		GetSeqProd: _getSeqProd,
		getCityState: _getCityState,
		GetStores: _GetStores,
		GetPhoneNumber: _GetPhoneNumber,
		GetOldPhoneNumber: _GetOldPhoneNumber,
		GetChurches: _GetChurches,
		GetFuneralHomes: _GetFuneralHomes,
		GetHospitals: _GetHospitals,
		GetProdInventory: _getProdInventory,
        GetExtras: _getExtras,
		CompareDate: _CompareDate,
		GetBuyerDtls: _GetBuyerDtls,
		GetDeliveryOptions: _GetDeliveryOptions,
		GetPreceedingZeroDate: _GetPreceedingZeroDate,
		Getcemeteries: _Getcemeteries,
		CheckTime: _CheckTime,
		GetProdCode: _getProdCode,
		CheckDeliveryMethod: _CheckDeliveryMethod,
		CallDeliveryOptions: _CallDeliveryOptions,
		CalculateDeliveryCharges: _CalculateDeliveryCharges,
		getUpSellData: _getUpSellData
	};
	function _Getcemeteries() {
		var defered = $q.defer();
		var cemeteries = [];
		OrderCloud.UserGroups.List('Cemetery').then(function (res) {
			console.log(res.Items.ID);
			OrderCloud.Addresses.ListAssignments(null, null, res.Items[0].ID).then(function (data) {
				angular.forEach(data.Items, function (val, key) {
					OrderCloud.Addresses.Get(val.AddressID).then(function (res) {
						cemeteries.push(res);
						defered.resolve(cemeteries);
					});
				});



			});
		})
		return defered.promise;
	}
	function _GetPreceedingZeroDate(dt) {
		var d = $q.defer(), date;
		dt = new Date(dt);
		dt = (("0" + (dt.getMonth() + 1)).slice(-2)) + "-" + (("0" + dt.getDate()).slice(-2)) + "-" + dt.getFullYear();
		d.resolve(dt);
		return d.promise;
	}
	function _GetDeliveryOptions(line, DeliveryMethod) {
		var d = $q.defer();
		OrderCloud.Categories.ListProductAssignments(null, line.ProductID).then(function (res1) {

			OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function (res2) {
				//OrderCloud.Categories.Get('c2_c1_c1').then(function (res2) {

				//OrderCloud.Categories.Get('OutdoorLivingDecor_Grilling_Grills').then(function (res2) {
				//OrderCloud.Categories.Get('c4_c1').then(function (res2) {
				var key = {}, MinDate = {};
				line.xp.NoInStorePickUp = true;
				if (res2.xp.DeliveryChargesCatWise.DeliveryMethods['InStorePickUp']) {
					line.xp.NoInStorePickUp = false;
				}
				_.each(res2.xp.DeliveryChargesCatWise.DeliveryMethods, function (v, k) {
					if (v.MinDays) {
						MinDate[k] = v.MinDays;
						key['MinDate'] = MinDate;
					}
					if (k == "UPS" && v['Boolean'] == true) {
						key[k] = {};
					}
					if (k == "USPS" && v['Boolean'] == true) {
						key[k] = {};
					}
					if (k == "InStorePickUp") {
						key[k] = {};
					}
					if (k == 'Mixed' && v['Boolean'] == true) {
						key[k] = {};
					}
					_.each(v, function (v1, k1) {
						var obj = {};
						if (v1['Boolean'] == true) {
							if (k == "Mixed" && line.Quantity < 50) {

							} else {
								obj[k1] = v1['Value'];
								key[k] = obj;
							}
						}
					});
				});
				if (key['UPS'] && !key['LocalDelivery'] && !key['Mixed'] && !key['InStorePickUp'] && !key['USPS'] && !key['DirectShip'] && !key['Courier']) {
					DeliveryMethod = "UPS";
				}
				if (!key['UPS'] && !key['LocalDelivery'] && !key['Mixed'] && key['InStorePickUp'] && !key['USPS'] && !key['DirectShip'] && !key['Courier']) {
					line.xp.NoDeliveryExInStore = true;
					line.xp.addressType = "Will Call";
				}
				delete line.xp.Status;
				if (DeliveryMethod == "UPS" && !key['UPS'])
					line.xp.Status = "OnHold";
				_GetBuyerDtls().then(function (dt) {
					if (DeliveryMethod == "LocalDelivery") {
						if (!key.LocalDelivery)
							key.LocalDelivery = {};
						key.LocalDelivery.StandardDelivery = dt.xp.Shippers.LocalDelivery.StandardDelivery;
						key.LocalDelivery.SameDayDelivery = dt.xp.Shippers.LocalDelivery.SameDayDelivery;
					} else if (DeliveryMethod == "InStorePickUp") {
						//key.InStorePickUp = dt.xp.Shippers.InStorePickUp;
						//d.resolve(key);
					} else if (DeliveryMethod == "UPS") {
						//key.UPS = {};
						if (key.UPS)
							key.UPS.UPSCharges = dt.xp.Shippers.UPS.UPSCharges;
					} else if (DeliveryMethod == "DirectShip") {
						key.DirectShip.StandardDelivery = dt.xp.Shippers.DirectShip.StandardDelivery;
					}
					else if (DeliveryMethod == "Mixed") {
						if (!key.Mixed)
							key['Mixed'] = {};
						key.Mixed.StandardDelivery = dt.xp.Shippers.Mixed.StandardDelivery;
					}
					else if (DeliveryMethod == "USPS") {
						key.USPS = {};
						key.USPS.USPSCharges = dt.xp.Shippers.USPS.USPSCharges;
					}
					//else if (DeliveryMethod == "Courier") {
					// 	key.Courier = {};
					// 	key.Courier.CourierCharges = dt.xp.Shippers.Courier.OMS;
					// }
					d.resolve(key);
				});
			});
		});
		return d.promise;
	}
	function _GetBuyerDtls() {
		var d = $q.defer();
		OrderCloud.Buyers.Get().then(function (res) {
			d.resolve(res);
		});
		return d.promise;
	}
	function _CompareDate(endDate) {
		//endDate = new Date(endDate);
		//endDate = (("0" + (endDate.getMonth() + 1)).slice(-2)) + "-" + (("0" + endDate.getDate()).slice(-2)) + "-" + endDate.getFullYear()
		var d = $q.defer();
		$.ajax({
			method: "GET",
			dataType: "json",
			contentType: "application/json",
			url: GetCstTime,
			success: function (res) {
				if (endDate == res.date)
					d.resolve("1");
				else
					d.resolve(res.datetime);
			},
			error: function (err) {
				console.log("err" + err);
			}
		});
		//.success().error();
		return d.promise;
	}




	function _getExtras() {
		var data = {
			"Balloons": [
				{
					"Skuid": "bal_1",
					"Title": "Balloon Orange",
					"Price": "$4.99",
					"CategoryName": "Balloons"
				},
				{
					"Skuid": "bal_2",
					"Title": "Balloon Red",
					"Price": "$5.99",
					"CategoryName": "Balloons"
				},
				{
					"Skuid": "bal_3",
					"Title": "Balloon Blue",
					"Price": "$6.99",
					"CategoryName": "Balloons"
				},
				{
					"Skuid": "bal_4",
					"Title": "Balloon Pink",
					"Price": "$7.99",
					"CategoryName": "Balloons"
				}
			],
			"Plush": [
				{
					"Skuid": "plush_1",
					"Title": "Flora Frog 12'",
					"Price": "$5.99",
					"CategoryName": "Plush"
				},
				{
					"Skuid": "plush_2",
					"Title": " Stuffed Animal- FTD",
					"Price": "$5.99",
					"CategoryName": "Plush"
				},
				{
					"Skuid": "plush_3",
					"Title": " Baabsy Lamb",
					"Price": "$5.99",
					"CategoryName": "Plush"
				},
				{
					"Skuid": "plush_4",
					"Title": " Lin Lin Panda",
					"Price": "$5.99",
					"CategoryName": "Plush"
				}
			],
			"Sweets": [
				{
					"Skuid": "sweet_1",
					"Title": " Chocolate Stars",
					"Price": "$4.99",
					"CategoryName": "Sweets"
				},
				{
					"Skuid": "sweet_2",
					"Title": "Bittersweet chocolate",
					"Price": "$4.99",
					"CategoryName": "Sweets"
				},
				{
					"Skuid": "sweet_3",
					"Title": "Milk chocolate",
					"Price": "$4.99",
					"CategoryName": "Sweets"
				},
				{
					"Skuid": "sweet_4",
					"Title": "Chocolate Daisies",
					"Price": "$4.99",
					"CategoryName": "Sweets"
				}
			]
		}
		return data;
	}



	function _getProdInventory(ProdId) {
		var defferred = $q.defer();
		OrderCloud.Products.GetInventory(ProdId).then(function (res) {
			defferred.resolve(res);
		});
		return defferred.promise;
	}
	function _GetChurches() {
		var defered = $q.defer();
		var churchs = [];
		OrderCloud.UserGroups.List('Church').then(function (res) {
			console.log(res.Items.ID);
			OrderCloud.Addresses.ListAssignments(null, null, res.Items[0].ID).then(function (data) {
				angular.forEach(data.Items, function (val, key) {
					OrderCloud.Addresses.Get(val.AddressID).then(function (res) {
						churchs.push(res);
						defered.resolve(churchs);
					});
				});

			});
		})
		return defered.promise;
	}
	function _GetFuneralHomes() {
		var defered = $q.defer();
		var funeralHomes = [];
		OrderCloud.UserGroups.List('Funeral').then(function (res) {
			console.log(res.Items.ID);
			OrderCloud.Addresses.ListAssignments(null, null, res.Items[0].ID).then(function (data) {
				angular.forEach(data.Items, function (val, key) {
					OrderCloud.Addresses.Get(val.AddressID).then(function (res) {
						funeralHomes.push(res);
						defered.resolve(funeralHomes);
					});
				});

			});
		})
		return defered.promise;
	}
	function _GetHospitals() {
		var defered = $q.defer();
		var hospitals = [];
		OrderCloud.UserGroups.List('Hospitals').then(function (res) {
			console.log(res.Items.ID);
			OrderCloud.Addresses.ListAssignments(null, null, res.Items[0].ID).then(function (data) {
				angular.forEach(data.Items, function (val, key) {
					OrderCloud.Addresses.Get(val.AddressID).then(function (res) {
						hospitals.push(res);
						defered.resolve(hospitals);
					});
				});

			});
		})
		return defered.promise;
	}
	function _GetPhoneNumber(phn) {
		var d = $q.defer();
		var arr = [];
		var init = phn.indexOf('(');
		var fin = phn.indexOf(')');
		arr.push(parseInt(phn.substr(init + 1, fin - init - 1)));
		init = phn.indexOf(' ');
		fin = phn.indexOf('-');
		arr.push(parseInt(phn.substr(init + 1, fin - init - 1)));
		init = phn.indexOf('-');
		arr.push(parseInt(phn.substr(init + 1, phn.length)));
		d.resolve(arr);
		return d.promise;
	}
	function _GetOldPhoneNumber() {
		var d = $q.defer();
		var arr = [];
		var init = phn.indexOf('(');
		var fin = phn.indexOf(')');
		arr.push(parseInt(phn.substr(init + 1, fin - init - 1)));
		init = phn.indexOf(')');
		fin = phn.indexOf('-');
		arr.push(parseInt(phn.substr(init + 1, fin - init - 1)));
		init = phn.indexOf('-');
		arr.push(parseInt(phn.substr(init + 1, phn.length)));
		d.resolve(arr);
		return d.promise;
	}
	function _GetStores() {
		var defered = $q.defer();
		$http.get('https://api.myjson.com/bins/4wsk2').then(function (res) {
			defered.resolve(res);
		});
		return defered.promise;
	}

	function _getCityState(zip) {
		var defered = $q.defer();
		$http.defaults.headers.common['Authorization'] = undefined;
		$http.get('http://maps.googleapis.com/maps/api/geocode/json?address=' + zip).then(function (res) {
			var city, state, country, obj = {}, Cities = [];
			angular.forEach(res.data.results[0].address_components, function (component, index) {
				var types = component.types;
				angular.forEach(types, function (type, index) {
					if (type == 'locality') {
						city = component.long_name;
					}
					if (type == 'administrative_area_level_1') {
						state = component.short_name;
					}
					if (type == 'country') {
						country = component.short_name;
					}
				});
			});
			console.log("cities " + res.data.results[0]);
			if (res.data.results[0].postcode_localities) {
				Cities = res.data.results[0].postcode_localities
				obj = { "City": city, "State": state, 'Country': country, 'Cities': Cities }
				if (zip == 55038)
					obj.Cities.push("Columbus");
				if (zip == 55082) {
					obj.Cities.push("Grant");
					obj.Cities.push("West Lakeland");
				}
				defered.resolve(obj);
			}
			else {
				defered.resolve({ "City": city, "State": state, 'Country': country });
			}

		});
		return defered.promise;
	}
	function _getSeqProd(sequence) {
		/*	var defferred = $q.defer();
			$http({
				method: 'GET',
				dataType: "json",
				url: "https://api.ordercloud.io/v1/me/products?xp.sequencenumber=" + sequence,
	
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + OrderCloud.Auth.ReadToken()
				}
	
			}).success(function (data, status, headers, config) {
	
				defferred.resolve(data);
			}).error(function (data, status, headers, config) {
			});
			return defferred.promise;*/
		var defferred = $q.defer();
		OrderCloud.Products.List(null, 1, 100, null, null, { "xp.sequencenumber": sequence }).then(function (res) {
			// var d= $q.defer();
			var queue = [];
			angular.forEach(res.Items, function (node) {
				queue.push(getprices(node));

			});
			$q.all(queue).then(function (items) {
				defferred.resolve(items);
			});
		})
		return defferred.promise;
	}
	function _getProdCode(prodCode) {
		var defferred = $q.defer();
		OrderCloud.Products.List(null, 1, 100, null, null, { "xp.ProductCode": prodCode }).then(function (res) {
			// var d= $q.defer();
			var queue = [];
			angular.forEach(res.Items, function (node) {
				queue.push(getprices(node));

			});
			$q.all(queue).then(function (items) {
				defferred.resolve(items);
			});
		})
		return defferred.promise;
	}

	function getprices(node) {
		var d = $q.defer();
		//OrderCloud.Products.ListAssignments(node.ID).then(function (list) {
			OrderCloud.PriceSchedules.Get(node.ID).then(function (success) {
				node["StandardPriceSchedule"] = success;
				d.resolve(node);

			});
		//});
		return d.promise;
	}
	function _getProductCodeImages(prodCode) {
		var deferred = $q.defer();
		var ticket = localStorage.getItem("alf_ticket");
		var productVarientImages = [];
		$http.get(alfcontenturl + "api/search/keyword.atom?q=" + prodCode + "&alf_ticket=" + ticket).then(function (res) {
			var x2js = new X2JS();
			var data = x2js.xml_str2json(res.data);
			var arrayData = data.feed.entry;
			if (!arrayData) {
				arrayData = {};
				arrayData.link = {};
				arrayData.link._href = 'http://52.206.111.191:8080/alfresco/d/a/workspace/SpacesStore/983a2452-9626-4258-b728-4212b73d39f4/noimg.jpg';
			}
			if (!Array.isArray(arrayData)) {
				arrayData = [arrayData];
			}
			angular.forEach(arrayData, function (value, key) {
				if (value.link._href.toLowerCase().match(/\.(jpg|jpeg|png|gif)/g)) {
					productVarientImages.push(value.link._href + '?alf_ticket=' + ticket);
				}
			});
			deferred.resolve(productVarientImages);
		});
		return deferred.promise;
	}
    function _addToWishList(productID, isOnload) {
		var deferred = $q.defer();
		OrderCloud.Me.Get().then(function (res) {
			if (res.ID == "gby8nYybikCZhjMcwVPAiQ") {
				if (!isOnload) {
					var modalInstance = $uibModal.open({
						animation: true,
						backdropClass: 'loginModalBg',
						windowClass: 'loginModalBg',
						templateUrl: 'login/templates/login.modal.tpl.html',
						controller: 'LoginCtrl',
						controllerAs: 'login',
						resolve: {
							emailSubscribeList: function (ConstantContact) {
								return ConstantContact.GetListOfSubscriptions();
							},
							CurrentUser: function ($q, $state, OrderCloud) {
								var dfd = $q.defer();
								OrderCloud.Me.Get()
									.then(function (data) {
										dfd.resolve(data);
									})
									.catch(function () {
										OrderCloud.Auth.RemoveToken();
										OrderCloud.Auth.RemoveImpersonationToken();
										// OrderCloud.BuyerID.Set(null);
										$state.go('home');
										dfd.resolve();
									});
								return dfd.promise;
							}
						}
					});
					modalInstance.result.then(function () {

					}, function () {
						angular.noop();
					});
				}
				deferred.resolve();
			} else {
				var Obj = res;
				if (Obj.xp.WishList === undefined) {
					Obj.xp.WishList = [];
				}
				if (Obj.xp.WishList.indexOf(productID) < 0) {
					if (!isOnload) {
						Obj.xp.WishList.push(productID);
						OrderCloud.Me.Patch(JSON.stringify(Obj)).then(function (res) {
							deferred.resolve(true);
						});
					} else {
						deferred.resolve();
					}
				} else {
					deferred.resolve(false);
				}
			}

		});
		return deferred.promise;

    }
    function _createOrder() {
		//var productID;
		var deferred = $q.defer();
		if ($cookieStore.get('isLoggedIn')) {
			OrderCloud.Me.Get().then(function (res) {
				console.log(res);
				CurrentOrder.Get().then(function (order) {
					console.log("order= " + order);
					deferred.resolve(order);

				}, function () {
					OrderCloud.Orders.Create({}).then(function (order) {
						CurrentOrder.Set(order.ID);

						console.log("order= " + order);
						deferred.resolve(order);

					})

				})
			})

		}
		else {


			CurrentOrder.Get().then(function (order) {

				console.log("order= " + order);
				deferred.resolve(order);

			}, function () {
				OrderCloud.Orders.Create({}).then(function (order) {
					CurrentOrder.Set(order.ID);
					deferred.resolve(order);

				})

			})

        }
		return deferred.promise;
	}
    function _addressValidation(obj) {
		var deferred = $q.defer();
		$http.defaults.headers.common['Authorization'] = 'Basic QXZhbGFyYTpDNGxjdWw0dDNUYXghIQ==';
		$http.post('https://Four51TRIAL104401.jitterbit.net/Four51Test/v1/AvalaraValidateAddress', obj).then(function (res) {
			deferred.resolve(res);
		});
		return deferred.promise;
	}
    function _getHelpAndPromo(ticket) {
		var defferred = $q.defer();
		$http({
			method: 'GET',
			dataType: "json",
			url: alfrescourl + "ProductListing/HelpAndPromos?alf_ticket=" + ticket,
			headers: {
				'Content-Type': 'application/json'
			}
		}).success(function (data, status, headers, config) {
			defferred.resolve(data);
		}).error(function (data, status, headers, config) {
			defferred.reject(data);
		});
		return defferred.promise;
	}
	function _CheckTime() {
		//endDate=new Date(endDate);
		//endDate=(("0" +(endDate.getMonth() + 1)).slice(-2))+ "-" + (("0" + endDate.getDate()).slice(-2)) + "-" +endDate.getFullYear()
		var d = $q.defer();
		$.ajax({
			method: "GET",
			dataType: "json",
			contentType: "application/json",
			url: localdeliverytimeurl,
			success: function (res) {
				var datetime = new Date(res.datetime);
				var time = datetime.getHours();
				if (time <= 12)
					d.resolve("sameday");
				else
					d.resolve('notsameday');
			},
			error: function (err) {
				console.log("err" + err);
			}
		});
		//.success().error();
		return d.promise;
	}
	function _CheckDeliveryMethod(line, CstDateTime) {
        var d = $q.defer();
        var IsLocal;
        OrderCloud.Categories.ListProductAssignments(null, line.ProductID).then(function (res1) {
            //OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function (res2) {
            OrderCloud.Categories.Get('GardenPlants_Annuals').then(function (res2) {
                var DeliveryMethods = res2
                if (!!line.ShippingAddress.Zip) {
                    if (line.xp.DeliveryMethod == 'Faster') {
                        _getCityState(line.ShippingAddress.Zip).then(function (res) {
                            var city = res.City;
                            if (res.Cities) {
                                city = res.Cities[0]
                            }
                            IsLocal = _.contains(["Minneapolis", "Saint Paul", "Medina", "Anoka", "Centerville", "Stillwater", "Grant"], city);
                            if (IsLocal) {
                                _CallDeliveryOptions(line, DeliveryMethods, CstDateTime);
                                d.resolve(1);
                            } else {
                                line.xp.DeliveryMethod = ""
                                if (DeliveryMethods.Name == "Gift Cards") {
                                    line.xp.DeliveryMethod = 'USPS'
                                }
                                if (DeliveryMethods.xp.DeliveryChargesCatWise.DeliveryMethods.UPS) {
                                    line.xp.DeliveryMethod = 'UPS';
                                }
                                if (DeliveryMethods.xp.DeliveryChargesCatWise.DeliveryMethods.LocalDelivery) {
                                    line.xp.DeliveryMethod = 'LocalDelivery';
                                }
                                if (DeliveryMethods.xp.DeliveryChargesCatWise.DeliveryMethods.UPS && DeliveryMethods.xp.DeliveryChargesCatWise.DeliveryMethods.LocalDelivery) {
                                    if (IsLocal) {
                                        line.xp.DeliveryMethod = 'LocalDelivery';
                                    } else {
                                        line.xp.DeliveryMethod = 'UPS';
                                    }
                                }
                                _CallDeliveryOptions(line, DeliveryMethods, CstDateTime);
                                d.resolve(1);
                            }
                        }).catch(function (err) {
                            console.log(err);
                            d.reject();
                        });
                    } else {
                        IsLocal = _.contains(["Minneapolis", "Saint Paul", "Medina", "Anoka", "Centerville", "Stillwater", "Grant"], line.ShippingAddress.City);
                        if (DeliveryMethods.Name == "Gift Cards") {
                            line.xp.DeliveryMethod = 'USPS'
                        }
                        if (DeliveryMethods.xp.DeliveryChargesCatWise.DeliveryMethods.UPS) {
                            line.xp.DeliveryMethod = 'UPS';
                        }
                        if (DeliveryMethods.xp.DeliveryChargesCatWise.DeliveryMethods.LocalDelivery) {
                            line.xp.DeliveryMethod = 'LocalDelivery';
                            d.resolve(1);
                        }
                        if (DeliveryMethods.xp.DeliveryChargesCatWise.DeliveryMethods.UPS && DeliveryMethods.xp.DeliveryChargesCatWise.DeliveryMethods.LocalDelivery) {
                            if (IsLocal) {
                                line.xp.DeliveryMethod = 'LocalDelivery';
                            } else {
                                line.xp.DeliveryMethod = 'UPS';
                            }
                        }

                        _CallDeliveryOptions(line, DeliveryMethods, CstDateTime);
                        d.resolve(1);
                    }
                }
            });
        });
        return d.promise;
    }
	function _CallDeliveryOptions(line, DeliveryMethods, CstDateTime) {
		var key = {}, dt, MinDate = {};
		line.xp.MinDays = {};
		_.each(DeliveryMethods.xp.CategoryDeliveryCharges.DeliveryMethods, function (v, k) {
			if (v.MinDays) {
				MinDate[k] = v.MinDays;
				key['MinDate'] = MinDate;
			}
		});
		line.xp.MinDate = key.MinDate;
		if (line.xp.MinDate) {
			angular.forEach(line.xp.MinDate, function (val1, key1) {
				dt = angular.copy(CstDateTime);
				dt = dt.setDate(dt.getDate() + val1);
				line.xp.MinDays[key1] = new Date(dt);
			}, true);
			line.xp.MinDays['MinToday'] = new Date(angular.copy(CstDateTime));
			if (line.xp.MinDate.LocalDelivery) {
				dt = angular.copy(CstDateTime);
				//dt.setHours(0, 0, 0, 0);
				if (dt.getHours() >= 12)
					dt = dt.setDate(dt.getDate() + line.xp.MinDate.LocalDelivery + 1);
				else
					dt = dt.setDate(dt.getDate() + line.xp.MinDate.LocalDelivery);
				line.xp.MinDays['MinToday'] = new Date(dt);
			}
		} else {
			dt = angular.copy(CstDateTime);
			line.xp.MinDate = {};
			if (dt.getHours() >= 12)
				line.xp.MinDays['MinToday'] = dt.setDate(dt.getDate() + 1);
			else
				line.xp.MinDays['MinToday'] = dt;
		}
		if (DeliveryMethods.xp.DeliveryChargesCatWise.DeliveryMethods[line.xp.DeliveryMethod]) {
			line.xp.DeliveryNotAvailable = false;
			line.xp.Status = null;
		} else {
			if ((Product.xp['Code B4'] == "F" || Product.xp['Code B4'] == "T") && line.xp.DeliveryMethod != "LocalDelivery") {
				line.xp.Destination = Product.xp['Code B4'];
				line.xp.Status = "OnHold";
				line.xp.DeliveryNotAvailable = false;
			} else {
				delete line.xp.Destination;
				line.xp.Status = null;
				line.xp.DeliveryNotAvailable = true;
			}
		}

	}
	function _CalculateDeliveryCharges(line, BuyerXp, CstDateTime) {
        var d = $q.defer();
        var obj = {};
        var dt;
		OrderCloud.Categories.ListProductAssignments(null, line.ProductID).then(function (res1) {
            //OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function (res2) {
            OrderCloud.Categories.Get('GardenPlants_Annuals').then(function (res2) {
				OrderCloud.Me.GetProduct(line.ProductID).then(function (data) {
					var DeliveryMethods = res2, Product = data;
					if (DeliveryMethods.xp.DeliveryChargesCatWise.DeliveryMethods[line.xp.DeliveryMethod]) {
						if (line.xp.DeliveryMethod == "LocalDelivery" || line.xp.DeliveryMethod == "Faster") {
							obj['Standard Delivery'] = BuyerXp.Shippers.LocalDelivery.StandardDeliveryFees;
							if (line.Quantity >= 50) {
								if (Product.xp.Handling)
									obj['Handling Charges'] = Product.Handling;
								if (line.xp.DeliveryMethod == "Faster") {
									if (line.ShippingAddress.City == "Minneapolis" || line.ShippingAddress.City == "Saint Paul")
										obj['Service Fees'] = BuyerXp.AdditionalCharges.ServiceFees;
									else
										line.DeliveryNotAvailable = true;
								}
							}
						}
						if (line.xp.DeliveryMethod == "UPS") {
							obj['UPS Charges'] = BuyerXp.Shippers.UPS.UPSCharges;
						}
						if (line.xp.DeliveryMethod == "Courier") {
							obj = {};
							obj['Courier Charges'] = BuyerXp.Shippers.Courier.OMS;
						}
						if (DeliveryMethods.Name == "Gift Cards") {
							obj = {};
							obj['USPS Charges'] = BuyerXp.Shippers.USPS.USPSCharges;
						}
						if (DeliveryMethods.xp.PalletCharge)
							obj['Pallet Charge'] = DeliveryMethods.xp.PalletCharge;
						if (line.xp.deliveryFeesDtls && line.xp.addressType != "InStorePickUp") {
							if (line.xp.deliveryFeesDtls['Placement Charges'])
								obj['Placement Charges'] = line.xp.deliveryFeesDtls['Placement Charges'];
						}
						dt = angular.copy(CstDateTime).setHours(0, 0, 0, 0);
						if (angular.copy(CstDateTime).getHours() < 12 && dt == new Date(line.xp.deliveryDate) && (line.xp.DeliveryMethod == "LocalDelivery" || line.xp.DeliveryMethod == "Faster")) {
							obj['Same Day Delivery'] = BuyerXp.Shippers.LocalDelivery.StandardDeliveryFees;
							if (line.xp.addressType == "Funeral" || line.xp.addressType == "Church") {
								if (BuyerXp.Shippers.LocalDelivery.StandardDeliveryFees > 0) {
									obj = {};
									obj['Same Day Delivery'] = BuyerXp.Shippers.LocalDelivery.StandardDeliveryFees;
								} else {
									obj[line.xp.addressType + " Charges"] = BuyerXp.Shippers.LocalDelivery.Funeral_ChurchFees;
								}
							}
						}
						line.xp.deliveryFeesDtls = obj;
						line.xp.TotalCost = 0;
						line.xp.deliveryCharges = 0;
						angular.forEach(line.xp.deliveryFeesDtls, function (val, key) {
							line.xp.deliveryCharges += parseFloat(val);
						}, true);
						if (line.xp.NoDeliveryFees == true || line.xp.addressType == "InStorePickUp") {
							if (line.xp.deliveryFeesDtls['Placement Charges']) {
								line.xp.deliveryFeesDtls = {
									"Placement Charges": line.xp.deliveryFeesDtls['Placement Charges']
								};
								line.xp.deliveryCharges = line.xp.deliveryFeesDtls['Placement Charges'];
								line.xp.TotalCost = parseInt(line.xp.deliveryFeesDtls['Placement Charges']);
							} else {
								delete line.xp.deliveryFeesDtls;
								line.xp.deliveryCharges = 0;
							}
							if (line.xp.Tax)
								line.xp.TotalCost = line.xp.TotalCost + line.xp.Tax + (line.Quantity * line.UnitPrice);
							else
								line.xp.TotalCost = line.xp.TotalCost + line.Quantity * line.UnitPrice;
						} else {
							if (line.xp.deliveryCharges > 250) {
								line.xp.Discount = line.xp.deliveryCharges - 250;
								line.xp.deliveryCharges = 250;
							}
							line.xp.TotalCost = line.xp.deliveryCharges + (line.Quantity * line.UnitPrice);
							if (line.xp.Tax)
								line.xp.TotalCost = line.xp.TotalCost + line.xp.Tax;
						}

						d.resolve("1");
					}
				});
			});
		});
		return d.promise;
	}
	function _getUpSellData(prodID) {
		var d = $q.defer();
		var upSellCategories = [];
		var UpsellDtls = null;
		var CategoryItemsUpsell = {};
		upsell(prodID).then(function (res) {
			d.resolve(res)
		})
		function upsell() {
			var tempArr = [];
			var cats = [];
			var tempArr1 = [];
			var d = $q.defer();

			//OrderCloud.Products.Get(prodID).then(function (data) {
			OrderCloud.Products.Get("cat2_cat12_prod2").then(function (data) {

				UpsellDtls = data;
				_.filter(UpsellDtls.xp.Upsell, function (row) {
					_.each(row, function (val, key) {
						cats.push(key);
					});
				});
				angular.forEach(cats, function (line, index) {
					//tempArr.push(OrderCloud.Categories.Get(line));
					tempArr.push(OrderCloud.Categories.Get("c1_c9_c1"));
				}, true);
				$q.all(tempArr).then(function (res) {
					angular.forEach(res, function (r) {
						upSellCategories.push({ "ID": r.ID, "Name": r.Name });
					}, true);
					getCategoriesItems(upSellCategories[0].ID, 0);
				});
				angular.forEach(upSellCategories, function (line, index) {
					//tempArr.push(OrderCloud.Categories.Get(line));
					tempArr1.push(getCategoriesItems(upSellCategories[index].ID, upSellCategories[index].Name));
				}, true);
				$q.all(tempArr1).then(function (res) {
					d.resolve(res);
				});
			});
			return d.promise;
		};
		function getCategoriesItems(catID, index) {
			var d = $q.defer();
			catID = "c1_c1";// dummy
			CategoryItemsUpsell[index] = [];
			var upsel, tempArr = [];
			var catData = _.find(UpsellDtls.xp.Upsell, function (row) {
				if (row[catID]) {
					upsel = row[catID];
					return true;
				}
			});
			angular.forEach(upsel, function (row) {
				tempArr.push(OrderCloud.Products.Get(row));
			}, true);
			$q.all(tempArr).then(function (res1) {
				angular.forEach(res1, function (r) {
					CategoryItemsUpsell[index].push({ "ID": r.ID, "Name": r.Name, "Price": 25, "Description": r.Description, "Size": r.xp.SpecsOptions.Size, "Color": r.xp.SpecsOptions.Color });
					d.resolve(CategoryItemsUpsell)
				}, true);
				// if ((upSellCategories.length - 1) != index) {
				// 	index = index + 1;
				// 	getCategoriesItems(upSellCategories[index].ID, index);
				// } else {
				// 	d.resolve()
				// }
			});
			return d.promise;
		};
		return d.promise;
	}

	return service;
}

function PdpController(CurrentCatgory, $uibModal, $q, Underscore, OrderCloud, $stateParams, PlpService, productDetail, alfcontenturl, $sce, CurrentOrder, $rootScope, $scope, PdpService, productImages, selectedProduct, extraProducts, $cookieStore, $state, CstDateTime) {
	var vm = this;
	$rootScope.showBreadCrumb = true;
	vm.selectedSizeIndex = 0;  // stores selected size index from vm.productDetails
	vm.selectedProductIndex = 0; // stores selected product index under size array from vm.productDetails     	
	vm.sizeGroupedProducts = []; // stores prodcuts in accrging to size 
	vm.productVarientImages = productImages; // stores product images based on selcted size and color
	vm.defaultSizeIndex = 0; // static value to retrieve size
	vm.selectedProductId = 0; //Holds selected SKU Id
	var activeProduct = null;
	var groupedProducts = []//stores selected products
	vm.DeliveryType = '';
	vm.openCalenderPopUp = false;
	vm.line = {};

	vm.pdpPdtCode = $stateParams.prodId;
	   /* bread crumb*/
	OrderCloud.Categories.Get(CurrentCatgory.ParentID, "bachmans").then(function (res) {
		// return res;
		$scope.$emit("CurrentCatgory2", res);
		OrderCloud.Categories.Get(res.ParentID, "bachmans").then(function (res) {
			// return res;
			$scope.$emit("CurrentCatgory1", res);

		});
	});
	$scope.$emit("CurrentCatgory3", CurrentCatgory.Name);

	/* end of bread crumb*/

	var availableColors, availableSizes = [];
	$scope.radio = { selectedSize: -1, selectedColor: -1 };
	vm.wishListTxt = "ADD TO WISHLIST"; //Default text for wishlist button
	vm.displayWishList = false; // TO display wishlist text after server check



	availableSizes = DisplaySizes(productDetail, true);
	vm.allSizes = availableSizes;
	availableColors = DisplayColors(productDetail, true);
	vm.allColors = availableColors;
	vm.GetDeliveryMethods = GetDeliveryMethods;
	vm.callAvailableOptions = callAvailableOptions;
	vm.getLineItems = getLineItems;
	vm.getCityState = getCityState;
	vm.init = init;
	vm.addAssemblyProducts = addAssemblyProducts;
	vm.placement = false;
	vm.assemblychecked = false;
	vm.init();
	var loggedin = {
		"ClientID": "8836BE8D-710A-4D2D-98BF-EDBE7227E3BB",
		"Claims": ["FullAccess"]
	};

	if (selectedProduct !== undefined) {
		$.grep(productDetail, function (e, i) {
			if (e.ID == selectedProduct) {
				$scope.radio.selectedColor = e.xp.SpecsOptions.Color;
				$scope.radio.selectedSize = e.xp.SpecsOptions.Size;
				vm.productTitle = e.Name;
				vm.prodDesription = e.Description;
				var selectedSizeHold = angular.copy(availableSizes);
				var selectedColorHold = angular.copy(availableColors);
				DisplaySelectedColor(e.xp.SpecsOptions.Size, _.findIndex(selectedSizeHold, function (item) {
					if (e.xp.SpecsOptions.Size === null || e.xp.SpecsOptions.Size === null) {
						return item.xp.SpecsOptions.Size == e.xp.SpecsOptions.Size
					} else {
						return item.xp.SpecsOptions.Size.toLowerCase() == e.xp.SpecsOptions.Size.toLowerCase()
					}
				})
				);
				DisplaySelectedSize(e.xp.SpecsOptions.Color, _.findIndex(selectedColorHold, function (item) {
					if (e.xp.SpecsOptions.Color === null || e.xp.SpecsOptions.Color === null) {
						return item.xp.SpecsOptions.Color == e.xp.SpecsOptions.Color
					} else {
						return item.xp.SpecsOptions.Color.toLowerCase() == e.xp.SpecsOptions.Color.toLowerCase()
					}
				})
				);
				vm.suggestPdt = e.xp.Upsell;
				vm.upSellProducts = [];
				angular.forEach(e.xp.Upsell, function (pdtID) {
					//OrderCloud.Products.Get(pdtID).then(function (res) {
					OrderCloud.Me.GetProduct(pdtID).then(function (res) {
						vm.upSellProducts.push(res);
						console.log('UpsellArr', vm.upSellProducts);
						setTimeout(function () {
							var pdtCarousal = angular.element("#owl-suggested-pdt-carousel");
							pdtCarousal.owlCarousel({
								loop: true,
								center: true,
								margin: 12,
								nav: true,
								navText: ['<span class="pdtCarousalArrowPrev" aria-hidden="true">next</span>', '<span class="pdtCarousalArrowNext" aria-hidden="true">prev</span>'],
								callbacks: true,
								URLhashListener: true,
								autoplayHoverPause: true,
								startPosition: 'URLHash',
								responsiveClass: true,
								responsive: {
									0: {
										items: 1,
										stagePadding: 120,
									},
									320: {
										items: 1,
										dots: true,
										stagePadding: 30,
										margin: 45,
									},
									568: {
										items: 1,
										dots: true,
										stagePadding: 100,
										margin: 30
									},
									960: {
										items: 1,
										dots: true,
										stagePadding: 200,
										margin: 10
									},
									768: {
										items: 1,
										dots: true,
										stagePadding: 120
									},
									1024: {
										items: 2,
										dots: true,
										stagePadding: 80
									},
									1200: {
										items: 2,
										dots: true,
										stagePadding: 10,
										margin: 0
									},
									1500: {
										items: 2,
										dots: true,
										stagePadding: 30,
										margin: 0
									},
									1900: {
										items: 2,
										dots: true,
										stagePadding: 100,
										margin: 0
									}
								},
								onInitialized: function (event) {
									var tmp_owl = this;
									pdtCarousal.find('.owl-item').on('click', function () {
										tmp_owl.to($(this).index() - (pdtCarousal.find(".owl-item.cloned").length / 2));
										var carousal_id = $(this).attr('data-role');
									});
									console.log($(this).index());
									var pdtOwlItemWidth = $('.pdt-carousel .owl-item.center.active').width();
									$('.pdt-carousel .pdtCarousalArrowPrev').css({ 'margin-right': pdtOwlItemWidth / 2 + 14 });
									$('.pdt-carousel .pdtCarousalArrowNext').css({ 'margin-left': pdtOwlItemWidth / 2 + 14 });
									if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true)) //IF IE > 10
									{
										$('.pdt-carousel .pdtCarousalArrowPrev').css({ 'margin-right': pdtOwlItemWidth / 2 + 7 });
										$('.pdt-carousel .pdtCarousalArrowNext').css({ 'margin-left': pdtOwlItemWidth / 2 + 7 });
									}
								},
								onChanged: function () {
									setTimeout(function () {
										var carousal_id = pdtCarousal.find('.owl-item.center .expertise_fields').attr('data-role');
										console.log(carousal_id);
									}, 300);
								}
							});
						}, 1000);
					});
				});

				var ticket = localStorage.getItem("alf_ticket");
				PlpService.GetProductImages(ticket).then(function (res) {
					var upsellPdtImages = [];
					angular.forEach(Underscore.where(res.items), function (node) {
						node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + localStorage.getItem("alfTemp_ticket");
						upsellPdtImages.push(node);
					});
					//var upSellProductsNew = [];
					/*for (var i = 0; i < upsellPdtImages.length; i++) {
						for(var j = 0; j < vm.suggestPdt.length; j++){
							var matchCatID = Underscore.where(res.items, { displayName:  vm.suggestPdt[j] + '.jpg' });
							if(matchCatID.length > 0){
								angular.forEach(matchCatID, function (node) {
									upSellProductsNew.push(node);
								});
							} else {
								upSellProductsNew.push({ contentUrl: 'assets/images/noimg.jpg' });
							}
							vm.upSellProductsNew = upSellProductsNew;
							if (vm.upSellProductsNew.length > 0) {
								if (vm.upSellProductsNew[j] != '') {
									vm.upSellProducts[j].imgPath = vm.upSellProductsNew[j].contentUrl;
								}
							}
						}
					}*/
				});
			}
		});
	} else {
		vm.selectedSizeIndex = -1;
		vm.selectedProductIndex = -1;
		vm.baseTitle = false;
		var baseData;
		$.grep(productDetail, function (e, i) {
			if (e.xp.IsBaseProduct == 'true') {
				baseData = i;
				vm.productTitle = e.xp.BaseProductTitle;
				vm.prodDesription = e.xp.BaseDescription;
			}
		});
	}

	//Extras for products
	vm.productExtras = extraProducts;
	vm.extraItems = {}
	vm.SelectExtra = function (selectedExtra, item, $event) {
		$('.dropdown.open button p').text(selectedExtra);

		switch (item.CategoryName) {
			case 'Balloons':
				vm.extraItems[item.CategoryName] = item;
				break;
			case 'Plush':
				vm.extraItems[item.CategoryName] = item;
				break;
			case 'Sweets':
				vm.extraItems[item.CategoryName] = item;
				break;

		}
		console.log('extraItems=' + vm.extraItems)
	}

	$scope.qty = 1;

	// Function to get colors for selected size
	vm.selectVarients = function (selectedSize, $index) {
		DisplaySelectedColor(selectedSize, $index);
	};


	// function to retrieve images for selected size and color
	vm.selectColor = function ($index, color) {
		DisplaySelectedSize(color, $index);
	}

	vm.multirecipient = function () {
		//if (activeProduct) {
		var modalInstance = $uibModal.open({
			animation: true,
			backdropClass: 'multiRecipentModal',
			windowClass: 'multiRecipentModal',
			templateUrl: 'pdp/templates/multirecipient.tpl.html',
			controller: 'MultipleRecipientCtrl',
			controllerAs: 'multipleRecipient',
			resolve: {
				items: function () {
					//if (vm.DeliveryType) {
					activeProduct.xp.DeliveryMethod = vm.DeliveryType;
					//activeProduct.xp.DeliveryMethods = vm.listCategories;//.xp.CategoryDeliveryCharges.DeliveryMethods;
					//activeProduct.xp.BuyerXp = vm.buyerXp;
					activeProduct.xp.Placement = vm.placementnotes;
					if (vm.AssemblyList.length != 0) {
						activeProduct.xp.AssemblyList = vm.AssemblyList;

					}
					// .then(function (data) {
					// 	return data;
					// }, function (err) { console.log(err) });
					//vm.callAvailableOptions(activeProduct, vm.listCategories);
					//vm.ItemInfo['Product']=activeProduct.Product;
					//vm.ItemInfo['ProductID']=activeProduct.ID;
					//LIneItemInfo.SetLIneItemInfo(vm.ItemInfo);
					return activeProduct;
				},
				Order: function ($rootScope, $q, $state, toastr, CurrentOrder, $cookieStore) {
					// var dfd = $q.defer();
					// CurrentOrder.Get()
					// 	.then(function (order) {
					// 		dfd.resolve(order)
					// 	})
					// 	.catch(function () {
					// 		dfd.resolve(null);
					// 	});
					// // PdpService.CreateOrder().then(function (order) {
					// // 	dfd.resolve(order);
					// // })
					// return dfd.promise;
					return vm.order;

				},
				Signedin: function ($q, $state, OrderCloud) {
					// var dfd = $q.defer();
					// OrderCloud.Me.Get().then(function (res) {
					// 	console.log("zxcvbnm", res);
					// 	dfd.resolve(res);
					// })
					// return dfd.promise;
					return vm.signIn;
				},
				LineItems: function (CurrentOrder) {
					// var dfd = $q.defer();
					// CurrentOrder.Get()
					// 	.then(function (order) {
					// 		var promise = vm.getLineItems(order.ID)
					// 		dfd.resolve(promise)
					// 	})
					// 	.catch(function () {
					// 		dfd.resolve(null);
					// 	});
					// // PdpService.CreateOrder().then(function (order) {
					// // 	dfd.resolve(order);
					// // })
					// return dfd.promise;
					return vm.lineItems;
				},
				WishList: function () {
                    return {
                        removeFromwishList: false,

                    }
                },
				CstDateTime: function ($q, PdpService) {
					// var dfr = $q.defer();
					// PdpService.CompareDate().then(function (dt) {
					// 	dfr.resolve(new Date(dt));
					// });
					// return dfr.promise;

					return CstDateTime;
				},
				BuyerXp: function ($q, PdpService) {
					// var dfd = $q.defer();
					// PdpService.GetBuyerDtls().then(function (res) {

					// 	//vm.buyerXp = res.xp;
					// 	dfd.resolve(res.xp);
					// });
					// return dfd.promise
					return vm.buyerXp
				},
				ExtraItems: function () {
					var extraItems = []
					if (!_.isEmpty(vm.extraItems)) {
						angular.forEach(vm.extraItems, function (val, key) {
							extraItems.push(val)
						}, true)
					}
					return extraItems;


				}

			}
		});

		modalInstance.result.then(function (selectedItem) {
			$scope.selected = selectedItem;
		}, function () {
			if ($state.current == 'pdp') {
				$state.go($state.current, {}, { reload: true });
				angular.noop();
			}
			else {
				angular.noop();
			}


		});
		//}
		//else {
		//alert("Please select prodcut");
		//	vm.multirecipientSelectErr = "Please select product";
		//}
	}


	// Add to wishList
	vm.addToWishList = function (productID) {
		if (productID > 1) {
			WishListHandler(productID, false);
		} else {
			//alert('Please Select a product from available options');
			vm.addToWishListSelectErr = 'Please Select a product from available options';
		}
	}

	// added to cart -pdp modal
	/*vm.pdpAddedToCartPopUp = function () {
		var modalInstance = $uibModal.open({
			animation: false,
			backdropClass: 'pdpAddedToCartModal',
			windowClass: 'pdpAddedToCartModal',
			templateUrl: 'pdp/templates/pdp-added-to-cart.tpl.html',
			controller: 'pdpAddedToCartCtrl',
			controllerAs: 'pdpAddedToCart'
		});

		modalInstance.result.then(function () {

		}, function () {
			angular.noop();
		});



	}*/

	// carousel

	/*setTimeout(function(){
   angular.element("#owl-carousel-pdp-banner").owlCarousel({
	   //responsive: true,
	   items:1,
	   dots:true,
	   loop:true,
	   autoplay:true,
	   autoplayHoverPause:true,
	   animateOut: 'fadeOut'
 
   });
   $('#owl-carousel-pdp-banner .owl-item img').css({'width':'60%','padding-right': '30px'});
   },500);*/


	// suggested-carousel

	var owl2 = angular.element("#owl-carousel-pdp-banner");
	owl2.trigger('destroy.owl.carousel');
	setTimeout(function () {
		owl2.owlCarousel({
			loop: false,
			nav: false,
			navText: ['<span class="" aria-hidden="true"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 90" style="enable-background:new 0 0 50 90;" xml:space="preserve"><style type="text/css">.st0{fill:none;stroke:#8c58b5;stroke-width:8;stroke-miterlimit:10;}</style><polyline class="st0" points="10,11.7 41.3,46.4 10,81.1 "/></svg></span>', '<span class="" aria-hidden="true"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 90" style="enable-background:new 0 0 50 90;" xml:space="preserve"><style type="text/css">.st0{fill:none;stroke:#8c58b5;stroke-width:8;stroke-miterlimit:10;}</style><polyline class="st0" points="10,11.7 41.3,46.4 10,81.1 "/></svg></span>'],
			dots: true,
			items: 1
		});
		if ($(window).width() > 1024) {
			$(".elevateZoom").elevateZoom({
				easing: true,
				responsive: true,
				borderSize: 1,
				zoomWindowPosition: 1,
				zoomWindowOffetx: 100,
				cursor: "crosshair"
			});
			$("#zoom_01").elevateZoom();
		}
		if ($(window).width() <= 1024) {
			$(".elevateZoom").pinchzoomer();
		}
	}, 300);

	// FUnction to display all available colors
	function DisplayColors(prodcuts, IsObjectRequired) {
		console.log("All Product", prodcuts);
		var unique = {};
        var distinct = [];
        var distinctObj = [];
		for (var i in prodcuts) {
            if (typeof (prodcuts[i].xp) !== 'undefined') {
				if (typeof (unique[prodcuts[i].xp.SpecsOptions.Color]) == "undefined") {
					distinct.push(prodcuts[i].xp.SpecsOptions.Color);
					distinctObj.push(prodcuts[i]);
				}
				unique[prodcuts[i].xp.SpecsOptions.Color] = 0;
            }
		}
		if (IsObjectRequired)
			return distinctObj;
		else
			return distinct;

	}

	// FUnction to display all available sizes
	function DisplaySizes(prodcuts, IsObjectRequired) {
		console.log("All Product", prodcuts);
		var unique = {};
        var distinct = [];
        var distinctObj = [];
		for (var i in prodcuts) {
            if (typeof (prodcuts[i].xp) !== 'undefined') {
				if (typeof (unique[prodcuts[i].xp.SpecsOptions.Size]) == "undefined") {
					distinct.push(prodcuts[i].xp.SpecsOptions.Size);
					distinctObj.push(prodcuts[i]);
				}
				unique[prodcuts[i].xp.SpecsOptions.Size] = 0;
            }
		}
		if (IsObjectRequired)
			return distinctObj;
		else
			return distinct;
	}

	// Function to get selected product

	function DisplayProduct(selectedSku) {

		vm.productTitle = selectedSku.Name;
		vm.prodDesription = selectedSku.Description;
		vm.selectedProductId = selectedSku.ID;

		WishListHandler(selectedSku.ID, true);
		PdpService.GetProductCodeImages(selectedSku.ID).then(function (res) {
			if (res.length == 0) {
				res.push('assets/images/noimg.jpg');
			}
			vm.productVarientImages = res;
			var owl2 = angular.element("#owl-carousel-pdp-banner");
			owl2.trigger('destroy.owl.carousel');
			setTimeout(function () {
				owl2.owlCarousel({
					loop: false,
					nav: false,
					navText: ['<span class="" aria-hidden="true"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 90" style="enable-background:new 0 0 50 90;" xml:space="preserve"><style type="text/css">.st0{fill:none;stroke:#8c58b5;stroke-width:8;stroke-miterlimit:10;}</style><polyline class="st0" points="10,11.7 41.3,46.4 10,81.1 "/></svg></span>', '<span class="" aria-hidden="true"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 90" style="enable-background:new 0 0 50 90;" xml:space="preserve"><style type="text/css">.st0{fill:none;stroke:#8c58b5;stroke-width:8;stroke-miterlimit:10;}</style><polyline class="st0" points="10,11.7 41.3,46.4 10,81.1 "/></svg></span>'],
					dots: true,
					items: 1
				});

				if ($(window).width() > 1024) {
					$(".elevateZoom").elevateZoom({
						easing: true,
						responsive: true,
						zoomWindowWidth: 500,
						zoomWindowHeight: 500,
						borderSize: 1,
						zoomWindowOffetx: 100,
						cursor: "crosshair"

					});
				}
				if ($(window).width() <= 1024) {
					$(".elevateZoom").pinchzoomer();
				}
			}, 300);
		});
	}


	function DisplaySelectedColor(selectedSize, $index) {
		vm.selectedSizeIndex = $index;
		// vm.selectedProductIndex = -1;
		var prodFiltered = _.filter(productDetail, function (_obj) {
			if (_obj.xp.SpecsOptions.Size === null || selectedSize === null) {
				return (_obj.xp.SpecsOptions.Size == selectedSize)
			} else {
				return (_obj.xp.SpecsOptions.Size == selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == selectedSize)
			}
		});
		var imAvailableColors = angular.copy(availableColors);
		prodFiltered = DisplayColors(prodFiltered, false);
		prodFiltered = _.filter(imAvailableColors, function (color) {
			if (_.contains(prodFiltered, color.xp.SpecsOptions.Color)) {
				color.isNotAvailable = false;
				return color;
			}
			else {
				color.isNotAvailable = true;
				return color;
			}
		});
		vm.allColors = prodFiltered;
		if ($scope.radio.selectedSize != -1 && $scope.radio.selectedColor != -1) {
			var selectedSku = _.filter(productDetail, function (_obj) {
				return ((_obj.xp.SpecsOptions.Size == $scope.radio.selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == $scope.radio.selectedSize) && (_obj.xp.SpecsOptions.Color == $scope.radio.selectedColor || _obj.xp.SpecsOptions.Color.toLowerCase() == $scope.radio.selectedColor))
			});
			if (selectedSku.length == 1) {
				activeProduct = selectedSku[0];
				if (activeProduct) {
					OrderCloud.Me.GetProduct(activeProduct.ID).then(function (data) {
						activeProduct.xp.Product = data;
						vm.productinfo = data;
						// if (activeProduct.xp.Product.xp.Placement) {
						// 	vm.placement = activeProduct.xp.Product.xp.Placement;
						// }
						GetDeliveryMethods(activeProduct.ID);
						vm.line = activeProduct;
						console.log("activeProduct", activeProduct);
					})
				}

				DisplayProduct(selectedSku[0]);
			} else {

				console.log('PDP PRODUCT ERROR :: ', selectedSku);
			}
		}
	}


	function DisplaySelectedSize(color, $index) {

		var colorFiltered = _.filter(productDetail, function (_obj) { // filters SKU with  selected color
			if (_obj.xp.SpecsOptions.Color === null || color === null) {
				return (_obj.xp.SpecsOptions.Color == color)
			} else {
				return (_obj.xp.SpecsOptions.Color.toLowerCase() == color.toLowerCase())
			}
		});
		colorFiltered = DisplaySizes(colorFiltered, false); // sizes availavle for seelcted color 
		var imAvailableSizes = angular.copy(availableSizes); //copy for all available sizes
		colorFiltered = _.filter(imAvailableSizes, function (size) { // Adds isNotAvailable attribute for Sizes based on selected dolor
			if (_.contains(colorFiltered, size.xp.SpecsOptions.Size)) {
				size.isNotAvailable = false;
				return size;
			}
			else {
				size.isNotAvailable = true;
				return size;
			}
		});
		vm.allSizes = colorFiltered; // bind the sizes to DOM
		vm.selectedProductIndex = $index; // Active state for selected color
		if ($scope.radio.selectedSize != -1 && $scope.radio.selectedColor != -1) { // change prodcut if size and color is selected
			var selectedSku = _.filter(productDetail, function (_obj) {
				return ((_obj.xp.SpecsOptions.Size == $scope.radio.selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == $scope.radio.selectedSize) && (_obj.xp.SpecsOptions.Color == $scope.radio.selectedColor || _obj.xp.SpecsOptions.Color.toLowerCase() == $scope.radio.selectedColor))
			});
			if (selectedSku.length == 1) {
				//console.log(selectedSku[0]);
				activeProduct = selectedSku[0];
				if (activeProduct) {
					OrderCloud.Me.GetProduct(activeProduct.ID).then(function (data) {
						activeProduct.xp.Product = data
						vm.productinfo = data;
						// if (activeProduct.xp.Product.xp.Placement) {
						// 	vm.placement = activeProduct.xp.Product.xp.Placement;
						// }
						// if(activeProduct.xp.Product.xp.Assembly){
                        //    vm.assembly = activeProduct.xp.Product.xp.assembly;
						// }
						GetDeliveryMethods(activeProduct.ID);
						vm.line = activeProduct;
						console.log("activeProduct", activeProduct);
					});
				}

				DisplayProduct(selectedSku[0]); // displays selected product info
			} else {

				console.log('PDP PRODUCT ERROR ::', selectedSku);
			}
		}
	}




	function WishListHandler(productId, isOnload) {
		vm.wishListTxt = "ADD TO WISHLIST";
		vm.displayWishList = false;
		PdpService.AddToWishList(productId, isOnload).then(function (item) {
			if (item == true) {
				// vm.wishListTxt ="ADDED";
				vm.wishListTxt = $sce.trustAsHtml('<span class="svg-added">' +
					'<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 137.5 93.3" style="enable-background:new 0 0 137.5 93.3;" xml:space="preserve">' +
					'<g>' +
					'<path d="M116.3,23.6L70.2,69.7l-8.7,8.7c-1.1,1.1-2.7,1.8-4.3,1.8s-3.2-0.6-4.3-1.8l-8.7-8.7l-23-23c-1.1-1.1-1.8-2.7-1.8-4.3 s0.6-3.2,1.8-4.3l-0.1,0.1c1.1-1.1,2.7-1.8,4.3-1.8s3.2,0.6,4.3,1.8l27.5,27.3L107.6,15c1.1-1.1,2.7-1.8,4.3-1.8s3.2,0.6,4.3,1.8 l0,0c1.1,1.1,1.8,2.7,1.8,4.3S117.4,22.5,116.3,23.6z"/>' +
					'</g>' +
					'</svg>' +
					'ADDED TO WISHLIST </span>');
				//Product Added confirmation popup here
			}
			else if (item == false) {
				//vm.wishListTxt ="ADDED Already";
				vm.wishListTxt = $sce.trustAsHtml('<span class="svg-added">' +
					'<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 137.5 93.3" style="enable-background:new 0 0 137.5 93.3;" xml:space="preserve">' +
					'<g>' +
					'<path d="M116.3,23.6L70.2,69.7l-8.7,8.7c-1.1,1.1-2.7,1.8-4.3,1.8s-3.2-0.6-4.3-1.8l-8.7-8.7l-23-23c-1.1-1.1-1.8-2.7-1.8-4.3 s0.6-3.2,1.8-4.3l-0.1,0.1c1.1-1.1,2.7-1.8,4.3-1.8s3.2,0.6,4.3,1.8l27.5,27.3L107.6,15c1.1-1.1,2.7-1.8,4.3-1.8s3.2,0.6,4.3,1.8 l0,0c1.1,1.1,1.8,2.7,1.8,4.3S117.4,22.5,116.3,23.6z"/>' +
					'</g>' +
					'</svg>' +
					'ADDED ALREADY </span> ');
				//Product Already in list  popup here
			}
			vm.displayWishList = true;
		});

	}





	// color-circle-outer

	$('a.btn-circle-micro').on('click',
		function () {
			//alert('sss');
			$(this).parent().siblings('li').removeClass('clr-circle-outer').end().addClass('clr-circle-outer');
		});
	var ticket = localStorage.getItem("alf_ticket");
	PdpService.GetHelpAndPromo(ticket).then(function (res) {
		vm.leftPromo = alfcontenturl + res.items[3].contentUrl + "?alf_ticket=" + ticket;
	});

	function GetDeliveryMethods(prodID) {
		vm.Faster = false;
		vm.placement = false;
		vm.assembly = false;
		OrderCloud.Categories.ListProductAssignments(null, prodID).then(function (res1) {

			OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function (res2) {
				//OrderCloud.Categories.Get('c2_c1_c1').then(function (res2) {
				//OrderCloud.Categories.Get('GardenPlants_Annuals').then(function (res2) {
				vm.listCategories = res2;
				//vm.ItemInfo['DeliveryMethods']=vm.listCategories;
				if (res2.xp.Placement) {
					vm.placement = true;
				}
				if (res2.xp.Assembly) {
					vm.assembly = true;
				}
				if (res2.xp.CategoryDeliveryCharges.DeliveryMethods.Mixed) {
					vm.Faster = true;
				}
				else {
					vm.DeliveryType = '';
				}



			});
		});

	}

	function callAvailableOptions(line, res2) {
		var key = {}, MinDate = {};
		line.xp.NoInStorePickUp = true;
		if (res2.xp.DeliveryChargesCatWise.DeliveryMethods['InStorePickUp']) {
			line.xp.NoInStorePickUp = false;
		}
		_.each(res2.xp.DeliveryChargesCatWise.DeliveryMethods, function (v, k) {
			if (v.MinDays) {
				MinDate[k] = v.MinDays;
				key['MinDate'] = MinDate;
			}
			if (k == "UPS" && v['Boolean'] == true) {
				key[k] = {};
			}
			if (k == "USPS" && v['Boolean'] == true) {
				key[k] = {};
			}
			if (k == "InStorePickUp") {
				key[k] = {};
			}
			if (k == 'Mixed' && v['Boolean'] == true) {
				key[k] = {};
			}
			_.each(v, function (v1, k1) {
				var obj = {};
				if (v1['Boolean'] == true) {
					if (k == "Mixed" && line.Quantity < 50) {

					} else {
						obj[k1] = v1['Value'];
						key[k] = obj;
					}
				}
			});
		});

		if (!key['UPS'] && !key['LocalDelivery'] && !key['Mixed'] && key['InStorePickUp'] && !key['USPS'] && !key['DirectShip'] && !key['Courier']) {
			line.xp.NoDeliveryExInStore = true;
			line.xp.addressType = "Will Call";
		}
	}

	function getLineItems(id) {
		var deferred = $q.defer();

		OrderCloud.LineItems.List(id).then(function (res) {

			console.log("Lineitems", res);
			angular.forEach(res.Items, function (val, key, obj) {
				if (val.xp.deliveryDate) {
					val.xp.deliveryDate = new Date(val.xp.deliveryDate);
				}
				if (val.xp.pickupDate) {
					val.xp.pickupDate = new Date(val.xp.pickupDate);
				}
				if (val.ShippingAddress.Phone) {
					PdpService.GetPhoneNumber(val.ShippingAddress.Phone).then(function (res) {
						val.ShippingAddress.Phone1 = res[0];
						val.ShippingAddress.Phone2 = res[1];
						val.ShippingAddress.Phone3 = res[2];
					});

				}

			});


			deferred.resolve(res.Items);

		});

		//}

		return deferred.promise
	}
	function init() {
		vm.order = (function () {
			var dfd = $q.defer();
			CurrentOrder.Get()
				.then(function (order) {
					dfd.resolve(order)
				})
				.catch(function () {
					dfd.resolve(null);
				});
			// PdpService.CreateOrder().then(function (order) {
			// 	dfd.resolve(order);
			// })
			return dfd.promise;
		})();
		// if(vm.order){
		// 	vm.lineItems=(function(){

		// 				vm.getLineItems(vm.order.ID).then(function(items){
        //                   return items;
		// 				});

		// 	})(vm.order);
		// }
		//else {
		vm.lineItems = (function (CurrentOrder) {
			var dfd = $q.defer();

			CurrentOrder.Get()
				.then(function (order) {
					var promise = vm.getLineItems(order.ID)
					dfd.resolve(promise)
				})
				.catch(function () {
					dfd.resolve(null);
				});
			// PdpService.CreateOrder().then(function (order) {
			// 	dfd.resolve(order);
			// })
			return dfd.promise;
		})(CurrentOrder);
		vm.signIn = (function () {
			var dfd = $q.defer();
			OrderCloud.Me.Get().then(function (res) {
				console.log("zxcvbnm", res);
				dfd.resolve(res);
			})
			return dfd.promise;
		})();
		//}
		PdpService.GetBuyerDtls().then(function (res) {

			vm.buyerXp = res.xp;
			//vm.ItemInfo['BuyerXp']=vm.buyerXp;
		});
	}

	vm.detailsPage = function ($event) {
		var id = $($event.target).parents('.pdt-carousel-cont').attr('data-prodid');
		var seq = $($event.target).parents('.pdt-carousel-cont').attr('data-sequence');
		if (typeof id != "undefined") {
			var href = "/pdp/" + seq + "/prodId=" + id;
			$state.go('pdp', { 'sequence': seq, 'prodId': id });
		} else {
			var href = "/pdp/" + seq;
			$state.go('pdp', { 'sequence': seq });
		}
    }

	vm.checkDeliverymethod = checkDeliverymethod;
	function checkDeliverymethod(line) {
		line.xp.DeliveryMethod = vm.DeliveryType
		vm.fasterDeliveryerr = false;
		vm.ZipCodePromise = call(line);
		function call(line) {
			var d = $q.defer();
            if (!!line.ShippingAddress.Zip) {
				if (line.xp.DeliveryMethod == 'Faster') {
					PdpService.getCityState(line.ShippingAddress.Zip).then(function (res) {
						var city = res.City;

						if (city == "Minneapolis" || city == "Saint Paul") {
							//vm.notLocal = false;
							vm.callDeliveryOptions(line);
						}
						else {
							line.xp.DeliveryMethod = ""
							//alert("Faster Delivery Is Only Local Delivery");
							vm.fasterDeliveryerr = true;
							vm.GetDeliveryMethods(line.ID).then(function (res) {

								if (res.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip)
									line.xp.DeliveryMethod = "DirectShip";

								if (res.Name == "Gift Cards") {
									line.xp.DeliveryMethod = 'USPS'
								}
								if (res.xp.DeliveryChargesCatWise.DeliveryMethods.UPS) {
									line.xp.DeliveryMethod = 'UPS';
									vm.sameDay = false;

								}
								if (res.xp.DeliveryChargesCatWise.DeliveryMethods.LocalDelivery) {
									line.xp.DeliveryMethod = 'LocalDelivery';
									vm.sameDay = true;
									d.resolve(vm.sameDay);
								}
								if (res.xp.DeliveryChargesCatWise.DeliveryMethods.UPS && res.xp.DeliveryChargesCatWise.DeliveryMethods.LocalDelivery) {
									if (line.ShippingAddress.City == "Minneapolis" || line.ShippingAddress.City == "Saint Paul") {
										line.xp.DeliveryMethod = 'LocalDelivery';
										vm.sameDay = true;
										d.resolve(vm.sameDay);
									}
									else {

										line.xp.DeliveryMethod = 'UPS';
										vm.sameDay = false;

									}
								}
								vm.callDeliveryOptions(line);

							});


						}


					}).catch(function (err) {
						console.log(err);
						d.reject();
					});
				}

				// if (line.xp.DeliveryMethod == 'Mixed' && vm.notLocal == false) {

				// 	vm.callDeliveryOptions(line);
				// 	vm.sameDay = true;
				// }
				else {
					vm.GetAllDeliveryMethods(line.ID).then(function (res) {

						if (res.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip)
							line.xp.DeliveryMethod = "DirectShip";

						if (res.Name == "Gift Cards") {
							line.xp.DeliveryMethod = 'USPS'
						}
						if (res.xp.DeliveryChargesCatWise.DeliveryMethods.UPS) {
							line.xp.DeliveryMethod = 'UPS';
							vm.sameDay = false;

						}
						if (res.xp.DeliveryChargesCatWise.DeliveryMethods.LocalDelivery) {
							line.xp.DeliveryMethod = 'LocalDelivery';
							vm.sameDay = true;
							d.resolve(vm.sameDay);
						}
						if (res.xp.DeliveryChargesCatWise.DeliveryMethods.UPS && res.xp.DeliveryChargesCatWise.DeliveryMethods.LocalDelivery) {
							if (line.ShippingAddress.City == "Minneapolis" || line.ShippingAddress.City == "Saint Paul") {
								line.xp.DeliveryMethod = 'LocalDelivery';
								vm.sameDay = true;
								d.resolve(vm.sameDay);
							}
							else {

								line.xp.DeliveryMethod = 'UPS';
								vm.sameDay = false;

							}
						}


					}).catch(function (err) {
						console.log(err);
						d.reject();
					});

					vm.callDeliveryOptions(line);

				}
			}
			return d.promise;
		}

	}
	vm.GetAllDeliveryMethods = GetAllDeliveryMethods
	function GetAllDeliveryMethods(prodID) {
		var deferred = $q.defer();
		OrderCloud.Categories.ListProductAssignments(null, prodID).then(function (res1) {
			OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function (res2) {
				//OrderCloud.Categories.Get('c2_c1_c1').then(function (res2) {
				//OrderCloud.Categories.Get('OutdoorLivingDecor_Grilling_Grills').then(function (res2) {
				//OrderCloud.Categories.Get('c4_c1').then(function (res2) {

				deferred.resolve(res2);
			});
		});
		return deferred.promise;
	}
	vm.callDeliveryOptions = callDeliveryOptions;
	function callDeliveryOptions(line) {
		PdpService.GetDeliveryOptions(line, line.xp.DeliveryMethod).then(function (res) {
			console.log("deliverymethods", res);

			// if (!res['UPS'] && !res['LocalDelivery'] && !res['Mixed'] && res['InStorePickUp'] && !res['USPS'] && !res['DirectShip'] && !res['Courier']) {
			// 	line.xp.deliveryFeesDtls = res['InStorePickUp'];
			// }
			if (line.xp.DeliveryMethod == 'InStorePickUp') {
				line.xp.deliveryFeesDtls = 0;
			}
			if (res.MinDate) {
				line.xp.MinDate = res.MinDate;
			}
			// if (line.xp.MinDate) {
			// 	angular.forEach(line.xp.MinDate, function (val, key) {
			// 		if (line.xp.DeliveryMethod == key) {
			// 			vm.mindays = val;
			// 			console.log("vm.mindays", vm.mindays);
			// 		}
			// 	})

			// }
			var dt;
			line.xp.MinDays = {};
			// if (line.xp.deliveryDate) {
			// 	var dat = new Date();
			// 	dat.setHours(0, 0, 0, 0);
			// 	if (new Date(val.xp.deliveryDate) < dat)
			// 		delete val.xp.deliveryDate;
			// } 
			//else
			PdpService.CheckTime().then(function (data) {
				if (data == 'sameday') {
					if (line.xp.MinDate) {
						angular.forEach(line.xp.MinDate, function (val1, key1) {
							dt = new Date();
							dt.setHours(0, 0, 0, 0);
							dt = dt.setDate(dt.getDate() + val1);
							dt = new Date(dt);
							line.xp.MinDays[key1] = dt.getFullYear() + "-" + (("0" + (dt.getMonth() + 1)).slice(-2)) + "-" + (("0" + dt.getDate()).slice(-2));
						}, true);
						dt = new Date();
						line.xp.MinDays['MinToday'] = dt.getFullYear() + "-" + (("0" + (dt.getMonth() + 1)).slice(-2)) + "-" + (("0" + dt.getDate()).slice(-2));
						// if (line.xp.MinDate.LocalDelivery)
						// 	line.xp.MinDays['MinToday'] = val.xp.MinDate.LocalDelivery;
					} else {
						dt = new Date();
						line.xp.MinDate = {};
						line.xp.MinDays['MinToday'] = dt.getFullYear() + "-" + (("0" + (dt.getMonth() + 1)).slice(-2)) + "-" + (("0" + dt.getDate()).slice(-2));
					}
					vm.mindays = line.xp.MinDays;
				}
				else if (data == 'notsameday') {
					if (line.xp.MinDate) {
						angular.forEach(line.xp.MinDate, function (val1, key1) {
							dt = new Date();
							dt.setHours(0, 0, 0, 0);
							dt = dt.setDate(dt.getDate() + val1);
							dt = new Date(dt);
							line.xp.MinDays[key1] = dt.getFullYear() + "-" + (("0" + (dt.getMonth() + 1)).slice(-2)) + "-" + (("0" + dt.getDate()).slice(-2));
						}, true);
						dt = new Date();
						line.xp.MinDays['MinToday'] = dt.getFullYear() + "-" + (("0" + (dt.getMonth() + 1)).slice(-2)) + "-" + (("0" + dt.getDate() + 1).slice(-2));
						// if (line.xp.MinDate.LocalDelivery)
						// 	line.xp.MinDays['MinToday'] = val.xp.MinDate.LocalDelivery;
					} else {
						dt = new Date();
						line.xp.MinDate = {};
						line.xp.MinDays['MinToday'] = dt.getFullYear() + "-" + (("0" + (dt.getMonth() + 1)).slice(-2)) + "-" + (("0" + dt.getDate() + 1).slice(-2));
					}
                    vm.mindays = line.xp.MinDays;
				}
			});


			if (line.xp.DeliveryMethod == 'UPS') {
				vm.DeliveryMethod = 'UPS'
			}
			else {
				vm.DeliveryMethod = ''
			}

			console.log('vm.DeliveryMethod ', vm.DeliveryMethod + "vm.mindays", vm.mindays + 'DeliveryMethod', line.xp.DeliveryMethod);


			//init();
		});
	}
	function getCityState(line, zip) {
		if (zip) {
			if (zip.length == 5) {
				PdpService.getCityState(zip).then(function (res) {
					line.ShippingAddress.City = res.City;
					line.ShippingAddress.State = res.State;
					line.ShippingAddress.Country = res.Country;

				});
			}
		}

	}
	vm.zipCodeChange = zipCodeChange;
	function zipCodeChange(zip) {
		if (!zip) {
			vm.sameDay = false;
		}

	}
	function addAssemblyProducts(check) {
		if (check) {
			vm.productinfo
			vm.AssemblyModal = true;
			if (!vm.AssemblyProducts) {
				vm.AssemblyProducts = [];
				var tempArr = [];
				//OrderCloud.Products.Get("cat2_cat12_prod2").then(function (data) {
				//angular.forEach(data.xp.Cross, function (row, index) {
				angular.forEach(vm.productinfo.xp.Cross, function (row, index) {
					tempArr.push(OrderCloud.Products.Get(row));
				}, true);
				$q.all(tempArr).then(function (res) {
					angular.forEach(res, function (r) {//vm.AssemblyProducts.push({"ID":r.ID,"Name":r.Name,"Price":30,"Description":r.Description,"Size":r.xp.SpecsOptions.Size, "Color":r.xp.SpecsOptions.Color});
						vm.AssemblyProducts.push({ "ID": r.ID, "Name": r.Name, "Price": 30, "Description": r.Description })
					}, true);
				});
				//});
			}

		}
		else if (check == false) {
			vm.AssemblyList.length = 0;
		}
	}
	vm.AssemblyList = [];
	vm.SelectedProducts = function () {
		vm.AssemblyModal = false;
		console.log(vm.ItemSelected);
		_.mapObject(vm.ItemSelected, function (val, key) {
			if (val == true)
				vm.AssemblyList.push(key);
		});
	};
}

function MultipleRecipientController($uibModal, BaseService, $scope, $stateParams, $uibModalInstance, items, AddressValidationService, $rootScope, OrderCloud, CurrentOrder, LineItemHelpers, PdpService, Order, $q, Signedin, LineItems, $cookieStore, WishList, $state, CstDateTime, BuyerXp, TaxService, ExtraItems) {

	var vm = this;
	vm.oneAtATime = true;
	vm.limit = 4;
	vm.list = {};
	vm.line = null;
	vm.name = [];
	vm.addressType = 'Residence';
	vm.addAddress = [];
    vm.isLoggedIn = $cookieStore.get('isLoggedIn');
    vm.savedBookAddress = {};
    vm.addAddress = [];
	vm.crdmsg = [];
	vm.activeRecipient = [];
	//vm.showNewRecipient = false;
    vm.activeOrders = [];
	vm.storeNames = [];
	vm.crdmsghide = crdmsghide;
	vm.getCityState = getCityState;
	vm.cancel = cancel;
	vm.getLineItems = getLineItems;
	vm.updateLinedetails = updateLinedetails;
	vm.submitDetails = submitDetails;
	vm.storesDetails = storesDetails;
	vm.newrecipient = newrecipient;
	vm.closeTab = closeTab;
	vm.addedToCartPopUp = addedToCartPopUp;
	vm.hospitalDetails = hospitalDetails;
	vm.addressTypeChanged = addressTypeChanged;
	vm.GetDeliveryMethods = GetDeliveryMethods;
	vm.DeliveryMethod = '';
	vm.signnedin = Signedin;
	vm.showaddress = [];
	vm.isMultiplerecipient = false;
	vm.checkAddRecipient = checkAddRecipient;
	vm.submitRecipientDetails = submitRecipientDetails;
	vm.recipientLineitem = {};
	vm.saveUserAddressData = saveUserAddressData;
	vm.saveaddressdata = [];
	vm.openRecipient = [];
	vm.init = init;
	vm.checkDeliverymethod = checkDeliverymethod;
	vm.callDeliveryOptions = callDeliveryOptions;
	vm.addBookAddress = addBookAddress;
	vm.addressBook = addressBook;
	vm.lastIndex = 0;
	vm.formInValid = true;
	vm.finished = finished;
	vm.activerecipients = [];
	vm.zipCodeChange = zipCodeChange;
	vm.changeQuantity = changeQuantity;
	vm.changeDate = changeDate;
	vm.sameAsAboveAddress = [];
	vm.addSameAddress = addSameAddress;
	vm.changeaddSameAddress = changeaddSameAddress;
	vm.sameAddress = {};
	vm.disableAddToCart = false;
	vm.calculateShippingCost = calculateShippingCost;
	vm.multipleCities = { exist: false }
	vm.disabledDates = disabledDates;
	vm.removeFromwishList = removeFromwishList;
	vm.sameDayDate = new Date(angular.copy(CstDateTime))
	vm.calculateDeliveryCharges = calculateDeliveryCharges;
	vm.addAssemblyProducts = addAssemblyProducts;
	vm.AssemblyList = [];
	vm.CheckPromotion = CheckPromotion;
	vm.addExtraItems = [];
	vm.ExtraItems = ExtraItems;
	vm.addExtraLineItems = addExtraLineItems;
	vm.addExtraLineItemsCheck = addExtraLineItemsCheck;


	var item = {
		"ID": "",
		"ProductID": items.ID,
		"Quantity": items.StandardPriceSchedule.PriceBreaks[0].Quantity,
		"DateAdded": "",
		"QuantityShipped": 0,
		"UnitPrice": items.StandardPriceSchedule.PriceBreaks[0].Price,
		"LineTotal": 0,
		"CostCenter": null,
		"DateNeeded": null,
		"ShippingAccount": null,
		"ShippingAddressID": null,
		"ShippingAddress": null,
		"ShipperID": null,
		"ShipperName": null,
		"Specs": [],
		"xp": {}
	};

	item.xp.DeliveryMethod = items.xp.DeliveryMethod;
	item.xp.Placement = items.xp.Placement;
	item.xp.AssemblyList = items.xp.AssemblyList;
	if (ExtraItems.length != 0) {
		item.xp.extra = true
	}


	init();
	function init() {
		if (Order) {
			vm.order = Order
			//vm.getLineItems();

			if (LineItems.length != 0) {
				angular.forEach(LineItems, function (val, key, obj) {
					if (val.xp.deliveryDate) {
						val.xp.deliveryDate = new Date(val.xp.deliveryDate);
					}
					if (val.xp.pickupDate) {
						val.xp.pickupDate = new Date(val.xp.pickupDate);
					}
					if (val.ShippingAddress.Phone) {
						PdpService.GetPhoneNumber(val.ShippingAddress.Phone).then(function (res) {
							val.ShippingAddress.Phone1 = res[0];
							val.ShippingAddress.Phone2 = res[1];
							val.ShippingAddress.Phone3 = res[2];
						});


					}
					val.Quantity = 1;
					val.UnitPrice = items.StandardPriceSchedule.PriceBreaks[0].Price;
					val.xp.MinDays = items.xp.MinDays;
				});
				vm.activerecipients = LineItems;
				vm.activeOrders[0] = null;
				vm.formInValid = false;
				vm.disableAddToCart = true;
				vm.isMultiplerecipient = true;
				//vm.showNewRecipient = false;
			}

			if (LineItems.length == 0) {
				OrderCloud.LineItems.List(vm.order.ID).then(function (res) {
					//vm.recipientLineitem.xp.LineItems = res;

					//vm.allItems = res.Items;
					if (res.Items.length != 0) {
						angular.forEach(res.Items, function (val, key, obj) {
							if (val.xp.deliveryDate) {
								val.xp.deliveryDate = new Date(val.xp.deliveryDate);
							}
							if (val.xp.pickupDate) {
								val.xp.pickupDate = new Date(val.xp.pickupDate);
							}
							if (val.ShippingAddress.Phone) {
								PdpService.GetPhoneNumber(val.ShippingAddress.Phone).then(function (res) {
									val.ShippingAddress.Phone1 = res[0];
									val.ShippingAddress.Phone2 = res[1];
									val.ShippingAddress.Phone3 = res[2];
								});


							}
							val.Quantity = 1;
							val.UnitPrice = items.StandardPriceSchedule.PriceBreaks[0].Price;
							val.xp.MinDays = items.xp.MinDays;
						});
						vm.activerecipients = res.Items;
						vm.activeOrders[0] = null;
						vm.formInValid = false;
						vm.disableAddToCart = true;
						vm.isMultiplerecipient = true;
						//vm.showNewRecipient = false;
					}
					else {
						vm.activeOrders[0] = item;
					}
				}).catch(function (err) {
					console.log(err)
					vm.activeOrders[0] = item;
				})
			}

		}
		else {
			vm.order = "";
			vm.activeOrders[0] = item;

		}
		vm.CheckPromotion(item).then(function (data) {

		}, function (err) {
			console.log(err);
		})

	}
	function cancel() {
		$uibModalInstance.dismiss('cancel');
		$state.go($state.current, {}, { reload: true });
	};
	function crdmsghide(line, index) {
		AddressValidationService.Validate(line.ShippingAddress)
			.then(function (response) {
				if (response.ResponseBody.ResultCode == 'Success') {
					var validatedAddress = response.ResponseBody.Address;
					var zip = validatedAddress.PostalCode.substring(0, 5);
					line.ShippingAddress.Zip = parseInt(zip);
					if (validatedAddress.Line2) {
                        line.ShippingAddress.Street1 = validatedAddress.Line2;
                        line.ShippingAddress.Street2 = validatedAddress.Line1;
                    }
                    else {
                        line.ShippingAddress.Street1 = validatedAddress.Line1;
                        line.ShippingAddress.Street2 = null;
                    }
					line.ShippingAddress.City = validatedAddress.City;
                    line.ShippingAddress.State = validatedAddress.Region;
                    line.ShippingAddress.Country = validatedAddress.Country;
					vm.crdmsg[index] = !vm.crdmsg[index];
					if (vm.lastIndex == index) {
						vm.formInValid = false;
						vm.disableAddToCart = false;

					}
					else {
						vm.formInValid = true;
						vm.disableAddToCart = true;
					}

				} else {
					alert("Address not found...");
					vm.crdmsg[index] = true;
				}

			});
	}

	function submitDetails(activeitems) {
        vm.submitDetailsPromise = submitDetailsCall(activeitems);
		//console.log("activeitems" + JSON.stringify(activeitems));
		//var deferred = $q.defer();
		function submitDetailsCall(activeitems) {
			var submitdefer = $q.defer();
			var someExtraItems = []
			angular.forEach(activeitems, function (val, key) {
				if (val.xp.extra) {
					angular.forEach(vm.ExtraItems, function (val1, key1) {
						var item = {
							"ID": "",
							"ProductID": val1.Skuid,
							"Quantity": 1,
							"UnitPrice": val1.Price,
							"ShippingAddress": val.ShippingAddress,
							"xp": val.xp
						};
						delete item.xp.AssemblyList;
						delete item.xp.BaseLineItemID;
						delete item.xp.extra;
						someExtraItems.push(item);
					});

				}
			}, true);
			var new_array = activeitems.concat(someExtraItems);
            var uniques = _.map(_.groupBy(new_array, function (value) {
				return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.ShippingAddress.Zip + '' + new Date(value.xp.deliveryDate) + '' + value.xp.DeliveryMethod;
			}), function (grouped) {
				console.log("grouped ==" + JSON.stringify(grouped));
				var TotalQuantity = 0;
				TotalQuantity = _.reduce(_.pluck(grouped, 'Quantity'), function (memo, num) { return Number(memo) + Number(num); }, 0);
				grouped[0].Quantity = Number(TotalQuantity);

				return grouped[0];
			});
			function lineDetails(line, order) {
				var deferred = $q.defer();
				if (line.ID == "") {
					common(line);
					createNewLineItem(line, order, deferred);
					function common(line) {
						//line.xp.addressType=vm.addressType;
						if (line.ShippingAddress.Phone1 && line.ShippingAddress.Phone2 && line.ShippingAddress.Phone3) {
							line.ShippingAddress.Phone = '(' + line.ShippingAddress.Phone1 + ')' + " " + line.ShippingAddress.Phone2 + '-' + line.ShippingAddress.Phone3;
							delete line.ShippingAddress.Phone1;
							delete line.ShippingAddress.Phone2;
							delete line.ShippingAddress.Phone3;

						}
						if (line.xp.deliveryDate) {
							line.xp.deliveryDate = new Date(line.xp.deliveryDate);
						}
						if (line.xp.pickupDate) {
							line.xp.pickupDate = new Date(line.xp.pickupDate);
						}
						if (!line.xp.CardMessage) {
							delete line.xp.CardMessage;
						}
						if (!line.xp.DeliveryNotes) {
							delete line.xp.DeliveryNotes;
						}
						if (line.xp.addressType == "Residence" || !line.xp.addressType || line.xp.addressType == "Shipping" || line.xp.addressType == "Church" || line.xp.addressType == "School" || line.xp.addressType == "Business" || line.xp.addressType == "Cemetery") {
							if (line.xp) {
								delete line.xp.PatientFName;
								delete line.xp.PatientLName;
								delete line.xp.pickupDate;
							}
						}
						else if (line.xp.addressType == "Will Call") {
							if (line.xp) {
								delete line.xp.PatientFName;
								delete line.xp.PatientLName;
								delete line.xp.deliveryDate;

							}
						}
					}
					function createNewLineItem(line, order, deferred) {
						var lineitemdtls = {
							ProductID: line.ProductID,
							Quantity: line.Quantity,
							ShipFromAddressID: "testShipFrom"
						};
						console.log("line", line);
						//PdpService.CreateOrder().then(function (order) {
						// if (!vm.order) {
						// 	vm.order = order;
						// 	console.log("order"+order.ID);
						// }
						//lineitemdtls.ShippingAddress = line.ShippingAddress;
						lineitemdtls.xp = line.xp;
						// OrderCloud.Addresses.Create(line.ShippingAddress).then(function (addressData) {
						// 	lineitemdtls.ShippingAddressID = addressData.ID
						OrderCloud.LineItems.Create(order.ID, lineitemdtls).then(function (lineitem) {
							lineitem.ShippingAddress = line.ShippingAddress;
							lineitem.xp = line.xp;
							//lineitem.ShippingAddress.ID = lineitem.ID

							OrderCloud.LineItems.SetShippingAddress(order.ID, lineitem.ID, lineitem.ShippingAddress).then(function (data) {
								TaxService.GetTax(order.ID).then(function (tax) {
									if (tax.status != 500)
										angular.forEach(tax.ResponseBody.TaxLines, function (val, key) {
											if (val.LineNo == lineitem.ID) {
												lineitem.xp.Tax = val.Tax
											}
										}, true);
									if (lineitem.xp.deliveryDate) {
										lineitem.xp.deliveryDate = new Date(lineitem.xp.deliveryDate);
									}
									if (lineitem.xp.pickupDate) {
										lineitem.xp.pickupDate = new Date(lineitem.xp.pickupDate);
									}
									vm.calculateDeliveryCharges(lineitem).then(function (data) {
										if (data == '1') {
											vm.updateLinedetails(order.ID, lineitem).then(function (data) {
												if (data == 'updated') {
													deferred.resolve('1');
												}
											})
										}
									})
								})
								//})
								//})
							})

							//}
						});
						//})



					}


				}
				else {
					deferred.resolve(null);
				}

				return deferred.promise;
			}
			PdpService.CreateOrder().then(function (order) {
				if (!vm.order) {
					vm.order = order;
					console.log("order" + order.ID);
				}
				var promises = uniques.map(function (line) {
					return lineDetails(line, order);
				});

				$q.all(promises).then(function (data) {
					$uibModalInstance.close();
					vm.addedToCartPopUp();
					submitdefer.resolve('1');
				}, function (err) {
					console.log(err);
					submitdefer.resolve('1');
				});

			});
			return submitdefer.promise;
		}



	}


	function updateLinedetails(args, newline) {
		var updatedeferred = $q.defer();
		console.log("OrderId==" + args);
		// delete newline.xp.NoInStorePickUp;
		// delete newline.xp.NoDeliveryExInStore;
		// delete newline.xp.MinDate;
		//delete newline.xp.DeliveryMethods
		//delete newline.xp.Product
		//delete newline.xp.BuyerXp
		//delete newline.xp.MinDate
		//delete newline.xp.MinDays
		if (newline.xp.AssemblyList) {
			if (newline.xp.AssemblyList.length != 0) {
				var AssemblyList = newline.xp.AssemblyList
			}
		}
		delete newline.xp.DeliveryNotAvailable
		delete newline.xp.AssemblyList
		delete newline.xp.NoDeliveryFees
		OrderCloud.LineItems.Update(args, newline.ID, newline).then(function (dat) {
			console.log("LineItemsUpdate", JSON.stringify(newline.ShippingAddress));
			OrderCloud.LineItems.SetShippingAddress(args, newline.ID, newline.ShippingAddress).then(function (data) {
				console.log("SetShippingAddress", data);
				if (WishList.removeFromwishList) {
					vm.removeFromwishList(newline.ProductID);
				}
				if (AssemblyList) {
					vm.addAssemblyProducts(args, newline, newline.ID, AssemblyList).then(function (data) {
						if (data == "1") {
							vm.calculateShippingCost(args);
							updatedeferred.resolve('updated');
						}
					})
				}
				else {
					vm.calculateShippingCost(args);
					updatedeferred.resolve('updated');
				}
			});
		});
		return updatedeferred.promise;
	}
	function calculateShippingCost(args) {
		var sum = 0;
		OrderCloud.LineItems.List(args).then(function (dat) {
			angular.forEach(dat.Items, function (value, key) {
				if (value.xp.deliveryCharges) {
					sum += parseFloat(value.xp.deliveryCharges);
				}
			});
			OrderCloud.Orders.Patch(args, { ShippingCost: sum }).then(function (ord) {
				console.log("shippingcost" + ord);
			})
		});


	}
	function disabledDates(data) {
		return (data.mode === 'day' && (data.date.getDay() === 0));
	};
	function getLineItems() {

		OrderCloud.LineItems.List(vm.order.ID).then(function (res) {


			console.log("Lineitems", res);
			angular.forEach(res.Items, function (val, key, obj) {
				if (val.xp.deliveryDate) {
					val.xp.deliveryDate = new Date(val.xp.deliveryDate);
				}
				if (val.xp.pickupDate) {
					val.xp.pickupDate = new Date(val.xp.pickupDate);
				}
				if (val.ShippingAddress.Phone) {
					PdpService.GetPhoneNumber(val.ShippingAddress.Phone).then(function (res) {
						val.ShippingAddress.Phone1 = res[0];
						val.ShippingAddress.Phone2 = res[1];
						val.ShippingAddress.Phone3 = res[2];
					});


				}
				val.Quantity = 1;
			});
			if (res.Items.length > 0) {
				vm.isMultiplerecipient = true;


			}

			vm.activerecipients = res.Items;


		});


	};

	function closeTab() {
		$uibModalInstance.close();
		vm.addedToCartPopUp();
	}

	function newrecipient(index) {
		var item = {
			"ID": "",
			"ProductID": items.ID,
			"Quantity": items.StandardPriceSchedule.PriceBreaks[0].Quantity,
			"DateAdded": "",
			"QuantityShipped": 0,
			"UnitPrice": items.StandardPriceSchedule.PriceBreaks[0].Price,
			"LineTotal": 0,
			"CostCenter": null,
			"DateNeeded": null,
			"ShippingAccount": null,
			"ShippingAddressID": null,
			"ShippingAddress": {},
			"ShipperID": null,
			"ShipperName": null,
			"Specs": [],
			"xp": {}
		};

		item.xp.DeliveryMethod = items.xp.DeliveryMethod;
		item.xp.Placement = items.xp.Placement;
		item.xp.AssemblyList = items.xp.AssemblyList
		item.ShippingAddress.Country = 'US'
		//vm.addressType = 'Residence'
		vm.visible = false;
		//vm.line = item;
		vm.activeRecipient[index] = false;
		vm.activeRecipient[index + 1] = true;
		//vm.activeRecipient = false;
		vm.crdmsg[index] = true;
		vm.crdmsg[index + 1] = true;
		//vm.showNewRecipient = !vm.showNewRecipient;
		vm.formInValid = true;
		vm.disableAddToCart = true;
		if (ExtraItems.length != 0) {
			item.xp.extra = true
		}
		if (vm.activeOrders) {
			var data = _.groupBy(vm.activeOrders, function (value) {
				if (value.ShippingAddress != null) {

					//totalCost += value.xp.TotalCost;
					return value.ShippingAddress.Phone + ' ' + value.ShippingAddress.City + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.ShippingAddress.State + '' + value.ShippingAddress.Street2 + '' + value.ShippingAddress.Zip;
				}
			});

			vm.groups = data;
			vm.activesameAddress = []
			for (var n in vm.groups) {
				vm.activesameAddress.push(n);

			}
		}
		vm.activeOrders.push(item);
	}
	vm.addNewreceipent = addNewreceipent;
	function addNewreceipent(index) {
		var item = {
			"ID": "",
			"ProductID": items.ID,
			"Quantity": items.StandardPriceSchedule.PriceBreaks[0].Quantity,
			"DateAdded": "",
			"QuantityShipped": 0,
			"UnitPrice": items.StandardPriceSchedule.PriceBreaks[0].Price,
			"LineTotal": 0,
			"CostCenter": null,
			"DateNeeded": null,
			"ShippingAccount": null,
			"ShippingAddressID": null,
			"ShippingAddress": {},
			"ShipperID": null,
			"ShipperName": null,
			"Specs": [],
			"xp": {}
		};

		item.xp.DeliveryMethod = items.xp.DeliveryMethod;
		item.xp.Placement = items.xp.Placement;
		item.xp.AssemblyList = items.xp.AssemblyList
		item.ShippingAddress.Country = 'US'
		//vm.addressType = 'Residence'
		vm.visible = false;
		//vm.line = item;
		if (ExtraItems.length != 0) {
			item.xp.extra = true
		}
		if (!vm.activeOrders[0]) {
			vm.activeRecipient[index] = true;
			vm.crdmsg[index] = true;
			vm.activeOrders[0] = item;
			var data = _.groupBy(vm.activerecipients, function (value) {
				if (value.ShippingAddress != null) {

					//totalCost += value.xp.TotalCost;
					return value.ShippingAddress.Phone + ' ' + value.ShippingAddress.City + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.ShippingAddress.State + '' + value.ShippingAddress.Street2 + '' + value.ShippingAddress.Zip;
				}
			});

			vm.groups = data;
			vm.activesameAddress = []
			for (var n in vm.groups) {
				vm.activesameAddress.push(n);

			}
		}
		else {
			vm.activeRecipient[index] = false;
			vm.activeRecipient[index + 1] = true;
			//vm.activeRecipient = false;
			vm.crdmsg[index] = true;
			vm.crdmsg[index + 1] = true;
			//vm.showNewRecipient = !vm.showNewRecipient;
			vm.activeOrders.push(item);
			if (vm.activeOrders.length > 1) {
				var newarr = [];
				newarr = vm.activerecipients;
				newarr.concat(vm.activeOrders)
				var data = _.groupBy(newarr, function (value) {
					if (value.ShippingAddress != null) {

						//totalCost += value.xp.TotalCost;
						return value.ShippingAddress.Phone + ' ' + value.ShippingAddress.City + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.ShippingAddress.State + '' + value.ShippingAddress.Street2 + '' + value.ShippingAddress.Zip;
					}
				});

				vm.groups = data;
				vm.activesameAddress = []
				for (var n in vm.groups) {
					vm.activesameAddress.push(n);

				}
			}
			else {
				var data = _.groupBy(vm.activerecipients, function (value) {
					if (value.ShippingAddress != null) {

						//totalCost += value.xp.TotalCost;
						return value.ShippingAddress.Phone + ' ' + value.ShippingAddress.City + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.ShippingAddress.State + '' + value.ShippingAddress.Street2 + '' + value.ShippingAddress.Zip;
					}
				});

				vm.groups = data;
				vm.activesameAddress = []
				for (var n in vm.groups) {
					vm.activesameAddress.push(n);

				}
			}

		}
		vm.formInValid = true;
		vm.disableAddToCart = true;

	}
	function addedToCartPopUp() {
		var modalInstance = $uibModal.open({
			animation: false,
			backdropClass: 'addedToCartModal',
			windowClass: 'addedToCartModal',
			templateUrl: 'pdp/templates/added-to-cart.tpl.html',
			controller: 'addedToCartCtrl1',
			controllerAs: 'addedToCart',
			resolve: {
				Orderid: function (OrderCloud, $q) {
					var deferred = $q.defer();
					console.log(vm.order);

					OrderCloud.LineItems.List(vm.order.ID).then(function (res) {

						LineItemHelpers.GetProductInfo(res.Items).then(function () {

							angular.forEach(res.Items, function (val, key) {
								console.log(val, key);
								PdpService.GetProductCodeImages(val.ProductID).then(function (res1) {

									console.log(res1);
									val.productimages = res1[0];
								})
							})
							console.log("addedToCartPopUp", res);
							deferred.resolve(res);
						})
					})
					//}

					return deferred.promise;
				},
				Ordertotal: function ($q) {
					var deferred = $q.defer();
					console.log('vm.order', vm.order);
					deferred.resolve(vm.order);
					return deferred.promise;
				}
			}
		});

		modalInstance.result.then(function (selectedItem) {
			$scope.selected = selectedItem;
		}, function () {
			$state.go($state.current, {}, { reload: true });
			angular.noop();
		});
	}
	function getCityState(line, zip) {
		if (zip) {
			if (zip.length == 5) {
				PdpService.getCityState(zip).then(function (res) {
					line.ShippingAddress.City = res.City;
					line.ShippingAddress.State = res.State;
					line.ShippingAddress.Country = res.Country;
					if (res.Cities) {
						vm.multipleCities.Cities = res.Cities;
						vm.multipleCities.exist = true;
					}
					else {
						vm.multipleCities.exist = false;
					}
				});
			}
		}

	}
	var storesData;
	PdpService.GetStores().then(function (res) {
		storesData = res.data.stores;
		vm.storeNames = _.pluck(res.data.stores, 'storeName');
	});
	function storesDetails(item, line, name, index) {
		var store = line;
		var filt = _.filter(storesData, function (row) {
			return _.indexOf([item], row.storeName) > -1;
		});
		if (store.ShippingAddress == null)
			store.ShippingAddress = {};
		//store.ShippingAddress.FirstName = filt[0].storeName;
		//store.ShippingAddress.LastName = filt[0].storeName;
		store.ShippingAddress.Street1 = filt[0].storeAddress;
		//store.ShippingAddress.Street2 = filt[0].Street2;
		store.ShippingAddress.City = filt[0].city;
		store.ShippingAddress.State = filt[0].state;
		store.ShippingAddress.Zip = parseInt(filt[0].zipCode);
		store.ShippingAddress.CompanyName = name
		store.xp.DeliveryMethod = "InStorePickUp";

		PdpService.GetOldPhoneNumber(filt[0].phoneNumber).then(function (res) {
			store.ShippingAddress.Phone1 = res[0];
			store.ShippingAddress.Phone2 = res[1];
			store.ShippingAddress.Phone3 = res[2];
		});

		vm.checkDeliverymethod(line, index)
	};
	var hospitalData;
	PdpService.GetHospitals().then(function (res) {
		hospitalData = res;
		vm.hospitalNames = _.pluck(hospitalData, 'AddressName');
	});
	function hospitalDetails(item, line, name, index) {
		var hospital = line;
		var filt = _.filter(hospitalData, function (row) {
			return _.indexOf([item], row.AddressName) > -1;
		});
		if (hospital.ShippingAddress == null)
			hospital.ShippingAddress = {};
		//store.ShippingAddress.FirstName = filt[0].storeName;
		//store.ShippingAddress.LastName = filt[0].storeName;
		hospital.ShippingAddress.Street1 = filt[0].Street1;
		hospital.ShippingAddress.Street2 = filt[0].Street2;
		hospital.ShippingAddress.City = filt[0].City;
		hospital.ShippingAddress.State = filt[0].State;
		hospital.ShippingAddress.Zip = parseInt(filt[0].Zip);
		hospital.ShippingAddress.CompanyName = name
		if (filt[0].Phone) {
			hospital.ShippingAddress.Phone1 = filt[0].Phone.substr(0, 3);
			hospital.ShippingAddress.Phone2 = filt[0].Phone.substr(3, 3);
			hospital.ShippingAddress.Phone3 = filt[0].Phone.substr(6);
		}
		// PdpService.GetOldPhoneNumber(filt[0].phoneNumber).then(function (res) {
		// 	store.ShippingAddress.Phone1 = res[0];
		// 	store.ShippingAddress.Phone2 = res[1];
		// 	store.ShippingAddress.Phone3 = res[2];
		// });

		vm.checkDeliverymethod(line, index)
	};
	var funeralHomeData;
	PdpService.GetFuneralHomes().then(function (res) {
		funeralHomeData = res;
		vm.funeralHomes = _.pluck(funeralHomeData, 'AddressName');
	});
	vm.funeralHomeDetails = funeralHomeDetails;
	function funeralHomeDetails(item, line, name, index) {
		var funeralHome = line;
		var filt = _.filter(funeralHomeData, function (row) {
			return _.indexOf([item], row.AddressName) > -1;
		});
		if (funeralHome.ShippingAddress == null)
			funeralHome.ShippingAddress = {};
		//store.ShippingAddress.FirstName = filt[0].storeName;
		//store.ShippingAddress.LastName = filt[0].storeName;
		funeralHome.ShippingAddress.Street1 = filt[0].Street1;
		funeralHome.ShippingAddress.Street2 = filt[0].Street2;
		funeralHome.ShippingAddress.City = filt[0].City;
		funeralHome.ShippingAddress.State = filt[0].State;
		funeralHome.ShippingAddress.Zip = parseInt(filt[0].Zip);
		funeralHome.ShippingAddress.CompanyName = name
		if (filt[0].Phone) {
			funeralHome.ShippingAddress.Phone1 = filt[0].Phone.substr(0, 3);
			funeralHome.ShippingAddress.Phone2 = filt[0].Phone.substr(3, 3);
			funeralHome.ShippingAddress.Phone3 = filt[0].Phone.substr(6);
		}
		// PdpService.GetOldPhoneNumber(filt[0].phoneNumber).then(function (res) {
		// 	store.ShippingAddress.Phone1 = res[0];
		// 	store.ShippingAddress.Phone2 = res[1];
		// 	store.ShippingAddress.Phone3 = res[2];
		// });

		vm.checkDeliverymethod(line, index)
	};
	var churchData;
	PdpService.GetChurches().then(function (res) {
		churchData = res;
		vm.churchNames = _.pluck(churchData, 'AddressName');
	});
	vm.churchDetails = churchDetails;
	function churchDetails(item, line, name, index) {
		var church = line;
		var filt = _.filter(churchData, function (row) {
			return _.indexOf([item], row.AddressName) > -1;
		});
		if (church.ShippingAddress == null)
			church.ShippingAddress = {};
		//store.ShippingAddress.FirstName = filt[0].storeName;
		//store.ShippingAddress.LastName = filt[0].storeName;
		church.ShippingAddress.Street1 = filt[0].Street1;
		church.ShippingAddress.Street2 = filt[0].Street2;
		church.ShippingAddress.City = filt[0].City;
		church.ShippingAddress.State = filt[0].State;
		church.ShippingAddress.Zip = parseInt(filt[0].Zip);
		church.ShippingAddress.CompanyName = name
		if (filt[0].Phone) {
			church.ShippingAddress.Phone1 = filt[0].Phone.substr(0, 3);
			church.ShippingAddress.Phone2 = filt[0].Phone.substr(3, 3);
			church.ShippingAddress.Phone3 = filt[0].Phone.substr(6);
		}
		// PdpService.GetOldPhoneNumber(filt[0].phoneNumber).then(function (res) {
		// 	store.ShippingAddress.Phone1 = res[0];
		// 	store.ShippingAddress.Phone2 = res[1];
		// 	store.ShippingAddress.Phone3 = res[2];
		// });

		vm.checkDeliverymethod(line, index)
	};
	var CemeteryData;
	PdpService.Getcemeteries
	PdpService.Getcemeteries().then(function (res) {
		CemeteryData = res;
		vm.cemeteries = _.pluck(CemeteryData, 'AddressName');
	});
	vm.cemeteryDetails = cemeteryDetails;
	function cemeteryDetails(item, line, name, index) {
		var cemetery = line;
		var filt = _.filter(CemeteryData, function (row) {
			return _.indexOf([item], row.AddressName) > -1;
		});
		if (cemetery.ShippingAddress == null)
			cemetery.ShippingAddress = {};
		//store.ShippingAddress.FirstName = filt[0].storeName;
		//store.ShippingAddress.LastName = filt[0].storeName;
		cemetery.ShippingAddress.Street1 = filt[0].Street1;
		cemetery.ShippingAddress.Street2 = filt[0].Street2;
		cemetery.ShippingAddress.City = filt[0].City;
		cemetery.ShippingAddress.State = filt[0].State;
		cemetery.ShippingAddress.Zip = parseInt(filt[0].Zip);
		cemetery.ShippingAddress.CompanyName = name
		if (filt[0].Phone) {
			cemetery.ShippingAddress.Phone1 = filt[0].Phone.substr(0, 3);
			cemetery.ShippingAddress.Phone2 = filt[0].Phone.substr(3, 3);
			cemetery.ShippingAddress.Phone3 = filt[0].Phone.substr(6);
		}
		// PdpService.GetOldPhoneNumber(filt[0].phoneNumber).then(function (res) {
		// 	store.ShippingAddress.Phone1 = res[0];
		// 	store.ShippingAddress.Phone2 = res[1];
		// 	store.ShippingAddress.Phone3 = res[2];
		// });

		vm.checkDeliverymethod(line, index)
	};
	function addressTypeChanged(lineitem, addressType, index) {
		angular.forEach(lineitem.ShippingAddress, function (value, key) {
			console.log(key + ': ' + value);
			// if (key == 'Street1' || key == 'Street2' || key == 'City' || key == 'State' || key == 'Zip' || key == 'Country' || key == 'Phone1' || key == 'Phone2' || key == 'Phone3') {
			// 	lineitem.ShippingAddress[key] = null;
			// }
			if (key == 'Street1' || key == 'Street2' || key == 'City' || key == 'State' || key == 'Country' || key == 'Phone1' || key == 'Phone2' || key == 'Phone3') {
				lineitem.ShippingAddress[key] = null;
			}

		});
		//lineitem.ShippingAddress = null;
		lineitem.xp.deliveryDate = null;
		lineitem.xp.addressType = addressType;
		vm.sameDay[index] = false;
		vm.name[index] = "";
		vm.sameAsAboveAddress[index] = false;
		if (addressType == "In-Store Pickup") {
			lineitem.xp.DeliveryMethod = "InStorePickUp"
			//vm.callDeliveryOptions(lineitem);
		}
	}


	function checkDeliverymethod(line, index) {
		PdpService.CheckDeliveryMethod(line, CstDateTime).then(function (data) {

		});
	}
	function GetDeliveryMethods(prodID) {
		var deferred = $q.defer();
		OrderCloud.Categories.ListProductAssignments(null, prodID).then(function (res1) {
			OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function (res2) {
				//OrderCloud.Categories.Get('c2_c1_c1').then(function (res2) {
				//OrderCloud.Categories.Get('OutdoorLivingDecor_Grilling_Grills').then(function (res2) {
				//OrderCloud.Categories.Get('c4_c1').then(function (res2) {

				deferred.resolve(res2);
			});
		});
		return deferred.promise;
	}

	function callDeliveryOptions(line) {
		PdpService.GetDeliveryOptions(line, line.xp.DeliveryMethod).then(function (res) {
			console.log("deliverymethods", res);

			// if (!res['UPS'] && !res['LocalDelivery'] && !res['Mixed'] && res['InStorePickUp'] && !res['USPS'] && !res['DirectShip'] && !res['Courier']) {
			// 	line.xp.deliveryFeesDtls = res['InStorePickUp'];
			// }
			if (line.xp.DeliveryMethod == 'InStorePickUp') {
				line.xp.deliveryFeesDtls = 0;
			}
			if (res.MinDate) {
				line.xp.MinDate = res.MinDate;
			}
			// if (line.xp.MinDate) {
			// 	angular.forEach(line.xp.MinDate, function (val, key) {
			// 		if (line.xp.DeliveryMethod == key) {
			// 			vm.mindays = val;
			// 			console.log("vm.mindays", vm.mindays);
			// 		}
			// 	})

			// }
			var dt;
			line.xp.MinDays = {};
			// if (line.xp.deliveryDate) {
			// 	var dat = new Date();
			// 	dat.setHours(0, 0, 0, 0);
			// 	if (new Date(val.xp.deliveryDate) < dat)
			// 		delete val.xp.deliveryDate;
			// } 
			//else
			PdpService.CheckTime().then(function (data) {
				if (data == 'sameday') {
					if (line.xp.MinDate) {
						angular.forEach(line.xp.MinDate, function (val1, key1) {
							dt = new Date();
							dt.setHours(0, 0, 0, 0);
							dt = dt.setDate(dt.getDate() + val1);
							dt = new Date(dt);
							line.xp.MinDays[key1] = dt.getFullYear() + "-" + (("0" + (dt.getMonth() + 1)).slice(-2)) + "-" + (("0" + dt.getDate()).slice(-2));
						}, true);
						dt = new Date();
						line.xp.MinDays['MinToday'] = dt.getFullYear() + "-" + (("0" + (dt.getMonth() + 1)).slice(-2)) + "-" + (("0" + dt.getDate()).slice(-2));
						// if (line.xp.MinDate.LocalDelivery)
						// 	line.xp.MinDays['MinToday'] = val.xp.MinDate.LocalDelivery;
					} else {
						dt = new Date();
						line.xp.MinDate = {};
						line.xp.MinDays['MinToday'] = dt.getFullYear() + "-" + (("0" + (dt.getMonth() + 1)).slice(-2)) + "-" + (("0" + dt.getDate()).slice(-2));
					}
					vm.mindays = line.xp.MinDays;
				}
				else if (data == 'notsameday') {
					if (line.xp.MinDate) {
						angular.forEach(line.xp.MinDate, function (val1, key1) {
							dt = new Date();
							dt.setHours(0, 0, 0, 0);
							dt = dt.setDate(dt.getDate() + val1);
							dt = new Date(dt);
							line.xp.MinDays[key1] = dt.getFullYear() + "-" + (("0" + (dt.getMonth() + 1)).slice(-2)) + "-" + (("0" + dt.getDate()).slice(-2));
						}, true);
						dt = new Date();
						line.xp.MinDays['MinToday'] = dt.getFullYear() + "-" + (("0" + (dt.getMonth() + 1)).slice(-2)) + "-" + (("0" + dt.getDate() + 1).slice(-2));
						// if (line.xp.MinDate.LocalDelivery)
						// 	line.xp.MinDays['MinToday'] = val.xp.MinDate.LocalDelivery;
					} else {
						dt = new Date();
						line.xp.MinDate = {};
						line.xp.MinDays['MinToday'] = dt.getFullYear() + "-" + (("0" + (dt.getMonth() + 1)).slice(-2)) + "-" + (("0" + dt.getDate() + 1).slice(-2));
					}
					vm.mindays = line.xp.MinDays;
				}
			});


			if (line.xp.DeliveryMethod == 'UPS') {
				vm.DeliveryMethod = 'UPS'
			}
			else {
				vm.DeliveryMethod = ''
			}

			console.log('vm.DeliveryMethod ', vm.DeliveryMethod + "vm.mindays", vm.mindays + 'DeliveryMethod', line.xp.DeliveryMethod);


			//init();
		});
	}
	function checkAddRecipient(lineitem, index) {
		if (vm.addAddress[index]) {
			vm.openRecipient[index] = true;
			vm.formInValid = false;
			vm.disableAddToCart = false;
			var item = {
				"ID": "",
				"ProductID": items.ID,
				"Quantity": items.StandardPriceSchedule.PriceBreaks[0].Quantity,
				"DateAdded": "",
				"QuantityShipped": 0,
				"UnitPrice": items.StandardPriceSchedule.PriceBreaks[0].Price,
				"LineTotal": 0,
				"CostCenter": null,
				"DateNeeded": null,
				"ShippingAccount": null,
				"ShippingAddressID": null,
				"ShippingAddress": {},
				"ShipperID": null,
				"ShipperName": null,
				"Specs": [],
				"xp": {}
			};
			//item.xp = items.xp
			item.xp.DeliveryMethod = items.xp.DeliveryMethod;
			item.xp.Placement = items.xp.Placement;
			item.xp.AssemblyList = items.xp.AssemblyList
			item.ShippingAddress = lineitem.ShippingAddress;
			item.xp.addressType = lineitem.xp.addressType;
			item.xp.deliveryDate = lineitem.xp.deliveryDate;
			if (ExtraItems.length != 0) {
				item.xp.extra = true
			}
			vm.recipientLineitem['item' + index] = item;

			vm.addressType = lineitem.xp.addressType;
			if (vm.recipientLineitem['item' + index].xp.DeliveryMethod == 'Mixed') {
				if (lineitem.xp.ShippingAddress.City == 'Minneapolis' || lineitem.xp.ShippingAddress.City == "Saint Paul") {
					vm.checkDeliverymethod(vm.recipientLineitem['item' + index], index);
				}
				else {
					//alert("Fast Delivery for local only");
					vm.recipientLineitem['item' + index].xp.DeliveryMethod = lineitem.xp.DeliveryMethod;
					vm.callDeliveryOptions(vm.recipientLineitem['item' + index]);
				}

			}
			if (vm.addAddress[index] == false) {
				vm.openRecipient[index] = false;
				vm.formInValid = true;
				vm.disableAddToCart = true;
				delete vm.recipientLineitem['item' + index];
			}

		}
		if (vm.addAddress[index] == false) {
			vm.openRecipient[index] = false;
			vm.formInValid = true;
			vm.disableAddToCart = true;
			delete vm.recipientLineitem['item' + index];
		}

	}
	function submitRecipientDetails(activeitems) {
		vm.submitRecipientDetailsPromise = submitRecipientDetailscall(activeitems);
		function submitRecipientDetailscall(activeitems) {
			var submitDetailsDefer = $q.defer();

			if (activeitems.length != 0) {
				var someExtraItems = [];
				angular.forEach(activeitems, function (val, key) {
					if (val.xp.extra) {
						angular.forEach(vm.ExtraItems, function (val1, key1) {
							var item = {
								"ID": "",
								"ProductID": val1.Skuid,
								"Quantity": 1,
								"UnitPrice": val1.Price,
								"ShippingAddress": val.ShippingAddress,
								"xp": val.xp
							};
							delete item.xp.AssemblyList;
							delete item.xp.BaseLineItemID;
							delete item.xp.extra;
							someExtraItems.push(item);
						});

					}
				}, true);
				var new_array = activeitems.concat(someExtraItems);
				var uniques = _.map(_.groupBy(new_array, function (value) {
					return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.ShippingAddress.Zip + '' + new Date(value.xp.deliveryDate) + '' + value.xp.DeliveryMethod;
				}), function (grouped) {
					console.log("grouped ==" + JSON.stringify(grouped));
					var TotalQuantity = 0;
					TotalQuantity = _.reduce(_.pluck(grouped, 'Quantity'), function (memo, num) { return Number(memo) + Number(num); }, 0);
					grouped[0].Quantity = Number(TotalQuantity);

					return grouped[0];
				});
				if (vm.recipientLineitem) {
					var arr = _.map(vm.recipientLineitem, function (value, key) { return vm.recipientLineitem[key] });
					var newArray = uniques.concat(arr);
				}
				else {
					var newArray = uniques
				}



				var newUniques = _.map(_.groupBy(newArray, function (value) {
					return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.ShippingAddress.Zip + '' + new Date(value.xp.deliveryDate) + ' ' + value.xp.DeliveryMethod;
				}), function (grouped) {
					console.log("grouped ==" + JSON.stringify(grouped));
					var TotalQuantity = 0;
					TotalQuantity = _.reduce(_.pluck(grouped, 'Quantity'), function (memo, num) { return Number(memo) + Number(num); }, 0);
					grouped[0].Quantity = Number(TotalQuantity);

					return grouped[0];
				});
			}
			else {
				var someExtraItems = [];
				angular.forEach(vm.recipientLineitem, function (val, key) {
					if (val.xp.extra) {
						angular.forEach(vm.ExtraItems, function (val1, key1) {
							var item = {
								"ID": "",
								"ProductID": val1.Skuid,
								"Quantity": 1,
								"UnitPrice": val1.Price,
								"ShippingAddress": val.ShippingAddress,
								"xp": val.xp
							};
							delete item.xp.AssemblyList;
							delete item.xp.BaseLineItemID;
							delete item.xp.extra;
							someExtraItems.push(item);
						});

					}
				}, true);
				var new_array = vm.recipientLineitem.concat(someExtraItems);
				var arr = _.map(new_array, function (value, key) { return vm.recipientLineitem[key] });
				var newArray = arr
				var newUniques = _.map(_.groupBy(newArray, function (value) {
					return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.ShippingAddress.Zip + '' + new Date(value.xp.deliveryDate) + '' + value.xp.DeliveryMethod;
				}), function (grouped) {
					console.log("grouped ==" + JSON.stringify(grouped));
					var TotalQuantity = 0;
					TotalQuantity = _.reduce(_.pluck(grouped, 'Quantity'), function (memo, num) { return Number(memo) + Number(num); }, 0);
					grouped[0].Quantity = Number(TotalQuantity);

					return grouped[0];
				});
			}


			function lineDetails(line, order) {
				var deferred = $q.defer();
				if (line.ID == "") {
					common(line);
					OrderCloud.LineItems.List(vm.order.ID).then(function (res) {
						checkLineItemsId(res, line, deferred).then(function (data) {

							if (data != 'sameId') {
								checkLineItemsAddress(res, line, deferred).then(function (data) {
									if (data != 'sameAddress') {
										createNewLineItem(line, deferred);

									}
								});
							}
						});
					});
					function common(line) {
						if (line.ShippingAddress.Phone1 && line.ShippingAddress.Phone2 && line.ShippingAddress.Phone3) {
							line.ShippingAddress.Phone = '(' + line.ShippingAddress.Phone1 + ')' + " " + line.ShippingAddress.Phone2 + '-' + line.ShippingAddress.Phone3;
							delete line.ShippingAddress.Phone1;
							delete line.ShippingAddress.Phone2;
							delete line.ShippingAddress.Phone3;

						}
						if (line.xp.deliveryDate) {
							line.xp.deliveryDate = new Date(line.xp.deliveryDate);
						}
						if (line.xp.pickupDate) {
							line.xp.pickupDate = new Date(line.xp.pickupDate);
						}
						if (!line.xp.CardMessage) {
							delete line.xp.CardMessage;
						}
						if (!line.xp.DeliveryNotes) {
							delete line.xp.DeliveryNotes;
						}
						if (line.xp.addressType == "Residence" || !line.xp.addressType || line.xp.addressType == "Shipping" || line.xp.addressType == "Church" || line.xp.addressType == "School" || line.xp.addressType == "Business" || line.xp.addressType == "Cemetery") {
							if (line.xp) {
								delete line.xp.PatientFName;
								delete line.xp.PatientLName;
								delete line.xp.pickupDate;
							}
						}
						else if (line.xp.addressType == "Will Call") {
							if (line.xp) {
								delete line.xp.PatientFName;
								delete line.xp.PatientLName;
								delete line.xp.deliveryDate;

							}
						}
					}

					function checkLineItemsId(res, line, deferred) {
						var d1 = $q.defer();
						var count = 0;
						angular.forEach(res.Items, function (val, key, obj) {
							var a = new Date(val.xp.deliveryDate);
							var b = new Date(line.xp.deliveryDate);

							var DateA = Date.UTC(a.getFullYear(), a.getMonth() + 1, a.getDate());
							var DateB = Date.UTC(b.getFullYear(), b.getMonth() + 1, b.getDate());
							if (val.ProductID == line.ProductID && val.ShippingAddress.FirstName == line.ShippingAddress.FirstName && val.ShippingAddress.LastName == line.ShippingAddress.LastName && (val.ShippingAddress.Street1).split(/(\d+)/g)[1] == (line.ShippingAddress.Street1).split(/(\d+)/g)[1] && val.xp.DeliveryMethod == line.xp.DeliveryMethod && DateA == DateB) {
								if (count == 0) {
									val.Quantity += line.Quantity;
									vm.calculateDeliveryCharges(val).then(function (data) {
										if (data == '1') {
											vm.updateLinedetails(vm.order.ID, val).then(function (data) {
												if (data == 'updated') {
													deferred.resolve("1");
												}
											})
										}
									});
									count++;
									d1.resolve('sameId');
								}
							}
						});
						if (count == 0) {
							d1.resolve(null);
						}
						return d1.promise;
					}

					function checkLineItemsAddress(res, line, deferred) {
						var count = 0;
						var d2 = $q.defer();
						angular.forEach(res.Items, function (val, key, obj) {

							var a = new Date(val.xp.deliveryDate);
							var b = new Date(line.xp.deliveryDate);

							var DateA = Date.UTC(a.getFullYear(), a.getMonth() + 1, a.getDate());
							var DateB = Date.UTC(b.getFullYear(), b.getMonth() + 1, b.getDate());

							if (val.ShippingAddress.FirstName == line.ShippingAddress.FirstName && val.ShippingAddress.LastName == line.ShippingAddress.LastName && (val.ShippingAddress.Street1).split(/(\d+)/g)[1] == (line.ShippingAddress.Street1).split(/(\d+)/g)[1] && DateA == DateB) {
								if (count == 0) {
									//line.xp.TotalCost = parseFloat(line.UnitPrice) * parseFloat(line.Quantity);
									line.xp.NoDeliveryFees = true
									var lineitemdtls = {
										ProductID: line.ProductID,
										Quantity: line.Quantity,
										ShipFromAddressID: "testShipFrom"
									};
									console.log("line", line);
									PdpService.CreateOrder().then(function (order) {
										if (!vm.order) {
											vm.order = order;
										}
										OrderCloud.LineItems.Create(order.ID, lineitemdtls).then(function (lineitem) {
											lineitem.ShippingAddress = line.ShippingAddress;
											lineitem.xp = line.xp;
											OrderCloud.LineItems.SetShippingAddress(order.ID, lineitem.ID, lineitem.ShippingAddress).then(function (data) {
												TaxService.GetTax(order.ID).then(function (tax) {
													if (tax.status != 500)
														angular.forEach(tax.ResponseBody.TaxLines, function (val, key) {
															if (val.LineNo == lineitem.ID) {
																lineitem.xp.Tax = val.Tax
															}
														}, true);


													if (lineitem.xp.deliveryDate) {
														lineitem.xp.deliveryDate = new Date(lineitem.xp.deliveryDate);
													}
													if (lineitem.xp.pickupDate) {
														lineitem.xp.pickupDate = new Date(lineitem.xp.pickupDate);
													}
													vm.calculateDeliveryCharges(lineitem).then(function (data) {
														if (data == '1') {
															vm.updateLinedetails(order.ID, lineitem).then(function (data) {
																if (data == 'updated') {
																	deferred.resolve("1");
																}
															})
														}
													})
												})
											})


										})
									})
									count++
									d2.resolve('sameAddress');
								}
							}
						});
						if (count == 0) {
							d2.resolve(null);
						}

						return d2.promise;
					}
					function createNewLineItem(line, deferred) {
						var lineitemdtls = {
							ProductID: line.ProductID,
							Quantity: line.Quantity,
							ShipFromAddressID: "testShipFrom"
						};
						//lineitemdtls.ShippingAddress = line.ShippingAddress;
						lineitemdtls.xp = line.xp;
						//lineitemdtls.ShipFromAddressID = "testShipFrom"
						// OrderCloud.Addresses.Create(line.ShippingAddress).then(function (addressData) {
						// 	lineitemdtls.ShippingAddressID = addressData.ID
						OrderCloud.LineItems.Create(order.ID, lineitemdtls).then(function (lineitem) {
							lineitem.ShippingAddress = line.ShippingAddress;
							lineitem.xp = line.xp;
							//lineitem.ShippingAddress.ID = lineitem.ID
							OrderCloud.LineItems.SetShippingAddress(order.ID, lineitem.ID, lineitem.ShippingAddress).then(function (data) {
								TaxService.GetTax(order.ID).then(function (tax) {
									if (tax.status != 500)
										angular.forEach(tax.ResponseBody.TaxLines, function (val, key) {
											if (val.LineNo == lineitem.ID) {
												lineitem.xp.Tax = val.Tax
											}
										}, true);
									if (lineitem.xp.deliveryDate) {
										lineitem.xp.deliveryDate = new Date(lineitem.xp.deliveryDate);
									}
									if (lineitem.xp.pickupDate) {
										lineitem.xp.pickupDate = new Date(lineitem.xp.pickupDate);
									}
									vm.calculateDeliveryCharges(lineitem).then(function (data) {
										if (data == '1') {
											vm.updateLinedetails(order.ID, lineitem).then(function (data) {
												if (data == 'updated') {
													deferred.resolve("1");
												}
											})
										}
									})
								});
							})
						});
						//});


					}
				}
				else {
					deferred.resolve(null);
				}

				return deferred.promise;
			}
			var promises = newUniques.map(function (line) {
				return lineDetails(line, vm.order);
			});
			// var promises = [];
			// angular.forEach(newUniques, function (line) {
			// 	//var d=$q.defer();
			// 	var p = lineDetails(line, vm.order).then(function (data) {
			// 		return data;
			// 	})
			// 	//  .then(function(data){
			// 	//  d.resolve(data);
			// 	//  },function(error){
			// 	// 	 console.log(error);
			// 	// 	 d.reject(null);
			// 	//  });

			// 	promises.push(p);
			// });

			$q.all(promises).then(function (data) {
				$uibModalInstance.close();
				vm.addedToCartPopUp();
				submitDetailsDefer.resolve('1')
			}, function (error) {
				console.s("error" + error);
				submitDetailsDefer.resolve('1')
			});

			return submitDetailsDefer.promise;
		}
	}
	vm.calculateDeliveryCharges = calculateDeliveryCharges;
	function calculateDeliveryCharges(line) {
		var d = $q.defer();
		PdpService.CalculateDeliveryCharges(line, BuyerXp, CstDateTime).then(function (data) {
			if (data == '1') {
				d.resolve("1");
			}
		});
		return d.promise;
	}

	function addressBook(index) {
		if (vm.addressType == "Residence") {
			vm.showaddress[index] = !!!vm.showaddress[index];
			if (vm.showaddress[index]) {

				OrderCloud.Me.ListAddresses(null, null, 100).then(function (res) {
					console.log(res);
					vm.addressbook = res;
				})
			}
		}
		else {
			vm.showaddress[index] = false;
		}


	}
	vm.saveaddress = function (data) {
		console.log(data);
		//if(vm.saveaddress==true){
		var phone = "(" + data.Phone1 + ") " + data.Phone2 + "-" + data.Phone3;;
		var addressdata = { "FirstName": data.FirstName, "LastName": data.LastName, "Street1": data.Street1, "Street2": data.Street2, "City": data.City, "State": data.State, "Zip": data.Zip, "Country": data.Country, "Phone": phone };
		OrderCloud.Me.CreateAddress(addressdata).then(function (res) {
			console.log(res);
		})
		//}
	}
	var specialKeys = new Array();
	specialKeys.push(8);
	vm.IsNumeric = function ($e) {
		console.log($e);
		var keyCode = $e.which ? $e.which : $e.keyCode;
		var ret = ((keyCode >= 48 && keyCode <= 57) || specialKeys.indexOf(keyCode) != -1);
		if (!ret)
			$e.preventDefault();
	}
	function addBookAddress(lineitem, address, index) {
		if (vm.addressType == "Residence") {
			if (address)
				lineitem.ShippingAddress = address;
			lineitem.xp.addressType = vm.addressType;
			if (lineitem.ShippingAddress.Phone) {
				PdpService.GetPhoneNumber(lineitem.ShippingAddress.Phone).then(function (res) {
					lineitem.ShippingAddress.Phone1 = res[0];
					lineitem.ShippingAddress.Phone2 = res[1];
					lineitem.ShippingAddress.Phone3 = res[2];
				});
			}
			vm.checkDeliverymethod(lineitem);
		}
		else {
			alert("Address Type should be residence");
		}
	}
	function addSameAddress(lineitem, addressitem, index) {
		var address = addressitem.ShippingAddress
		//if (vm.addressType == "Residence") {
		if (address) {
			//lineitem.ShippingAddress = address;
			//lineitem.xp.addressType = vm.addressType;
			vm.addressType = addressitem.xp.addressType;
			lineitem.ShippingAddress.Street1 = address.Street1
			lineitem.ShippingAddress.Street2 = address.Street2
			lineitem.ShippingAddress.City = address.City
			lineitem.ShippingAddress.State = address.State
			lineitem.ShippingAddress.Zip = address.Zip
			lineitem.ShippingAddress.Phone = address.Phone
			if (lineitem.ShippingAddress.Phone) {
				PdpService.GetPhoneNumber(lineitem.ShippingAddress.Phone).then(function (res) {
					lineitem.ShippingAddress.Phone1 = res[0];
					lineitem.ShippingAddress.Phone2 = res[1];
					lineitem.ShippingAddress.Phone3 = res[2];
				});
			}
			else {
				lineitem.ShippingAddress.Phone1 = address.Phone1;
				lineitem.ShippingAddress.Phone2 = address.Phone2;
				lineitem.ShippingAddress.Phone3 = address.Phone3;
			}
			vm.checkDeliverymethod(lineitem);
		}
		//}
	}
	function changeaddSameAddress(line, check, index) {
		if (!check) {
			line.ShippingAddress = {};
			vm.sameAddress[index] = null;
		}
	}
	function finished(index) {
		vm.lastIndex = index;
	}
	function zipCodeChange(zip, index) {
		if (!zip) {
			vm.sameDay[index] = false;
		}

	}
	function changeQuantity(qty, index) {
		if (vm.recipientLineitem['item' + index]) {
			vm.recipientLineitem['item' + index].Quantity = qty;
		}

	}
	function changeDate(item, index) {
		if (vm.recipientLineitem['item' + index]) {
			vm.recipientLineitem['item' + index].xp.deliveryDate = item.xp.deliveryDate;
		}
	}
	function saveUserAddressData(check, line, index) {
		if (check == true) {
			var phone = "(" + line.ShippingAddress.Phone1 + ")" + " " + line.ShippingAddress.Phone2 + "-" + line.ShippingAddress.Phone3;
			var addressdata = { "Shipping": true, "FirstName": line.ShippingAddress.FirstName, "LastName": line.ShippingAddress.LastName, "Street1": line.ShippingAddress.Street1, "Street2": line.ShippingAddress.Street2, "City": line.ShippingAddress.City, "State": line.ShippingAddress.State, "Zip": line.ShippingAddress.Zip, "Country": line.ShippingAddress.Country, "Phone": phone, "xp": { "NickName": "", "IsDefault": false } };
			OrderCloud.Me.CreateAddress(addressdata).then(function (res) {
				console.log(res);
			})
		}
	}
	function removeFromwishList(id) {
		if (WishList.removeFromwishList) {
			$rootScope.$broadcast('RemoveItemFromWishList', {
				Id: id
			})
		}

	}
	function addAssemblyProducts(order, line, BaseLineItemID, list) {
		var addAssemblyProductsdefer = $q.defer();
		var promise = [];
		var count = 0;
		angular.forEach(list, function (val, key) {
			promise[count] = createNewLineItem(line, order, BaseLineItemID, val);
			count++
		});

		function createNewLineItem(line, order, BaseLineItemID, ID) {
			var d = $q.defer();
			var lineitemdtls = {
				ProductID: ID,
				Quantity: 1,
				ShipFromAddressID: "testShipFrom"
				//ShippingAddressID:line.ShippingAddress.ID
			};
			console.log("line", line);
			//lineitemdtls.ShippingAddress = line.ShippingAddress;
			lineitemdtls.xp = line.xp;
			OrderCloud.LineItems.Create(order, lineitemdtls).then(function (lineitem) {
				lineitem.ShippingAddress = line.ShippingAddress;
				lineitem.xp = line.xp;
				//lineitem.ShippingAddress.ID = lineitem.ID
				vm.AssemblyList.push(lineitem.ID);
				OrderCloud.LineItems.SetShippingAddress(order, lineitem.ID, lineitem.ShippingAddress).then(function (data) {
					TaxService.GetTax(order).then(function (tax) {
						if (tax.status != 500)
							angular.forEach(tax.ResponseBody.TaxLines, function (val, key) {
								if (val.LineNo == lineitem.ID) {
									lineitem.xp.Tax = val.Tax
								}
							}, true);
						if (lineitem.xp.deliveryDate) {
							lineitem.xp.deliveryDate = new Date(lineitem.xp.deliveryDate);
						}
						if (lineitem.xp.pickupDate) {
							lineitem.xp.pickupDate = new Date(lineitem.xp.pickupDate);
						}
						lineitem.xp.NoDeliveryFees = true;
						lineitem.xp.BaseLineItemID = BaseLineItemID;
						vm.calculateDeliveryCharges(lineitem).then(function (data) {
							if (data == '1') {
								OrderCloud.LineItems.Update(order, lineitem.ID, lineitem).then(function (dat) {
									console.log("LineItemsUpdate", JSON.stringify(lineitem.ShippingAddress));
									OrderCloud.LineItems.SetShippingAddress(order, lineitem.ID, lineitem.ShippingAddress).then(function (data) {
										console.log("SetShippingAddress", data);
										d.resolve(data)
									});
								});
							}
						})
					})
				})
			})
			return d.promise;
		}
		$q.all(promise).then(function (data) {
			line.xp.AssemblyLineItemsList = vm.AssemblyList;
			delete line.xp.BaseLineItemID
			OrderCloud.LineItems.Update(order, line.ID, line).then(function (dat) {
				vm.AssemblyList.length = 0;
				console.log("LineItemsUpdate", JSON.stringify(line.ShippingAddress));
				OrderCloud.LineItems.SetShippingAddress(order, line.ID, line.ShippingAddress).then(function (data) {
					addAssemblyProductsdefer.resolve('1')
				});
			});


		}, function (error) {
			console.s("error" + error);
			addAssemblyProductsdefer.resolve('1')
		});
		return addAssemblyProductsdefer.promise;
	}
	function CheckPromotion(line) {
		var d = $q.defer();
		OrderCloud.Categories.ListProductAssignments(null, line.ProductID).then(function (res1) {
			OrderCloud.Me.GetProduct(line.ProductID).then(function (Product) {
				if (!Product.xp.couponID || !Product.xp.couponID.length == 0) {
					function call(line, val) {
						var d = $q.defer();
						OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function (res2) {
							//OrderCloud.Categories.Get('GardenPlants_Annuals').then(function (res2) {
							if (res2.xp.couponID) {
								if (res2.xp.couponID.length != 0) {
									line.xp.PromoId = val.CategoryID;
									line.xp.PromoCode = res2.xp.couponID[0].coupon;
								}
							}
						})
						return d.promise;
					}

					var promise = [], count = 0;
					angular.forEach(res1.Items, function (val, key) {
						//OrderCloud.Categories.Get(val.CategoryID).then(function (res2) {
						promise[count] = call(line, val);
						count++
					}, true)
					$q.all(promise).then(function (data) {
						d.resolve(data);
					}, function (err) {
						d.resolve(null)
					});

				}
				else {
					if (Product.xp.couponID || Product.xp.couponID.length != 0) {
						line.xp.PromoCode = Product.xp.couponID[0].coupon;
						d.resolve(line)
					}
					else {
						d.resolve(null)
					}

				}
			})
		})
		return d.promise;
	}
	function addExtraLineItems(exindex, line, index) {
		if (exindex) {
			line.xp.extra = true;
		}
		else {
			line.xp.extra = false;
		}


	}
	function addExtraLineItemsCheck(exindex, line, index) {
		if (exindex) {
			vm.recipientLineitem['item' + index].xp.extra = true;
		}
		else {
			vm.recipientLineitem['item' + index].xp.extra = false;
		}
	}
}
/*
function pdpAddedToCartController($scope, $uibModalInstance) {
	var vm = this;
	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};
}*/

function addedToCartController1($scope, $uibModalInstance, $state, Orderid, $cookieStore, Ordertotal, PdpService, OrderCloud) {
	var vm = this;
	vm.orderid = Orderid.Items;
	console.log(vm.orderid);
	vm.checkout = checkout;
	OrderCloud.Orders.Get(Ordertotal.ID).then(function (data) {
		console.log(data);
		vm.ordertotal = data;
	})
	/*angular.forEach(vm.orderid, function(val, key){
		console.log(val,key);
		PdpService.GetProductCodeImages(val.ID).then(function(res){
			console.log(res);
			vm.orderid[key].productimages=res[0];
		})
	})*/
	console.log(vm.orderid);
	//vm.continueShopping=continueShopping;
	function checkout() {
		$state.go('checkout');
	}
	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');

		$state.go($state.current, {}, { reload: true });


	};
	vm.shiftSelectedCartRight = function () {
		var currentPos = angular.element('#owl-carousel-added-cart-pdt .owl-carousel-item').scrollLeft();
		var posToShift = angular.element('.added-main .detail-block .cart-info div:nth-child(2) .middle-part #owl-carousel-added-cart-pdt .owl-carousel-item').width();
		angular.element('#owl-carousel-added-cart-pdt .owl-carousel-item').scrollLeft(currentPos + posToShift);
		angular.element('#owl-carousel-added-cart-pdt .owl-carousel-item .cartLeftArrow').css({ 'display': 'block' });
	}

	vm.shiftSelectedCartLeft = function () {
		var currentPos = angular.element('#owl-carousel-added-cart-pdt .owl-carousel-item').scrollLeft();
		var posToShift = angular.element('.added-main .detail-block .cart-info div:nth-child(2) .middle-part #owl-carousel-added-cart-pdt .owl-carousel-item').width();
		angular.element('#owl-carousel-added-cart-pdt .owl-carousel-item').scrollLeft(currentPos - posToShift);
		if (currentPos == 0) {
			angular.element('#owl-carousel-selected-cat .cartLeftArrow').css({ 'display': 'none' });
		} else {
			angular.element('#owl-carousel-selected-cat .cartLeftArrow').css({ 'display': 'block' });
		}
	}
	// function continueShopping(){
	// 	$state.go('home');
	// }
}
function numbersOnly() {
	return {
		require: 'ngModel',
		link: function (scope, element, attr, ngModelCtrl) {
			function fromUser(text) {
				if (text) {

					if (text.charCodeAt(0) == 48) {
						var transformedInput = text.replace(/[^1-9]/g, '');
						if (transformedInput !== text) {

							ngModelCtrl.$setViewValue(transformedInput);
							ngModelCtrl.$render();
						}
						return transformedInput;
					}

					else {
						var transformedInput = text.replace(/[^0-9]/g, '');
						var newtransformedInput
						if (transformedInput !== text) {

							ngModelCtrl.$setViewValue(transformedInput);
							ngModelCtrl.$render();
						}
						if (transformedInput.length > 3) {
							newtransformedInput = transformedInput.slice(0, 3);
							ngModelCtrl.$setViewValue(newtransformedInput);
							ngModelCtrl.$render();

						}

						else {
							return transformedInput;
						}
					}


				}
				return undefined;
			}
			ngModelCtrl.$parsers.push(fromUser);
		}
	};
}
function usZipcode() {
	return {
		require: 'ngModel',
		link: function (scope, element, attr, ngModelCtrl) {
			function fromUser(text) {
				if (text) {

					if (text.charCodeAt(0) == 48) {
						var transformedInput = text.replace(/[^1-9]/g, '');
						if (transformedInput !== text) {

							ngModelCtrl.$setViewValue(transformedInput);
							ngModelCtrl.$setValidity('usZipcode', false);
							ngModelCtrl.$render();

						}

						return transformedInput;
					}

					else {
						var transformedInput = text.replace(/[^0-9]/g, '');
						var newtransformedInput
						if (transformedInput !== text) {
							ngModelCtrl.$setViewValue(transformedInput);
							ngModelCtrl.$setValidity('usZipcode', false);
							ngModelCtrl.$render();
						}
						if (transformedInput.length > 5) {
							newtransformedInput = transformedInput.slice(0, 5);
							ngModelCtrl.$setViewValue(newtransformedInput);
							ngModelCtrl.$setValidity('usZipcode', false);
							ngModelCtrl.$render();

						}

						else {
							ngModelCtrl.$setValidity('usZipcode', true)
							return transformedInput;
						}
					}


				}
				return undefined;
			}
			ngModelCtrl.$parsers.push(fromUser);
		}
	};
}
function noSunday() {
	return {
		require: 'ngModel',
		link: function (scope, element, attr, ngModelCtrl) {
			function fromUser(text) {
				if (text) {
					var d = new Date(text);
					if (d.getDay() == 0) {
						var transformedInput = d.setDate(d.getDay() + 1);
						if (new Date(transformedInput) !== new Date(text)) {
							ngModelCtrl.$validators.noSunday = function (modelValue, viewValue) {
								return false;
							}
							ngModelCtrl.$render();

						}

						return text;
					}

					else {
						ngModelCtrl.$validators.noSunday = function (modelValue, viewValue) {
							return true;
						}
						return text;
					}



				}
				return undefined;
			}
			ngModelCtrl.$parsers.push(fromUser);
		}
	};
}