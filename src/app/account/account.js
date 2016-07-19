angular.module( 'orderCloud' )

	.config( AccountConfig )
	.factory( 'AccountService', AccountService )
	.controller( 'AccountCtrl', AccountController )
	.controller( 'profilectrl', ProfileController )
	.controller( 'ConfirmPasswordCtrl', ConfirmPasswordController )
	.controller( 'ChangePasswordCtrl', ChangePasswordController )
	.controller( 'CreditCardCtrl', CreditCardController)
	.controller( 'TrackOrderCtrl', TrackOrderController )
	.controller( 'EmailSubscriptionCtrl', EmailSubscriptionController )
	.controller('deleteCtrl', DemoController)
	.controller('deleteWishlistCtrl', DelWishlistController)



;

function AccountConfig( $stateProvider ) {
	$stateProvider
		.state( 'account', {
			parent: 'base',
			url: '/account',
			resolve:{
				CurrentUser: function($q, $state, OrderCloud) {
					var dfd = $q.defer();
					OrderCloud.Me.Get()
						.then(function(data) {
							dfd.resolve(data);
						})
						.catch(function(){
							OrderCloud.Auth.RemoveToken();
							OrderCloud.Auth.RemoveImpersonationToken();
							// OrderCloud.BuyerID.Set(null);
							$state.go('home');
							dfd.resolve();
						});
					return dfd.promise;
				},
				OrderList:function($q, $state, OrderCloud,AccountService){
							var orders=[];
							var vm=this;
							var d= $q.defer();
							OrderCloud.Me.ListOutgoingOrders().then(function(oooores){
								angular.forEach(oooores.Items,function(od){
									var promise=AccountService.GetOrderDetails(od.ID);
									orders.push(promise);
								});
								$q.all(orders).then(function(foooo){
									vm.showOrders=foooo;
									console.log("orders with line items====",vm.showOrders);
									d.resolve(foooo);
								});
							})
							return d.promise;
				},
				AddressList: function(AccountService, CurrentUser){
					return AccountService.ListAddress(CurrentUser.ID);
				},
				/*EventList:function($q, $state, OrderCloud,AccountService){
					var d= $q.defer();
					var vm=this;
					var ajaxarr=[];
					var arr=[];
					var filter ={
						"xp.IsEvent":true
					};
					OrderCloud.Me.ListOutgoingOrders(null, 1, 100, null, null, filter, null, null).then(function(re){
						angular.forEach(re.Items, function(order){
							var promise =  AccountService.GetOrderDetails(order.ID);
							ajaxarr.push(promise);
						});
						$q.all(ajaxarr).then(function(items){
							vm.eventsDetails=items;
							console.log("events are=====",vm.eventsDetails);
						});
					})
					return d.promise;
				},*/
				WishList: function($q, $state, OrderCloud, CurrentUser) {
					var wishlistArr = CurrentUser.xp.WishList;
					var d= $q.defer();
					var wishArr = [];
					if(wishlistArr != undefined){
						for(var i=0;i<wishlistArr.length;i++){
							var promise =OrderCloud.Me.GetProduct(wishlistArr[i]);
							wishArr.push(promise);
						}
						$q.all(wishArr).then(function(items){
							console.log("wish list ====",items);
							d.resolve(items);
						});
					}
					return d.promise;
				},
				SelectedEmailList: function(LoginFact) {
					return LoginFact.GetContactList();
				}
			},
			templateUrl:'account/templates/accountLanding.tpl.html',
			controller:'AccountCtrl',
			controllerAs: 'account'
		})
		.state( 'account.wishlistAccount',{
			url: '/wishlistAccount',
			templateUrl: 'account/templates/myWishlistAccount.tpl.html',
			controller: 'AccountCtrl',
			controllerAs: 'account',
			resolve:{

			}
		})
		.state( 'account.getdirection',{
			url: '/getdirection',
			templateUrl: 'account/templates/getdirection.tpl.html',
			controller: 'AccountCtrl',
			controllerAs: 'account'
		})
		.state( 'account.changePassword', {
			url: '/account/changepassword',
			//templateUrl: 'account/templates/changePassword.tpl.html',
			controller: 'ChangePasswordCtrl',
			controllerAs: 'changePassword'
		})
		.state( 'account.perpleperksAccount', {
			url: '/perpleperksAccount',
			templateUrl: 'account/templates/perpleperksAccount.tpl.html',
			controller: 'AccountCtrl',
			controllerAs: 'account'
		})
		.state( 'account.creditCardAccount', {
			url: '/creditCardAccount',
			templateUrl: 'account/templates/creditCardAccount.tpl.html',
			controller: 'CreditCardAccountCtrl',
			controllerAs: 'CreditCardAccount'
		})
		.state( 'account.addresses', {
			url: '/addresses',
			templateUrl: 'account/templates/addressBookAccount.tpl.html',
			controller: 'AccountCtrl',
			controllerAs: 'account'
		})
		.state( 'account.orders', {
			url: '/orders',
			templateUrl: 'account/templates/orders.tpl.html',
			controller: 'profilectrl',
			controllerAs: 'profile'
		})
		.state( 'account.event', {
			url:'event',
			templateUrl: 'account/templates/myAccountEvents.tpl.html',
			controller: 'profilectrl',
			controllerAs: 'profile'
		})
		.state( 'account.profile', {
			url:'/profile',
			templateUrl: 'account/templates/account.tpl.html',
			controller: 'profilectrl',
			controllerAs: 'profile'
		})
		.state( 'account.CreditCard', {
			url: '/creditCard',
			templateUrl:'account/templates/accountCreditCard.tpl.html',
			controller:'CreditCardCtrl',
			controllerAs: 'creditCards',
            resolve: {
                CreditCards: function(OrderCloud) {
                   return OrderCloud.Me.ListCreditCards(null, 1, 100)
                }
            }
		})
		.state( 'account.trackorders', {
			url: '/trackorders',
			templateUrl: 'account/templates/trackorder.tpl.html',
			controller: 'profilectrl',
			controllerAs: 'profile',
			
		})
		.state( 'account.emailsubscription', {
			url: '/emailsubscription',
			templateUrl: 'account/templates/emailsubscription.tpl.html',
			controller: 'EmailSubscriptionCtrl',
			controllerAs: 'EmailSubscription'

				/*SelectedEmailList: function(LoginFact) {
					return LoginFact.GetContactList();
				},*/
				/*UpdateEmailLIst:function(LoginFact,CurrentUser){
					var u_data={
						"id":CurrentUser.ID,
						"lists": [{
							"id": "1923130021",
							"status": "ACTIVE"
						}],
						"email_addresses": [{"email_address":CurrentUser.Email}]
					}
					return LoginFact.UpdateEmailPreference(u_data);
				}*/
		})
	/*.state( 'corsageBuilder', {
	 parent: 'base',
	 url: '/corsageBuilder',
	 templateUrl:'account/templates/corsageBuilder.tpl.html',
	 controller:'corsageBuilderCtrl',
	 controllerAs: 'corsageBuilder'
	 })*/
}
function AccountService( $q, $uibModal,OrderCloud,Underscore,$http) {
	var service = {
		Update: _update,
		ChangePassword: _changePassword,
		GetOrderDetails: _getOrderDetails,
		GetLineItemDetails: _getLineItemDetails,
		GetPhoneNumber:_getphonenumber,
		ListAddress: _listAddresses,
		getCityState: _getCityState
	};
	//*** START ZIP,CITY,STATE VALIDATION**//
	function _getCityState(zip){
		var d = $q.defer();
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
			d.resolve({"City":city, "State":state});
		});
		return d.promise;
	}
	//*** END ZIP,CITY,STATE VALIDATION**//


	//******LIST ADDRESS STARTS*****
	function _listAddresses(userId, size) {
		return OrderCloud.Addresses.ListAssignments(null, userId, null, null, null, null, 1, size, null).then(function(res){
			var arr = [];
			for(var i=0;i<res.Items.length;i++){
				var promise = OrderCloud.Addresses.Get(res.Items[i].AddressID).then(function(res){
					return res;
				})
				arr.push(promise);
			}
			return $q.all(arr);
		})
	};
	//******LIST ADDRESS END*****

	//*******GETTING PHONE NUMBER******//
	function _getphonenumber(phn){
		var d = $q.defer();
		var arr = [];
		var init = phn.indexOf('(');
		var fin = phn.indexOf(')');
		arr.push(parseInt(phn.substr(init+1,fin-init-1)));
		init = phn.indexOf(')');
		fin = phn.indexOf('-');
		arr.push(parseInt(phn.substr(init+1,fin-init-1)));
		init = phn.indexOf('-');
		arr.push(parseInt(phn.substr(init+1,phn.length)));
		d.resolve(arr);
		return d.promise;
	}
	//*******GETTING PHONE NUMBER******//
	//start of getorderdetails
	function _getOrderDetails(orderID) {
		var deferred = $q.defer();
		var order;
		var lineItemQueue = [];
		var productQueue = [];

		OrderCloud.Me.GetOrder(orderID)
			.then(function(data) {
				order = data;
				order.LineItems = [];
				gatherLineItems();
			});

		function gatherLineItems() {
			OrderCloud.LineItems.List(orderID, null, 1, 100, null, null, null)
				.then(function(data) {
					order.LineItems = order.LineItems.concat(data.Items);
					for (var i = 2; i <= data.Meta.TotalPages; i++) {
						lineItemQueue.push(OrderCloud.LineItems.List(orderID, null, i, 100, null, null, null));
					}
					$q.all(lineItemQueue).then(function(results) {
						angular.forEach(results, function(result) {
							order.LineItems = order.LineItems.concat(result.Items);
						});
						gatherProducts();
					});
				});
		}
		function gatherProducts() {
			var productIDs =Underscore.uniq(Underscore.pluck(order.LineItems, 'ProductID'));

			angular.forEach(productIDs, function(productID) {
				productQueue.push((function() {
					var d = $q.defer();

					OrderCloud.Products.Get(productID)
						.then(function(product) {
							angular.forEach(Underscore.where(order.LineItems, {ProductID: product.ID}), function(item) {
								item.Product = product;
							});

							d.resolve();
						});

					return d.promise;
				})());
			});
			$q.all(productQueue).then(function() {
				if (order.SpendingAccountID) {
					OrderCloud.SpendingAccounts.Get(order.SpendingAccountID)
						.then(function(sa) {
							order.SpendingAccount = sa;
							deferred.resolve(order);
						});
				}
				else {
					deferred.resolve(order);
				}
			});
		}

		return deferred.promise;
	}
	//end of getorderdetails
	//start of getlineitemdetails
	function _getLineItemDetails(orderID, lineItemID) {
		var deferred = $q.defer();
		var lineItem;

		OrderCloud.LineItems.Get(orderID, lineItemID)
			.then(function(li) {
				lineItem = li;
				getProduct();
			});

		function getProduct() {
			OrderCloud.Products.Get(lineItem.ProductID)
				.then(function(product){
					lineItem.Product = product;
					deferred.resolve(lineItem);
				});
		}

		return deferred.promise;
	}

	//end of getlineitemdetails

	function _update(currentProfile, newProfile) {
		var deferred = $q.defer();

		function ProfileEdit() {
			OrderCloud.Users.Update(currentProfile.ID, newProfile)
				.then(function(data) {
					deferred.resolve(data);
				})
				.catch(function(ex) {
					deferred.reject(ex);
				})
		}

		var modalInstance = $uibModal.open({
			animation: true,
			templateUrl: 'account/templates/confirmPassword.modal.tpl.html',
			controller: 'ConfirmPasswordCtrl',
			controllerAs: 'confirmPassword',
			size: 'sm'
		});

		modalInstance.result.then(function(password) {
			var checkPasswordCredentials = {
				Username: currentProfile.Username,
				Password: password
			};
			OrderCloud.Credentials.Get(checkPasswordCredentials).then(
				function() {
					alert("Are you want to change data????");
					ProfileEdit();
				}).catch(function(ex) {
				deferred.reject(ex);
			});
		}, function() {
			angular.noop();
		});

		return deferred.promise;
	}

	function _changePassword(currentUser,newcurrUser) {
		var deferred = $q.defer();

		var checkPasswordCredentials = {
			Username: currentUser.Username,
			Password: newcurrUser.CurrentPassword
		};

		function changePasswordfun() {
			currentUser.Password = newcurrUser.NewPassword;
			OrderCloud.Users.Update(currentUser.ID, currentUser)
				.then(function() {
					deferred.resolve();
				})
				.catch(function(ex) {
					//vm.profile = currentProfile;
					$exceptionHandler(ex)
				})
		};

		OrderCloud.Auth.GetToken(checkPasswordCredentials).then(
			function() {
				alert("Are you sure to change password????");
				changePasswordfun();
			}).catch(function( ex ) {
			deferred.reject(ex);
		});

		return deferred.promise;
	}

	return service;
}

