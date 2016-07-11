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
		GetSeqProd: _getSeqProd,
		getCityState: _getCityState
	};
	function _getCityState(zip){
		var defered = $q.defer();
		$http.defaults.headers.common['Authorization'] = undefined;
		$http.get('http://maps.googleapis.com/maps/api/geocode/json?address='+zip).then(function(res){
			var city, state;
			angular.forEach(res.data.results[0].address_components, function(component,index){
				var types = component.types;
				angular.forEach(types, function(type,index){
					if(type == 'locality') {
						city = component.long_name;
					}
					if(type == 'administrative_area_level_1') {
						state = component.short_name;
					}
				});
			});
			defered.resolve({"City":city, "State":state});
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
		vm.prodDesription = sizeGroupedProducts[selectedSize][vm.selectedProductIndex].Description;
		// OrderCloud.Products.GetInventory(sizeGroupedProducts[selectedSize][vm.selectedProductIndex].ID).then(function(res){
		// if(res.Available > 0){
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
			  // 		$(".elevateZoom").elevateZoom({
					// easing : true,
					// responsive:true,
					// zoomWindowWidth:400,
					// borderSize: 1
					// });
				    },300);
				});

		// 	}
		// });
		//$('body').find('.detail-container .prod_title').text(vm.sizeGroupedProducts[0].Name);

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
		vm.prodDesription = prod.Description;
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
		var modalInstance = $uibModal.open({
			animation: true,
			backdropClass: 'multiRecipentModal',
			windowClass:'multiRecipentModal',
			templateUrl: 'pdp/templates/multireceipent.tpl.html',
			controller: 'MultipleReceipentCtrl',
			controllerAs: 'multipleReceipent',
			param: {
				//productID: prodID
			},
			resolve: {
				items: function () {

					return vm.activeProducts;
				},
				Order: function ($rootScope, $q, $state, toastr, CurrentOrder) {
                    var dfd = $q.defer();
                    CurrentOrder.GetID()
                        .then(function (order) {
                            dfd.resolve(order)
                        })
                        .catch(function () {
                            dfd.resolve(null);
                        });
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

function MultipleReceipentController($uibModal, BaseService, $scope, $stateParams, $uibModalInstance, items, $rootScope, OrderCloud, CurrentOrder, LineItemHelpers, PdpService, Order) {
    var vm = this;
    vm.oneAtATime = true;
	vm.selectedRecipient = false;
	vm.list = {},
    vm.line = null;
	vm.addressType='Residence';
    console.log("items", items[0]);
	vm.singlelerecipent = true;
	vm.crdmsg = true;
	vm.activeOrders = [];
	vm.crdmsghide =crdmsghide;
	vm.getCityState=getCityState;
    vm.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
	vm.getLineItems = getLineItems;
	vm.activeRecipient = true;
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
	if(Order){
      vm.order=Order
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
		vm.order= args;
		console.log("order id", vm.order)
		lineitem.ShippingAddress = vm.lineitemdtls.ShippingAddress;
		lineitem.xp = vm.lineitemdtls.xp;
		lineitem.Quantity = vm.lineitemdtls.Quantity;
		lineitem.xp.deliveryDate = new Date(vm.lineitemdtls.xp.deliveryDate);
		vm.updateLinedetails(args, lineitem);
	});

	
	 function crdmsghide() {
		alert("test");
		vm.crdmsg = !vm.crdmsg;
	}

	
	vm.submitDetails =submitDetails;
	 function submitDetails(line, $index) {
             line.ProductID=vm.activeOrders[0].ProductID;
		console.log("line", line);
		// if (vm.showNewRecipient) {
		// 	vm.line = item;
		// 	vm.line.ShippingAddress = line.ShippingAddress;
		// 	vm.line.xp = line.xp;
		// 	line = $scope.line;
		// }
		if(line.ShippingAddress.Phone1 && line.ShippingAddress.Phone2 &&line.ShippingAddress.Phone3){
          line.ShippingAddress.Phone=line.ShippingAddress.Phone1+line.ShippingAddress.Phone2+line.ShippingAddress.Phone3;
		  delete line.ShippingAddress.Phone1;
		  delete line.ShippingAddress.Phone2;
		  delete line.ShippingAddress.Phone3;

		}
		if (line.xp.deliveryDate) {
			line.xp.deliveryDate = new Date(line.xp.deliveryDate);
		}
		if (this.addressType == "Hospital" || this.addressType == "Church" || this.addressType == "School" || this.addressType == "Funeral") {
			line.ShippingAddress = line.xp.ShippingAddress;
			console.log("shippingdata", line.xp.ShippingAddress);
		}

		if (vm.visible == true) {
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
		vm.lineitemdtls = line;


		if (line.ID == "") {
			var count = 0;
			//JSON.stringify(vm.activeOrders[0].ShippingAddress) != JSON.stringify(items[0].ShippingAddress
			if(vm.order) {
			angular.forEach(vm.activeOrders, function (val, key, obj) {
				if (val.ProductID == line.ProductID && val.ShippingAddress.FirstName == line.ShippingAddress.FirstName && val.ShippingAddress.LastName == line.ShippingAddress.LastName && val.ShippingAddress.Street1 == line.ShippingAddress.Street1) {
					val.Quantity++
					vm.updateLinedetails(vm.order, val);
					vm.crdmsg = !$scope.crdmsg;
					vm.activeRecipient = true;
					vm.showNewRecipient = false;
					count++
				}


			});
		 }
			if (count == 0) {

				PdpService.CreateOrder(line.ProductID);
				$scope.crdmsg = !$scope.crdmsg;
				$scope.activeRecipient = false;
				$scope.showNewRecipient = true;

			}



		}
		// else {
		// 	vm.updateLinedetails(vm.order, line);
		// 	$scope.crdmsg = !$scope.crdmsg;
		// 	$scope.activeRecipient = false;
		// 	$scope.showNewRecipient = false;
		// }



	}
	vm.updateLinedetails = function updateLinedetails(args, newline) {
		OrderCloud.LineItems.Update(args, newline.ID, newline).then(function (dat) {
			console.log("LineItemsUpdate", dat);
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
				if (val.xp.deliveryDate)
				{
					val.xp.deliveryDate = new Date(val.xp.deliveryDate);
				}
				if(val.ShippingAddress.Phone){
					val.ShippingAddress.Phone1=val.ShippingAddress.Phone.slice(0,3);
					val.ShippingAddress.Phone2=val.ShippingAddress.Phone.slice(3,6);
					val.ShippingAddress.Phone3=val.ShippingAddress.Phone.slice(6);
				}
			})
			vm.activeOrders = res.Items;
			if (res.Items.length > 0) {
				vm.line = null;
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
				item.ShippingAddress = null;
				item.xp = null;
				vm.line = item;
				vm.activeRecipient = false;
				vm.showNewRecipient = true;
			}


		});

	};

	vm.closeTab = function () {

		$uibModalInstance.close();
		vm.addedToCartPopUp();
	}
		vm.showNewRecipient = false;
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
		vm.line = null;
		vm.line = item;
		vm.activeRecipient = false;
		vm.showNewRecipient = !vm.showNewRecipient;


	}
	vm.addedToCartPopUp = function () {
		var modalInstance = $uibModal.open({
			animation: false,
			backdropClass: 'addedToCartModal',
			windowClass: 'addedToCartModal',
			templateUrl: 'pdp/templates/added-to-cart.tpl.html',
			controller: 'addedToCartCtrl',
			controllerAs: 'addedToCart'
		});

		modalInstance.result.then(function () {

		}, function () {
			angular.noop();
		});
	}
	function getCityState(line,zip){
     PdpService.getCityState(zip).then(function(res){
				line.ShippingAddress.City = res.City;
				line.ShippingAddress.State = res.State;
			});
	}

}

function pdpAddedToCartController($scope, $uibModalInstance) {
    var vm = this;
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}

function addedToCartController($scope, $uibModalInstance, $state) {
    var vm = this;
	vm.checkout = checkout;
	function checkout() {
		$state.go('checkout');
	}
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}