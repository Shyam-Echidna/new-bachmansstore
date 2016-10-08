angular.module('orderCloud')

    .config(AccountConfig)
    .factory('AccountService', AccountService)
    .controller('WishlistCtrl', WishlistController)
    .controller('GetDirectionCtrl', GetDirectionController)
    .controller('PurchaseOrderCtrl', PurchaseOrderController)
    .controller('BachmansChargeCtrl', BachmanschargeController)
    .controller('PurpleperkCtrl', PurpleperkController)
    .controller('OrderCtrl', OrderController)
    .controller('Eventctrl', EventController)
    .controller('AccountCtrl', AccountController)
    .controller('AddressCtrl', AddressController)
    .controller('profilectrl', ProfileController)
    .controller('ConfirmPasswordCtrl', ConfirmPasswordController)
    .controller('ChangePasswordCtrl', ChangePasswordController)
    .controller('CreditCardCtrl', CreditCardController)
    .controller('TrackOrderCtrl', TrackOrderController)
    .controller('EmailSubscriptionCtrl', EmailSubscriptionController)
    .controller('deleteCtrl', DemoController)
    .controller('deleteWishlistCtrl', DelWishlistController)
    .controller('messageCtrl', MessageController)
    .controller('deleteCreditcardCtrl', DeleteCreditcardController)

function AccountConfig($stateProvider) {
    $stateProvider
        .state('account', {
            parent: 'base',
            url: '/account',
            resolve: {
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
            },
            templateUrl: 'account/templates/accountLanding.tpl.html',
            controller: 'AccountCtrl',
            controllerAs: 'account'
        })
        .state('account.wishlistAccount', {
            url: '/wishlistAccount',
            templateUrl: 'account/templates/myWishlistAccount.tpl.html',
            controller: 'WishlistCtrl',
            controllerAs: 'wishlists',
            resolve: {
                WishList: function ($q, $state, OrderCloud, CurrentUser) {
                    var getInventory = function (productId) {
                        return OrderCloud.Me.GetProduct(productId).then(function (product) {
                            return OrderCloud.Products.GetInventory(product.ID).then(function (inventory) {
                                inventory.Available = parseInt(inventory.Available);
                                product.inventory = inventory;
                                return product;
                            })
                        })
                    };
                    var wishArr = [];
                    if (CurrentUser.xp && CurrentUser.xp.WishList) {
                        var wishlistArr = CurrentUser.xp.WishList;
                        for (var j = 0; j < wishlistArr.length; j++) {
                            wishArr.push(getInventory(wishlistArr[j]));
                        }
                        return $q.all(wishArr);
                    } else {
                        return null;
                    }

                }

            }
        })
        .state('account.getdirection', {
            url: '/getdirection',
            templateUrl: 'account/templates/getdirection.tpl.html',
            controller: 'GetDirectionCtrl',
            controllerAs: 'getdirection',
            resolve: {
                getdirectionAddress: function ($q, OrderCloud, $state, AccountService) {
                    var vm = this;
                    var ajaxarr = [];
                    var arr = [];
                    var events = [];
                    return OrderCloud.Me.ListOutgoingOrders().then(function (res) {
                        angular.forEach(res.Items, function (od) {
                            var promise = AccountService.GetOrderDetails(od.ID);
                            arr.push(promise);
                        });
                        return $q.all(arr).then(function (orderObj) {
                            vm.line = orderObj;
                            angular.forEach(vm.line, function (res) {
                                angular.forEach(res.LineItems, function (prod) {
                                    if (prod.Product.xp && prod.Product.xp.IsWorkShopEvent == true) {
                                        events.push(prod);

                                    }
                                })
                            })
                            return events;
                        });
                    })


                }
            }
        })
        .state('account.changePassword', {
            url: '/account/changepassword',
            //templateUrl: 'account/templates/changePassword.tpl.html',
            controller: 'ChangePasswordCtrl',
            controllerAs: 'changePassword'
        })
        .state('account.bachmanscharge', {
            url: '/bachmanscharge',
            templateUrl: 'account/templates/Bachmanscharge.tpl.html',
            controller: 'BachmansChargeCtrl',
            controllerAs: 'bachmanscharge',
            resolve: {
                BachmansCharge: function (OrderCloud, $q) {
                    var vm = this;
                    var arr = [],
                        queue = [];
                    var d = $q.defer();
                    return OrderCloud.Me.Get().then(function (c_suid) {
                        return OrderCloud.SpendingAccounts.ListAssignments(null, c_suid.ID, null, null, null, 100).then(function (assins) {
                            angular.forEach(assins.Items, function (uuu) {
                                queue.push(OrderCloud.SpendingAccounts.Get(uuu.SpendingAccountID));

                            })
                            return $q.all(queue).then(function (charges) {
                                angular.forEach(charges, function (charge) {
                                    if (charge.Name == "Bachmans Charge") {
                                        arr.push(charge);
                                    }
                                })

                                return arr;

                            })
                        })
                    })
                }
            }
        })
        .state('account.purchaseorder', {
            url: '/purchaseorder',
            templateUrl: 'account/templates/purchaseorder.tpl.html',
            controller: 'PurchaseOrderCtrl',
            controllerAs: 'purchaseorder'
        })
        .state('account.perpleperksAccount', {
            url: '/perpleperksAccount',
            templateUrl: 'account/templates/perpleperksAccount.tpl.html',
            controller: 'PurpleperkCtrl',
            controllerAs: 'Purpleperk',
            resolve: {

                PurplePerkBalance: function (PPBalance, OrderCloud, $q, $http) {
                    var defferred = $q.defer();
                    OrderCloud.Me.Get().then(function (res) {
                        var PPID = res.xp.LoyaltyID;
                        if (PPID == null) {
                            var data = {
                                "card_number": "7777779529387135"
                            };
                        } else {
                            var data = {
                                "card_number": PPID
                            };
                        }


                        $http({

                            method: 'POST',
                            dataType: "json",
                            url: PPBalance,
                            data: JSON.stringify(data),
                            headers: {
                                'Content-Type': 'application/json'
                            }

                        }).success(function (data, status, headers, config) {

                            defferred.resolve(data);
                        }).error(function (data, status, headers, config) {
                            defferred.reject(data);
                        });


                    });

                    return defferred.promise;
                },
                PurplePerk: function (OrderCloud, $q) {
                    var vm = this;
                    var defferred = $q.defer();
                    OrderCloud.Me.Get().then(function (res) {
                        OrderCloud.SpendingAccounts.ListAssignments(null, res.ID, null, null, 1, null, null).then(function (assignment) {
                            if (assignment.Items) {
                                var queue = [];
                                angular.forEach(assignment.Items, function (item) {
                                    queue.push(getpurple(item));

                                });
                                $q.all(queue).then(function (items) {
                                    angular.forEach(items, function (item) {
                                        if (item.Name == 'Purple Perks') {
                                            defferred.resolve(item);
                                        }
                                    });
                                });
                            } else {
                                return null;
                            }
                        })

                    })
                    return defferred.promise;

                    function getpurple(item) {
                        var d = $q.defer();
                        OrderCloud.SpendingAccounts.Get(item.SpendingAccountID).then(function (purple) {
                            d.resolve(purple);
                        });
                        return d.promise;
                    }
                }
            }
        })
        .state('account.perpleperksAccount.perpleperkreg', {
            url: '/perpleperkreg',
            templateUrl: 'account/templates/perplePerksRegistered.tpl.html',
            controller: 'PurpleperkCtrl',
            controllerAs: 'Purpleperk'
        })
        .state('account.creditCardAccount', {
            url: '/creditCardAccount',
            templateUrl: 'account/templates/creditCardAccount.tpl.html',
            controller: 'CreditCardAccountCtrl',
            controllerAs: 'CreditCardAccount'
        })
        .state('account.addresses', {
            url: '/addresses',
            templateUrl: 'account/templates/addressBookAccount.tpl.html',
            controller: 'AddressCtrl',
            controllerAs: 'Address',
            resolve: {
                AddressList: function (AccountService, CurrentUser) {
                    return AccountService.ListAddress(CurrentUser.ID);
                }
            }
        })
        .state('account.orders', {
            url: '/orders',
            templateUrl: 'account/templates/orders.tpl.html',
            controller: 'OrderCtrl',
            controllerAs: 'orders',
            resolve: {
                OrderList: function ($q, $state, OrderCloud, AccountService) {
                    var orders = [];
                    var vm = this;
                    var d = $q.defer();
                    OrderCloud.Me.ListOutgoingOrders().then(function (oooores) {
                        var completedOdr = _.reject(oooores.Items, function (obj) {
                            return _.indexOf([obj.Status], 'Unsubmitted') > -1
                        });
                        angular.forEach(completedOdr, function (od) {
                            var promise = AccountService.GetOrderDetails(od.ID);
                            orders.push(promise);
                        });
                        $q.all(orders).then(function (foooo) {
                            vm.showOrders = foooo;
                            console.log("line items", vm.showOrders);
                            d.resolve(foooo);
                        });
                    })
                    return d.promise;
                }
            }
        })
        .state('account.event', {
            url: '/event',
            templateUrl: 'account/templates/myAccountEvents.tpl.html',
            controller: 'Eventctrl',
            controllerAs: 'event',
            resolve: {
                EventList: function ($q, OrderCloud, $state, AccountService) {
                    var vm = this;
                    var ajaxarr = [];
                    var arr = [];
                    var events = [];
                    return OrderCloud.Me.ListOutgoingOrders().then(function (res) {
                        angular.forEach(res.Items, function (od) {
                            var promise = AccountService.GetOrderDetails(od.ID);
                            arr.push(promise);
                        });
                        return $q.all(arr).then(function (orderObj) {
                            vm.line = orderObj;
                            angular.forEach(vm.line, function (res) {
                                angular.forEach(res.LineItems, function (prod) {
                                    if (prod.Product.xp && prod.Product.xp.IsWorkShopEvent == true) {
                                        events.push(prod);

                                    }
                                })
                            })
                            return events;
                        });
                    })


                }
            }
        })
        .state('account.profile', {
            url: '/profile',
            templateUrl: 'account/templates/account.tpl.html',
            controller: 'profilectrl',
            controllerAs: 'profile'
        })
        .state('account.CreditCard', {
            url: '/creditCard',
            templateUrl: 'account/templates/accountCreditCard.tpl.html',
            controller: 'CreditCardCtrl',
            controllerAs: 'creditCards',
            resolve: {
                CreditCards: function (OrderCloud) {
                    return OrderCloud.Me.ListCreditCards(null, 1, 100)
                }
            }
        })
        .state('account.trackorders', {
            url: '/trackorders',
            templateUrl: 'account/templates/trackorder.tpl.html',
            controller: 'TrackOrderCtrl',
            controllerAs: 'trackorder',
            resolve: {
                TrackOrder: function ($q, $state, OrderCloud, AccountService) {
                    var orders = [];
                    var vm = this;
                    var d = $q.defer();
                    OrderCloud.Me.ListOutgoingOrders().then(function (oooores) {
                        angular.forEach(oooores.Items, function (od) {
                            var promise = AccountService.GetOrderDetails(od.ID);
                            orders.push(promise);
                        });
                        $q.all(orders).then(function (foooo) {
                            vm.trackorder = foooo;
                            d.resolve(foooo);
                        });
                    })
                    return d.promise;
                }
            }

        })
        .state('account.emailsubscription', {
            url: '/emailsubscription',
            templateUrl: 'account/templates/emailsubscription.tpl.html',
            controller: 'EmailSubscriptionCtrl',
            controllerAs: 'EmailSubscription',
            resolve: {
                emaillist: function (ConstantContact) {
                    return ConstantContact.GetListOfSubscriptions();
                },
                subscriptions: function (emaillist, CurrentUser, AccountService) {
                    return AccountService.GetUpdateSubscription(CurrentUser.xp.ConstantContact.ID, emaillist).then(function (res) {
                        return res;
                    });
                }
            }
        })
    /*.state( 'corsageBuilder', {
     parent: 'base',
     url: '/corsageBuilder',
     templateUrl:'account/templates/corsageBuilder.tpl.html',
     controller:'corsageBuilderCtrl',
     controllerAs: 'corsageBuilder'
     })*/
}