function AccountController( $uibModal, WishList, AddressList,$exceptionHandler, $location, $state, $scope, OrderCloud, toastr, CurrentUser, AccountService, $anchorScroll, $q ) {
	var vm = this;
	vm.profile = angular.copy(CurrentUser);
	var currentProfile = CurrentUser;
	vm.update = function() {
		console.log("vm.profile== after",vm.profile);
		AccountService.Update(currentProfile, vm.profile)
			.then(function(data) {
				console.log("data ==",data);
				vm.profile = angular.copy(data);
				currentProfile = data;
				toastr.success('Account changes were saved.', 'Success!');
			})
			.catch(function(ex) {
				vm.profile = currentProfile;
				$exceptionHandler(ex)
			})
	};
	vm.resetForm = function(form) {
		vm.profile = currentProfile;
		form.$setPristine(true);
	};
	var accountMenu=[
		{'value':'profile', 'label':'My Profile'},
		{'value':'addresses', 'label':'Address Book'},
		{'value':'orders', 'label':'Order History'},
		{'value':'trackorders', 'label':'Track Orders'},
		{'value':'event', 'label':'My Events'},
		{'value':'CreditCard', 'label':'Credit Cards'},
		{'value':'perpleperksAccount', 'label':'Perple Perks'},
		{'value':'wishlistAccount', 'label':'My Wishlist'},
		{'value':'emailsubscription', 'label':'Email Preferences'}
	];
	vm.accountMenu = accountMenu;
	vm.selectedMenu ="My Profile";
	vm.selectedMenuIndex = 0;

	vm.changeMenuSelection = function changeMenuSelection(selectedMenu, menuIndex){
		vm.selectedMenu = selectedMenu;
		vm.selectedMenuIndex = menuIndex;
	};
	vm.addressData=AddressList;
	//Wishlist listing starts here
	vm.wishList = WishList;
	console.log("WishList===",WishList);
	//---purpleperks functionality starts here---//
	
	OrderCloud.SpendingAccounts.ListAssignments(null, CurrentUser.ID,null,null,1,null,null).then(function(purple){
		console.log("perple account is---:",purple);
		for(var i=0;i<purple.Items.length;i++){
			var ppp=OrderCloud.SpendingAccounts.Get(purple.Items[0].SpendingAccountID).then(function(pres){
			vm.purpleperk=pres;
			});
		}
	})
	//---purpleperks functionality ends here---//
	vm.getLocation=function(zip){
		AccountService.getCityState(zip).then(function(res){
			console.log("response are city and state==",res);
			$scope.addr.City = res.City;
			$scope.addr.State = res.State;
		});
	}
	vm.getLoactionEdit=function(zip){
		AccountService.getCityState(zip).then(function(res){
			vm.editAddr.City = res.City;
			vm.editAddr.State = res.State;
		});
	}
		vm.CreateAddress = function(line){
		var $this = this;
		var params = {"FirstName":line.FirstName,"LastName":line.LastName,"Street1":line.Street1,"Street2":line.Street2,"City":line.City,"State":line.State,"Zip":line.Zip,"Phone":"("+line.Phone1+")"+line.Phone2+"-"+line.Phone3,"Country":"IN", "xp":{NickName:line.NickName}};
		OrderCloud.Addresses.Create(params).then(function(data){
			data.Zip = parseInt(data.Zip);
			params = {"AddressID": data.ID,"UserID": CurrentUser.ID,"IsBilling": false,"IsShipping": true};
			OrderCloud.Addresses.SaveAssignment(params).then(function(res){
				$state.go('account.addresses', {}, {reload:true});
			});
		})
	}
	vm.editAdress=function(editAddr,index){
		vm['showedit' + index] =true;
		vm.editAddr=editAddr;
		vm.editAddr.Zip = parseInt(vm.editAddr.Zip);
		vm.stateData=vm.editAddr.State;
		$scope.showedit=false;
		vm.contact={};
		var phn = vm.editAddr.Phone;
		AccountService.GetPhoneNumber(vm.editAddr.Phone).then(function(res){
			console.log(" edit response are",res);
			vm.contact.Phone1 = res[0];
			vm.contact.Phone2 = res[1];
			vm.contact.Phone3 = res[2];
		});
	}
	vm.closeShowedit=function(index){
		vm['showedit'+index]=false;
	}
	vm.saveAddress = function(saveAddr,contact){
		saveAddr.Phone = "("+contact.Phone1+")"+contact.Phone2+"-"+contact.Phone3;
		console.log("saveAddr.Phone", saveAddr.Phone);
		OrderCloud.Addresses.Update(saveAddr.ID, saveAddr).then(function(){
			$state.go('account.addresses', {}, {reload: true});
		})
	}


	// delete pop up
	vm.deletePopup = function(Addrid) {
		var modalInstance = $uibModal.open({
			animation: false,
			windowClass: 'deletePopup',
			template: '<div class="">'+
			'<div class="">'+
			'<div class="">'+
			'<a>'+
			/*'<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"'+
			 ' viewBox="-26.2 -77.7 33.4 33.4" style="enable-background:new -26.2 -77.7 33.4 33.4;" xml:space="preserve">'+
			 '<style type="text/css">'+
			 '.st0{fill:#FFFFFF;}'+
			 '</style>'+
			 '<g>'+
			 '<g>'+
			 '<rect x="-32.3" y="-61.8" transform="matrix(-0.7071 -0.7071 0.7071 -0.7071 26.916 -110.851)" class="stw" width="45.6" height="1.6"/>'+
			 '</g>'+
			 '<g>'+
			 '<rect x="-32.3" y="-61.8" transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 -59.351 -97.416)" class="stw" width="45.6" height="1.6"/>'+
			 '</g>'+
			 '</g>'+
			 '</svg>'+*/
			'</a>'+
			'</div>'+
			'<p>Are you sure you want to delete?</p>'+
			'<button class="save-btn" ng-click="Del()">Ok</button>'+
			'<button class="cancel-btn" ng-click="canceldel()">Cancel</button>'+
			'</div>'+
			'</div>',
			controller: 'deleteCtrl',
			controllerAs: 'deletectrl',
			resolve: {
				SelectedAddr: function () {
					return Addrid;
				}
			}
		});
		modalInstance.result.then(function() {

		}, function() {
			angular.noop();
		});
	}
	vm.deleteWishList = function(prodid){
		var modalInstance = $uibModal.open({
			animation: false,
			windowClass: 'deletePopup',
			template: '<div class="">'+
			'<div class="">'+
			'<div class="">'+
			'<a>'+
			/*'<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"'+
			 ' viewBox="-26.2 -77.7 33.4 33.4" style="enable-background:new -26.2 -77.7 33.4 33.4;" xml:space="preserve">'+
			 '<style type="text/css">'+
			 '.st0{fill:#FFFFFF;}'+
			 '</style>'+
			 '<g>'+
			 '<g>'+
			 '<rect x="-32.3" y="-61.8" transform="matrix(-0.7071 -0.7071 0.7071 -0.7071 26.916 -110.851)" class="stw" width="45.6" height="1.6"/>'+
			 '</g>'+
			 '<g>'+
			 '<rect x="-32.3" y="-61.8" transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 -59.351 -97.416)" class="stw" width="45.6" height="1.6"/>'+
			 '</g>'+
			 '</g>'+
			 '</svg>'+*/
			'</a>'+
			'</div>'+
			'<p>Are you sure you want to delete?</p>'+
			'<button class="save-btn" ng-click="DeleteWishListProduct()">Ok</button>'+
			'<button class="cancel-btn" ng-click="canceldel()">Cancel</button>'+
			'</div>'+
			'</div>',
			controller: 'deleteWishlistCtrl',
			controllerAs: 'deletewishctrl',
			resolve: {
				SelectedWishList: function () {
					return prodid;
				},
				CurrentUser: function () {
					return CurrentUser;
				}
			}
		});
		modalInstance.result.then(function() {

		}, function() {
			angular.noop();
		});

	}
	vm.stateSelected = function(stateSelected){
		vm.stateData=stateSelected;
	};
	vm.makeDefault=function(address){
		_.filter(vm.addressData,function(row){
			if(row.xp.IsDefault){
				var dataFalse={
					IsDefault :false
				};
				var default_value={
					"Shipping": row.Shipping,
					"Billing": row.Billing,
					"FirstName":row.FirstName,
					"LastName":row.LastName,
					"Street1":row.Street1,
					"Street2":row.Street2,
					"City":row.City,
					"State":row.State,
					"Zip":row.Zip,
					"Phone":row.Phone,
					"Country":row.Country,
					"xp":dataFalse
				};
				OrderCloud.Addresses.Update(row.ID,default_value).then(function(res){
					console.log("the patchched addres is",res);
				})

			}
		});
		var  dataTrue ={
			IsDefault :true
		};
		var new_value={
			"Shipping": address.Shipping,
			"Billing": address.Billing,
			//"AddressName":row.AddressName,
			"FirstName":address.FirstName,
			"LastName":address.LastName,
			"Street1":address.Street1,
			"Street2":address.Street2,
			"City":address.City,
			"State":address.State,
			"Zip":address.Zip,
			"Phone":address.Phone,
			"Country":address.Country,
			"xp":dataTrue
		};
		OrderCloud.Addresses.Update(address.ID,new_value).then(function(res){
			console.log("patched address-",res);
			$state.go('account.addresses', {}, {reload: true});
		});


	}
	var specialKeys = new Array();
    specialKeys.push(8);
    vm.IsNumeric = function ($e) {
        console.log($e);
        var keyCode = $e.which ? $e.which : $e.keyCode;
        var ret = ((keyCode >= 48 && keyCode <= 57) || specialKeys.indexOf(keyCode) != -1);
        if(!ret)
            $e.preventDefault();
    }
	$scope.loadMap = function(){
		setTimeout(function(){
			// starting map showing
			var map, lat, lon,
				directionsDisplay = new google.maps.DirectionsRenderer({
					draggable: true,
					suppressMarkers: true
				}),
				directionsService = new google.maps.DirectionsService();
			//navigator.geolocation.getCurrentPosition(function (position) {
			//lat = position.coords.latitude;
			//lon = position.coords.longitude;
			lat = "44.9706756";
			lon = "-93.3315183";

			var mapOptions = {
				zoom: 10,
				center: new google.maps.LatLng(lat, lon),
				mapTypeId: google.maps.MapTypeId.ROADMAP
			}
			map = new google.maps.Map(document.getElementById('map'), mapOptions);
			directionsDisplay.setMap(map);
			document.getElementById("panel2").style.display = "none";},3000);
		//ending map showing
	}
	//order details accordiaan
	vm.showOrderDetail = function(index) {
	  	if(index == vm.selectedIndex) {
	   		vm.selectedIndex = null;
	  	} else {
	   		vm.selectedIndex = index;
	  	}
    }
}

