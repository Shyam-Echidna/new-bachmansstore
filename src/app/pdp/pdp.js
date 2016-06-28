angular.module( 'orderCloud' )

	.config( PdpConfig )
	.factory( 'PdpService', PdpService)
	.controller( 'PdpCtrl', PdpController )
    .controller('MultipleReceipentCtrl',MultipleReceipentController)
    .controller('pdpAddedToCartCtrl', pdpAddedToCartController)
    .controller('addedToCartCtrl',addedToCartController)
;

function PdpConfig( $stateProvider ) {
	$stateProvider
		.state( 'pdp', {
			parent: 'base',
			url: '/pdp/:sequence?prodId',
			templateUrl:'pdp/templates/pdp.tpl.html',
			resolve: {
				productDetail: function(PlpService, PdpService, $q, $stateParams, $http, OrderCloud){
						//var filter ={"xp.sequencenumber":$stateParams.sequence};
					    // return OrderCloud.Me.ListProducts(null, 1, 100, null, null, filter, null).then(function(res){
				     // 	console.log('Product response data',res);
				     // 	return res;
				     return PdpService.GetSeqProd($stateParams.sequence).then(function(res){
			           return res;
			          });
				},
				productImages : function(PdpService, $stateParams, $q, $http){
					return PdpService.GetProductCodeImages($stateParams.prodId);
				},
				selectedProduct : function($stateParams){
					return $stateParams.prodId;
				}
			},
			controller:'PdpCtrl',
			controllerAs: 'pdp'
		})		
}