function AccountService($q, $uibModal, $exceptionHandler, ConstantContact, OrderCloud, Underscore, $http, $location, $anchorScroll, toastr) {
    var service = {
        Update: _update,
        ChangePassword: _changePassword,
        GetOrderDetails: _getOrderDetails,
        GetLineItemDetails: _getLineItemDetails,
        GetPhoneNumber: _getphonenumber,
        ListAddress: _listAddresses,
        getCityState: _getCityState,
        GoTop: _goTop,
        GetUpdateSubscription: _getUpdateSubscription,
        GetCardType: _getCardType,
        GetBillingAddress: _getBillingAddress,
        ListBillingAddress:_listBillingAddress,
        ReAssignAddress: _reAssignAddress,
        ZipcodeValidation: _zipcodeValidation
    };

    function _zipcodeValidation() {
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
                        } else {
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

                            } else {
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
    function _reAssignAddress(addressAssignment) {
        return OrderCloud.Addresses.DeleteAssignment(addressAssignment.AddressID, addressAssignment.UserID, null, 'bachmans').then(function () {
            return OrderCloud.Addresses.SaveAssignment(addressAssignment).then(function (res) {
                return res;
            })
        })

    };
    function _getBillingAddress() {
        var bindAddressType = function (addressType) {
            var promise = OrderCloud.Addresses.Get(addressType.AddressID).then(function (res) {
                res.addressType = addressType;
                return res;
            })
            return promise;
        };
        OrderCloud.Addresses.ListAssignments(null, userId, null, null, null, null, 1, size, null).then(function (res) {
            var arr = [];
            for (var i = 0; i < res.Items.length; i++) {
                var addressType = { "AddressID": res.Items[i].AddressID, "IsShipping": res.Items[i].IsShipping, "IsBilling": res.Items[i].IsBilling };
                arr.push(bindAddressType(addressType));
            }
            $q.all(arr).then(function (nnn) {
                console.log("nnnnn", nnn);
            })
        })
    }

    function _getCardType(CardNumber) {
        var cardType;
        var cards = {
            //"Electron": /^(4026|417500|4405|4508|4844|4913|4917)\d+$/,
            //"Maestro": /^(5018|5020|5038|5612|5893|6304|6759|6761|6762|6763|0604|6390)\d+$/,
            //"Dankort": /^(5019)\d+$/,
            //"Interpayment": /^(636)\d+$/,
            //"Unionpay": /^(62|88)\d+$/,
            "Visa": /^4[0-9]{12}(?:[0-9]{3})?$/,
            "MasterCard": /^5[1-5][0-9]{14}$/,
            "AmericanExpress": /^3[47][0-9]{13}$/,
            //"Diners": /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
            "Discover": /^6(?:011|5[0-9]{2})[0-9]{12}$/,
            //"Jcb": /^(?:2131|1800|35\d{3})\d{11}$/
        },
            defferred = $q.defer();
        for (var key in cards) {
            if (cards[key].test(CardNumber)) {
                cardType = key;
            }
        }
        return cardType;
    }

    function _getUpdateSubscription(ConstantContactId, subscriptionList) {
        var params = {
            "ConstantContactId": ConstantContactId
        }
        return ConstantContact.GetSpecifiedContact(params).then(function (res) {

            var userSubscriptions = res.data.lists;
            if (userSubscriptions) {
                var userSubIds = Underscore.pluck(userSubscriptions, "id");
                angular.forEach(subscriptionList.data, function (subscription) {
                    if (userSubIds.indexOf(subscription.id) > -1) {
                        subscription.Checked = true;
                    }
                })
            }
            return subscriptionList.data;
        })

    }

    function _goTop() {
        $location.hash('top');
        $anchorScroll();

    }

    function _goBottom() {
        $location.hash('bottom');
        $anchorScroll();
    }
    //*** START ZIP,CITY,STATE VALIDATION**//
    function _getCityState(zip) {
        var d = $q.defer();
        $http.defaults.headers.common['Authorization'] = undefined;
        $http.get('http://maps.googleapis.com/maps/api/geocode/json?address=' + zip).then(function (res) {
            var city, state;
            var cities = [];
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
            console.log("cities ", res.data.results[0].postcode_localities);
            if (res.data.results[0].postcode_localities) {
                d.resolve({ "Cities": res.data.results[0].postcode_localities, "State": state });
            } else {
                d.resolve({ "City": city, "State": state });
            }
            //d.resolve({ "City": city, "State": state });
        });
        return d.promise;
    }
    //*** END ZIP,CITY,STATE VALIDATION**//


    //******LIST ADDRESS STARTS*****
    function _listAddresses(userId, size) {
        var bindAddressType = function (addressType) {
            var promise = OrderCloud.Addresses.Get(addressType.AddressID).then(function (res) {
                res.addressType = addressType;
                return res;
            })
            return promise;
        };
        return OrderCloud.Addresses.ListAssignments(null, userId, null, null, null, null, 1, size, null).then(function (res) {
            var arr = [];
            for (var i = 0; i < res.Items.length; i++) {
                //var addressType = { "AddressID": res.Items[i].AddressID, "IsShipping": res.Items[i].IsShipping, "IsBilling": res.Items[i].IsBilling};
                arr.push(bindAddressType(res.Items[i]));
            }
            return $q.all(arr);
        })
    };
  
    function _listBillingAddress(ID){
        var dfr = $q.defer();
        var arr = {};
        OrderCloud.Addresses.ListAssignments(null, ID).then(function(addrList){
            var temp = [];
            angular.forEach(addrList.Items, function(val){
                temp.push(OrderCloud.Addresses.Get(val.AddressID));
            }, true);
            $q.all(temp).then(function(result){
                arr["addresses"] = result;
                arr["defaultAddr"]=_.filter(result, function(obj) {
                    if(obj.xp && obj.xp!=null){
                        if(obj.xp.IsDefault != null)
                        return _.indexOf([obj.xp.IsDefault], true) > -1
                    }
                });
                dfr.resolve(arr);
            });
        });
        return dfr.promise;
    }

    //******LIST ADDRESS END*****

    //*******GETTING PHONE NUMBER******//
    function _getphonenumber(phn) {
        var d = $q.defer();
        var arr = [];
        var init = phn.indexOf('(');
        var fin = phn.indexOf(')') + "";
        arr.push(parseInt(phn.substr(init + 1, fin - init - 1)));
        init = phn.indexOf(')');
        fin = phn.indexOf('-');
        arr.push(parseInt(phn.substr(init + 1, fin - init - 1)));
        init = phn.indexOf('-');
        arr.push(parseInt(phn.substr(init + 1, phn.length)));
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
            .then(function (data) {
                order = data;
                order.LineItems = [];
                gatherLineItems();
            });

        function gatherLineItems() {
            OrderCloud.LineItems.List(orderID, null, 1, 100, null, null, null)
                .then(function (data) {
                    order.LineItems = order.LineItems.concat(data.Items);
                    for (var i = 2; i <= data.Meta.TotalPages; i++) {
                        lineItemQueue.push(OrderCloud.LineItems.List(orderID, null, i, 100, null, null, null));
                    }
                    $q.all(lineItemQueue).then(function (results) {
                        angular.forEach(results, function (result) {
                            order.LineItems = order.LineItems.concat(result.Items);
                        });
                        gatherProducts();
                    });
                });
        }

        function gatherProducts() {
            var productIDs = Underscore.uniq(Underscore.pluck(order.LineItems, 'ProductID'));

            angular.forEach(productIDs, function (productID) {
                productQueue.push((function () {
                    var d = $q.defer();
                    OrderCloud.Products.Get(productID)
                        .then(function (product) {
                            angular.forEach(Underscore.where(order.LineItems, { ProductID: product.ID }), function (item) {
                                item.Product = product;
                            });

                            d.resolve();
                        });

                    return d.promise;
                })());
            });
            $q.all(productQueue).then(function () {
                if (order.SpendingAccountID) {
                    OrderCloud.SpendingAccounts.Get(order.SpendingAccountID)
                        .then(function (sa) {
                            order.SpendingAccount = sa;
                            deferred.resolve(order);
                        });
                } else {
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
            .then(function (li) {
                lineItem = li;
                getProduct();
            });

        function getProduct() {
            OrderCloud.Products.Get(lineItem.ProductID)
                .then(function (product) {
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
                .then(function (data) {
                    deferred.resolve(data);
                })
                .catch(function (ex) {
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
        modalInstance.result.then(function (password) {
            var checkPasswordCredentials = {
                Username: currentProfile.Username,
                Password: password
            };
            OrderCloud.Credentials.Get(checkPasswordCredentials).then(
                function () {
                    alert("Are you want to change data????");
                    ProfileEdit();
                }).catch(function (ex) {
                    deferred.reject(ex);
                });
        }, function () {
            angular.noop();
        });

        return deferred.promise;
    }

    function _changePassword(currentUser, newuser) {
        var deferred = $q.defer();
        var vm = this;
        var checkPasswordCredentials = {
            Username: currentUser.Username,
            Password: newuser.CurrentPassword
        };

        function changePasswordfun() {
            currentUser.Password = newuser.NewPassword;
            OrderCloud.Users.Update(currentUser.ID, currentUser)
                .then(function () {
                    deferred.resolve();
                })
                .catch(function (ex) {
                    $exceptionHandler(ex)
                })
        };
        OrderCloud.Auth.GetToken(checkPasswordCredentials).then(
            function () {

                changePasswordfun();
            }).catch(function (ex) {
                deferred.reject(ex);
            });
        return deferred.promise;
    }
    return service;
}
function GetDirectionController(getdirectionAddress) {
    var vm = this;
    vm.locationAddress = getdirectionAddress;
    console.log("vm.gggggg", vm.locationAddress);
    vm.dddd = function () {
        console.log("hitting");
    }
}

function OrderController(OrderList, OrderCloud) {
    var vm = this;
    var arr = [];
    vm.showOrders = OrderList;
    console.log("kkkk", vm.showOrders);
    angular.forEach(vm.showOrders, function (res) {
        var lineitems = OrderCloud.LineItems.Get(res.ID).then(function (res2) {
            arr.push(lineitems);
            console.log("the respond is", arr);
        })

    })
    console.log("the orders are", arr);
    //order details accordion
    vm.showOrderDetail = function (orderID, index) {
        var order = _.where(vm.showOrders, { "ID": orderID });
        console.log("order", order);
        vm.recepientGroup = _.groupBy(order[0].LineItems, function (value) {
            return value.ShippingAddress.FirstName + " " + value.ShippingAddress.LastName;
        });
        console.log("recepientGroup", vm.recepientGroup);
        if (index == vm.selectedIndex) {
            vm.selectedIndex = null;
        } else {
            vm.selectedIndex = index;
        }
    }
    vm.adjustProdImage = function () {
        if (angular.element("body").hasClass("safari")) {
            setTimeout(function () {
                var arrImgs = angular.element(".product-info-details .prod-img img.order-img");
                for (var i = arrImgs.length; i >= 0; i--) {
                    angular.element(arrImgs[i]).css("position", "relative");
                }
            }, 500);
        }
    }
}

function MessageController($uibModalInstance) {
    var vm = this;
    vm.canceldel = function () {

        $uibModalInstance.dismiss('cancel');
    };
}

function EventController(OrderCloud, EventList) {
    var vm = this;
    var Upcomingevents = [];
    var Pastevents = [];
    vm.eventlist = EventList;
    var date = new Date();
    var currentdate = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    angular.forEach(vm.eventlist, function (od) {
        if (od.Product.xp.EventDate > currentdate) {
            Upcomingevents.push(od);
            /*angular.forEach(Upcomingevents, function(addres) {
                OrderCloud.Addresses.Get(addres.Product.xp.Location.Id).then(function(aid) {
                    console.log("address venue", aid);
                })
            })*/
            vm.Upcomingevent = Upcomingevents;

        } else {
            Pastevents.push(od);
            vm.Pastevent = Pastevents;
        }
    });
    console.log("events aare listed", vm.eventlist);
    vm.loadMap = function () {
        setTimeout(function () {
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
        }, 3000);
        //ending map showing
    }

}

function BachmanschargeController(BachmansCharge) {
    var vm = this;
    vm.bcharge = BachmansCharge;
    console.log("BachmansCharge", vm.bcharge);
};

function PurpleperkController(PurplePerk, PurplePerkBalance) {
    var vm = this;
    console.log("PurplePerk==", PurplePerkBalance);
    vm.purpleperk = PurplePerk;
    if (vm.purpleperk) {
        vm.purpleperk = PurplePerk;
        vm.purpleperkExist = true;
        vm.purpleperkDoesNotExist = false;

    } else {
        vm.purpleperkExist = false;
        vm.purpleperkDoesNotExist = true;
    }

}

function PurchaseOrderController(OrderCloud) {
    var vm = this;
    OrderCloud.Me.Get().then(function (res) {
        vm.purchaseorderid = res.xp.PurchaseOrderNumber;
        console.log("purchase order id", vm.purchaseorderid);

    })

}

function AddressController(AddressList, $anchorScroll, $location, AccountService, $scope, $uibModal, OrderCloud, CurrentUser, $state) {
    var vm = this;
    vm.addressData = AddressList;
    vm.CreateAddress = function (line) {
        var $this = this;
        var params = {
            "FirstName": line.FirstName,
            "LastName": line.LastName,
            "Street1": line.Street1,
            "Street2": line.Street2,
            "City": line.City,
            "State": line.State,
            "Zip": line.Zip,
            "Phone": "(" + line.Phone1 + ") " + line.Phone2 + "-" + line.Phone3,
            "Country": "US",
            "xp": { NickName: line.xp.NickName }
        };
        OrderCloud.Addresses.Create(params).then(function (data) {
            data.Zip = parseInt(data.Zip);
            var obj = { "AddressID": data.ID, "UserID": CurrentUser.ID, "IsBilling": line.IsBilling, "IsShipping": true };
            OrderCloud.Addresses.SaveAssignment(obj).then(function (res) {

                $state.go('account.addresses', {}, { reload: true });
                $location.hash('top');
                $anchorScroll();

            });
        })
    }
    vm.ScrollTopAdddr = function () {
        AccountService.GoTop();
    }
    //_------FOR PHONE NUMBER VALIDATION IN CONTACT INFORMATION IN MY PROFILE PAGE------//
    var specialKeys = new Array();
    specialKeys.push(8);
    vm.IsPhone = function ($e) {
        var keyCode = $e.which ? $e.which : $e.keyCode;
        var ret = ((keyCode >= 48 && keyCode <= 57) || specialKeys.indexOf(keyCode) != -1);
        if (!ret)
            $e.preventDefault();
    }

    //_------ END FOR PHONE NUMBER VALIDATION IN CONTACT INFORMATION IN MY PROFILE PAGE------//
    vm.saveAddress = function (saveAddr, contact) {
        saveAddr.Phone = "(" + contact.Phone1 + ")" + contact.Phone2 + "-" + contact.Phone3;
        var billing = (vm.oldAddress.addressType.IsBilling == saveAddr.addressType.IsBilling) ? true : false;
        var shipping = (vm.oldAddress.addressType.IsShipping == saveAddr.addressType.IsShipping) ? true : false;

        if (!billing || !shipping) {
            AccountService.ReAssignAddress(saveAddr.addressType).then(function () {
                console.log('address re-assigned');
            })

        }
        OrderCloud.Addresses.Update(saveAddr.ID, saveAddr).then(function () {
            $state.go('account.addresses', {}, { reload: true });
            $location.hash('top');
            $anchorScroll();
        })
    }
    vm.getLocation = function (zip) {
        if (zip && zip.length == 5) {
            AccountService.getCityState(zip).then(function (res) {
                console.log("res==", res);
                if (res.Cities) {
                    $scope.addr.City = res.Cities[0];
                    $scope.Cities = res.Cities;
                    $scope.addr.State = res.State;
                } else {
                    $scope.Cities = null;
                    $scope.addr.City = res.City;
                    $scope.addr.State = res.State;
                }
            });
        }
    }
    vm.zipValidation = function () {
        AccountService.ZipcodeValidation();

    }
    vm.getLoactionEdit = function (zip) {
        if (zip.length == 5) {
            AccountService.getCityState(zip).then(function (res) {
                if (res.Cities) {
                    $scope.addr.City = res.Cities[0];
                    $scope.Cities = res.Cities;
                } else {
                    $scope.Cities = null;
                    $scope.addr.City = res.City;
                }
            });
        }
    }
    // delete pohetp up
    vm.deletePopup = function (Addrid) {
        var modalInstance = $uibModal.open({
            animation: true,
            windowClass: 'deletePopup',
            template: '<div class="">' +
            '<div class="">' +
            '<div class="">' +
            '<a>' +
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
            '</a>' +
            '</div>' +
            '<p>Are you sure you want to delete?</p>' +
            '<button class="save-btn" ng-click="Del()">Ok</button>' +
            '<button class="cancel-btn" ng-click="canceldel()">Cancel</button>' +
            '</div>' +
            '</div>',
            controller: 'deleteCtrl',
            controllerAs: 'deletectrl',
            resolve: {
                SelectedAddr: function () {
                    return Addrid;
                }
            }
        });
        modalInstance.result.then(function () {

        }, function () {
            angular.noop();
        });
    }
    vm.editAdress = function (editAddr, index) {
        vm['showedit' + vm.prevIndex] = false;
        vm.prevIndex = angular.copy(index)
        vm['showedit' + index] = true;
        vm.oldAddress = angular.copy(editAddr);
        vm.editAddr = angular.copy(editAddr);
        vm.editAddr.Zip = parseInt(vm.editAddr.Zip);
        vm.stateData = vm.editAddr.State;
        $scope.showedit = false;
        vm.contact = {};
        var phn = vm.editAddr.Phone;
        AccountService.GetPhoneNumber(vm.editAddr.Phone).then(function (res) {
            vm.contact.Phone1 = res[0];
            vm.contact.Phone2 = res[1];
            vm.contact.Phone3 = res[2];
        });
    }
    vm.makeDefault = function (address) {
        _.filter(vm.addressData, function (row) {
            if (row.xp.IsDefault == true && address.ID != row.ID) {
                row.xp.IsDefault = false;
                OrderCloud.Addresses.Update(row.ID, row).then(function (res) { });
            }
            if ((!row.xp.IsDefault || row.xp.IsDefault == false) && address.ID == row.ID) {
                row.xp.IsDefault = true;
                OrderCloud.Addresses.Update(row.ID, row).then(function (res) { });
            }
        });
    }
    vm.closeShowedit = function (index) {
        vm['showedit' + index] = false;
    }
}

function AccountController($uibModal, $exceptionHandler, $location, $state, $scope, OrderCloud, toastr, CurrentUser, AccountService, $anchorScroll, $q, PdpService, $rootScope) {
    var vm = this;
    var orders = [];
    vm.multirecipient = multirecipient;
    /*OrderCloud.Me.ListOutgoingOrders().then(function(respond){
        angular.forEach(respond, function(ee) {
                            var promise = AccountService.GetOrderDetails(ee.Items.ID);
                            orders.push(promise);
                        });
                        $q.all(orders).then(function(foooo) {
                            vm.showOrders = foooo;
                            console.log(vm.showOrders);
                            d.resolve(foooo);
                        });
    })*/
    vm.profile = angular.copy(CurrentUser);
    var currentProfile = angular.copy(CurrentUser);
    vm.update = function () {
        AccountService.Update(currentProfile, vm.profile)
            .then(function (data) {
                vm.profile = angular.copy(data);
                currentProfile = data;
                toastr.success('Account changes were saved.', 'Success!');
            })
            .catch(function (ex) {
                vm.profile = currentProfile;
                $exceptionHandler(ex)
            })
    };
    vm.resetForm = function (form) {
        vm.profile = currentProfile;
        form.$setPristine(true);
    };
    var accountMenu = [
        { 'value': 'profile', 'label': 'My Profile' },
        { 'value': 'addresses', 'label': 'Address Book' },
        { 'value': 'orders', 'label': 'Order History' },
        //{ 'value': 'trackorders', 'label': 'Track Orders' },
        { 'value': 'event', 'label': 'My Events' },
        { 'value': 'CreditCard', 'label': 'Credit Cards' },
        { 'value': 'perpleperksAccount', 'label': 'Perple Perks' },
        { 'value': 'wishlistAccount', 'label': 'My Wishlist' },
        { 'value': 'emailsubscription', 'label': 'Email Preferences' }
    ];
    vm.accountMenu = accountMenu;
    vm.selectedMenu = "My Profile";
    vm.selectedMenuIndex = 0;
    vm.changeMenuSelection = function changeMenuSelection(selectedMenu, menuIndex) {
        vm.selectedMenu = selectedMenu;
        vm.selectedMenuIndex = menuIndex;
    };
    //vm.addressData=AddressList;
    //vm.wishList = WishList;
    //---purpleperks functionality starts here---//


    //---purpleperks functionality ends here---//
    vm.deleteWishList = function (prodid) {
        var modalInstance = $uibModal.open({
            animation: false,
            windowClass: 'deletePopup',
            template: '<div class="">' +
            '<div class="">' +
            '<div class="">' +
            '<a>' +
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
            '</a>' +
            '</div>' +
            '<p>Are you sure you want to delete?</p>' +
            '<button class="save-btn" ng-click="DeleteWishListProduct()">Ok</button>' +
            '<button class="cancel-btn" ng-click="canceldel()">Cancel</button>' +
            '</div>' +
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
        modalInstance.result.then(function () {

        }, function () {
            angular.noop();
        });

    }
    vm.stateSelected = function (stateSelected) {
        vm.stateData = stateSelected;
    };

    var specialKeys = new Array();
    specialKeys.push(8);
    vm.IsNumeric = function ($e) {
        var keyCode = $e.which ? $e.which : $e.keyCode;
        var ret = ((keyCode >= 48 && keyCode <= 57) || specialKeys.indexOf(keyCode) != -1);
        if (!ret)
            $e.preventDefault();
    }

    function multirecipient(id) {
        var modalInstance = $uibModal.open({
            animation: true,
            backdropClass: 'multiRecipentModal',
            windowClass: 'multiRecipentModal',
            templateUrl: 'pdp/templates/multirecipient.tpl.html',
            controller: 'MultipleRecipientCtrl',
            controllerAs: 'multipleRecipient',
            resolve: {
                items: function (OrderCloud, $q) {
                    var activeProduct = {};
                    var itemdefer = $q.defer();
                    OrderCloud.Me.GetProduct(id).then(function (res) {
                        activeProduct = res;
                        activeProduct.xp.DeliveryMethod = '';
                        // var poromise = vm.callAvailableOptions(activeProduct);
                        itemdefer.resolve(activeProduct);

                    }).catch(function (err) {
                        console.log(err);
                    })
                    return itemdefer.promise;
                },
                Order: function ($q, CurrentOrder) {
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
                Signedin: function ($q, $state, OrderCloud) {
                    var dfd = $q.defer();
                    OrderCloud.Me.Get().then(function (res) {
                        console.log("zxcvbnm", res);
                        dfd.resolve(res);
                    })
                    return dfd.promise;
                },
                LineItems: function (CurrentOrder) {
                    var dfd = $q.defer();
                    CurrentOrder.Get()
                        .then(function (order) {
                            var promise = vm.getLineItems(order.ID)
                            dfd.resolve(promise)
                        })
                        .catch(function () {
                            dfd.resolve(null);
                        });
                    return dfd.promise;
                },
                WishList: function () {
                    return {
                        removeFromwishList: true,

                    }
                },
                CstDateTime: function ($q, PdpService) {
                    var dfr = $q.defer();
                    PdpService.CompareDate().then(function (dt) {
                        dfr.resolve(new Date(dt));
                    });
                    return dfr.promise;
                },
                BuyerXp: function ($q, PdpService) {
                    var dfd = $q.defer();
                    PdpService.GetBuyerDtls().then(function (res) {
                        dfd.resolve(res.xp);
                    });
                    return dfd.promise
                },
                ExtraItems: function () {
                    var extraItems = []
                    // if (!_.isEmpty(vm.extraItems)) {
                    //     angular.forEach(vm.extraItems, function (val, key) {
                    //         extraItems.push(val)
                    //     }, true)
                    // }
                    return extraItems;


                }
            }
        });

        modalInstance.result.then(function () {

        }, function () {
            angular.noop();
        });
    }
    //vm.callAvailableOptions = callAvailableOptions;

    // function callAvailableOptions(line) {
    //     var d = $q.defer();
    //     OrderCloud.Categories.ListProductAssignments(null, line.ID).then(function (res1) {
    //         //OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function(res2){
    //         //OrderCloud.Categories.Get('c2_c1_c1').then(function (res2) {
    //         OrderCloud.Categories.Get('OutdoorLivingDecor_Grilling_Grills').then(function (res2) {
    //             //OrderCloud.Categories.Get('c4_c1').then(function (res2) {
    //             var key = {},
    //                 MinDate = {};
    //             line.xp.NoInStorePickUp = true;
    //             if (res2.xp.DeliveryChargesCatWise.DeliveryMethods['InStorePickUp']) {
    //                 line.xp.NoInStorePickUp = false;
    //             }
    //             _.each(res2.xp.DeliveryChargesCatWise.DeliveryMethods, function (v, k) {
    //                 if (v.MinDays) {
    //                     MinDate[k] = v.MinDays;
    //                     key['MinDate'] = MinDate;
    //                 }
    //                 if (k == "UPS" && v['Boolean'] == true) {
    //                     key[k] = {};
    //                 }
    //                 if (k == "USPS" && v['Boolean'] == true) {
    //                     key[k] = {};
    //                 }
    //                 if (k == "InStorePickUp") {
    //                     key[k] = {};
    //                 }
    //                 if (k == 'Mixed' && v['Boolean'] == true) {
    //                     key[k] = {};
    //                 }
    //                 _.each(v, function (v1, k1) {
    //                     var obj = {};
    //                     if (v1['Boolean'] == true) {
    //                         if (k == "Mixed" && line.Quantity < 50) {

    //                         } else {
    //                             obj[k1] = v1['Value'];
    //                             key[k] = obj;
    //                         }
    //                     }
    //                 });
    //             });

    //             if (!key['UPS'] && !key['LocalDelivery'] && !key['Mixed'] && key['InStorePickUp'] && !key['USPS'] && !key['DirectShip'] && !key['Courier']) {
    //                 line.xp.NoDeliveryExInStore = true;
    //                 line.xp.addressType = "Will Call";
    //             }
    //             d.resolve(line);

    //         });
    //     });
    //     return d.promise;
    // }
    vm.getLineItems = getLineItems;

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
    $rootScope.$on('RemoveItemFromWishList', function (evt, data) {
        var indx = CurrentUser.xp.WishList.indexOf(data.Id);
        CurrentUser.xp.WishList.splice(indx, 1);
        OrderCloud.Me.Patch(CurrentUser)
            .then(function (data) {
                console.log(data)
            }, function (err) {
                console.log(err);
            });
    });
}

function ConfirmPasswordController($uibModalInstance) {
    var vm = this;

    vm.submit = function () {
        $uibModalInstance.close(vm.password);
    };

    vm.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

}

function DeleteCreditcardController($rootScope, CreditCardService, OrderCloud, $uibModalInstance, card) {
    var vm = this;
    console.log(card);
    vm.canceldel = function () {

        $uibModalInstance.dismiss('cancel');
    };
    vm.deleteCard = function () {
        CreditCardService.Delete(card)
            .then(function () {
                $uibModalInstance.close('deleted');
                $rootScope.$broadcast('deletecreditCard');
            })
            .catch(function () {
                toastr('Sorry, something went wrong. Please try again.')
            });
    };
}

function CreditCardController($rootScope, AccountService, toastr, $scope, $uibModal, $filter, CreditCardService, OrderCloud, CreditCards, CurrentUser,checkOutService,AddressValidationService) {
    var vm = this;
    vm.list = CreditCards.Items;
    vm.newcreditcard = false;
    vm.editcreditcard = false;
    $rootScope.$on('deletecreditCard', function () {
        OrderCloud.Me.ListCreditCards(null, 1, 100).then(function (res) {
            vm.list = res.Items;
        });
    });

    AccountService.ListBillingAddress(CurrentUser.ID).then(function (res) {
        vm.addressBook = res.addresses;
    }); 

    vm.newCardInput = function () {
        if (vm.list.length == 3) {
            var modalInstance = $uibModal.open({
                animation: true,
                windowClass: 'CardExceedLimitPopup',
                template: '<div class="">' +
                '<div class="">' +
                '<div class="">' +
                '<a>' +
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
                '</a>' +
                '</div>' +
                '<p>You have added maximum of 3 credit cards, please delete one to add more</p>' +
                '<button class="cancel-btn" ng-click="messagectrl.canceldel()">Ok</button>' +
                '</div>' +
                '</div>',
                controller: 'messageCtrl',
                controllerAs: 'messagectrl'
            });
            modalInstance.result.then(function () {

            }, function () {
                angular.noop();
            });
        } else {
            vm.newcreditcard = true;
            vm.editcreditcard = false;
            vm.card = null;
        }
    };
    vm.editCardInput = function (card) {
        vm.newcreditcard = false;
        vm.editcreditcard = true;
        vm.card = card;
        vm.card.ExpMonth = vm.card.ExpirationDate.substring(5, 7);
        vm.card.ExpYear = vm.card.ExpirationDate.substring(0, 4);
        vm.card.expYearDD = parseInt(vm.card.ExpirationDate.substring(2, 4));
    };
    vm.ccc = function () {
        alert("fdddsds");
    }

    vm.saveNewAddress = function(addr){
        if(vm.newAddressForm.$valid){
            AddressValidationService.Validate(addr).then(function (res) {
                if (res.ResponseBody.ResultCode == 'Success') {
                    var validatedAddress = res.ResponseBody.Address;
                    var zip = validatedAddress.PostalCode.substring(0, 5);
                    addr.Zip = parseInt(zip);
                    addr.City = validatedAddress.City;
                    addr.State = validatedAddress.Region;
                    addr.Country = validatedAddress.Country;
                    OrderCloud.Addresses.Create(addr).then(function (res1) {
                        vm.addressBook.push(res1);
                        var obj = { "AddressID": res1.ID, "UserID": CurrentUser.ID, "IsBilling": addr.Billing?addr.Billing:false, "IsShipping": addr.Shipping?addr.Shipping:false };
                        OrderCloud.Addresses.SaveAssignment(obj).then(function (res) {
                        });
                        vm.cardnewaddress=false;
                        vm.addr={};
                    });
                } else {
                    toastr.error('Address validation failed.');
                }
            });
        } else {
            toastr.error('Please fill the form.');
        }
    }

    vm.getLocation = function (zip) {
        if (zip && zip.toString().length == 5) {
            AccountService.getCityState(zip).then(function (res) {
                console.log("res==", res);
                if (res.Cities) {
                    vm.addr.City = res.Cities[0];
                    vm.Cities = res.Cities;
                    vm.addr.State = res.State;
                } else {
                    vm.Cities = null;
                    vm.addr.City = res.City;
                    vm.addr.State = res.State;
                }
            });
        }
    }
    
    vm.IsPhone = function ($e) {
        var keyCode = $e.which ? $e.which : $e.keyCode;
        var ret = ((keyCode >= 48 && keyCode <= 57) || specialKeys.indexOf(keyCode) != -1);
        if (!ret)
            $e.preventDefault();
    }

    vm.createCard = function (card) {
        if(vm.CreditCardCreateForm.$valid){
            card.CVV = "999";
            console.log("card.CVV"+vm.addressBook[parseInt(card.selectedAddress)].ID);
            card.CardType = AccountService.GetCardType(card.CardNumber);
            CreditCardService.Create(card).then(function (res) {
                if(card.selectedAddress == "newAddress"){
                    
                }else{
                    OrderCloud.Me.PatchCreditCard(res.ResponseBody.ID, { "xp": { "BillingAddressID": vm.addressBook[parseInt(card.selectedAddress)].ID } }).then(function (res2) {
                        console.log(res2);
                    });
                }
                OrderCloud.Me.ListCreditCards(null, 1, 100).then(function (response) {
                    vm.list = response.Items;
                    vm.newcreditcard = false;
                    vm.card={};
                    var filt = _.findWhere(vm.list, {
                        ID: cardID
                    });
                    vm.list = _.without(vm.list, _.findWhere(vm.list, {
                        ID: cardID
                    }));
                    vm.list.unshift(filt);
                });
            }).catch(function () {
                toastr.error('Sorry, something went wrong. Please check your card data and try again.');
            })
        } else {
            toastr.error('Please fill the form.');
        }
    };
    vm.cardtypeDetect = function (cardnumber) {
        //vm.card=card;
        console.log("cardnumber", cardnumber);
        if (CardNumber.length == 4) {
            vm.cardType = AccountService.GetCardType(CardNumber);
        }


    }

    vm.YearDropDown = function () {
        var num = $filter('date')(new Date(), "yy");
        var years = [];
        for (var i = 0; i < 12; i++) {
            years.push(parseInt(num) + i);
        }
        vm.years = years;
    }
    vm.replaceBetween = function (string, start, end, what) {
        return string.substring(0, start) + what + string.substring(end);
    };
    vm.updateCard = function () {
        // vm.card.ExpirationDate.substring(5, 7) = vm.card.ExpMonth;
        // vm.card.ExpirationDate.substring(2, 4) = vm.card.expYearDD.toString();
        vm.card.ExpirationDate = vm.replaceBetween(vm.card.ExpirationDate, 2, 4, vm.card.expYearDD.toString());
        CreditCardService.Update(vm.card)
            .then(function () {
                vm.card = null;
                vm.editcreditcard = false;
                OrderCloud.Me.ListCreditCards(null, 1, 100)
                    .then(function (ccs) {
                        vm.list = ccs.Items
                    })
            })
            .catch(function () {
                toastr('Sorry, something went wrong. Please check your card data and try again.')
            });
    };
    /*vm.deleteCard = function(card) {
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
       };*/
    /*vm.billingaddressbind=function(){
        vm.vvv=AddressList;
        console.log("address are---",vm.vvv);
    }*/
    vm.makedefaultcard = function (cardID) {
        vm.cards = vm.list;
        var filt = _.findWhere(vm.list, {
            ID: cardID
        });
        vm.list = _.without(vm.list, _.findWhere(vm.list, {
            ID: cardID
        }));
        vm.list.unshift(filt);
        OrderCloud.Users.Patch(CurrentUser.ID, { "xp": { "CreditCardDefaultId": cardID } }).then(function (res) { });
    }
    OrderCloud.Me.Get().then(function (user) {
        var filt = _.findWhere(vm.list, {
            ID: user.xp.CreditCardDefaultId
        });
        vm.list = _.without(vm.list, _.findWhere(vm.list, {
            ID: user.xp.CreditCardDefaultId
        }));
        vm.list.unshift(filt);
        vm.defaultUserCardID = user.xp.CreditCardDefaultId;
    });
    vm.deletePopupCard = function (cardid) {
        var modalInstance = $uibModal.open({
            animation: true,
            windowClass: 'deletePopup',
            template: '<div class="">' +
            '<div class="">' +
            '<div class="">' +
            '<a>' +
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
            '</a>' +
            '</div>' +
            '<p>Are you sure you want to delete?</p>' +
            '<button class="save-btn" ng-click="deleteCreditcardctrl.deleteCard()">Ok</button>' +
            '<button class="cancel-btn" ng-click="deleteCreditcardctrl.canceldel()">Cancel</button>' +
            '</div>' +
            '</div>',
            controller: 'deleteCreditcardCtrl',
            controllerAs: 'deleteCreditcardctrl',
            resolve: {
                card: function () {
                    return cardid;
                }
            }
        });
        modalInstance.result.then(function (card) {
            console.log("dsfsd", card);
        }, function () {
            angular.noop();
        });
    }

}

function ChangePasswordController($state, $scope, $uibModalInstance, $exceptionHandler, toastr, AccountService, CurrentUser, NewUser) {
    var vm = this;
    vm.free = NewUser;
    console.log(vm.free);
    $scope.canceldel = function () {

        $uibModalInstance.dismiss('cancel');
    };
    $scope.changePwd = function () {
        AccountService.ChangePassword(CurrentUser, vm.free)
            .then(function () {
                $scope.canceldel();
                toastr.success('Password successfully changed', 'Success!');
                vm.currentUser.CurrentPassword = vm.CurrentUser.CurrentPassword;
                vm.currentUser.NewPassword = vm.free.NewPassword;
                vm.currentUser.ConfirmPassword = CurrentUser.ConfirmPassword;
            })
            .catch(function (ex) {
                $exceptionHandler(ex)
            });
    }
}

function WishlistController(WishList) {
    var vm = this;
    vm.wishList = WishList;
    console.log("wwwwwwwishhhh", vm.wishList);

}

function DelWishlistController($uibModalInstance, WishList, $scope, OrderCloud, $state, SelectedWishList, CurrentUser) {

    $scope.canceldel = function () {

        $uibModalInstance.dismiss('cancel');
    };
    $scope.DeleteWishListProduct = function () {
        $uibModa$indexlInstance.dismiss('cancel');
        var indx = CurrentUser.xp.WishList.indexOf(SelectedWishList);
        CurrentUser.xp.WishList.splice(indx, 1);
        OrderCloud.Me.Patch(CurrentUser)
            .then(function (data) {
                $state.go($state.current, {}, { reload: true });
            })
    }
}

function DemoController($uibModalInstance, $scope, OrderCloud, SelectedAddr, $state) {
    var vm = this;
    $scope.canceldel = function () {

        $uibModalInstance.dismiss('cancel');
    };
    $scope.Del = function () {
        $uibModalInstance.dismiss('cancel');
        OrderCloud.Addresses.Delete(SelectedAddr, 'Bachmans').then(function (res) {
            $state.go('account.addresses', {}, { reload: true });
        })
    }

}

function EmailSubscriptionController($exceptionHandler, subscriptions, Underscore, ConstantContact, CurrentUser, toastr, AccountService, LoginFact) {
    var vm = this;
    vm.user = CurrentUser;
    vm.subscriptions = subscriptions;
    vm.oldSubscriptions = angular.copy(vm.subscriptions);
    console.log("subscription list are=", vm.oldSubscriptions);

    vm.updateContact = function () {
        var list = Underscore.filter(vm.subscriptions, function (subscription) {
            return subscription.Checked == true;
        })
        var obj = {
            "id": vm.user.xp.ConstantContact.ID,
            "lists": list,
            "email_addresses": [{ "email_address": vm.user.Email }]
        }
        ConstantContact.UpdateContact(obj).then(function () {
            toastr.success('Newsletter subscriptions updated', 'Success');
            AccountService.GetUpdateSubscription(vm.user.xp.ConstantContact.ID, vm.emailsubscribe).then(function (res) {
                vm.subscriptions = res;
                vm.oldSubscriptions = angular.copy(vm.subscriptions);
            });
        })

    };

}

function TrackOrderController($exceptionHandler, TrackOrder, toastr, CurrentUser, AccountService, $q) {
    var vm = this;
    vm.track_orders = TrackOrder;

}

function ProfileController($http, $exceptionHandler, $anchorScroll, $location, $state, $uibModal, toastr, OrderCloud, AccountService, CurrentUser, Underscore, $q, $scope) {
    var vm = this;
    vm.newuser = {};
    vm.profileData = angular.copy(CurrentUser);

    vm.top = function () {
        AccountService.GoTop();
    }

    if (vm.profileData.xp && vm.profileData.xp.ContactAddr) {
        OrderCloud.Addresses.Get(vm.profileData.xp.ContactAddr).then(function (res) {
            vm.profileData.contactAddress = res;
        });
    }

    vm.changeEmail = function () {
        var obj = { "Email": vm.change_email };
        if(CurrentUser.Email != vm.change_email) {
            OrderCloud.Users.Patch(CurrentUser.ID, obj).then(function (rrr) {
                vm.emailid = rrr;
                $state.go($state.current, {}, {reload: true});
            })
        }
        else{
            toastr.error('You entered same Email id');
        }
    }

    var phn = vm.profileData.Phone;
    if (vm.profileData.Phone) {
        AccountService.GetPhoneNumber(vm.profileData.Phone).then(function (res) {
            vm.profileData.Phone1 = res[0];
            vm.profileData.Phone2 = res[1];
            vm.profileData.Phone3 = res[2];
        });
    }

    vm.editAddressForProfile = function () {
        vm.userData = angular.copy(vm.profileData);
    }

    vm.saveUserProfileInfo = function () { 
        vm.profileData.Phone = "(" + vm.profileData.Phone1 + ") " + vm.profileData.Phone2 + " - " + vm.profileData.Phone3;
        var profile_addr = vm.userData.contactAddress;
        profile_addr.Country = "US";
        if (!vm.profileData.xp.ContactAddr) {
            OrderCloud.Addresses.Create(profile_addr).then(function (res) {
                vm.profileData.xp.ContactAddr = res.ID;
                OrderCloud.Users.Update(vm.profileData.ID, vm.profileData).then(function (res) { });
            });
        } else {
            OrderCloud.Addresses.Update(vm.profileData.xp.ContactAddr, profile_addr).then(function (res) {
                OrderCloud.Users.Update(vm.profileData.ID, vm.profileData).then(function (res) { });
            });
            }
            $location.hash('top');
            $anchorScroll();
        // start  user integartion to Egle
        var data = {
            "CustomerID":vm.profileData.ID,
            "Action":"update"
        }
        $http({

            method: 'POST',
            dataType:"json",
            url:"https://Four51TRIAL104401.jitterbit.net/Bachmans_Dev/four51_to_eagle_filecreate",
            data: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }

        }).success(function (data, status, headers, config) {
        }).error(function (data, status, headers, config) {
        });
        // endof user integartion to Egle


        $location.hash('top');
        $anchorScroll();
    }
    //_------ END FOR ADDRESS DISPLY IN CONTACT INFORMATION-------//
    vm.getZip = function (zip) {
        if (zip.length == 5) {
            AccountService.getCityState(zip).then(function (res) {
                vm.userData.contactAddress.City = res.City;
                vm.userData.contactAddress.State = res.State;
            });
        }
    }
    vm.saveAddress = function (userData) {
        //saveAddr.Phone = "("+contact.Phone1+")"+contact.Phone2+"-"+contact.Phone3;
        OrderCloud.Addresses.Update(saveAddr.ID, saveAddr).then(function () {
            $state.go('profile.addresses', {}, { reload: true });
        })
    }
    vm.getZipEdit = function (zip) {
        AccountService.getCityState(zip).then(function (res) {
            vm.editAddr.City = res.City;
            vm.editAddr.State = res.State;
        });
    }
    vm.stateSelected = function (stateSelected) {
        vm.stateData = stateSelected;
    };
    vm.ChangePasswordPopUp = function () {
        console.log(vm.newuser);
        var modalInstance = $uibModal.open({
            animation: false,
            windowClass: 'deletePopup',
            template: '<div class="">' +
            '<div class="">' +
            '<div class="">' +
            '<a>' +
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
            '</a>' +
            '</div>' +
            '<p>Are you sure you want to change password?</p>' +
            '<button class="save-btn" ng-click="changePwd()">Ok</button>' +
            '<button class="cancel-btn" ng-click="canceldel()">Cancel</button>' +
            '</div>' +
            '</div>',
            controller: 'ChangePasswordCtrl',
            controllerAs: 'ChangePassword',
            resolve: {
                CurrentUser: function () {
                    return CurrentUser;
                },
                NewUser: function () {
                    return vm.newuser;
                }
            }
        });
        modalInstance.result.then(function () {

        }, function () {
            angular.noop();
        });
    }
    /*vm.changePwd = function() {
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
    };*/
    /*    OrderCloud.Me.ListAddresses().then(function(dadd){
     console.log("addresses are---",dadd)
     _.filter(dadd.Items,function(row){
     if(row.xp.IsDefault){
     console.log(" default address is---",row)
     vm.default_add=row;
     }
     })

     })*/
    vm.editAdressDefault = function (profileData) {
        vm.editaddress = !vm.editaddress;
        vm.userData = angular.copy(profileData);
    }
    vm.saveAddressDefault = function (userData) {

        OrderCloud.Me.Patch(userData.ID, userData).then(function (res) {
            vm.profileData = vm.userData;
            vm.editaddress = !vm.editaddress;
        });
    }
    vm.stateSelected = function (stateSelected) {
        vm.stateData = stateSelected;
    };

    var specialKeys = new Array();
    specialKeys.push(8);
    vm.IsNumeric = function ($e) {
        console.log($e);
        var keyCode = $e.which ? $e.which : $e.keyCode;
        var ret = ((keyCode >= 48 && keyCode <= 57) || specialKeys.indexOf(keyCode) != -1);
        if (!ret)
            $e.preventDefault();
    }
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
/*  lat = "44.9706756";
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