function ConfirmPasswordController( $uibModalInstance ) {
	var vm = this;

	vm.submit = function() {
		$uibModalInstance.close(vm.password);
	};

	vm.cancel = function() {
		$uibModalInstance.dismiss('cancel');
	};

}
function CreditCardController(toastr, CreditCardService, OrderCloud, CreditCards) {
	var vm = this;
    vm.list = CreditCards.Items;
    vm.newcreditcard = false;
    vm.editcreditcard = false;

    vm.newCardInput = function() {
        vm.newcreditcard = true;
        vm.editcreditcard = false;
        vm.card = null;
    };

    vm.editCardInput = function(card) {
        vm.newcreditcard = false;
        vm.editcreditcard = true;
        vm.card = card;
        vm.card.ExpMonth = vm.card.ExpirationDate.substring(5, 7);
        vm.card.ExpYear = vm.card.ExpirationDate.substring(0, 4);
    };

    vm.createCard = function() {
        CreditCardService.Create(vm.card)
            .then(function(){
                vm.card = null;
                vm.newcreditcard = false;
                OrderCloud.Me.ListCreditCards(null, 1, 100)
                    .then(function(ccs){
                        vm.list = ccs.Items
                    })
            })
            .catch(function(){
                toastr('Sorry, something went wrong. Please check your card data and try again.')
            });
    };

    vm.updateCard = function() {
        CreditCardService.Update(vm.card)
            .then(function(){
                vm.card = null;
                vm.editcreditcard = false;
                OrderCloud.Me.ListCreditCards(null, 1, 100)
                    .then(function(ccs){
                        vm.list = ccs.Items
                    })
            })
            .catch(function(){
                toastr('Sorry, something went wrong. Please check your card data and try again.')
            });
    };
 vm.deleteCard = function(card) {
        CreditCardService.Delete(card)
            .then(function(){
                OrderCloud.Me.ListCreditCards(null, 1, 100)
                    .then(function(ccs){
                        vm.list = ccs.Items
                    })
            })
            .catch(function(){
                toastr('Sorry, something went wrong. Please try again.')
            });
    };

}
function ChangePasswordController( $state, $exceptionHandler, toastr, AccountService, CurrentUser ) {
	var vm = this;
	console.log(CurrentUser);
	vm.currentUser = CurrentUser;
	vm.changePwd = function() {
		AccountService.ChangePassword(vm.currentUser)
			.then(function() {
				toastr.success('Password successfully changed', 'Success!');
				console.log("current user==",vm.currentUser);
				vm.currentUser.CurrentPassword =CurrentUser.CurrentPassword;
				vm.currentUser.NewPassword =CurrentUser.NewPassword;
				vm.currentUser.ConfirmPassword =CurrentUser.ConfirmPassword;
			})
			.catch(function(ex) {
				$exceptionHandler(ex)
			});
	};
}
function DelWishlistController($uibModalInstance, $scope, OrderCloud,  $state, SelectedWishList, CurrentUser) {
	var vm = this;
	$scope.canceldel = function () {

		$uibModalInstance.dismiss('cancel');
	};

	$scope. DeleteWishListProduct =  function(){

		$uibModalInstance.dismiss('cancel');
		var indx = CurrentUser.xp.WishList.indexOf(SelectedWishList);
		CurrentUser.xp.WishList.splice(indx,1);
		OrderCloud.Me.Patch(CurrentUser)
			.then(function(data) {
				console.log(data);
				$state.go($state.current, {}, {reload: true});
			})
	}
}
function DemoController($uibModalInstance, $scope, OrderCloud, SelectedAddr, $state) {
	var vm = this;
	$scope.canceldel = function () {

		$uibModalInstance.dismiss('cancel');
	};
	$scope.Del = function() {
		$uibModalInstance.dismiss('cancel');
		OrderCloud.Addresses.Delete (SelectedAddr,'Bachmans').then(function (res) {
			console.log("deleted...",res);
			$state.go('account.addresses', {}, {reload: true});
		})
	}

}
/*function CreditCardAccountController( $exceptionHandler, toastr, CurrentUser, AccountService, Addresses, $q ) {
 var vm = this;
 }*/
