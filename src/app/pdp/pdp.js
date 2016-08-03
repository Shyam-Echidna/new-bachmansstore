angular.module('orderCloud')

	.config(PdpConfig)
	.factory('PdpService', PdpService)
	.controller('PdpCtrl', PdpController)
    .controller('MultipleReceipentCtrl', MultipleReceipentController)
    .controller('addedToCartCtrl1', addedToCartController1)
	;


function PdpConfig($stateProvider) {
	$stateProvider
		.state('pdp', {
			parent: 'base',
			url: '/pdp/:sequence?prodId',
			templateUrl: 'pdp/templates/pdp.tpl.html',
			resolve: {
				productDetail: function (PlpService, PdpService, $q, $stateParams, $http, OrderCloud) {
					var filter = { "xp.sequencenumber": $stateParams.sequence };
					var deferred = $q.defer();
					PdpService.GetSeqProd($stateParams.sequence).then(function (res) {
						var inventoryFilteredList = []; // Array for Products with inventory
						angular.forEach(res.Items, function (value, key) {
							var promise = PdpService.GetProdInventory(value.ID).then(function (res) {
								if (res.Available > 1) {
									return value;
								}
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
					return deferred.promise;
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

				}
			},
			controller: 'PdpCtrl',
			controllerAs: 'pdp'
		})
}

var guest = {
    "ClientID": "8836BE8D-710A-4D2D-98BF-EDBE7227E3BB",
    "Claims": ["FullAccess"]
};

function PdpService($q, Underscore, OrderCloud, CurrentOrder, $http, $uibModal, x2js, alfrescourl, alfcontenturl, $rootScope, $cookieStore) {
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
		GetChurches: _GetChurches,
		GetFuneralHomes: _GetFuneralHomes,
		GetHospitals: _GetHospitals,
		GetProdInventory: _getProdInventory,
        GetExtras: _getExtras,
		CompareDate: _CompareDate,
		GetBuyerDtls: _GetBuyerDtls,
		GetDeliveryOptions: _GetDeliveryOptions,
		GetPreceedingZeroDate: _GetPreceedingZeroDate

	};
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

			//OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function (res2) {
			 //OrderCloud.Categories.Get('c2_c1_c1').then(function (res2) {

			OrderCloud.Categories.Get('c8_c9_c1').then(function (res2) {
				//OrderCloud.Categories.Get('c4_c1').then(function (res2) {
				var key = {}, MinDate = {};
				// line.xp.NoInStorePickUp = true;
				// if (res2.xp.DeliveryChargesCatWise.DeliveryMethods['InStorePickUp']) {
				// 	line.xp.NoInStorePickUp = false;
				// }
				_.each(res2.xp.DeliveryChargesCatWise.DeliveryMethods, function (v, k) {
					if (v.MinDays) {
						MinDate[k] = v.MinDays;
						key['MinDate'] = MinDate;
					}
					if (k == "UPS" && v['Boolean'] == true) {
						key[k] = {};
					}
					// if (k == "USPS" && v['Boolean'] == true) {
					// 	key[k] = {};
					// }
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
				// if (!key['UPS'] && !key['LocalDelivery'] && !key['Mixed'] && key['InStorePickUp'] && !key['USPS'] && !key['DirectShip'] && !key['Courier']) {
				// 	line.xp.NoDeliveryExInStore = true;
				// 	line.xp.addressType = "Will Call";
				// }
				// delete line.xp.Status;
				// if (DeliveryMethod == "UPS" && !key['UPS'])
				// 	line.xp.Status = "OnHold";
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
					} //else if (DeliveryMethod == "DirectShip") {
					// 	key.DirectShip.StandardDelivery = dt.xp.Shippers.DirectShip.StandardDelivery;
					//} 
					else if (DeliveryMethod == "Mixed") {
						if (!key.Mixed)
							key['Mixed'] = {};
						key.Mixed.StandardDelivery = dt.xp.Shippers.Mixed.StandardDelivery;
					}// else if (DeliveryMethod == "USPS") {
					// 	key.USPS = {};
					// 	key.USPS.USPSCharges = dt.xp.Shippers.USPS.USPSCharges;
					// } else if (DeliveryMethod == "Courier") {
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
		var d = $q.defer();
		$.ajax({
			method: "GET",
			dataType: "json",
			contentType: "application/json",
			url: "http://103.227.151.31:8080/Bachman/localdeliverytime"
		}).success(function (res) {
			if (endDate == res.date)
				d.resolve("1");
			else
				d.resolve(res.date);
		}).error(function (err) {
			console.log("err" + err);
		});
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
			var city, state, country;
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
			defered.resolve({ "City": city, "State": state, 'Country': country });
		});
		return defered.promise;
	}
	function _getSeqProd(sequence) {
		var defferred = $q.defer();
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
		return defferred.promise;

	}

	function _getProductCodeImages(prodCode) {
		var deferred = $q.defer();
		var ticket = localStorage.getItem("alf_ticket");
		var productVarientImages = [];
		$http.get(alfcontenturl + "api/search/keyword.atom?q=" + prodCode + "&alf_ticket=" + ticket).then(function (res) {
			var x2js = new X2JS();
			var data = x2js.xml_str2json(res.data);
			var arrayData = data.feed.entry;
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
    function _addToWishList(productID , isOnload) {
		var deferred = $q.defer();
		OrderCloud.Me.Get().then(function (res) {
			if (res.ID == "gby8nYybikCZhjMcwVPAiQ") {
				if(!isOnload){
				var modalInstance = $uibModal.open({
					animation: true,
					backdropClass: 'loginModalBg',
					windowClass: 'loginModalBg',
					templateUrl: 'login/templates/login.modal.tpl.html',
					controller: 'LoginCtrl',
					controllerAs: 'login'
				});
				modalInstance.result.then(function () {

				}, function () {
					angular.noop();
				});
			}
				deferred.resolve();
			} else {
				var Obj = res;
				if (Obj.xp.WishList.indexOf(productID) < 0) {
						if(!isOnload){
						Obj.xp.WishList.push(productID);
						OrderCloud.Me.Patch(JSON.stringify(Obj)).then(function (res) {
						 	deferred.resolve(true);
						});
					}else{
						deferred.resolve();
					}
				}else{
					deferred.resolve(false);
				} 
			}
			
		});
		return deferred.promise;

    }
    function _createOrder(prodID) {
		var productID;
		if ($cookieStore.get('isLoggedIn')) {
			OrderCloud.Me.Get().then(function (res) {
				console.log(res);
/*				OrderCloud.Users.GetAccessToken(res.ID, guest)
					.then(function (data) {
						OrderCloud.Auth.SetImpersonationToken(data['access_token']);*/
						CurrentOrder.GetID().then(function (orderId) {
							var lineItem = {
								ProductID: prodID,
								Quantity: 1
							};
							console.log(orderId);
							if (productID == prodID) {
								alert("qwerty");
							}
							OrderCloud.LineItems.Create(orderId, lineItem).then(function (res) {
								console.log(res);
								//$rootScope.$broadcast('LineItemAddedToCart', orderId, res);
								return $rootScope.$broadcast('LineItemCreated', orderId, res);
							})
						}, function () {
							OrderCloud.Orders.Create({}).then(function (order) {
								CurrentOrder.Set(order.ID);
								var lineItem = {
									ProductID: prodID,
									Quantity: 1
								};
								productID = prodID;
								OrderCloud.LineItems.Create(order.ID, lineItem).then(function (lineitem) {
									return $rootScope.$broadcast('LineItemCreated', order.ID, lineitem);
								})
							})

						})
					})
		/*	})*/
		}
		else {
/*			OrderCloud.Users.GetAccessToken("gby8nYybikCZhjMcwVPAiQ", guest)
				.then(function (data) {
					OrderCloud.Auth.SetImpersonationToken(data['access_token']);*/
					CurrentOrder.GetID().then(function (orderId) {
						var lineItem = {
							ProductID: prodID,
							Quantity: 1
						};
						console.log(orderId);
						if (productID == prodID) {
							alert("qwerty");
						}
						OrderCloud.LineItems.Create(orderId, lineItem).then(function (res) {
							console.log(res);
							//$rootScope.$broadcast('LineItemAddedToCart', orderId, res);
							return $rootScope.$broadcast('LineItemCreated', orderId, res);
						})
					}, function () {
						OrderCloud.Orders.Create({}).then(function (order) {
							CurrentOrder.Set(order.ID);
							var lineItem = {
								ProductID: prodID,
								Quantity: 1
							};
							productID = prodID;
							OrderCloud.LineItems.Create(order.ID, lineItem).then(function (lineitem) {
								return $rootScope.$broadcast('LineItemCreated', order.ID, lineitem);
							})
						})

					})
				/*})*/
        }
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
	return service;
}

function PdpController($uibModal, $q, Underscore, OrderCloud, $stateParams, PlpService, productDetail, alfcontenturl, $sce, CurrentOrder, $rootScope, $scope, PdpService, productImages, selectedProduct, extraProducts) {
	var vm = this;
	$rootScope.showBreadCrumb = true;
	vm.selectedSizeIndex = 0;  // stores selected size index from vm.productDetails
	vm.selectedProductIndex = 0; // stores selected product index under size array from vm.productDetails     	
	vm.sizeGroupedProducts = []; // stores prodcuts in accrging to size 
	vm.productVarientImages = productImages; // stores product images based on selcted size and color
	vm.defaultSizeIndex = 0; // static value to retrieve size
	vm.selectedProductId = 0; //Holds selected SKU Id
	var activeProducts = null;
	var groupedProducts = []//stores selected products
	vm.DeliveryType = 'NO';

	var availableColors, availableSizes =[];
	$scope.radio = { selectedSize: null , selectedColor : null};
	vm.wishListTxt = "ADD TO WISHLIST"; //Default text for wishlist button
	vm.displayWishList = false; // TO display wishlist text after server check



	availableSizes = DisplaySizes(productDetail, true);
	vm.allSizes = availableSizes;
	availableColors = DisplayColors(productDetail, true);
	vm.allColors = availableColors;

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
				DisplaySelectedColor(e.xp.SpecsOptions.Size, _.findIndex(selectedSizeHold, function (item) { return item.xp.SpecsOptions.Size.toLowerCase() == e.xp.SpecsOptions.Size.toLowerCase() }));
				DisplaySelectedSize(e.xp.SpecsOptions.Color, _.findIndex(selectedColorHold, function (item) { return item.xp.SpecsOptions.Color.toLowerCase() == e.xp.SpecsOptions.Color.toLowerCase() }));
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

	$scope.qty = 1;

	// Function to get colors for selected size
	vm.selectVarients = function (selectedSize, $index) {
		DisplaySelectedColor(selectedSize, $index);
	};


	// function to retrieve images for selected size and color
	vm.selectColor = function ($index, color) {
		DisplaySelectedSize(color, $index);
	}

	vm.multireceipent = function () {
		$scope.items = "";
		if (activeProducts) {
			var modalInstance = $uibModal.open({
				animation: true,
				backdropClass: 'multiRecipentModal',
				windowClass: 'multiRecipentModal',
				templateUrl: 'pdp/templates/multireceipent.tpl.html',
				controller: 'MultipleReceipentCtrl',
				controllerAs: 'multipleReceipent',
				resolve: {
					items: function () {
						if (vm.DeliveryType) {
							activeProducts.xp.DeliveryMethod = vm.DeliveryType;
						}

						return activeProducts;
					},
					Order: function ($rootScope, $q, $state, toastr, CurrentOrder, $cookieStore) {
						var dfd = $q.defer();
						CurrentOrder.GetID()
							.then(function (order) {
								dfd.resolve(order)
							})
							.catch(function () {
								dfd.resolve(null);
							});
						return dfd.promise;

					},
					Signedin: function ($q, $state, OrderCloud) {
						var dfd = $q.defer();
						OrderCloud.Me.Get().then(function (res) {
							console.log("zxcvbnm", res);
							dfd.resolve(res);
						})
						return dfd.promise;
					}
				}
			});

			modalInstance.result.then(function (selectedItem) {
				$scope.selected = selectedItem;
			}, function () {
				angular.noop();
			});
		}
		else {
			//alert("Please select prodcut");
			vm.multireceipentSelectErr = "Please select product";
		}
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
				lensSize: 100,
				zoomWindowWidth: 500,
				zoomWindowHeight: 500,
				borderSize: 1,
				zoomWindowOffetx: 150
			});
		}
		if ($(window).width() <= 1024) {
			$(".elevateZoom").pinchzoomer();
		}
	}, 300);

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
				// breakpoint from 0 up
				0: {
					items: 1,
					stagePadding: 120,
				},
				// breakpoint from 328 up..... mobile portrait
				320: {
					items: 1,
					dots: true,
					stagePadding: 30,
					margin: 45,
				},
				// breakpoint from 328 up..... mobile landscape
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
				// breakpoint from 768 up
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
					stagePadding: 160
				},
				1500: {
					items: 3,
					dots: true,
					stagePadding: 60,
					margin: 0
				}
			},
			onInitialized: function (event) {
				var tmp_owl = this;
				pdtCarousal.find('.owl-item').on('click', function () {
					tmp_owl.to($(this).index() - (pdtCarousal.find(".owl-item.cloned").length / 2));
					var carousal_id = $(this).attr('data-role');
					//switchExpertise(carousal_id);
				});
				console.log($(this).index());
				var pdtOwlItemWidth = $('.pdt-carousel .owl-item.center.active').width();

				//$('.pdt-carousel .pdtCarousalArrowPrev').css({'left':-pdtOwlItemWidth/2 - 14});
				//$('.pdt-carousel .pdtCarousalArrowNext').css({'right':-pdtOwlItemWidth/2 - 14});

				//$('.pdt-carousel .pdtCarousalArrowPrev').css({'background-position':pdtOwlItemWidth/2 + 14 });
				//$('.pdt-carousel .pdtCarousalArrowNext').css({'background-position':pdtOwlItemWidth/2 + 14 });

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

					//switchExpertise(carousal_id);

					//switchExp(carousal_id);

					console.log(carousal_id);
				}, 300);
			}
		});
	}, 1000);

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

	function DisplayProduct(selectedSku){

		vm.productTitle = selectedSku.Name;
		vm.prodDesription = selectedSku.Description;
		vm.selectedProductId = selectedSku.ID;

		WishListHandler(selectedSku.ID, true);
		PdpService.GetProductCodeImages(selectedSku.ID).then(function (res) {
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
						lensSize: 100,
						zoomWindowWidth: 500,
						zoomWindowHeight: 500,
						borderSize: 1,
						zoomWindowOffetx: 150
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
			return (_obj.xp.SpecsOptions.Size == selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == selectedSize)
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
		if ($scope.radio.selectedSize != null && $scope.radio.selectedColor != null) {
			var selectedSku = _.filter(productDetail, function (_obj) {
				return ((_obj.xp.SpecsOptions.Size == $scope.radio.selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == $scope.radio.selectedSize) && (_obj.xp.SpecsOptions.Color == $scope.radio.selectedColor || _obj.xp.SpecsOptions.Color.toLowerCase() == $scope.radio.selectedColor))
			});
			if (selectedSku.length == 1) {
				activeProducts = selectedSku[0];
				if (activeProducts) {
					GetDeliveryMethods(activeProducts.ID);
				}

				DisplayProduct(selectedSku[0]);
			}else{

				console.log('PDP PRODUCT ERROR :: ', selectedSku);
			}
		}
	}


	function DisplaySelectedSize(color, $index) {

		var colorFiltered = _.filter(productDetail, function (_obj) { // filters SKU with  selected color
			return (_obj.xp.SpecsOptions.Color.toLowerCase() == color.toLowerCase())
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
		if ($scope.radio.selectedSize != null && $scope.radio.selectedColor != null) { // change prodcut if size and color is selected
			var selectedSku = _.filter(productDetail, function (_obj) {
				return ((_obj.xp.SpecsOptions.Size == $scope.radio.selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == $scope.radio.selectedSize) && (_obj.xp.SpecsOptions.Color == $scope.radio.selectedColor || _obj.xp.SpecsOptions.Color.toLowerCase() == $scope.radio.selectedColor))
			});
			if (selectedSku.length == 1) {
				//console.log(selectedSku[0]);
				activeProducts = selectedSku[0];
				if (activeProducts) {
					GetDeliveryMethods(activeProducts.ID);
				}

				DisplayProduct(selectedSku[0]); // displays selected product info
			}else{

				console.log('PDP PRODUCT ERROR ::', selectedSku);
			}
		}
	}



	function WishListHandler(productId, isOnload){
	    vm.wishListTxt = "ADD TO WISHLIST";
	    vm.displayWishList = false;
	    PdpService.AddToWishList(productId, isOnload).then(function (item) {
	        if(item == true){
	         // vm.wishListTxt ="ADDED";
	          vm.wishListTxt = $sce.trustAsHtml('<span class="svg-added">'+
	                  '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 137.5 93.3" style="enable-background:new 0 0 137.5 93.3;" xml:space="preserve">'+
	                      '<g>'+
	                        '<path d="M116.3,23.6L70.2,69.7l-8.7,8.7c-1.1,1.1-2.7,1.8-4.3,1.8s-3.2-0.6-4.3-1.8l-8.7-8.7l-23-23c-1.1-1.1-1.8-2.7-1.8-4.3 s0.6-3.2,1.8-4.3l-0.1,0.1c1.1-1.1,2.7-1.8,4.3-1.8s3.2,0.6,4.3,1.8l27.5,27.3L107.6,15c1.1-1.1,2.7-1.8,4.3-1.8s3.2,0.6,4.3,1.8 l0,0c1.1,1.1,1.8,2.7,1.8,4.3S117.4,22.5,116.3,23.6z"/>'+
	                      '</g>'+
	                  '</svg>'+
	                'ADDED TO CART </span>');
	          //Product Added confirmation popup here
	        }
	        else if(item == false){
	         	//vm.wishListTxt ="ADDED Already";
	          	vm.wishListTxt = $sce.trustAsHtml('<span class="svg-added">'+
	                  '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 137.5 93.3" style="enable-background:new 0 0 137.5 93.3;" xml:space="preserve">'+
	                      '<g>'+
	                        '<path d="M116.3,23.6L70.2,69.7l-8.7,8.7c-1.1,1.1-2.7,1.8-4.3,1.8s-3.2-0.6-4.3-1.8l-8.7-8.7l-23-23c-1.1-1.1-1.8-2.7-1.8-4.3 s0.6-3.2,1.8-4.3l-0.1,0.1c1.1-1.1,2.7-1.8,4.3-1.8s3.2,0.6,4.3,1.8l27.5,27.3L107.6,15c1.1-1.1,2.7-1.8,4.3-1.8s3.2,0.6,4.3,1.8 l0,0c1.1,1.1,1.8,2.7,1.8,4.3S117.4,22.5,116.3,23.6z"/>'+
	                      '</g>'+
	                  '</svg>'+
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
	vm.GetDeliveryMethods = GetDeliveryMethods;
	function GetDeliveryMethods(prodID) {
		vm.Faster = false;
		//vm.Courier = false;
		//vm.GiftCard = false;
		//vm.DirectShip = false;
		OrderCloud.Categories.ListProductAssignments(null, prodID).then(function (res1) {

			//OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function(res2){
			//OrderCloud.Categories.Get('c2_c1_c1').then(function (res2) {
			OrderCloud.Categories.Get('c8_c9_c1').then(function (res2) {				//OrderCloud.Categories.Get('c4_c1').then(function (res2) {

				if (res2.xp.DeliveryChargesCatWise.DeliveryMethods.Mixed) {
					vm.Faster = true;

				}
				// if (res2.xp.DeliveryChargesCatWise.DeliveryMethods.Courier == true && !res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip) {
				// 	vm.Courier = true;

				// }
				// if (res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip)
				// 	//$scope.createListItem(prodID, "DirectShip");
				// 	vm.DeliveryType = "DirectShip";
				// if (res2.Name == "Gift Cards")
				// 	//$scope.createListItem(prodID, "USPS");
				// 	vm.DeliveryType = "USPS";
				if (res2.Name != "Gift Cards" && !res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip && !res2.xp.DeliveryChargesCatWise.DeliveryMethods.Courier && !res2.xp.DeliveryChargesCatWise.DeliveryMethods.Mixed) {
					//$scope.createListItem(prodID);
					vm.DeliveryType = 'NO';
				}

			});
		});

	}

}

function MultipleReceipentController($uibModal, BaseService, $scope, $stateParams, $uibModalInstance, items, $rootScope, OrderCloud, CurrentOrder, LineItemHelpers, PdpService, Order, $q, Signedin) {
	var vm = this;
	vm.oneAtATime = true;
	vm.limit = 4;
	vm.selectedRecipient = false;
	vm.list = {};
	vm.line = null;
	vm.name = "";
	vm.addressType = 'Residence';

	console.log("items", items);
	vm.addAddress = [];
	//vm.singlelerecipent = true;
	vm.crdmsg = true;
	vm.activeRecipient = true;
	vm.showNewRecipient = false;
	vm.notLocal = false;
	vm.activeOrders = [];
	vm.storeNames = [];
	vm.crdmsghide = crdmsghide;
	vm.getCityState = getCityState;
	vm.cancel = cancel;
	vm.getLineItems = getLineItems;
	vm.updateLinedetails = updateLinedetails;
	vm.submitDetails = submitDetails;
	vm.storesDetails = storesDetails;
	vm.newreceipent = newreceipent;
	vm.closeTab = closeTab;
	vm.addedToCartPopUp = addedToCartPopUp;
	vm.hospitalDetails = hospitalDetails;
	vm.addressTypeChanged = addressTypeChanged;
	vm.GetDeliveryMethods = GetDeliveryMethods;
	vm.DeliveryMethod = '';
	vm.signnedin = Signedin;
	vm.showaddress = false;
	vm.isMultiplerecipient = false;
	vm.checkAddRecipient = checkAddRecipient;
	vm.submitRecipientDetails = submitRecipientDetails;
	vm.recipientLineitem = null;
	vm.saveaddressdata = false;
	vm.openRecipient = [];
	

	//vm.zipPattern='/(^\d{5}(-\d{4})?$';
	//vm.quantityPattern='[1-9][0-9]{0,2}';


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

	if (Order) {
		vm.order = Order
	}
	if (!vm.order) {
		vm.order = "";
	}
	if (vm.order == "") {
		vm.activeOrders[0] = item;
	}
	if (vm.order) {
		vm.getLineItems();
	}

	$rootScope.$on('LineItemCreated', function (events, args, lineitem) {
		vm.order = args;
		console.log("order id", vm.order)
		lineitem.ShippingAddress = vm.lineitemdtls.ShippingAddress;
		lineitem.xp = vm.lineitemdtls.xp;
		lineitem.Quantity = vm.lineitemdtls.Quantity;
		if (lineitem.xp.deliveryDate) {
			lineitem.xp.deliveryDate = new Date(lineitem.xp.deliveryDate);
		}
		if (lineitem.xp.pickupDate) {
			lineitem.xp.pickupDate = new Date(lineitem.xp.pickupDate);
		}
		vm.updateLinedetails(args, lineitem);
	});

	function cancel() {
		$uibModalInstance.dismiss('cancel');
	};
	function crdmsghide() {
		alert("test");
		vm.crdmsg = !vm.crdmsg;
	}

	function submitDetails(line, $index) {

		//line.ProductID = vm.activeOrders[0].ProductID;
		console.log("line", line);
		if (line.ShippingAddress.Phone1 && line.ShippingAddress.Phone2 && line.ShippingAddress.Phone3) {
			line.ShippingAddress.Phone = '(' + line.ShippingAddress.Phone1 + ')' + line.ShippingAddress.Phone2 + '-' + line.ShippingAddress.Phone3;
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


		if (vm.visible == true) {
			if (line.xp.CardMessage) {
				delete line.xp.CardMessage;
			}
		}

		if (this.addressType == "Residence" || !this.addressType || this.addressType == "Shipping" || this.addressType == "Church" || this.addressType == "School") {
			if (line.xp) {
				delete line.xp.PatientFName;
				delete line.xp.PatientLName;
				delete line.xp.pickupDate;
			}
		}
		else if (this.addressType == "Will Call") {
			if (line.xp) {
				delete line.xp.PatientFName;
				delete line.xp.PatientLName;
				delete line.xp.deliveryDate;
				line.xp.storeName = vm.name;
				line.xp.DeliveryMethod = 'InStorePickUp'
				//recipient.Street1 = line.ShippingAddress.Street1;
			}
		}

		if (vm.saveaddressdata == true) {
			/*var phone = "("+line.ShippingAddress.Phone1+") "+line.ShippingAddress.Phone2+"-"+line.ShippingAddress.Phone3;*/
			var addressdata = { "Shipping": true, "FirstName": line.ShippingAddress.FirstName, "LastName": line.ShippingAddress.LastName, "Street1": line.ShippingAddress.Street1, "Street2": line.ShippingAddress.Street2, "City": line.ShippingAddress.City, "State": line.ShippingAddress.State, "Zip": line.ShippingAddress.Zip, "Country": line.ShippingAddress.Country, "Phone": line.ShippingAddress.Phone, "xp": { "NickName": "", "IsDefault": false } };
			OrderCloud.Me.CreateAddress(addressdata).then(function (res) {
				console.log(res);
			})
		}


        line.xp.addressType = vm.addressType;


		// function init() {

		if (line.ID == "") {
			if (vm.order) {
				OrderCloud.LineItems.List(vm.order).then(function (res) {
					checkLineItemsId(res, line).then(function (data) {
						if (data != 'sameId') {
							checkLineItemsAddress(res, line).then(function (data) {
								if (data != 'sameAddress') {
									createNewLineItem(line);
								}
							});
						}
					});

					function checkLineItemsId(res, line) {
						var deferred = $q.defer();
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
											vm.updateLinedetails(vm.order, val);
										}
									});
									count++
									vm.crdmsg = !vm.crdmsg;
									vm.activeRecipient = false;
									vm.showNewRecipient = false;
									deferred.resolve('sameId');
								}
							}

						});
						if (count == 0) {
							deferred.resolve(null);
						}
						return deferred.promise;
					}
					function checkLineItemsAddress(res, line) {
						var count = 0;
						var deferred = $q.defer();

						angular.forEach(res.Items, function (val, key, obj) {
							var a = new Date(val.xp.deliveryDate);
							var b = new Date(line.xp.deliveryDate);

							var DateA = Date.UTC(a.getFullYear(), a.getMonth() + 1, a.getDate());
							var DateB = Date.UTC(b.getFullYear(), b.getMonth() + 1, b.getDate());

							if (val.ShippingAddress.FirstName == line.ShippingAddress.FirstName && val.ShippingAddress.LastName == line.ShippingAddress.LastName && (val.ShippingAddress.Street1).split(/(\d+)/g)[1] == (line.ShippingAddress.Street1).split(/(\d+)/g)[1] && DateA == DateB) {
								if (count == 0) {
									line.xp.TotalCost = parseFloat(line.UnitPrice) * parseFloat(line.Quantity);
									vm.lineitemdtls = line;
									console.log("line", line);
									PdpService.CreateOrder(line.ProductID);
									count++
									vm.crdmsg = !vm.crdmsg;
									vm.activeRecipient = false;
									vm.showNewRecipient = false;
									deferred.resolve('sameAddress');
								}
							}
						});
						if (count == 0) {
							deferred.resolve(null);
						}

						return deferred.promise;
					}

					function createNewLineItem(line) {
						vm.calculateDeliveryCharges(line).then(function (data) {
							if (data == '1') {
								vm.lineitemdtls = line;
								console.log("line", line);
								PdpService.CreateOrder(line.ProductID);

							}
						});

						vm.crdmsg = true;
						vm.activeRecipient = false;
						vm.showNewRecipient = false;

					}


				})
			}
			else {
				vm.calculateDeliveryCharges(line).then(function (data) {
					if (data == '1') {
						vm.lineitemdtls = line;
						console.log("line", line);
						PdpService.CreateOrder(line.ProductID);

					}
				});
				vm.crdmsg = true;
				vm.activeRecipient = false;
				vm.showNewRecipient = false;
			}

		}

		//}
		vm.sameDay = false;
		//vm.sameDayEnabled = true;
	}


	function updateLinedetails(args, newline) {
		OrderCloud.LineItems.Update(args, newline.ID, newline).then(function (dat) {
			console.log("LineItemsUpdate", JSON.stringify(newline.ShippingAddress));
			OrderCloud.LineItems.SetShippingAddress(args, newline.ID, newline.ShippingAddress).then(function (data) {
				console.log("SetShippingAddress", data);
				alert("Data submitted successfully");
				vm.getLineItems();
			});
		});

	}
	function getLineItems() {

		OrderCloud.LineItems.List(vm.order).then(function (res) {

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
				vm.activeRecipient = false;
				vm.showNewRecipient = false;
				vm.showNewRecipient1 = true;
			}

			vm.activeOrders = res.Items;

		});


	};

	function closeTab() {
		vm.showNewRecipient=true;
		$uibModalInstance.close();
		vm.addedToCartPopUp();
	}

	function newreceipent() {
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

		item.xp.DeliveryMethod = items.xp.DeliveryMethod

		//vm.line = null;
		item.ShippingAddress.Country = 'US'
		vm.addressType = 'Residence'
		vm.visible = false;
		vm.line = item;
		vm.activeRecipient = false;
		vm.crdmsg = true;
		vm.showNewRecipient = !vm.showNewRecipient;
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
					OrderCloud.LineItems.List(vm.order).then(function(res){
						LineItemHelpers.GetProductInfo(res.Items).then(function () {
							deferred.resolve(res);
						})
					})
					return deferred.promise;
				}
			}
		});

		modalInstance.result.then(function (selectedItem) {
			$scope.selected = selectedItem;
		}, function () {
			angular.noop();
		});
	}
	function getCityState(line, zip) {
		if (zip.length == 5) {
			PdpService.getCityState(zip).then(function (res) {
				line.ShippingAddress.City = res.City;
				line.ShippingAddress.State = res.State;
				line.ShippingAddress.Country = res.Country;
			});
		}
		else {
			alert('Zip code is invalid');
		}
	}
	var storesData;
	PdpService.GetStores().then(function (res) {
		storesData = res.data.stores;
		vm.storeNames = _.pluck(res.data.stores, 'storeName');
	});
	function storesDetails(item, line) {
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
		store.xp.DeliveryMethod = "InStorePickUp";
		PdpService.GetPhoneNumber(filt[0].phoneNumber).then(function (res) {
			store.ShippingAddress.Phone1 = res[0];
			store.ShippingAddress.Phone2 = res[1];
			store.ShippingAddress.Phone3 = res[2];
		});

		vm.checkDeliverymethod(line)
	};
	var hospitalData;
	PdpService.GetHospitals().then(function (res) {
		hospitalData = res;
		vm.hospitalNames = _.pluck(hospitalData, 'AddressName');
	});
	function hospitalDetails(item, line) {
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
		if (filt[0].Phone) {
			hospital.ShippingAddress.Phone1 = filt[0].Phone.substr(0, 3);
			hospital.ShippingAddress.Phone2 = filt[0].Phone.substr(3, 3);
			hospital.ShippingAddress.Phone3 = filt[0].Phone.substr(6);
		}
		// PdpService.GetPhoneNumber(filt[0].phoneNumber).then(function (res) {
		// 	store.ShippingAddress.Phone1 = res[0];
		// 	store.ShippingAddress.Phone2 = res[1];
		// 	store.ShippingAddress.Phone3 = res[2];
		// });

		vm.checkDeliverymethod(line)
	};
	var funeralHomeData;
	PdpService.GetFuneralHomes().then(function (res) {
		funeralHomeData = res;
		vm.funeralHomes = _.pluck(funeralHomeData, 'AddressName');
	});
	vm.funeralHomeDetails = funeralHomeDetails;
	function funeralHomeDetails(item, line) {
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
		if (filt[0].Phone) {
			funeralHome.ShippingAddress.Phone1 = filt[0].Phone.substr(0, 3);
			funeralHome.ShippingAddress.Phone2 = filt[0].Phone.substr(3, 3);
			funeralHome.ShippingAddress.Phone3 = filt[0].Phone.substr(6);
		}
		// PdpService.GetPhoneNumber(filt[0].phoneNumber).then(function (res) {
		// 	store.ShippingAddress.Phone1 = res[0];
		// 	store.ShippingAddress.Phone2 = res[1];
		// 	store.ShippingAddress.Phone3 = res[2];
		// });

		vm.checkDeliverymethod(line)
	};
	var churchData;
	PdpService.GetChurches().then(function (res) {
		churchData = res;
		vm.churchNames = _.pluck(churchData, 'AddressName');
	});
	vm.churchDetails = churchDetails;
	function churchDetails(item, line) {
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
		if (filt[0].Phone) {
			church.ShippingAddress.Phone1 = filt[0].Phone.substr(0, 3);
			church.ShippingAddress.Phone2 = filt[0].Phone.substr(3, 3);
			church.ShippingAddress.Phone3 = filt[0].Phone.substr(6);
		}
		// PdpService.GetPhoneNumber(filt[0].phoneNumber).then(function (res) {
		// 	store.ShippingAddress.Phone1 = res[0];
		// 	store.ShippingAddress.Phone2 = res[1];
		// 	store.ShippingAddress.Phone3 = res[2];
		// });

		vm.checkDeliverymethod(line)
	};
	function addressTypeChanged(lineitem, addressType) {
		angular.forEach(lineitem.ShippingAddress, function (value, key) {
			console.log(key + ': ' + value);
			if (key == 'Street1' || key == 'Street2' || key == 'City' || key == 'State' || key == 'Zip' || key == 'Country' || key == 'Phone1' || key == 'Phone2' || key == 'Phone3') {
				lineitem.ShippingAddress[key] = null;
			}

		});
		//lineitem.ShippingAddress = null;
		vm.name = "";

	}

	vm.checkDeliverymethod = checkDeliverymethod;
	function checkDeliverymethod(line) {
		PdpService.getCityState(line.ShippingAddress.Zip).then(function (res) {
			var city = res.City;
			if (line.xp.DeliveryMethod == 'Mixed') {
				if (city == "Minneapolis" || city == "Saint Paul") {
					vm.notLocal = false;
				}
				else {

					alert("Fast Delivery for local only");
					vm.notLocal = true;
				}
			}

		});
		if (line.xp.DeliveryMethod != 'NO') {

			vm.callDeliveryOptions(line);
			vm.sameDay = true;
		}
		else {
			vm.GetDeliveryMethods(line.ProductID).then(function (res) {
				// if(res.xp.DeliveryChargesCatWise.DeliveryMethods.Mixed){

				// }
				// if(res.xp.DeliveryChargesCatWise.DeliveryMethods.Courier == true && !res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip){

				// }
				if (res.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip)
					line.xp.DeliveryMethod = "DirectShip";

				// if(res.Name == "Gift Cards")
				if (res.xp.DeliveryChargesCatWise.DeliveryMethods.UPS) {
					line.xp.DeliveryMethod = 'UPS';

				}
				if (res.xp.DeliveryChargesCatWise.DeliveryMethods.LocalDelivery) {
					line.xp.DeliveryMethod = 'LocalDelivery';
					vm.sameDay = true;
				}
				if (res.xp.DeliveryChargesCatWise.DeliveryMethods.UPS && res.xp.DeliveryChargesCatWise.DeliveryMethods.LocalDelivery) {
					if (line.ShippingAddress.City == "Minneapolis" || line.ShippingAddress.City == "Saint Paul") {
						line.xp.DeliveryMethod = 'LocalDelivery';
						vm.sameDay = true;
					}
					else {

						line.xp.DeliveryMethod = 'UPS';

					}
				}


			});

			vm.callDeliveryOptions(line);

		}

	}
	function GetDeliveryMethods(prodID) {
		var deferred = $q.defer();
		OrderCloud.Categories.ListProductAssignments(null, prodID).then(function (res1) {
			//OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function(res2){
			//OrderCloud.Categories.Get('c2_c1_c1').then(function (res2) {
			OrderCloud.Categories.Get('c8_c9_c1').then(function (res2) {
				//OrderCloud.Categories.Get('c4_c1').then(function (res2) {
				// if (res2.xp.DeliveryChargesCatWise.DeliveryMethods.Mixed) {
				// 	vm.Faster = true;

				// }
				// // if (res2.xp.DeliveryChargesCatWise.DeliveryMethods.Courier == true && !res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip) {
				// // 	vm.Courier = true;

				// // }
				// // if (res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip)
				// // 	//$scope.createListItem(prodID, "DirectShip");
				// // 	vm.DeliveryType = "DirectShip";
				// // if (res2.Name == "Gift Cards")
				// // 	//$scope.createListItem(prodID, "USPS");
				// // 	vm.DeliveryType = "USPS";
				// if (res2.Name != "Gift Cards" && !res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip && !res2.xp.DeliveryChargesCatWise.DeliveryMethods.Courier && !res2.xp.DeliveryChargesCatWise.DeliveryMethods.Mixed) {
				// 	//$scope.createListItem(prodID);
				// 	vm.DeliveryType = 'NO';
				// }
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
				if (line.xp.MinDate.LocalDelivery)
					line.xp.MinDays['MinToday'] = val.xp.MinDate.LocalDelivery;
			} else {
				dt = new Date();
				line.xp.MinDate = {};
				line.xp.MinDays['MinToday'] = dt.getFullYear() + "-" + (("0" + (dt.getMonth() + 1)).slice(-2)) + "-" + (("0" + dt.getDate()).slice(-2));
			}
			vm.mindays = line.xp.MinDays;
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
		vm.openRecipient[index] = !vm.openRecipient[index];
		if (vm.addAddress[index]) {
			//vm.openRecipient[index] = true;
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

			vm.recipientLineitem = item;
			vm.addressType = lineitem.xp.addressType;
			if (vm.recipientLineitem.xp.DeliveryMethod == 'Mixed') {
				if (lineitem.xp.ShippingAddress.City == 'Minneapolis' || lineitem.xp.ShippingAddress.City == "Saint Paul") {
					vm.notLocal = false;
					vm.callDeliveryOptions(vm.recipientLineitem);

				}
				else {

					alert("Fast Delivery for local only");
					vm.notLocal = true;
				}

			}
			else {
				vm.recipientLineitem.xp.DeliveryMethod = lineitem.xp.DeliveryMethod;
				vm.callDeliveryOptions(vm.recipientLineitem);
			}

		}

	}
	function submitRecipientDetails(line, index) {
		vm.recipientLineitem.Quantity = line.Quantity;
		if (line.ShippingAddress.Phone1 && line.ShippingAddress.Phone2 && line.ShippingAddress.Phone3) {
			line.ShippingAddress.Phone = '(' + line.ShippingAddress.Phone1 + ')' + line.ShippingAddress.Phone2 + '-' + line.ShippingAddress.Phone3;
			delete line.ShippingAddress.Phone1;
			delete line.ShippingAddress.Phone2;
			delete line.ShippingAddress.Phone3;

		}
		vm.recipientLineitem.ShippingAddress = line.ShippingAddress;
		vm.recipientLineitem.xp.deliveryDate = line.xp.deliveryDate;

		// vm.calculateDeliveryCharges(vm.recipientLineitem).then(function (data) {
		// 	if (data == '1') {
		// function init() {
		//vm.lineitemdtls = vm.recipientLineitem;
		//console.log("line", vm.recipientLineitem);
		if (vm.recipientLineitem.ID == "") {
			OrderCloud.LineItems.List(vm.order).then(function (res) {
				checkLineItemsId(res, vm.recipientLineitem).then(function (data) {
					if (data != 'sameId') {
						checkLineItemsAddress(res, vm.recipientLineitem).then(function (data) {
							if (data != 'sameAddress') {
								createNewLineItem(vm.recipientLineitem);
							}
						});
					}
				});

				function checkLineItemsId(res, line) {
					var deferred = $q.defer();
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
										vm.updateLinedetails(vm.order, val);
									}
								});
								count++;
								vm.activeRecipient = false;
								vm.showNewRecipient = false;
								deferred.resolve('sameId');
							}
						}
					});
					if (count == 0) {
						deferred.resolve(null);
					}
					return deferred.promise;
				}
				function checkLineItemsAddress(res, line) {
					var count = 0;
					var deferred = $q.defer();
					angular.forEach(res.Items, function (val, key, obj) {

						var a = new Date(val.xp.deliveryDate);
						var b = new Date(line.xp.deliveryDate);

						var DateA = Date.UTC(a.getFullYear(), a.getMonth() + 1, a.getDate());
						var DateB = Date.UTC(b.getFullYear(), b.getMonth() + 1, b.getDate());

						if (val.ShippingAddress.FirstName == line.ShippingAddress.FirstName && val.ShippingAddress.LastName == line.ShippingAddress.LastName && (val.ShippingAddress.Street1).split(/(\d+)/g)[1] == (line.ShippingAddress.Street1).split(/(\d+)/g)[1] && DateA == DateB) {
							if (count == 0) {
								line.xp.TotalCost = parseFloat(line.UnitPrice) * parseFloat(line.Quantity);
								vm.lineitemdtls = line;
								console.log("line", line);
								PdpService.CreateOrder(line.ProductID);
								count++
								vm.activeRecipient = false;
								vm.showNewRecipient = false;
								deferred.resolve('sameAddress');
							}
						}
					});
					if (count == 0) {
						deferred.resolve(null);
					}

					return deferred.promise;
				}

				function createNewLineItem(line) {
					vm.calculateDeliveryCharges(line).then(function (data) {
						if (data == '1') {
							vm.lineitemdtls = line;
							console.log("line", line);
							PdpService.CreateOrder(line.ProductID);

						}
					});


					vm.activeRecipient = false;
					vm.showNewRecipient = false;

				}

			});
		}

		vm.sameDay = false;
		vm.openRecipient[index] = false;

	}
	vm.calculateDeliveryCharges = calculateDeliveryCharges;
	function calculateDeliveryCharges(line) {
		var d = $q.defer();
		PdpService.GetDeliveryOptions(line, line.xp.DeliveryMethod).then(function (res) {

			var obj = {};

			if (line.xp.DeliveryMethod == 'LocalDelivery') {

				PdpService.CompareDate(line.xp.deliveryDate).then(function (data) {
					if (data == '1') {

						angular.forEach(res[line.xp.DeliveryMethod], function (val, key) {
							obj[key] = val;
						}, true);
						line.xp.deliveryFeesDtls = obj;
						// if(!line.xp.DeliveryMethod)
						// 	line.xp.DeliveryMethod = DeliveryMethod;
						line.xp.TotalCost = 0;
						angular.forEach(line.xp.deliveryFeesDtls, function (val, key) {

							line.xp.TotalCost += parseFloat(val);

						});
						if (line.xp.TotalCost > 250) {
							line.xp.Discount = line.xp.TotalCost - 250;
							line.xp.TotalCost = 250;
						}
						line.xp.TotalCost = line.xp.TotalCost + (line.Quantity * line.UnitPrice);
						d.resolve('1');

					}
					else {
						delete res.LocalDelivery.SameDayDelivery;
						angular.forEach(res[line.xp.DeliveryMethod], function (val, key) {
							obj[key] = val;
						}, true);
						line.xp.deliveryFeesDtls = obj;
						// if(!line.xp.DeliveryMethod)
						// 	line.xp.DeliveryMethod = DeliveryMethod;
						line.xp.TotalCost = 0;
						angular.forEach(line.xp.deliveryFeesDtls, function (val, key) {

							line.xp.TotalCost += parseFloat(val);

						});
						if (line.xp.TotalCost > 250) {
							line.xp.Discount = line.xp.TotalCost - 250;
							line.xp.TotalCost = 250;
						}
						line.xp.TotalCost = line.xp.TotalCost + (line.Quantity * line.UnitPrice);
						d.resolve('1');
					}
					//d.resolve(1);
				})
				//d.resolve(1);
			}
			else {

				delete res.LocalDelivery.SameDayDelivery;
				angular.forEach(res[line.xp.DeliveryMethod], function (val, key) {
					obj[key] = val;
				}, true);
				line.xp.deliveryFeesDtls = obj;
				// if(!line.xp.DeliveryMethod)
				// 	line.xp.DeliveryMethod = DeliveryMethod;
				line.xp.TotalCost = 0;
				angular.forEach(line.xp.deliveryFeesDtls, function (val, key) {

					line.xp.TotalCost += parseFloat(val);

				});
				if (line.xp.TotalCost > 250) {
					line.xp.Discount = line.xp.TotalCost - 250;
					line.xp.TotalCost = 250;
				}
				line.xp.TotalCost = line.xp.TotalCost + (line.Quantity * line.UnitPrice);
				d.resolve('1');

			}




			//delete line.xp.Discount;

		});
		return d.promise;
	}

	vm.addressBook = function () {
		vm.showaddress = true;
		OrderCloud.Me.ListAddresses(null, null, 100).then(function (res) {
			console.log(res);
			vm.addressbook = res;
		})
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
	vm.IsNumeric = function ($e) {
        console.log($e);
        var keyCode = $e.which ? $e.which : $e.keyCode;
        var ret = ((keyCode >= 48 && keyCode <= 57) || specialKeys.indexOf(keyCode) != -1);
        if (!ret)
            $e.preventDefault();
    }
	
}
/*
function pdpAddedToCartController($scope, $uibModalInstance) {
	var vm = this;
	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};
}*/

