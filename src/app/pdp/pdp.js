angular.module('orderCloud')

	.config(PdpConfig)
	.factory('PdpService', PdpService)
	.controller('PdpCtrl', PdpController)
    .controller('MultipleReceipentCtrl', MultipleReceipentController)
    .controller('pdpAddedToCartCtrl', pdpAddedToCartController)
    .controller('addedToCartCtrl', addedToCartController)
	;

function PdpConfig($stateProvider) {
	$stateProvider
		.state('pdp', {
			parent: 'base',
			url: '/pdp/:sequence?prodId',
			templateUrl: 'pdp/templates/pdp.tpl.html',
			resolve: {
				productDetail: function(PlpService, PdpService, $q, $stateParams, $http, OrderCloud){
						var filter ={"xp.sequencenumber":$stateParams.sequence};
					    // return OrderCloud.Me.ListProducts(null, 1, 100, null, null, filter, null).then(function(res){
				     // 	console.log('Product response data',res);
				     // 	return res;
				     return PdpService.GetSeqProd($stateParams.sequence).then(function(res){
			           return res;
			          });
				},
				productImages: function (PdpService, $stateParams, $q, $http) {
					return PdpService.GetProductCodeImages($stateParams.prodId);
				},
				selectedProduct: function ($stateParams) {
					return $stateParams.prodId;
				}
			},
			controller: 'PdpCtrl',
			controllerAs: 'pdp'
		})
}


function PdpService($q, Underscore, OrderCloud, CurrentOrder, $http, $uibModal, x2js, alfrescourl, alfcontenturl, $rootScope) {
	var service = {
		AddToWishList: _addToWishList,
		CreateOrder: _createOrder,
		addressValidation: _addressValidation,
		GetProductCodeImages: _getProductCodeImages,
		GetHelpAndPromo: _getHelpAndPromo,
		GetSeqProd: _getSeqProd
	};
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
			angular.forEach(data.feed.entry, function (value, key) {
				if (value.link._href.toLowerCase().match(/\.(jpg|jpeg|png|gif)/g)) {
					productVarientImages.push(value.link._href + '?alf_ticket=' + ticket);
				}
			});
			deferred.resolve(productVarientImages);
		});
		return deferred.promise;
	}
    function _addToWishList(productID) {
		var deferred = $q.defer();
		OrderCloud.Get().then(function (res) {
			if (res.ID !== "gby8nYybikCZhjMcwVPAiQ") {
				var modalInstance = $uibModal.open({
					animation: true,
					backdropClass: 'loginModalBg',
					templateUrl: 'login/templates/login.modal.tpl.html',
					controller: 'LoginCtrl',
					controllerAs: 'login'
				});
				modalInstance.result.then(function () {

				}, function () {
					angular.noop();
				});
			} else {
				var Obj = res;
				if (Obj.xp.WishList.indexOf(productID) < 0) {
					Obj.xp.WishList.push(productID);
					$http({
						method: 'PATCH',
						dataType: "json",
						url: "https://api.ordercloud.io/v1/buyers/Bachmans/users/" + res.ID,
						data: JSON.stringify(Obj),
						headers: {
							'Content-Type': 'application/json'
						}

					}).success(function (data, status, headers, config) {
						alert("Product added to WishList");
					}).error(function (data, status, headers, config) {
						alert("Error Adding Product to WishList");
					});
				} else {
					alert("Product alredy in list");
				}
			}

			deferred.resolve(res);
		});
		return deferred.promise;

    }
    function _createOrder(prodID) {
		var productID;
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
				$rootScope.order = orderId;
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
					$rootScope.order = order.ID;
					return $rootScope.$broadcast('LineItemCreated', order.ID, lineitem);
				})
			})
		})
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