function EmailSubscriptionController( $exceptionHandler,CurrentUser, SelectedEmailList, toastr, AccountService,LoginFact) {
	var vm = this;
	vm.emailsubscribe=SelectedEmailList;
	vm.userdata=CurrentUser;
	console.log("update user data are",vm.userdata);
	//vm.updateemail=UpdateEmailLIst;
	//console.log("updated datas are--:",vm.updateemail);
}
function TrackOrderController( $exceptionHandler, toastr, CurrentUser, AccountService, Addresses, $q ) {
	var vm = this;
}
function ProfileController($exceptionHandler,$state,$uibModal,OrderCloud,AccountService,OrderList, AddressList, CurrentUser, Underscore, $q, $scope){
	var vm=this;
	vm.profileData=CurrentUser;
	console.log("profile data are --",vm.profileData);
	vm.changeEmail = function(){
		var obj = {"Email":vm.change_email};
		OrderCloud.Users.Patch(CurrentUser.ID, obj).then(function(rrr){
			vm.emailid=rrr;
			$state.go($state.current, {}, {reload: true});
		})
	}
	//_------FOR PHONE NUMBER VALIDATION IN CONTACT INFORMATION IN MY PROFILE PAGE------//
	var specialKeys = new Array();
	specialKeys.push(8);
	vm.IsPhone = function ($e) {
		console.log($e);
		var keyCode = $e.which ? $e.which : $e.keyCode;
		var ret = ((keyCode >= 48 && keyCode <= 57) || specialKeys.indexOf(keyCode) != -1);
		if(!ret)
			$e.preventDefault();
	}
	
//_------ END FOR PHONE NUMBER VALIDATION IN CONTACT INFORMATION IN MY PROFILE PAGE------//

	//_------FOR ADDRESS DISPLY IN CONTACT INFORMATION-------//
	/*vm.Totaladdress=AddressList;
	_.filter(vm.Totaladdress,function(row){
		if(row.xp.IsDefault){
			vm.default_add=row;
			vm.defaultAdd = angular.copy(row);
		}
	})*/
	//_------ END FOR ADDRESS DISPLY IN CONTACT INFORMATION-------//

	/*    OrderCloud.Me.ListAddresses().then(function(dadd){
	 console.log("addresses are---",dadd)
	 _.filter(dadd.Items,function(row){
	 if(row.xp.IsDefault){
	 console.log(" default address is---",row)
	 vm.default_add=row;
	 }
	 })

	 })*/
	/*ervice.GetPhoneNumber(vm.editAddr.Phone).then(function(res){
	 console.log(" edit response are",res);
	 vm.contact.Phone1 = res[0];
	 vm.contactvm.editAdressDefault=function(){
	 vm['showedit' + index] =true;
	 vm.editAddr=editAddr;
	 $scope.showedit=false;
	 vm.contact={};
	 var phn = vm.editAddr.Phone;
	 AccountS.Phone2 = res[1];
	 vm.contact.Phone3 = res[2];
	 });
	 vm.editAddr=default_add;

	 vm.stateData=vm.editAddr.State;
	 vm.contact={};
	 var phn = vm.editAddr.Phone;
	 var init = phn.indexOf('(');
	 var fin = phn.indexOf(')');
	 vm.contact.Phone1 = parseInt(phn.substr(init+1,fin-init-1));
	 init = phn.indexOf(')');
	 fin = phn.indexOf('-');
	 vm.contact.Phone2 = parseInt(phn.substr(init+1,fin-init-1));
	 init = phn.indexOf('-');
	 vm.contact.Phone3 = parseInt(phn.substr(init+1,phn.length));
	 console.log("vm.contact.Phone1"+ " " + vm.contact.Phone1 + " " +"vm.contact.Phone2"+ " " +vm.contact.Phone2 + " " + "vm.contact.Phone3" + " " + vm.contact.Phone3);

	 }*/
	 vm.getPlace=function(zip){
		AccountService.getCityState(zip).then(function(res){
			console.log("response are city and state==",res);
			$scope.addr.City = res.City;
			$scope.addr.State = res.State;
		});
	}
	vm.getPlaceEdit=function(zip){
		AccountService.getCityState(zip).then(function(res){
			vm.editAddr.City = res.City;
			vm.editAddr.State = res.State;
		});
	}
	/*vm.saveAddressDefault = function(saveAddr, contact){
		saveAddr.Phone = "("+contact.Phone1+")"+contact.Phone2+"-"+contact.Phone3;
		console.log("saveAddr.Phone", saveAddr.Phone);
		OrderCloud.Addresses.Update(saveAddr.ID, saveAddr).then(function(){
			$state.go('account.addresses', {}, {reload: true});
		})
	}*/
	vm.stateSelected = function(stateSelected){
		vm.stateData=stateSelected;
	};

	vm.changePwd = function() {
		AccountService.ChangePassword(CurrentUser, vm.currentUser)
			.then(function() {
				toastr.success('Password successfully changed', 'Success!');
				console.log("current user==",vm.currentUser);
				vm.currentUser.CurrentPassword =CurrentUser.CurrentPassword;
				vm.currentUser.NewPassword =CurrentUser.NewPassword;
				vm.currentUser.ConfirmPassword =CurrentUser.ConfirmPassword;
			})
			.catch(function(ex) {
				$exceptionHandler(ex)
			});
	};
	/*    OrderCloud.Me.ListAddresses().then(function(dadd){
	 console.log("addresses are---",dadd)
	 _.filter(dadd.Items,function(row){
	 if(row.xp.IsDefault){
	 console.log(" default address is---",row)
	 vm.default_add=row;
	 }
	 })

	 })*/
	/*vm.editAdressDefault=function(default_add){
	 vm.editAddr=default_add;
	 $scope.showedit=false;
	 vm.stateData=vm.editAddr.State;
	 vm.contact={};
	 var phn = vm.editAddr.Phone;
	 var init = phn.indexOf('(');
	 var fin = phn.indexOf(')');
	 vm.contact.Phone1 = parseInt(phn.substr(init+1,fin-init-1));
	 init = phn.indexOf(')');
	 fin = phn.indexOf('-');
	 vm.contact.Phone2 = parseInt(phn.substr(init+1,fin-init-1));
	 init = phn.indexOf('-');
	 vm.contact.Phone3 = parseInt(phn.substr(init+1,phn.length));
	 console.log("vm.contact.Phone1"+ " " + vm.contact.Phone1 + " " +"vm.contact.Phone2"+ " " +vm.contact.Phone2 + " " + "vm.contact.Phone3" + " " + vm.contact.Phone3);

	 }*/
	/*vm.saveAddressDefault = function(saveAddr, contact){
		saveAddr.Phone = "("+contact.Phone1+")"+contact.Phone2+"-"+contact.Phone3;
		console.log("saveAddr.Phone", saveAddr.Phone);
		OrderCloud.Me.UpdateAddress(saveAddr.ID, saveAddr).then(function(){
			$state.go('account.addresses', {}, {reload: true});
		})
	}*/
	vm.stateSelected = function(stateSelected){
		vm.stateData=stateSelected;
	};

//orders function call starts here
	vm.showOrders=OrderList;
	console.log("the proper orders are",vm.showOrders);
//orders function call ends here
//Events Functionallity Starts Here
/*vm.eventsDetails=EventList;
console.log("the proper events are",vm.eventsDetails);*/
	var ajaxarr=[];
	var arr=[];
	var filter ={
		"xp.IsEvent":true
	};
	OrderCloud.Me.ListOutgoingOrders(null, 1, 100, null, null, filter, null, null).then(function(re){
		angular.forEach(re.Items, function(order){
			var promise =  AccountService.GetOrderDetails(order.ID);
			ajaxarr.push(promise);
		});
		$q.all(ajaxarr).then(function(items){
			vm.eventsDetails=items;
			console.log("events are=====",vm.eventsDetails);
		});
	})
}

