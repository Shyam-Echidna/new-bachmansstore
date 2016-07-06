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
	.controller( 'corsageBuilderCtrl', corsageBuilderController)
	

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
                        console.log("datas are=:",data);
                    })
                    .catch(function(){
                        OrderCloud.Auth.RemoveToken();
                        OrderCloud.Auth.RemoveImpersonationToken();
                        OrderCloud.BuyerID.Set(null);
                        $state.go('login');
                        dfd.resolve();
                    });
                return dfd.promise;
            },
            OrderList:function($q,OrderCloud, AccountService){
					var orders=[];
					var forders=[];
					var dfr = $q.defer()
					OrderCloud.Me.ListOutgoingOrders().then(function(oooores){
					angular.forEach(oooores.Items,function(od){
					var value=AccountService.GetOrderDetails(od.ID);
					orders.push(value);
					console.log("value is ---",value);
				});
				
			})
					 return $q.all(orders).then(function(foooo){
						console.log("foo==",foooo);
						//return foooo;
						//dfr.resolve(orders);
					});
		
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
			controllerAs: 'account'
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
			controllerAs: 'profile',
			
		})
		/*.state( 'account.orders.event', {
            url:'event',
            templateUrl: 'orders/templates/event.tpl.html',
            controller: 'OrdersCtrl',
            controllerAs: 'orders'
           })*/
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
		.state( 'account.addresses.create', {
			url: '/addresses/create',
			//templateUrl:'account/templates/addressCreate.tpl.html',
			controller:'AddressCreateCtrl',
			controllerAs: 'addressCreate'
		})
		.state( 'account.addresses.edit', {
			url: '/:addressid/edit',
			templateUrl:'account/templates/addressEdit.tpl.html',
			controller:'AddressEditCtrl',
			controllerAs: 'addressEdit',
			resolve: {
				SelectedAddress: function($stateParams, $state, Addresses) {
					return Addresses.Get($stateParams.addressid).catch(function() {
                        $state.go('^');
                    });
				}
			}
		})

		.state( 'account.CreditCard', {
			url: '/creditCard',
			templateUrl:'account/templates/accountCreditCard.tpl.html',
			controller:'CreditCardCtrl',
			controllerAs: 'creditCard'
		})
		.state( 'account.trackorders', {
			url: '/trackorders',
			templateUrl: 'account/templates/trackorder.tpl.html',
			controller: 'profilectrl',
			controllerAs: 'profile'
		})
		.state( 'account.emailsubscription',{
			url: '/emailsubscription',
			templateUrl: 'account/templates/emailsubscription.tpl.html',
			controller: 'EmailSubscriptionCtrl',
			controllerAs: 'EmailSubscription',
			resolve: {
				SelectedEmailList: function(LoginFact) {
					return LoginFact.GetContactList();
				},
				UpdateEmailLIst:function(LoginFact,CurrentUser){
     			var u_data={
     							"id":CurrentUser.ID,
     							"lists": [{
            									"id": "1923130021",
        										"status": "ACTIVE"
        									}],
       							"email_addresses": [{"email_address":CurrentUser.Email}]
       						}
     						return LoginFact.UpdateEmailPreference(u_data);
     					}
     				}
     			})
	}
	/*.state( 'corsageBuilder', {
			parent: 'base',
			url: '/corsageBuilder',
			templateUrl:'account/templates/corsageBuilder.tpl.html',
			controller:'corsageBuilderCtrl',
			controllerAs: 'corsageBuilder'
		})*/