function addedToCartController1($scope, $uibModalInstance, $state, Orderid) {
	var vm = this;
	vm.orderid = Orderid.Items;
	console.log(vm.orderid);
	vm.checkout = checkout;
	function checkout() {
		$state.go('checkout');
	}
	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');

		$state.go('cart', { ID: vm.orderid });


	};
	vm.shiftSelectedCartRight= function(){
    	var currentPos = angular.element('#owl-carousel-added-cart-pdt .owl-carousel-item').scrollLeft();
    	var posToShift = angular.element('.added-main .detail-block .cart-info div:nth-child(2) .middle-part #owl-carousel-added-cart-pdt .owl-carousel-item').width();
    	angular.element('#owl-carousel-added-cart-pdt .owl-carousel-item').scrollLeft(currentPos + posToShift);
    	angular.element('#owl-carousel-added-cart-pdt .owl-carousel-item .cartLeftArrow').css({'display':'block'});
    }

    vm.shiftSelectedCartLeft= function(){
    	var currentPos = angular.element('#owl-carousel-added-cart-pdt .owl-carousel-item').scrollLeft();
    	var posToShift = angular.element('.added-main .detail-block .cart-info div:nth-child(2) .middle-part #owl-carousel-added-cart-pdt .owl-carousel-item').width();
    	angular.element('#owl-carousel-added-cart-pdt .owl-carousel-item').scrollLeft(currentPos - posToShift);
    	if(currentPos == 0){
    		angular.element('#owl-carousel-selected-cat .cartLeftArrow').css({'display':'none'});
    	} else{
    		angular.element('#owl-carousel-selected-cat .cartLeftArrow').css({'display':'block'});
    	}
    }
}