/*function MapController($scope){
 var vm=this;
 var map, lat, lon,
 directionsDisplay = new google.maps.DirectionsRenderer({
 draggable: true,
 suppressMarkers: true
 }),
 directionsService = new google.maps.DirectionsService();
 //navigator.geolocation.getCurrentPosition(function (position) {
 /*lat = position.coords.latitude;
 lon = position.coords.longitude;*/
/*	lat = "44.9706756";
 lon = "-93.3315183";

 var mapOptions = {
 zoom: 10,
 center: new google.maps.LatLng(lat, lon),
 mapTypeId: google.maps.MapTypeId.ROADMAP
 }
 map = new google.maps.Map(document.getElementById('map'), mapOptions);
 directionsDisplay.setMap(map);
 $scope.markers = [];

 var infoWindow = new google.maps.InfoWindow();

 var createMarker = function (info){

 var marker = new google.maps.Marker({
 map: $scope.map,
 position: new google.maps.LatLng(info.lat, info.long),
 title: info.city
 });
 marker.content = '<div class="infoWindowContent">' + info.desc + '</div>';

 google.maps.event.addListener(marker, 'click', function(){
 infoWindow.setContent('<h2>' + marker.title + '</h2>' + marker.content);
 infoWindow.open($scope.map, marker);
 });

 $scope.markers.push(marker);

 }
 $scope.openInfoWindow = function (e, selectedMarker) {
 e.preventDefault();
 google.maps.event.trigger(selectedMarker, 'click');
 }

 }*/