function AccountService( $q, $uibModal,OrderCloud,Underscore) {
	var service = {
		Update: _update, 
		ChangePassword: _changePassword,
		GetOrderDetails: _getOrderDetails,
        GetLineItemDetails: _getLineItemDetails
	};
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
			Users.Update(currentUser.ID, currentUser)
				.then(function() {
					deferred.resolve();
				})
				.catch(function(ex) {
				//vm.profile = currentProfile;
				$exceptionHandler(ex)
			})
		};

		OrderCloud.Credentials.Get(checkPasswordCredentials).then(
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

function AccountController( $exceptionHandler, $location, $state, $scope, OrderCloud, toastr, CurrentUser, AccountService, $anchorScroll, $q ) {
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

  	/* Order History Accordion like behaviour */
	vm.showOrderDetail = function(index) {
		if(index == vm.selectedIndex) {
			vm.selectedIndex = null;
		} else {
			vm.selectedIndex = index;
		}
    };
    /* Order History Accordion like behaviour */
    
	vm.resetForm = function(form) {
		vm.profile = currentProfile;
		form.$setPristine(true);
	};
	//Wishlist listing starts here
	var wishlistArr = CurrentUser.xp.WishList;
	if(wishlistArr!='undefined'){
	var wishArr = [];
	for(var i=0;i<wishlistArr.length;i++){
		vm.array_lenth=wishlistArr.length;
		var promise =OrderCloud.Me.GetProduct(wishlistArr[i]);
		wishArr.push(promise);
	}
	$q.all(wishArr).then(function(items){
		console.log("wish list ====",items);
		vm.wishList = items;
	});
	}
	//Wishlist Listing Ends Here
	//---purpleperks functionality starts here---//
	var arr=[];
	var filter={
		"Name":"Purple Perks"
	};
	OrderCloud.SpendingAccounts.List(null, 1,100,null,null,filter).then(function(purple){
		console.log("perple account is---:",purple);
		for(var i=0;i<purple.Items.length;i++){
			var ppp=purple.Items[0].xp;
			arr.push(ppp);
		}
		$q.all(arr).then(function(res){
			console.log("points are=:",res);
			vm.Perpelperk=res;
		})
	})
	//---purpleperks functionality ends here---//
	OrderCloud.Me.ListAddresses().then(function(data){
		vm.addressData=data.Items;
		console.log("adress data are--",vm.addressData);
	})
	vm.createAdd=function(addr){
		var obj =  {
		    Shipping: addr.IsShipping,
		    Billing: addr.IsBilling,
		   // AddressName:addr.AddressName,
		    FirstName:addr.FirstName,
		    LastName:addr.LastName,
		    Street1:addr.Street1,
		    Street2:addr.Street2,
		    City:addr.City,
		    State:addr.State,
		    Zip:addr.Zip,
		   	Country:'US',
		   	Phone:"("+addr.Phone1+")"+addr.Phone2+"-"+addr.Phone3,
		    xp:{}
		}
		$scope.newaddress=false;
		OrderCloud.Me.CreateAddress(obj).then(function(res){
			console.log("adress new are-",res);
			$state.go('account.addresses',{}, {reload: true});
			$location.hash('bottom');
			$anchorScroll();
		})
		OrderCloud.Me.ListAddresses().then(function(addressdatares){
			console.log("address are-",addressdatares);
		})
	}
	vm.editAdress=function(editAddr,showedit){
			vm.editAddr=editAddr;
			$scope.showedit=false;
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
			$location.hash('top');
			$anchorScroll();

	}
	vm.saveAddress = function(saveAddr, contact){
				saveAddr.Phone = "("+contact.Phone1+")"+contact.Phone2+"-"+contact.Phone3;
				console.log("saveAddr.Phone", saveAddr.Phone);
				OrderCloud.Me.UpdateAddress(saveAddr.ID, saveAddr).then(function(){
					$state.go('account.addresses', {}, {reload: true});
				})
	}
	vm.Del = function(id) {
	        alert("Are you sure to delete????");
	        OrderCloud.Me.DeleteAddress (id,true).then(function (res) {
	        console.log("deleted...",res);
	        $state.go('account.addresses', {}, {reload: true});
	    	})
	}
	//pop
	vm.stateSelected = function(stateSelected){
		vm.stateData=stateSelected;
	};
	vm.makeDefault=function(address){
		console.log("deafult", address);
		console.log("deafult", vm.addressData);
		_.filter(vm.addressData,function(row){
			/*if(row.xp.IsDefault){
				var dataFalse={
					IsDefault :false
				};*/
				var default_value={
					"Shipping": row.Shipping,
		    		"Billing": row.Billing,
		    		//"AddressName":row.AddressName,
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
				OrderCloud.Me.UpdateAddress(row.ID,default_value).then(function(res){
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
			   OrderCloud.Me.UpdateAddress(address.ID,new_value).then(function(res){
			    			console.log("patched address-",res);
			    			$state.go('account.addresses', {}, {reload: true});
			   	});

			   	console.log("deafult", vm.addressData);
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
function CreditCardController(OrderCloud,$location,$anchorScroll) {
	var vm = this;
	vm.createCreditCard=function(cards){
		var obj={
		"Token":cards.Token,
		"CardType":cards.CardType,
		"PartialAccountNumber":cards.PartialAccountNumber,
		"CardholderName":cards.CardholderName,
		"ExpirationDate":cards.ExpirationDate,
		//"xp":
	};
	OrderCloud.Me.CreateCreditCard(obj).then(function(rty){
	console.log("credit card is created",rty);
	$location.hash('bottom');
	$anchorScroll();
	})
}
	OrderCloud.Me.ListCreditCards().then(function(res){
		console.log("credits cards are-:",res);
		vm.carddata=res;
		$location.hash('bottom');
		$anchorScroll();
	})
	OrderCloud.Me.DeleteCreditCard().then(function(cdel){
		console.log("credit card is deleted--",cdel);
	})

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
function DemoController( $exceptionHandler, toastr, CurrentUser, AccountService, Addresses, $q ) {
	var vm = this;
}
/*function CreditCardAccountController( $exceptionHandler, toastr, CurrentUser, AccountService, Addresses, $q ) {
	var vm = this;
}*/
function EmailSubscriptionController( $exceptionHandler,UpdateEmailLIst,CurrentUser, SelectedEmailList, toastr, AccountService,LoginFact) {
	var vm = this;
	vm.emailsubscribe=SelectedEmailList;
	console.log("user email is--",vm.emailsubscribe);
	vm.userdata=CurrentUser;
	console.log("update user data are",vm.userdata);
	vm.updateemail=UpdateEmailLIst;
	console.log("updated datas are--:",vm.updateemail);
}
function TrackOrderController( $exceptionHandler, toastr, CurrentUser, AccountService, Addresses, $q ) {
	var vm = this;
}
function ProfileController($exceptionHandler,OrderCloud, OrderList, AccountService, CurrentUser, Underscore, $q, $scope){
	var vm=this;
	console.log("OrderList==",OrderList);
	vm.emaillist = function() {
        var vm=this;
        var modalInstance = $uibModal.open({
            animation: false,
            backdropClass: 'loginModalBg',
            windowClass: 'loginModalBg',
            templateUrl: 'login/templates/emaillist.tpl.html',
            controller:'LoginCtrl',
            controllerAs: 'login',
            /*resolve: {
                EmailPreference: function() {
                    return LoginFact.GetContactList();
                }
            }*/
            // size: 'sm'
        });

        //vm.emaillisting=EmailPreference;

        modalInstance.result.then(function() {
            
        }, function() {
            angular.noop();
        });
    }
	vm.profileData=CurrentUser;
	vm.changeEmail = function(){
		var obj = {"Email":vm.change_email};
		alert("r u sure want to save???");
	    OrderCloud.Users.Patch(CurrentUser.ID, obj).then(function(rrr){
		console.log("res===",rrr);
		vm.emailid=rrr;
	})
    }
    OrderCloud.Me.ListAddresses().then(function(dadd){
	console.log("addresses are---",dadd)
		/*	_.filter(dadd.Items,function(row){
			if(row.xp.IsDefault){
				console.log(" default address is---",row)
				vm.default_add=row;
		}
	})*/
	
})
    $scope.showdefautEdit=false;

 vm.editAdressDefault=function(showdefautEdit){
			//vm.editAddr=default_add;
			$scope.showdefautEdit=false;
			/*vm.stateData=vm.editAddr.State;
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
			console.log("vm.contact.Phone1"+ " " + vm.contact.Phone1 + " " +"vm.contact.Phone2"+ " " +vm.contact.Phone2 + " " + "vm.contact.Phone3" + " " + vm.contact.Phone3);*/

	}
vm.saveAddressDefault = function(saveAddr, contact){
				saveAddr.Phone = "("+contact.Phone1+")"+contact.Phone2+"-"+contact.Phone3;
				console.log("saveAddr.Phone", saveAddr.Phone);
				OrderCloud.Me.UpdateAddress(saveAddr.ID, saveAddr).then(function(){
					$state.go('account.addresses', {}, {reload: true});
				})
			}
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
    OrderCloud.Me.ListAddresses().then(function(dadd){
	console.log("addresses are---",dadd)
	/*		_.filter(dadd.Items,function(row){
			if(row.xp.IsDefault){
				console.log(" default address is---",row)
				vm.default_add=row;
		}
	})*/
	
})
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
vm.saveAddressDefault = function(saveAddr, contact){
				saveAddr.Phone = "("+contact.Phone1+")"+contact.Phone2+"-"+contact.Phone3;
				console.log("saveAddr.Phone", saveAddr.Phone);
				OrderCloud.Me.UpdateAddress(saveAddr.ID, saveAddr).then(function(){
					$state.go('account.addresses', {}, {reload: true});
				})
			}
vm.stateSelected = function(stateSelected){
		vm.stateData=stateSelected;
	};
	OrderCloud.Me.ListAddresses().then(function(dadd){
	console.log("addresses are---",dadd)
	/*		_.filter(dadd.Items,function(row){
			if(row.xp.IsDefault){
				console.log(" default address is---",row)
				vm.default_add=row;
		}
	})*/
	
})
//orders functionallity starts here
vm.oooo=OrderList;
console.log("oooooooooooooooooooo",vm.oooo);
/*var orders=[];
var forders=[];
OrderCloud.Me.ListOutgoingOrders().then(function(oooores){
	angular.forEach(oooores.Items,function(od){
		var promise=AccountService.GetOrderDetails(od.ID);
		orders.push(promise);
	});
	$q.all(orders).then(function(foooo){
		vm.showOrders=foooo;
		console.log("orders with line items====",vm.showOrders);
	});
})*/
//Events Functionallity Starts Here
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