function PdpController($uibModal, $q, Underscore, OrderCloud, $stateParams, PlpService, productDetail, alfcontenturl, $sce, CurrentOrder, $rootScope, $scope, PdpService, productImages, selectedProduct) {
	var vm = this;
	vm.selectedSizeIndex = 0;  // stores selected size index from vm.productDetails
	vm.selectedProductIndex = 0; // stores selected product index under size array from vm.productDetails     	
	vm.sizeGroupedProducts = []; // stores prodcuts in accrging to size 
	vm.productVarientImages = productImages; // stores product images based on selcted size and color
	vm.defaultSizeIndex = 0; // static value to retrieve size
	vm.activeProducts = [];//stores selected products
	var sizeGroupedProducts = _.groupBy(productDetail.Items, function (item) {
        return item.xp.SpecsOptions.Size;
    });

    vm.productDetails = Object.keys(sizeGroupedProducts).map(function (key) { return sizeGroupedProducts[key] });;
	console.log('Array converted all products  ', vm.productDetails);

	angular.forEach(vm.productDetails, function (value, key) {
		$.grep(value, function (e, i) {
			if (e.ID == selectedProduct) {
				vm.selectedSizeIndex = key;
				vm.selectedProductIndex = i;
			}
		});
	});


	vm.isSizeAvailable = vm.productDetails[0][0].length;
	$scope.qty = 1;

	// Function to get colors for selected size
	vm.selectVarients = function (selectedSize) {
		vm.sizeGroupedProducts = sizeGroupedProducts[selectedSize];
		vm.activeProducts = vm.sizeGroupedProducts;
		console.log('Selected size prod', vm.sizeGroupedProducts);
		//$('body').find('.detail-container .prod_title').text(vm.sizeGroupedProducts[0].Name);
		PdpService.GetProductCodeImages(sizeGroupedProducts[selectedSize][vm.selectedProductIndex].ID).then(function(res){
		vm.productVarientImages = res;
		var owl2 = angular.element("#owl-carousel-pdp-banner");   
		owl2.trigger('destroy.owl.carousel');
		setTimeout(function(){
      	owl2.owlCarousel({
            loop:false,
            nav:true,
            navText: ['<span class="" aria-hidden="true"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 90" style="enable-background:new 0 0 50 90;" xml:space="preserve"><style type="text/css">.st0{fill:none;stroke:#8c58b5;stroke-width:8;stroke-miterlimit:10;}</style><polyline class="st0" points="10,11.7 41.3,46.4 10,81.1 "/></svg></span>','<span class="" aria-hidden="true"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 90" style="enable-background:new 0 0 50 90;" xml:space="preserve"><style type="text/css">.st0{fill:none;stroke:#8c58b5;stroke-width:8;stroke-miterlimit:10;}</style><polyline class="st0" points="10,11.7 41.3,46.4 10,81.1 "/></svg></span>'],		
            dots:true,
            items:1
          }); 
      	 },300);
		});
	};
    $scope.radio = { selectedSize: null };

    // function to add active class for radio box
	vm.sizeBoxItemClicked = function ($index) {
		vm.selectedSizeIndex = $index;
		// pdp image min height -start
		 var pdpDetailBoxHt = $('.detail-overlay-box ').height();
		  //alert(pdpDetailBoxHt);
		  //$('.pdp-banner-top').css('min-height',pdpDetailBoxHt);

		// pdp image min height -end
	}

	// function to retrieve images for selected size and color
	vm.selectColor = function ($index, $event, prod) {
		vm.activeProducts[0] = prod;
		vm.selectedProductIndex = $index;
		$($event.target).parents('.detail-container').find('h3').text(prod.Name);
        $($event.target).parents('.product-box').find('.Price').text('$'+prod.StandardPriceSchedule.PriceBreaks[0].Price);
		PdpService.GetProductCodeImages(prod.ID).then(function(res){
		vm.productVarientImages = res;
		// pdp image min height -start
		  var pdpDetailBoxHt = $('.detail-overlay-box ').height();
		  //alert(pdpDetailBoxHt);
		  //$('.pdp-banner-top').css('min-height',pdpDetailBoxHt);

		  // pdp image min height -end
		var owl2 = angular.element("#owl-carousel-pdp-banner");   
		owl2.trigger('destroy.owl.carousel');
		setTimeout(function(){
      	owl2.owlCarousel({
	            loop:false,
	            nav:true,
	            navText: ['<span class="" aria-hidden="true"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 90" style="enable-background:new 0 0 50 90;" xml:space="preserve"><style type="text/css">.st0{fill:none;stroke:#8c58b5;stroke-width:8;stroke-miterlimit:10;}</style><polyline class="st0" points="10,11.7 41.3,46.4 10,81.1 "/></svg></span>','<span class="" aria-hidden="true"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 90" style="enable-background:new 0 0 50 90;" xml:space="preserve"><style type="text/css">.st0{fill:none;stroke:#8c58b5;stroke-width:8;stroke-miterlimit:10;}</style><polyline class="st0" points="10,11.7 41.3,46.4 10,81.1 "/></svg></span>'],		
	            dots:true,
	            items:1
          }); 
      	},300);
		});
	    //$('#owl-carousel-pdp-banner .owl-item img').css({'width':'60%','padding-right': '30px'});

	}

	vm.multireceipent = function () {
		$scope.items = "";
		CurrentOrder.Get().then(function (orderId) {
			$rootScope.order = orderId.ID;
			var modalInstance = $uibModal.open({
				animation: true,
				backdropClass: 'multiRecipentModal',
				templateUrl: 'pdp/templates/multireceipent.tpl.html',
				controller: 'MultipleReceipentCtrl',
				controllerAs: 'vm',
				param: {
					//productID: prodID
				},
				resolve: {
					items: function () {

						return vm.activeProducts;


					}
				}
			});

			modalInstance.result.then(function (selectedItem) {
				$scope.selected = selectedItem;
			}, function () {
				angular.noop();
			});
		},function(){
			var modalInstance = $uibModal.open({
				animation: true,
				backdropClass: 'multiRecipentModal',
				templateUrl: 'pdp/templates/multireceipent.tpl.html',
				controller: 'MultipleReceipentCtrl',
				controllerAs: 'vm',
				param: {
					//productID: prodID
				},
				resolve: {
					items: function () {

						return vm.activeProducts;


					}
				}
			});

			modalInstance.result.then(function (selectedItem) {
				$scope.selected = selectedItem;
			}, function () {
				angular.noop();
			});
		});

	}


	// Add to wishList
	vm.addToWishList = function (productID) {
		return PdpService.AddToWishList(productID).then(function (item) {
			return item;
		});
	}

	// added to cart -pdp modal
	vm.pdpAddedToCartPopUp = function () {
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



    }

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



	setTimeout(function(){
	    var pdtCarousal = angular.element("#owl-suggested-pdt-carousel");
		pdtCarousal.owlCarousel({
			loop: true,
			center: true,
			margin:12,
			nav:true,
			navText: ['<span class="pdtCarousalArrowPrev" aria-hidden="true">next</span>','<span class="pdtCarousalArrowNext" aria-hidden="true">prev</span>'],		
			callbacks: true,
			URLhashListener: true,
			autoplayHoverPause: true,
			startPosition: 'URLHash',
			responsiveClass:true,
			responsive:{
				// breakpoint from 0 up
				0:{
					items:1,
					stagePadding:120,
				},
				// breakpoint from 328 up..... mobile portrait
				320:{
					items:1,
					dots:true,
					stagePadding:30,
					margin:45,
				},
				// breakpoint from 328 up..... mobile landscape
				568:{
					items:1,
					dots:true,
					stagePadding:100,
					margin:30
				},
				960:{
					items:1,
					dots:true,
					stagePadding:200,
					margin:10
				},
				// breakpoint from 768 up
				768:{
					items:1,
					dots:true,
					stagePadding:120
				},
				1024:{
					items:2,
					dots:true,
					stagePadding:80
				},
				1500:{
					items:4,
					dots:true,
					stagePadding:0
				},
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
}

function MultipleReceipentController($uibModal, BaseService, $scope, $stateParams, $uibModalInstance, items, $rootScope, OrderCloud, CurrentOrder, LineItemHelpers, PdpService) {
    var vm = this;
    console.log(PdpService);
    vm.oneAtATime = true;
	vm.list = {},
		$scope.line = null;

	vm.selectedRecipient = false;
	vm.singlelerecipent = true;
	$scope.crdmsg = true;
    vm.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
	vm.getLineItems = getLineItems;
	$scope.activeRecipient = true;
	var item = {
		"ID": "",
		"ProductID": items[0].ID,
		"Quantity": items[0].StandardPriceSchedule.PriceBreaks[0].Quantity,
		"DateAdded": "",
		"QuantityShipped": 0,
		"UnitPrice": items[0].StandardPriceSchedule.PriceBreaks[0].Price,
		"LineTotal": 0,
		"CostCenter": null,
		"DateNeeded": null,
		"ShippingAccount": null,
		"ShippingAddressID": null,
		"ShippingAddress": null,
		"ShipperID": null,
		"ShipperName": null,
		"Specs": [],
		"xp": null
	};
	vm.order = $rootScope.order;
    vm.activeOrders = [];
	if (!vm.order) {
		vm.order = "";
	}
	if (vm.order == "") {
		vm.activeOrders[0] = item;
	}
	if ($rootScope.order) {
		vm.getLineItems();
	}

	$rootScope.$on('LineItemCreated', function (events, args, lineitem) {
		vm.order = $rootScope.order = args;
		console.log("order id", vm.order)
		lineitem.ShippingAddress = $rootScope.lineitemdtls.ShippingAddress;
		lineitem.xp = $rootScope.lineitemdtls.xp;
		lineitem.Quantity = $rootScope.lineitemdtls.Quantity;
		lineitem.xp.deliveryDate = new Date($rootScope.lineitemdtls.xp.deliveryDate);
		vm.updateLinedetails(args, lineitem);
	});

	$scope.crdmsghide = function () {
		alert("test");
		$scope.crdmsg = !$scope.crdmsg;
	}

	vm.shippingdata = null;
	$scope.submitDtls = function (line, $index) {

		console.log("line", line);
		if ($scope.showNewRecipient) {
			$scope.line = item;
			$scope.line.ShippingAddress = line.ShippingAddress;
			$scope.line.xp = line.xp;
			line = $scope.line;
		}
		if (line.xp.deliveryDate) {
			line.xp.deliveryDate = new Date(line.xp.deliveryDate);
		}
		if (this.addressType == "Hospital" || this.addressType == "Church" || this.addressType == "School" || this.addressType == "Funeral") {
			line.ShippingAddress = line.xp.ShippingAddress;
			console.log("shippingdata", line.xp.ShippingAddress);
		}

		if (this.visible == true) {
			if (line.xp) {
				delete line.xp.CardMessage;
			}
		}

		if (this.addressType == "Residence" || !this.addressType || this.addressType == "Shipping") {
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
				line.xp.storeName = line.willSearch;
				//recipient.Street1 = line.ShippingAddress.Street1;
			}
		}
		console.log("line", line);
		$rootScope.lineitemdtls = line;


		if (line.ID == "") {

			PdpService.CreateOrder(line.ProductID);
			$scope.crdmsg = !$scope.crdmsg;
			$scope.activeRecipient = false;
			$scope.showNewRecipient = false;

		}
		else {
			vm.updateLinedetails(vm.order, line);
			$scope.crdmsg = !$scope.crdmsg;
			$scope.activeRecipient = false;
			$scope.showNewRecipient = false;
		}



	}
	vm.updateLinedetails = function updateLinedetails(args, newline) {
		OrderCloud.LineItems.Update(args, newline.ID, newline).then(function (dat) {
			console.log("!@#$%", dat);
			OrderCloud.LineItems.SetShippingAddress(args, newline.ID, newline.ShippingAddress).then(function (data) {
				console.log("1234567890", data);
				alert("Data submitted successfully");
				vm.getLineItems();
			});
		});

	}
	function getLineItems() {

		OrderCloud.LineItems.List(vm.order).then(function (res) {

			console.log("Lineitems", res);
			angular.forEach(res.Items, function (val, key, obj) {
				if (val.xp.deliveryDate)
					val.xp.deliveryDate = new Date(val.xp.deliveryDate);
			})
			vm.activeOrders = res.Items;
			if (res.Items.length > 0) {
				$scope.line = null;
				item.ShippingAddress=null;
				item.xp=null;
				$scope.line = item;
				$scope.activeRecipient = false;
				$scope.showNewRecipient = true;
			}


		});

	};

	vm.closeTab = function () {

		$uibModalInstance.close();
		vm.addedToCartPopUp();
	}
	vm.addedToCartPopUp = function () {
		var modalInstance = $uibModal.open({
			animation: false,
			backdropClass: 'addedToCartModal',
			templateUrl: 'pdp/templates/added-to-cart.tpl.html',
			controller: 'addedToCartCtrl',
			controllerAs: 'addedToCart'
		});

		modalInstance.result.then(function () {

		}, function () {
			angular.noop();
		});
	}
	$scope.showNewRecipient = false;
	vm.newreceipent = function () {
		var item = {
			"ID": "",
			"ProductID": items[0].ID,
			"Quantity": items[0].StandardPriceSchedule.PriceBreaks[0].Quantity,
			"DateAdded": "",
			"QuantityShipped": 0,
			"UnitPrice": items[0].StandardPriceSchedule.PriceBreaks[0].Price,
			"LineTotal": 0,
			"CostCenter": null,
			"DateNeeded": null,
			"ShippingAccount": null,
			"ShippingAddressID": null,
			"ShippingAddress": null,
			"ShipperID": null,
			"ShipperName": null,
			"Specs": [],
			"xp": null
		};
		$scope.line = null;
		$scope.line = item;
		$scope.activeRecipient = false;
		$scope.showNewRecipient = !$scope.showNewRecipient;


	}
}

function pdpAddedToCartController($scope, $uibModalInstance) {
    var vm = this;
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}

function addedToCartController($scope, $uibModalInstance) {
    var vm = this;
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}