//Events Functionnallty Ends here
/*function corsageBuilderController($scope){
 var vm = this;
 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-type");
 owl2.owlCarousel({
 //responsive: true,
 loop:false,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:3,
 }
 }
 });
 },1000)

 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-base-flower");
 owl2.owlCarousel({
 //responsive: true,
 loop:true,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)

 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-ribbon-color");
 owl2.owlCarousel({
 //responsive: true,
 loop:true,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)
 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-fastener");
 owl2.owlCarousel({
 //responsive: true,
 loop:true,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)

 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-fastener-holder");
 owl2.owlCarousel({
 //responsive: true,
 loop:false,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)


 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-addOn-optional-1");
 owl2.owlCarousel({
 //responsive: true,
 loop:true,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)

 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-addOn-optional-2");
 owl2.owlCarousel({
 //responsive: true,
 loop:true,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)

 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-Embellishments-optional-1");
 owl2.owlCarousel({
 //responsive: true,
 loop:true,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)
 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-Embellishments-optional-2");
 owl2.owlCarousel({
 //responsive: true,
 loop:false,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)
 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-Embellishments-optional-3");
 owl2.owlCarousel({
 //responsive: true,
 loop:false,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)

 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-floral-accessories-1");
 owl2.owlCarousel({
 //responsive: true,
 loop:true,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)

 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-floral-accessories-2");
 owl2.owlCarousel({
 //responsive: true,
 loop:true,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)
 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-floral-accessories-3");
 owl2.owlCarousel({
 //responsive: true,
 loop:true,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)
 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-floral-accessories-4");
 owl2.owlCarousel({
 //responsive: true,
 loop:true,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)
 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-floral-accessories-5");
 owl2.owlCarousel({
 //responsive: true,
 loop:true,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)
 setTimeout(function(){
 var owl2 = angular.element("#owl-carousel-floral-accessories-6");
 owl2.owlCarousel({
 //responsive: true,
 loop:true,
 nav:true,
 //autoWidth:true,
 responsive:{
 0:{ items:1 },
 320:{
 items:3,
 },
 730 :{
 items:3,
 },
 1024:{
 items:5,
 }
 }
 });
 },1000)
 }*/