function PdpService( $q, Underscore, OrderCloud, CurrentOrder, $http, $uibModal, x2js, alfrescourl, alfcontenturl) {
	var service = {
		 AddToWishList : _addToWishList,
		 CreateOrder: _createOrder,
		 addressValidation: _addressValidation,
		 GetProductCodeImages: _getProductCodeImages,
		 GetHelpAndPromo:_getHelpAndPromo,
		 GetSeqProd :_getSeqProd
	};
	 function _getSeqProd(sequence){
   var defferred = $q.defer(); 
  $http({
                method: 'GET',
                dataType:"json",
                url:"https://api.ordercloud.io/v1/me/products?xp.sequencenumber="+sequence,
               
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

	function _getProductCodeImages(prodCode){
		var deferred = $q.defer();
		var ticket = localStorage.getItem("alf_ticket");
		var productVarientImages = [];
		 $http.get(alfcontenturl+"api/search/keyword.atom?q="+prodCode+"&alf_ticket="+ticket).then(function(res){
			var x2js = new X2JS();
			var data = x2js.xml_str2json(res.data);
			angular.forEach(data.feed.entry, function(value, key){
				 if (value.link._href.toLowerCase().match(/\.(jpg|jpeg|png|gif)/g)) {
        			productVarientImages.push(value.link._href+'?alf_ticket='+ticket);
   				 }	
			});
			deferred.resolve(productVarientImages);
		  });
		return deferred.promise; 
	}
    function _addToWishList(productID){
    	 var deferred = $q.defer();
    	 OrderCloud.Get().then(function(res){
    	 	if(res.ID !== "gby8nYybikCZhjMcwVPAiQ"){
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
    	 	}else{
    	 	 	var Obj = res;
    	 	 	if(Obj.xp.WishList.indexOf(productID) < 0){
    	 	 	Obj.xp.WishList.push(productID);
    	 		$http({
                method: 'PATCH',
                dataType:"json",
                url:"https://api.ordercloud.io/v1/buyers/Bachmans/users/"+res.ID,
                data: JSON.stringify(Obj),
                headers: {
                    'Content-Type': 'application/json'
                }

	            }).success(function (data, status, headers, config) { 
	                alert("Product added to WishList");
	            }).error(function (data, status, headers, config) {
	                alert("Error Adding Product to WishList");
	            });
    	 		}else{
    	 			alert("Product alredy in list");
    	 		}
    	 	}

    	 	deferred.resolve(res);
    	 });
 		 return deferred.promise;
        
    }
    function _createOrder(productID){
    	var productID;
		CurrentOrder.GetID().then(function(orderId){
			var lineItem = {			 
			  ProductID: prodID,
			  Quantity: 1
			};
			console.log(orderId);
			if(productID == prodID){
				alert("qwerty");
			}
			LineItems.Create(orderId,lineItem).then(function(res){
				console.log(res);
				//$rootScope.$broadcast('LineItemAddedToCart', orderId, res);
				return $rootScope.$broadcast('LineItemAddedToCart', orderId, res);
			})
		},function(){
			OrderCloud.Orders.Create({}).then(function(order){
				CurrentOrder.Set(order.ID);
				var lineItem = {			 
				  ProductID: prodID,
				  Quantity: 1
				};
				productID = prodID;
				OrderCloud.LineItems.Create(order.ID,lineItem).then(function(lineitem){
					return $rootScope.$broadcast('LineItemAddedToCart', order.ID, lineitem);
				})
			})
		})
    }
    function _addressValidation(obj){
		var deferred = $q.defer();
		$http.defaults.headers.common['Authorization'] = 'Basic QXZhbGFyYTpDNGxjdWw0dDNUYXghIQ==';
		$http.post('https://Four51TRIAL104401.jitterbit.net/Four51Test/v1/AvalaraValidateAddress', obj).then(function(res){
			deferred.resolve(res);
		});
		return deferred.promise;
    }
    function _getHelpAndPromo(ticket) {
      var defferred = $q.defer(); 
      $http({
        method: 'GET',
        dataType:"json",
        url:  alfrescourl+"ProductListing/HelpAndPromos?alf_ticket="+ticket,
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

function PdpController( $uibModal, $q, Underscore, OrderCloud,  $stateParams, PlpService, productDetail,alfcontenturl,$sce, CurrentOrder,$rootScope, $scope, PdpService, productImages, selectedProduct) {
	var vm = this;
	vm.selectedSizeIndex = 0;  // stores selected size index from vm.productDetails
	vm.selectedProductIndex = 0; // stores selected product index under size array from vm.productDetails     	
	vm.sizeGroupedProducts = []; // stores prodcuts in accrging to size 
	vm.productVarientImages = productImages; // stores product images based on selcted size and color
	vm.defaultSizeIndex =0; // static value to retrieve size
	var sizeGroupedProducts = _.groupBy(productDetail.Items, function(item) { 
        return item.xp.SpecsOptions.Size;
    });
    
    vm.productDetails = Object.keys(sizeGroupedProducts).map(function (key) {return sizeGroupedProducts[key]});;
	console.log('Array converted all products  ', vm.productDetails);
	
	angular.forEach(vm.productDetails, function(value, key){
		$.grep(value, function(e , i){ 
			if(e.ID == selectedProduct) {
			 vm.selectedSizeIndex = key;
			 vm.selectedProductIndex = i;
			}
		});
	});
	
    
	vm.isSizeAvailable = vm.productDetails[0][0].length;
	$scope.qty =1;
	
	// Function to get colors for selected size
	vm.selectVarients = function(selectedSize){
		vm.sizeGroupedProducts = sizeGroupedProducts[selectedSize];
		console.log('Selected size prod', vm.sizeGroupedProducts);
		//$('body').find('.detail-container .prod_title').text(vm.sizeGroupedProducts[0].Name);
		PdpService.GetProductCodeImages(sizeGroupedProducts[selectedSize][vm.selectedProductIndex].ID).then(function(res){
		vm.productVarientImages = res;
		var owl2 = angular.element("#owl-carousel-pdp-banner");   
		owl2.trigger('destroy.owl.carousel');
		setTimeout(function(){
      	owl2.owlCarousel({
            loop:true,
            nav:false,
            dots:true,
               responsive:{
                0:{ items:1 },
                320:{
                    items:1,
                },
                730 :{ 
                    items:1,
                },
                1024:{ 
                    items:1
                }
            }
          }); 
      	 },300);
		});
	};
    $scope.radio = {selectedSize:null};

    // function to add active class for radio box
	vm.sizeBoxItemClicked = function ($index) {
		vm.selectedSizeIndex = $index;
		// pdp image min height -start
		 var pdpDetailBoxHt = $('.detail-overlay-box ').height();
		  //alert(pdpDetailBoxHt);
		  $('.pdp-banner-top').css('min-height',pdpDetailBoxHt);

		  // pdp image min height -end
	}

	// function to retrieve images for selected size and color
	vm.selectColor = function ($index, $event, prod) {
		vm.selectedProductIndex = $index;
		$($event.target).parents('.detail-container').find('h3').text(prod.Name);
        $($event.target).parents('.product-box').find('.Price').text('$'+prod.StandardPriceSchedule.PriceBreaks[0].Price);
		PdpService.GetProductCodeImages(prod.ID).then(function(res){
		vm.productVarientImages = res;
		// pdp image min height -start
		  var pdpDetailBoxHt = $('.detail-overlay-box ').height();
		  //alert(pdpDetailBoxHt);
		  $('.pdp-banner-top').css('min-height',pdpDetailBoxHt);

		  // pdp image min height -end
		var owl2 = angular.element("#owl-carousel-pdp-banner");   
		owl2.trigger('destroy.owl.carousel');
		setTimeout(function(){
      	owl2.owlCarousel({
	            loop:true,
	            nav:false,
	            dots:true,
	            responsive:{
	            0:{ items:1 },
	            320:{
	                items:1,
	            },
	            730 :{ 
	                items:1,
	            },
	            1024:{ 
	                items:1
	            }
            }
          }); 
      	},300);
		});
	    $('#owl-carousel-pdp-banner .owl-item img').css({'width':'60%','padding-right': '30px'});
	}

	vm.multireceipent = function(prodID){
		$scope.items = "";
		var modalInstance = $uibModal.open({
			animation: true,
			backdropClass: 'multiRecipentModal',
			templateUrl: 'pdp/templates/multireceipent.tpl.html',
			controller:'MultipleReceipentCtrl',
			controllerAs: 'multiplereceipentview',
			param: {
				productID: prodID
			},
			resolve:{
				items: function () {
					var order={};
					CurrentOrder.GetID().then(function(orderId){
						var lineItem = {			 
						  ProductID: prodID,
						  Quantity: 1
						};
						console.log(orderId);
						OrderCloud.Orders.Get(orderId).then(function(res){
				    		order = res;
				    		OrderCloud.LineItems.Create(order.ID,lineItem).then(function(res){
							console.log(res);
							//$rootScope.$broadcast('LineItemAddedToCart', orderId, res);
							return $rootScope.$broadcast('LineItemAddedToCart', order, res);
						})
				    	})

						
					},function(){
						OrderCloud.Orders.Create({}).then(function(order){
							CurrentOrder.Set(order.ID);
							var lineItem = {			 
							  ProductID: prodID,
							  Quantity: 1
							};
							OrderCloud.LineItems.Create(order, lineItem).then(function(lineitem){
								console.log(lineitem);
								//$rootScope.$broadcast('LineItemAddedToCart', order.ID, lineitem);
								return $rootScope.$broadcast('LineItemAddedToCart', order, lineitem);
							})
						})
					})
		        }
			}
		});

		modalInstance.result.then(function(selectedItem) {
			$scope.selected = selectedItem;
		}, function() {
			angular.noop();
		});
	}


	// Add to wishList
	vm.addToWishList = function(productID){
		return PdpService.AddToWishList(productID).then(function(item){
			return item;
		});
	}

	// added to cart -pdp modal
	vm.pdpAddedToCartPopUp = function() {
         var modalInstance = $uibModal.open({
             animation: false,
             backdropClass: 'pdpAddedToCartModal',
             windowClass: 'pdpAddedToCartModal',
             templateUrl: 'pdp/templates/pdp-added-to-cart.tpl.html',
             controller:'pdpAddedToCartCtrl',
             controllerAs: 'pdpAddedToCart'
         });

         modalInstance.result.then(function() {

         }, function() {
             angular.noop();
         });


    
    }

	// carousel

	 setTimeout(function(){
	angular.element("#owl-carousel-pdp-banner").owlCarousel({
		//responsive: true,
		items:1,
		dots:true,
		loop:true,
		autoplay:true,
		autoplayHoverPause:true,
		animateOut: 'fadeOut'

	});
	//$('#owl-carousel-pdp-banner .owl-item img').css({'width':'60%','padding-right': '30px'});
	},500);


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
			1200:{
				items:2,
				dots:true,
				stagePadding:130
			},
			1500:{
				items:3,
				dots:true,
				stagePadding:0
			}
		},
		onInitialized : function(event){
		  var tmp_owl = this;
		  pdtCarousal.find('.owl-item').on('click', function(){
			tmp_owl.to( $(this).index() - (pdtCarousal.find(".owl-item.cloned").length / 2 ));
			var carousal_id = $(this).attr('data-role');
			//switchExpertise(carousal_id);
		   });
		   console.log($(this).index());
		   var pdtOwlItemWidth = $('.pdt-carousel .owl-item.center.active').width();    
			
			//$('.pdt-carousel .pdtCarousalArrowPrev').css({'left':-pdtOwlItemWidth/2 - 14});
			//$('.pdt-carousel .pdtCarousalArrowNext').css({'right':-pdtOwlItemWidth/2 - 14});
			
			//$('.pdt-carousel .pdtCarousalArrowPrev').css({'background-position':pdtOwlItemWidth/2 + 14 });
			//$('.pdt-carousel .pdtCarousalArrowNext').css({'background-position':pdtOwlItemWidth/2 + 14 });

			$('.pdt-carousel .pdtCarousalArrowPrev').css({'margin-right': pdtOwlItemWidth/2 + 14});
			$('.pdt-carousel .pdtCarousalArrowNext').css({'margin-left': pdtOwlItemWidth/2 + 14 });
		 	if((navigator.userAgent.indexOf("MSIE") != -1 ) || (!!document.documentMode == true )) //IF IE > 10
		    {
		      	$('.pdt-carousel .pdtCarousalArrowPrev').css({'margin-right': pdtOwlItemWidth/2 + 7});
				$('.pdt-carousel .pdtCarousalArrowNext').css({'margin-left': pdtOwlItemWidth/2 + 7 });
		    } 
		},
		onChanged : function(){
		  setTimeout(function(){
			var carousal_id = pdtCarousal.find('.owl-item.center .expertise_fields').attr('data-role');

			//switchExpertise(carousal_id);

			//switchExp(carousal_id);

			console.log(carousal_id);
		  },300);
		}
    });
},1000);

// color-circle-outer

$('a.btn-circle-micro').on('click',
    function(){
    	//alert('sss');
        $(this).parent().siblings('li').removeClass('clr-circle-outer').end().addClass('clr-circle-outer');
});
var ticket = localStorage.getItem("alf_ticket");
 PdpService.GetHelpAndPromo(ticket).then(function(res){
    vm.leftPromo = alfcontenturl+res.items[3].contentUrl+"?alf_ticket="+ticket;  
  });
}

function MultipleReceipentController($uibModal,BaseService, $scope, $stateParams, $uibModalInstance, items, $rootScope, OrderCloud, CurrentOrder, LineItemHelpers, PdpService) {
    var vm = this;
    console.log(PdpService);
    $scope.oneAtATime = true;
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    $scope.defaultaddroption = {
		type:'Residence'
	};
	
	

    $scope.$on('LineItemAddedToCart', function(events,args,line){
    	console.log("12345678",events,args,line);
    	/*Orders.Get(args).then(function(res){
    		vm.order = res;
    	})*/

    	OrderCloud.LineItems.List(args.ID, null, 100).then(function(data){
    		vm.lineitem = data.Items;
    		console.log("qwerty", vm.lineitem);
    	})
    	$uibModalInstance.opened.then(function(){
			vm.getLineItems();
		})
    	$scope.lineDtlsSubmit = function(line){
    		alert("lineDtlsSubmit");
    		var recipient = {
				"FirstName":line.ShippingAddress.FirstName, "LastName":line.ShippingAddress.LastName, "Street1":line.ShippingAddress.Street1, "Street2":line.ShippingAddress.Street2,"City":line.ShippingAddress.City, "State":line.ShippingAddress.State, "Zip":line.ShippingAddress.Zip, "Phone":"("+line.ShippingAddress.Phone1+")"+line.ShippingAddress.Phone2+"-"+line.ShippingAddress.Phone3, "Country": "US"
			};
			var lineitem = {
				"Quantity":line.Quantity, "xp":{
					"deliveryDate":line.xp.deliveryDate, "deliveryNote":line.xp.deliveryNote, "PatientFName":line.xp.PatientFName, "PatientLName":line.xp.PatientLName, "pickupDate":line.xp.pickupDate, "deliveryCharges":line.xp.deliveryCharges, "TotalCost":parseFloat(line.xp.deliveryCharges)+(parseFloat(line.UnitPrice)*parseFloat(line.Quantity)), "addressType":this.addressType
				}
			};
			if(this.addressType=="Residence" || !this.addressType || this.addressType=="Shipping"){
				delete lineitem.xp.PatientFName;
				delete lineitem.xp.PatientLName;
				delete lineitem.xp.pickupDate;
			}else if(this.addressType=="Hospital" || this.addressType=="School" || this.addressType=="FuneralorChurch"){
				delete lineitem.xp.pickupDate;
				recipient.Street1 = recipient.Street1;
				lineitem.xp.SearchedName = line.hosSearch;
				if(this.addressType=="FuneralorChurch")
					lineitem.xp.SearchedName = line.churchSearch;
				if(this.addressType=="School")
					lineitem.xp.SearchedName = line.schSearch;
			}else if(this.addressType=="Will Call"){
				delete lineitem.xp.PatientFName;
				delete lineitem.xp.PatientLName;
				delete lineitem.xp.deliveryDate;
				lineitem.xp.storeName = line.willSearch;
				recipient.Street1 = line.ShippingAddress.Street1;
			}
			OrderCloud.LineItems.SetShippingAddress(args.ID, line.ID, recipient).then(function(data){
				console.log(JSON.stringify(data));
				LineItems.Patch(args.ID, line.ID, lineitem).then(function(res){
					vm.getLineItems();
				});
			});
    	}
    	vm.getLineItems = function(){
			var totalCost = 0;
			if(args.Status == "Unsubmitted"){
				OrderCloud.LineItems.List(args.ID).then(function(res){
					LineItemHelpers.GetProductInfo(res.Items).then(function(data) {
						console.log(data);
						/*data = _.groupBy(data, function(obj){
							return obj.ProductID;
						});*/
						$scope.lineItemProducts = [];
						$scope.activeOrders = data;
						$scope.prodQty = {};
						//for(var n in data){
							//$scope.lineItemProducts.push(n);
							//console.log($scope.activeOrders);
							$scope.prodQty = _.reduce(_.pluck(data, 'Quantity'), function(memo, num){ return memo + num; }, 0);
							angular.forEach($scope.activeOrders,function(val, key){
								/*val.varientsOptions = {};
								val.varientsOptions.Size = (val.Specs[0].OptionID.split('_'))[0];
								val.varientsOptions.Color = (val.Specs[0].OptionID.split('_'))[1];*/
								if(val.ShippingAddress!=null){
									var phn = val.ShippingAddress.Phone;
									var init = phn.indexOf('(');
									var fin = phn.indexOf(')');
									val.ShippingAddress.Phone1 = parseInt(phn.substr(init+1,fin-init-1));
									init = phn.indexOf(')');
									fin = phn.indexOf('-');
									val.ShippingAddress.Phone2 = parseInt(phn.substr(init+1,fin-init-1));
									init = phn.indexOf('-');
									val.ShippingAddress.Phone3 = parseInt(phn.substr(init+1,phn.length));
									val.LineTotal = val.xp.TotalCost;
									totalCost += val.xp.TotalCost;
									val.ShippingAddress.Zip = parseInt(val.ShippingAddress.Zip);
								}else if(val.xp==null){
									val.xp = {};
									val.xp.deliveryCharges = 0;
									totalCost += val.LineTotal;
								}
								if(val.xp.deliveryDate)
									val.xp.deliveryDate = new Date(val.xp.deliveryDate);
								if(!val.xp.addressType)
									val.xp.addressType = "Residence";
								if(val.xp.addressType=="Will Call"){
									val.xp.pickupDate = new Date(val.xp.pickupDate);
									val.willSearch = val.xp.storeName;
								}	
							});
						//}
						//angular.element(document.getElementById("order-checkout")).scope().orderTotal = totalCost;
						$scope.orderTotal = totalCost;
					});
				});
			}else{
				var orderParams = {"Type": "Standard","FromUserID": $stateParams.ID,"xp":{"OrderSource":"OMS"}};
				OrderCloud.Orders.Create(orderParams).then(function(data){
					CurrentOrder.Set(data.ID);
					vm.order = data;
					vm.getLineItems();
					//$scope.getOrderDtls();
				});
			}
		};
    	vm.GetSearchedVal = function(lineitem){
    		console.log('qwerty',lineitem);
			if(lineitem.xp.addressType=="School")
				lineitem.schSearch = lineitem.xp.SearchedName;
			if(lineitem.xp.addressType=="FuneralorChurch")
				lineitem.churchSearch = lineitem.xp.SearchedName;	
			if(lineitem.xp.addressType=="Hospital")
				lineitem.hosSearch = lineitem.xp.SearchedName;		
		}
		$scope.checkZipCode = function(zipValue){
			var zipCodeData = BaseService.QuestionableZipCodeService();
			if(zipCodeData[zipValue] !== undefined)
				$scope.zipCities = zipCodeData[zipValue];
			else
				alert('No delivery available / Invalid zip code');
		}
		$scope.showConfirmation = function(data){
			if(data.isDevliverable){
			alert('delivery available');
		}else{
			alert('delivery not avialble');
		}

		}

		// $scope.getDeliveryCharges = function(line){
		// 	var del = _.findWhere(deliveryCharges, {zip: (line.ShippingAddress.Zip).toString()});
		// 	if((line.ShippingAddress.Zip).toString().length>=5 && del!=undefined){
		// 		line.xp.deliveryCharges = del.DeliveryCharge;
		// 		line.xp.TotalCost = parseFloat(line.xp.deliveryCharges)+(parseFloat(line.Quantity)*parseFloat(line.UnitPrice));
		// 	}else if(line.xp==null){
		// 		line.xp = {};
		// 		line.xp.deliveryCharges = 0;
		// 		line.xp.TotalCost = parseFloat(line.xp.deliveryCharges)+(parseFloat(line.Quantity)*parseFloat(line.UnitPrice));
		// 	}
		// 	$http.get('http://maps.googleapis.com/maps/api/geocode/json?address='+line.ShippingAddress.Zip).then(function(res){
		// 		angular.forEach(res.data.results[0].address_components, function(component,index){
		// 			var types = component.types;
		// 			angular.forEach(types, function(type,index){
		// 				if(type == 'locality') {
		// 					line.ShippingAddress.City = component.long_name;
		// 				}
		// 				if(type == 'administrative_area_level_1') {
		// 					line.ShippingAddress.State = component.long_name;
		// 				}
		// 			});
		// 		});
		// 	});
		// };
		$scope.storesDtls = function(item){
			var store = this.$parent.$parent.$parent.lineitems;
			var filt = _.filter(storesData, function(row){
				return _.indexOf([item],row.storeName) > -1;
			});
			if(store.ShippingAddress == null)
				store.ShippingAddress = {};
			//store.ShippingAddress.FirstName = filt[0].storeName;
			//store.ShippingAddress.LastName = filt[0].storeName;
			store.ShippingAddress.Street1 = filt[0].storeAddress;
			//store.ShippingAddress.Street2 = filt[0].Street2;
			store.ShippingAddress.City = filt[0].city;
			store.ShippingAddress.State = filt[0].state;
			store.ShippingAddress.Zip = parseInt(filt[0].zipCode);
			var phn = filt[0].phoneNumber;
			var init = phn.indexOf('(');
			var fin = phn.indexOf(')');
			store.ShippingAddress.Phone1 = parseInt(phn.substr(init+1,fin-init-1));
			init = phn.indexOf(')');
			fin = phn.indexOf('-');
			store.ShippingAddress.Phone2 = parseInt(phn.substr(init+1,fin-init-1));
			init = phn.indexOf('-');
			store.ShippingAddress.Phone3 = parseInt(phn.substr(init+1,phn.length));
			//$scope.getDeliveryCharges(store);
		};
		$scope.hospitalDtls = function(item){
			alert('hospitalDtls');
			var hos = this.$parent.$parent.$parent.lineitems;
			var filt = _.filter(hospitals, function(row){
				return _.indexOf([item],row.FirstName) > -1;
			});
			if(hos.ShippingAddress==null)
				hos.ShippingAddress={};
			//hos.ShippingAddress.FirstName = filt[0].FirstName;
			//hos.ShippingAddress.LastName = filt[0].LastName;
			hos.ShippingAddress.Street1 = filt[0].Street1;
			hos.ShippingAddress.Street2 = filt[0].Street2;
			hos.ShippingAddress.City = filt[0].City;
			hos.ShippingAddress.State = filt[0].State;
			hos.ShippingAddress.Zip = parseInt(filt[0].Zip);
			var phn = filt[0].Phone;
			var init = phn.indexOf('(');
			var fin = phn.indexOf(')');
			hos.ShippingAddress.Phone1 = parseInt(phn.substr(init+1,fin-init-1));
			init = phn.indexOf(')');
			fin = phn.indexOf('-');
			hos.ShippingAddress.Phone2 = parseInt(phn.substr(init+1,fin-init-1));
			init = phn.indexOf('-');
			hos.ShippingAddress.Phone3 = parseInt(phn.substr(init+1,phn.length));
		};
		$scope.nextTab = function(line, index){
			var $this = this;
			var addrValidate = {
				"addressLine1": line.ShippingAddress.Street1, 
				"addressLine2": line.ShippingAddress.Street2,
				"zipcode": line.ShippingAddress.Zip, 
				"country": "US"
			};
			if($this.$parent.$parent!=null){
				//this.$parent.$parent.receipt[index] = false;
				$this.$parent.$parent.nextrecipient[index+1] = true;
			}else{
				$uibModalInstance.close();
				vm.addedToCartPopUp();
			/*PdpService.addressValidation(addrValidate).then(function(res){
				if(res.data.ResultCode == "Success"){
					if($this.$parent.$parent.$$nextSibling!=null){
						$this.$parent.$parent.$$nextSibling.delInfoRecipient[index+1] = true;
					}else{
						$scope.status.delInfoOpen = false;
						$scope.status.paymentOpen = true;
						$scope.status.isFirstDisabled=true;
					}
					$scope.lineDtlsSubmit(line);
				}else{
					alert("Address not found...");
				}
			});*/
			}
			
    	}
    	vm.addedToCartPopUp = function(){
    		var modalInstance = $uibModal.open({
	            animation: false,
	            backdropClass: 'addedToCartModal',
	            templateUrl: 'pdp/templates/added-to-cart.tpl.html',
	            controller:'addedToCartCtrl',
	            controllerAs: 'addedToCart'
	        });

	        modalInstance.result.then(function() {

	        }, function() {
	            angular.noop();
	        });
    	}
    });
    //$scope.isopen = 0;
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
