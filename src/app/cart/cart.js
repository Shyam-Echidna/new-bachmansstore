angular.module('orderCloud')

    .config(CartConfig)
    .controller('CartCtrl', CartController)
    .controller('MiniCartCtrl', MiniCartController)
    .controller('ProductRequestCtrl', ProductRequestController)
    .controller('ChangeRecipientPopupCtrl', ChangeRecipientPopupController)
    .directive('ordercloudMinicart', OrderCloudMiniCartDirective)
    .factory('CartService', CartService)
    .controller('EditRecipientPopupCtrl', EditRecipientPopupController)

    ;

function CartConfig($stateProvider) {
    $stateProvider
        .state('cart', {
            parent: 'base',
            //data: {componentName: 'Cart'},
            url: '/cart',
            templateUrl: 'cart/templates/cart.tpl.html',
            controller: 'CartCtrl',
            controllerAs: 'cart',
            params: {
                ID: null
            },
            resolve: {
                Order: function ($rootScope, $q, $state, toastr, CurrentOrder, OrderCloud, TaxService) {
                    var dfd = $q.defer();
                    CurrentOrder.GetID()
                        .then(function (orderID) {
                            TaxService.GetTax(orderID)
                                .then(function() {
                                    OrderCloud.Orders.Get(orderID)
                                        .then(function (order) {
                                            dfd.resolve(order);
                                        });
                                });
                        })
                        .catch(function () {
                            dfd.resolve();
                        });
                    return dfd.promise;
                },/*
                CurrentOrderResolve: function(Order, $state) {
                    if (!Order) {
                        $state.go('home');
                    }
                },*/
                LineItemsList: function ($q, $state, Order, Underscore, OrderCloud, toastr, LineItemHelpers) {
                    var dfd = $q.defer();
                    if (Order != 0) {
                        OrderCloud.LineItems.List(Order.ID)
                            .then(function (data) {
                                if (!data.Items.length) {
                                    toastr.error("Your order does not contain any line items.", 'Error');
                                    if ($state.current.name === 'cart') {
                                        $state.go('home');
                                    }
                                    dfd.reject();
                                }
                                else {
                                    LineItemHelpers.GetProductInfo(data.Items)
                                        .then(function () {
                                            dfd.resolve(data);
                                        });
                                }
                            })
                            .catch(function () {
                                toastr.error("Your order does not contain any line items.", 'Error');
                                dfd.reject();
                            });
                    }
                    else {
                        dfd.resolve(0);
                    }

                    return dfd.promise;
                },
                LoggedinUser: function (OrderCloud, $q) {
                    var deferred = $q.defer();
                    OrderCloud.Me.Get().then(function (res) {
                        console.log(res);
                        deferred.resolve(res);
                    })
                    return deferred.promise;
                }
            }
        });
}
function CartService($q, OrderCloud, $http) {
    return {
        CompareDate: _CompareDate,
        GetBuyerDtls: _GetBuyerDtls,
        GetDeliveryOptions: _GetDeliveryOptions,
        getCityState: _getCityState,
        GetPhoneNumber: _GetPhoneNumber
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

}

function CartController($q, $uibModal, $rootScope, $timeout, $scope, $state, OrderCloud, Order, LineItemHelpers, LineItemsList, PdpService, LoggedinUser, CartService, CurrentOrder) {
    var vm = this;
    vm.order = Order;
    vm.lineItems = LineItemsList;
    vm.removeItem = removeItem;
    vm.pagingfunction = PagingFunction;
    vm.signnedinuser = LoggedinUser;
    vm.editrecipient = editrecipient;
    vm.updateRecipientDetails = updateRecipientDetails;
    vm.getCityState = getCityState;
    vm.checkLineItemsAddress = checkLineItemsAddress;
    vm.changeDeliveryDate = changeDeliveryDate;
    vm.changerecipientpopup = changerecipientpopup;
    vm.editrecipientpopup = editrecipientpopup;
    vm.changeRecipientfun = changeRecipientfun;
    vm.changeQuantity = changeQuantity;

    vm.changeDate = changeDate;
    console.log(vm.order);
    vm.updateQuantity = function (cartOrder, lineItem) {
        $timeout.cancel();
        $timeout(function () {
            LineItemHelpers.UpdateQuantity(cartOrder, lineItem);
        }, 800);
    };

    function PagingFunction() {
        var dfd = $q.defer();
        if (vm.lineItems.Meta.Page < vm.lineItems.Meta.TotalPages) {
            OrderCloud.LineItems.List(vm.order.ID, vm.lineItems.Meta.Page + 1, vm.lineItems.Meta.PageSize)
                .then(function (data) {
                    vm.lineItems.Meta = data.Meta;
                    vm.lineItems.Items = [].concat(vm.lineItems.Items, data.Items);
                    LineItemHelpers.GetProductInfo(vm.lineItems.Items)
                        .then(function () {
                            dfd.resolve(vm.lineItems);
                        });
                });
        }
        else dfd.reject();
        return dfd.promise;
    }

    $rootScope.$on('OC:UpdateOrder', function (event, OrderID) {
        OrderCloud.Orders.Get(OrderID)
            .then(function (data) {
                vm.order = data;
            });
    });

    $rootScope.$on('OC:UpdateLineItem', function (event, Order) {
        OrderCloud.LineItems.List(Order.ID)
            .then(function (data) {
                LineItemHelpers.GetProductInfo(data.Items)
                    .then(function () {


                        vm.lineItems = data;
                    });
            });
    });

    vm.wishlist = function (productID) {
        alert("test");
        PdpService.AddToWishList(productID);
    }

    angular.forEach(vm.lineItems.Items, function (line) {

        line.xp.deliveryDate = new Date(line.xp.deliveryDate);
    });

    var data = _.groupBy(vm.lineItems.Items, function (value) {
        if (value.ShippingAddress != null) {

            //totalCost += value.xp.TotalCost;
            return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.ShippingAddress.Zip;
        }
    });

    vm.groups = data;
    vm.linetotalvalue = 0;
    vm.lineVal = [];
    vm.lineTotal = {};
    vm.changerecipientarr = [];
    for (var n in vm.groups) {
        vm.lineVal.push(n);
        vm.lineTotal[n] = _.reduce(_.pluck(data[n], 'LineTotal'), function (memo, num) { return memo + num; }, 0);
    }

    console.log("vm.lineVal", vm.groups);

    vm.clearcart = function () {
        OrderCloud.Orders.Delete(vm.order.ID)
            .then(function(){
                CurrentOrder.Remove()
                    .then(function(){
                       $state.go('home');
                    });
        });
    };

    vm.closePopover = function () {
        vm.showDeliveryToolTip = false;
    };
    vm.deleteNote = {
        templateUrl: 'deleteNote.html',
    };
    vm.showproductrequest = {
        templateUrl: 'showproductrequest.html',
    };

    vm.productrequestpopup = function (lineItem) {
        console.log(lineItem);
        $uibModal.open({
            templateUrl: 'cart/templates/productrequest.tpl.html',
            backdropClass: 'productrequestpopup',
            windowClass: 'productrequestpopup',
            controller: 'ProductRequestCtrl',
            controllerAs: 'productRequest',
            resolve: {
                prodrequestdata: function () {
                    return lineItem;
                },
                Order: function () {
                    var order = vm.order
                    return order;
                }
            }
        });
    }


    function changeDeliveryDate(item) {
        //console.log(date);
        // OrderCloud.LineItems.Patch(vm.order.ID, date.ID, date.xp).then(function (res) {
        //     console.log(res);
        // })
        var data = [];
        data[0] = item;
        vm.updateRecipientDetails(data).then(function (s) {
            if (s = 'success') {
                vm.changeLineDate[index] = false;
            }
        })

    }
    // vm.edIt = function () {
    //     alert('ss');
    //     $('.recipient-details').find('span').attr('contenteditable', 'true');

    // }

    function editrecipient(data) {
        console.log(data);
        var deferred = $q.defer();
        // var log = [];
        // for (var i = 1; i < data.length; i++) {
        //     data[i].ShippingAddress = data[0].ShippingAddress;
        // }
        var shippingAddress = data[0].ShippingAddress
        var i = 0;
        var temppromise = [];
        angular.forEach(data, function (value, key) {

            temppromise[i] = OrderCloud.LineItems.SetShippingAddress(vm.order.ID, value.ID, shippingAddress);
            i++;
        });
        $q.all(temppromise).then(function (result) {
            vm.updateRecipientDetails(result).then(function (s) {
                if (s == 'Success') {
                    $state.reload();
                }
            });
            // var tmp = [];
            // angular.forEach(result, function (response) {
            //     tmp.push(response);
            // });
            // return tmp;
        })
        // .then(function (tmpResult) {

        //     console.log("tmpResult= ",tmpResult);
        // });



    }


    function changerecipientpopup(item) {
        $uibModal.open({
            templateUrl: 'cart/templates/changerecipientpopup.tpl.html',
            backdropClass: 'changerecipientpopup',
            windowClass: 'changerecipientpopup',
            controller: 'ChangeRecipientPopupCtrl',
            controllerAs: 'changeRecipientPopup',
            resolve: {
                Lineitem: function () {
                    return item;
                }
            }
        });
    }

    function editrecipientpopup(data) {
        $uibModal.open({
            templateUrl: 'cart/templates/editrecipientpopup.tpl.html',
            backdropClass: 'changerecipientpopup',
            windowClass: 'changerecipientpopup',
            controller: 'EditRecipientPopupCtrl',
            controllerAs: 'editRecipientPopup',
            resolve: {
                Lineitems: function () {
                    return data;
                }
            }
        });
    }

    OrderCloud.SpendingAccounts.ListAssignments(null, vm.signnedinuser.ID).then(function (result) {
        angular.forEach(result.Items, function (value, key) {
            console.log(value);
            OrderCloud.SpendingAccounts.Get(value.SpendingAccountID).then(function (data) {
                if (data.Name == "Purple Perks") {
                    vm.purpleperksacc = data;
                }
            })
        })
    })


    function changeRecipientfun(lineitem, addressforlineitem) {
        if (lineitem.ShippingAddress != addressforlineitem.ShippingAddress) {
            var data = []
            lineitem.ShippingAddress = addressforlineitem.ShippingAddress;
            data[0] = lineitem;
            console.log(lineitem, addressforlineitem);
            vm.updateRecipientDetails(data).then(function (s) {
                if (s == 'Success') {
                    $state.reload();
                    lineitem.showDeliveryToolTip=!lineitem.showDeliveryToolTip;
                }
            });
        }
          lineitem.showDeliveryToolTip=! lineitem.showDeliveryToolTip;
    }

    vm.checkDeliverymethod = checkDeliverymethod;
    function checkDeliverymethod(line) {
        var defered = $q.defer();

        vm.GetDeliveryMethods(line.ProductID).then(function (res) {

            if (res.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip)
                line.xp.DeliveryMethod = "DirectShip";


            if (res.xp.DeliveryChargesCatWise.DeliveryMethods.UPS) {
                line.xp.DeliveryMethod = 'UPS';

            }
            if (res.xp.DeliveryChargesCatWise.DeliveryMethods.LocalDelivery) {
                line.xp.DeliveryMethod = 'LocalDelivery';
                //vm.sameDay = true;
            }
            if (res.xp.DeliveryChargesCatWise.DeliveryMethods.UPS && res.xp.DeliveryChargesCatWise.DeliveryMethods.LocalDelivery) {
                if (line.ShippingAddress.City == "Minneapolis" || line.ShippingAddress.City == "Saint Paul") {
                    line.xp.DeliveryMethod = 'LocalDelivery';
                    //vm.sameDay = true;
                }
                else {

                    line.xp.DeliveryMethod = 'UPS';

                }
            }
            defered.resolve('success')

        });
        return defered.promise;

        //vm.callDeliveryOptions(line);

    }
    vm.GetDeliveryMethods = GetDeliveryMethods;
    function GetDeliveryMethods(prodID) {
        var deferred = $q.defer();
        OrderCloud.Categories.ListProductAssignments(null, prodID).then(function (res1) {

            //OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function(res2){
             //OrderCloud.Categories.Get('c2_c1_c1').then(function (res2) {
                OrderCloud.Categories.Get('c8_c9_c1').then(function (res2) {

                //OrderCloud.Categories.Get('c4_c1').then(function (res2) {

                deferred.resolve(res2);
            });
        });
        return deferred.promise;
    }
    vm.calculateDeliveryCharges = calculateDeliveryCharges;
    function calculateDeliveryCharges(line) {
        var d = $q.defer();
        CartService.GetDeliveryOptions(line, line.xp.DeliveryMethod).then(function (res) {

            var obj = {};

            if (line.xp.DeliveryMethod == 'LocalDelivery') {

                CartService.CompareDate(line.xp.deliveryDate).then(function (data) {
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

    function updateRecipientDetails(data) {
        var defered = $q.defer();
        OrderCloud.LineItems.List(vm.order.ID).then(function (res) {
            if (res.Items.length > 1) {
                var promises = [];
                var inum = 0;
                angular.forEach(data, function (val1) {
                    promises[inum] = calliteration(val1);
                    function calliteration(val1) {
                        var deferred = $q.defer();
                        var newLineItems = []
                        OrderCloud.LineItems.List(vm.order.ID).then(function (res) {
                            newLineItems = res.Items;
                            newLineItems.splice(_.indexOf(newLineItems, _.find(newLineItems, function (val) { return val.ID == val1.ID; })), 1);
                            vm.checkDeliverymethod(val1).then(function (r) {
                                if (r == 'success') {
                                    vm.checkLineItemsId(newLineItems, val1).then(function (id) {
                                        if (id == 'notsameId') {
                                            vm.checkLineItemsAddress(newLineItems, val1).then(function (address) {
                                                if (address == 'notsameAddress') {
                                                    vm.calculateDeliveryCharges(val1).then(function (r1) {
                                                        if (r1 == '1') {
                                                            vm.updateLinedetails(vm.order.ID, val1).then(function (u) {

                                                            })


                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })


                                }
                            });
                        });

                        return deferred.promise;
                    }
                    inum++;
                });
                $q.all(promises).then(function (result) {
                    var tmp = [];
                    angular.forEach(result, function (response) {
                        tmp.push(response.data);
                    });
                    return tmp;
                }).then(function (tmpResult) {
                    var combinedResult = tmpResult.join(", ");
                    console.log(combinedResult);
                    defered.resolve('success');
                });




            }
            else {
                angular.forEach(data, function (val1, key1, obj1) {
                    vm.getCityState(val1, val1.ShippingAddress.Zip).then(function (z) {
                        if (z == 'zip') {
                            vm.checkDeliverymethod(val1).then(function (r) {
                                if (r == 'success') {
                                    vm.calculateDeliveryCharges(val1).then(function (r1) {
                                        if (r1 == '1') {
                                            vm.updateLinedetails(vm.order.ID, val1).then(function (u) {
                                                if (u == 'updated') {
                                                    defered.resolve('success');
                                                }
                                            })

                                        }
                                    })
                                }
                            });
                        }
                    });

                });

            }
           
        });
        return defered.promise;
    }
    vm.updateLinedetails = updateLinedetails;
    function updateLinedetails(args, newline) {
        var defered = $q.defer()
        OrderCloud.LineItems.Update(args, newline.ID, newline).then(function (dat) {
            console.log("LineItemsUpdate", JSON.stringify(newline.ShippingAddress));
            OrderCloud.LineItems.SetShippingAddress(args, newline.ID, newline.ShippingAddress).then(function (data) {
                console.log("SetShippingAddress", data);
                alert("Data submitted successfully");
                //vm.getLineItems();
                defered.resolve('updated')
            });

        });
        return defered.promise;
    }

    function getCityState(line, zip) {
        var defered = $q.defer();
        CartService.getCityState(zip).then(function (res) {
            line.ShippingAddress.City = res.City;
            line.ShippingAddress.State = res.State;
            line.ShippingAddress.Country = res.Country;
            defered.resolve('zip')
        });
        return defered.promise;
    }

    function checkLineItemsAddress(res, line) {
        var count = 0;
        var deferred = $q.defer();
        angular.forEach(res, function (val, key, obj) {

            var a = new Date(val.xp.deliveryDate);
            var b = new Date(line.xp.deliveryDate);

            var DateA = Date.UTC(a.getFullYear(), a.getMonth() + 1, a.getDate());
            var DateB = Date.UTC(b.getFullYear(), b.getMonth() + 1, b.getDate());

            if (val.ShippingAddress.FirstName == line.ShippingAddress.FirstName && val.ShippingAddress.LastName == line.ShippingAddress.LastName && (val.ShippingAddress.Street1).split(/(\d+)/g)[1] == (line.ShippingAddress.Street1).split(/(\d+)/g)[1] && DateA == DateB) {
                if (count == 0) {
                    line.xp.TotalCost = parseFloat(line.UnitPrice) * parseFloat(line.Quantity);
                    count++
                    vm.updateLinedetails(vm.order.ID, line).then(function (u) {
                        if (u == 'updted') {
                            deferred.resolve('sameAddress');
                        }
                    })

                }
            }
        });
        if (count == 0) {
            deferred.resolve('notsameAddress');
        }

        return deferred.promise;
    }
    vm.checkLineItemsId = checkLineItemsId;
    function checkLineItemsId(res, line) {
        var deferred = $q.defer();
        var count = 0;

        angular.forEach(res, function (val, key, obj) {
            var a = new Date(val.xp.deliveryDate);
            var b = new Date(line.xp.deliveryDate);

            var DateA = Date.UTC(a.getFullYear(), a.getMonth() + 1, a.getDate());
            var DateB = Date.UTC(b.getFullYear(), b.getMonth() + 1, b.getDate());

            if (val.ProductID == line.ProductID && val.ShippingAddress.FirstName == line.ShippingAddress.FirstName && val.ShippingAddress.LastName == line.ShippingAddress.LastName && (val.ShippingAddress.Street1).split(/(\d+)/g)[1] == (line.ShippingAddress.Street1).split(/(\d+)/g)[1] && val.xp.DeliveryMethod == line.xp.DeliveryMethod && DateA == DateB) {
                if (count == 0) {
                    val.Quantity += line.Quantity;
                    vm.calculateDeliveryCharges(val).then(function (data) {
                        if (data == '1') {
                            vm.updateLinedetails(vm.order.ID, val).then(function (u) {
                                // if (u == 'updated') {

                                // }
                            })
                        }
                    });
                    count++
                    OrderCloud.LineItems.Delete(vm.order.ID, line.ID).then(function (data) {
                        console.log("Lineitemdeleted", data);
                    });
                    deferred.resolve('sameId');
                }
            }

        });
        if (count == 0) {
            deferred.resolve('notsameId');
        }
        return deferred.promise;
    }

    console.log(angular.element(document.getElementById("changerecipientid")).scope());
    $rootScope.$on('newRecipientCreated', function (events, Lineitem) {
        var data = []
        data[0] = Lineitem;
        console.log('Lineitem', Lineitem);
        vm.updateRecipientDetails(data).then(function (s) {
            if (s == 'Success') {
                $state.reload();
            }
        });
    });
    $rootScope.$on('recipientEdited', function (events, Lineitems) {

        vm.editrecipient(Lineitems);
    });
    function changeQuantity(lineItem) {

        OrderCloud.LineItems.Get(vm.order.ID, lineItem.ID).then(function (data) {
            console.log("LineitemQuantity", data);
            var lineitemFee = parseFloat(data.xp.TotalCost) - parseFloat(data.Quantity * data.UnitPrice);
            lineItem.xp.TotalCost = lineitemFee + (lineItem.Quantity * lineItem.UnitPrice);
            OrderCloud.LineItems.Update(vm.order.ID, lineItem.ID, lineItem).then(function (dat) {
                console.log("LineItemsUpdate", JSON.stringify(dat));
                OrderCloud.LineItems.SetShippingAddress(vm.order.ID, lineItem.ID, lineItem.ShippingAddress).then(function (data) {
                    console.log("SetShippingAddress", data);
                    alert("Data submitted successfully");
                    //vm.getLineItems();

                });

            });
        });
    }
    vm.changeLineDate = []
    function changeDate(index) {
        vm.changeLineDate[index] = (!!vm.changeLineDate[index]) ? false : true;
        console.log(index);
    }
    function removeItem(order, lineItem) {
        var defered = $q.defer();
        var newLineItems = [];
        var data = [];
        data[0] = lineItem;
        //vm.deleteLineItem();
        OrderCloud.LineItems.List(vm.order.ID).then(function (res) {
            if (res.Items.length > 1) {
                if (lineItem.TotalCost == (lineItem.UnitPrice * lineItem.Quantity)) {
                    // deleteLineItem
                    vm.RemoveLineItem(order, lineItem);
                }
                else {
                    newLineItems = res.Items;
                    var count = 0;

                    angular.forEach(data, function (val1, key1, obj1) {
                        newLineItems.splice(_.indexOf(newLineItems, _.find(newLineItems, function (val) { return val.ID == val1.ID; })), 1);

                        count++;

                    });
                    console.log('newLineItems', newLineItems);

                    // });
                    if (count > 0) {
                        vm.checkLineItemFeeDetails(newLineItems, lineItem).then(function (FeeDetails) {

                            if (FeeDetails == 'LineItemFeeDetailsupdated' || FeeDetails == 'LineItemFeeDetailsNotupdated') {
                                //deleteLineItem
                                vm.RemoveLineItem(order, lineItem);

                            }
                            // if (FeeDetails == 'LineItemFeeDetailsNotupdated') {

                            // }
                        })
                    }
                }
            }
            else {
                //deleteLineItem
                vm.RemoveLineItem(order, lineItem);
            }

        });
    }
    vm.checkLineItemFeeDetails = checkLineItemFeeDetails;
    function checkLineItemFeeDetails(res, line) {
        var count = 0;
        var deferred = $q.defer();
        angular.forEach(res, function (val, key, obj) {

            var a = new Date(val.xp.deliveryDate);
            var b = new Date(line.xp.deliveryDate);

            var DateA = Date.UTC(a.getFullYear(), a.getMonth() + 1, a.getDate());
            var DateB = Date.UTC(b.getFullYear(), b.getMonth() + 1, b.getDate());

            if (val.ShippingAddress.FirstName == line.ShippingAddress.FirstName && val.ShippingAddress.LastName == line.ShippingAddress.LastName && (val.ShippingAddress.Street1).split(/(\d+)/g)[1] == (line.ShippingAddress.Street1).split(/(\d+)/g)[1] && DateA == DateB) {
                if (count == 0) {
                    line.xp.TotalCost = parseFloat(line.UnitPrice) * parseFloat(line.Quantity);
                    count++
                    vm.calculateDeliveryCharges(val).then(function (r1) {
                        if (r1 == '1') {
                            vm.updateLinedetails(vm.order.ID, val).then(function (u) {
                                if (u == 'updated') {

                                    deferred.resolve('LineItemFeeDetailsupdated');
                                }
                            })


                        }
                    })


                }
            }
        });
        if (count == 0) {
            deferred.resolve('LineItemFeeDetailsNotupdated');
        }

        return deferred.promise;
    }
    vm.RemoveLineItem = RemoveLineItem;
    function RemoveLineItem(Order, LineItem) {
        OrderCloud.LineItems.Delete(Order.ID, LineItem.ID)
            .then(function () {
                // If all line items are removed delete the order.
                OrderCloud.LineItems.List(Order.ID)
                    .then(function (data) {
                        if (!data.Items.length) {
                            CurrentOrder.Remove();
                            OrderCloud.Orders.Delete(Order.ID).then(function () {
                                $state.reload();
                                $rootScope.$broadcast('OC:RemoveOrder');
                            });
                        } else {
                            $state.reload();
                        }
                    });
            });
    }

    /*carousel*/

    setTimeout(function(){
   angular.element("#owl-carousel-cart").owlCarousel({
    loop: true,
    center: true,
    margin: 12,
    nav: true,
    responsive: {
                // breakpoint from 0 up
                0: {
                    items: 1
                },
                // breakpoint from 328 up..... mobile portrait
                320: {
                    items: 2
                },
                // breakpoint from 328 up..... mobile landscape
                568: {
                    items: 2
                },
                960: {
                    items: 3
                },
                // breakpoint from 768 up
                768: {
                    items: 3
                },
                1024: {
                    items: 4
                },
                1200: {
                    items: 4
                },
                1500: {
                    items: 4
                }
            }

   });

});
}

function MiniCartController($q, $state, $rootScope, OrderCloud, LineItemHelpers, CurrentOrder) {
    var vm = this;
    vm.LineItems = {};
    vm.Order = null;
    vm.showLineItems = false;


    vm.getLI = function () {
        CurrentOrder.Get()
            .then(function (data) {
                vm.Order = data;
                if (data) vm.lineItemCall(data);
            });
    };

    vm.getLI();

    vm.checkForExpress = function () {
        var expressCheckout = false;
        angular.forEach($state.get(), function (state) {
            if (state.url && state.url == '/expressCheckout') {
                expressCheckout = true;
                return expressCheckout;
            }
        });
        return expressCheckout;
    };

    vm.checkForCheckout = function () {
        var checkout = false;
        angular.forEach($state.get(), function (state) {
            if (state.url && state.url == '/checkout') {
                checkout = true;
                return checkout;
            }
        });
        return checkout;
    };

    vm.goToCart = function () {
        $state.go('cart', {}, { reload: true });
    };

    vm.lineItemCall = function /*getLineItems*/(order) {
        var dfd = $q.defer();
        var queue = [];
        OrderCloud.LineItems.List(order.ID)
            .then(function (li) {
                vm.LineItems = li;
                if (li.Meta.TotalPages > li.Meta.Page) {
                    var page = li.Meta.Page;
                    while (page < li.Meta.TotalPages) {
                        page += 1;
                        queue.push(OrderCloud.LineItems.List(order.ID, page));
                    }
                }
                $q.all(queue)
                    .then(function (results) {
                        angular.forEach(results, function (result) {
                            vm.LineItems.Items = [].concat(vm.LineItems.Items, result.Items);
                            vm.LineItems.Meta = result.Meta;
                        });
                        dfd.resolve(LineItemHelpers.GetProductInfo(vm.LineItems.Items.reverse()));
                    });
            });
        return dfd.promise;
    };

    $rootScope.$on('LineItemAddedToCart', function () {
        CurrentOrder.Get()
            .then(function (order) {
                vm.lineItemCall(order);
                vm.showLineItems = true;
            });
    });


    $rootScope.$on('OC:RemoveOrder', function () { //broadcast is in build > src > app > common > line items
        vm.Order = null;
        vm.LineItems = {};
    });
}

function OrderCloudMiniCartDirective() {
    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'cart/templates/minicart.tpl.html',
        controller: 'MiniCartCtrl',
        controllerAs: 'minicart'
    };
}

function ProductRequestController($uibModal, $scope, $stateParams, prodrequestdata, $uibModalInstance, OrderCloud, Order) {
    var vm = this;
    vm.order = Order;
    vm.prodrequestdata = prodrequestdata;
    vm.cancel = function () {
        $uibModalInstance.close();
    }

    vm.save = function (data) {
        console.log(data);
        var updateline = { "xp": data };
        OrderCloud.LineItems.Patch(vm.order.ID, vm.prodrequestdata.ID, updateline).then(function (test) {
            $uibModalInstance.close();
        })
    }
}
function ChangeRecipientPopupController($uibModal, $scope, $uibModalInstance, Lineitem, $rootScope, CartService) {
    var vm = this;
    vm.cancel = cancel;
    vm.getCityState = getCityState;
    vm.changedtls = changedtls;
    var item = {
        "Quantity": Lineitem.Quantity,

        "ShippingAddress": {},

        "xp": {}
    };
    item.xp.deliveryDate = Lineitem.xp.deliveryDate;
    vm.item = item;
    function cancel() {
        $uibModalInstance.dismiss('cancel');
    };


    function changedtls(data) {

        if (data.ShippingAddress.Phone1 && data.ShippingAddress.Phone2 && data.ShippingAddress.Phone3) {
            data.ShippingAddress.Phone = '(' + data.ShippingAddress.Phone1 + ')' + data.ShippingAddress.Phone2 + '-' + data.ShippingAddress.Phone3;
            delete data.ShippingAddress.Phone1;
            delete data.ShippingAddress.Phone2;
            delete data.ShippingAddress.Phone3;

        }
        console.log(data);
        Lineitem.ShippingAddress = data.ShippingAddress;
        $rootScope.$broadcast('newRecipientCreated', Lineitem);
        $uibModalInstance.dismiss('cancel');
    }
    function getCityState(item) {
        CartService.getCityState(item.ShippingAddress.Zip).then(function (res) {
            item.ShippingAddress.City = res.City;
            item.ShippingAddress.State = res.State;
            item.ShippingAddress.Country = res.Country;
        });
    }
}
function EditRecipientPopupController($uibModal, $scope, $uibModalInstance, Lineitems, $rootScope, CartService) {
    var vm = this;
    vm.cancel = cancel;
    vm.getCityState = getCityState;
    vm.changedtls = changedtls;
    var item = {
        "Quantity": Lineitems[0].Quantity,

        "ShippingAddress": {},

        "xp": {}
    };
    if (Lineitems[0].ShippingAddress.Phone) {
        CartService.GetPhoneNumber(Lineitems[0].ShippingAddress.Phone).then(function (res) {
            Lineitems[0].ShippingAddress.Phone1 = res[0];
            Lineitems[0].ShippingAddress.Phone2 = res[1];
            Lineitems[0].ShippingAddress.Phone3 = res[2];
        });


				}
    item.ShippingAddress = Lineitems[0].ShippingAddress;
    item.xp.deliveryDate = Lineitems[0].xp.deliveryDate;
    vm.item = item;
    function cancel() {
        $uibModalInstance.dismiss('cancel');
    };


    function changedtls(data) {

        if (data.ShippingAddress.Phone1 && data.ShippingAddress.Phone2 && data.ShippingAddress.Phone3) {
            data.ShippingAddress.Phone = '(' + data.ShippingAddress.Phone1 + ')' + data.ShippingAddress.Phone2 + '-' + data.ShippingAddress.Phone3;
            delete data.ShippingAddress.Phone1;
            delete data.ShippingAddress.Phone2;
            delete data.ShippingAddress.Phone3;

        }
        console.log(data);
        Lineitems[0].ShippingAddress = data.ShippingAddress;
        $rootScope.$broadcast('recipientEdited', Lineitems);
        $uibModalInstance.dismiss('cancel');
    }
    function getCityState(item) {
        CartService.getCityState(item.ShippingAddress.Zip).then(function (res) {
            item.ShippingAddress.City = res.City;
            item.ShippingAddress.State = res.State;
            item.ShippingAddress.Country = res.Country;
        });
    }
}
