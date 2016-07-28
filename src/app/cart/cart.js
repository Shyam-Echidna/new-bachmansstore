angular.module('orderCloud')

    .config(CartConfig)
    .controller('CartCtrl', CartController)
    .controller('MiniCartCtrl', MiniCartController)
    .controller('ProductRequestCtrl', ProductRequestController)
    .controller('ChangeReceipentPopupCtrl', ChangeReceipentPopupController)
    .directive('ordercloudMinicart', OrderCloudMiniCartDirective)
    .factory('CartService', CartService)
    .controller('EditReceipentPopupCtrl', EditReceipentPopupController)

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
                Order: function ($rootScope, $q, $state, toastr, CurrentOrder, OrderCloud) {
                    var dfd = $q.defer();
                    CurrentOrder.GetID()
                        .then(function (data) {
                            OrderCloud.As().Orders.Get(data).then(function (order) {
                                console.log(order);
                                dfd.resolve(order);
                            })
                        })
                        .catch(function () {
                            dfd.resolve(0);
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
                        OrderCloud.As().LineItems.List(Order.ID)
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
             OrderCloud.Categories.Get('c2_c1_c1').then(function (res2) {
                //OrderCloud.Categories.Get('c8_c9_c1').then(function (res2) {
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

function CartController($q, $uibModal, $rootScope, $timeout, $scope, $state, OrderCloud, Order, LineItemHelpers, LineItemsList, PdpService, LoggedinUser, CartService) {
    var vm = this;
    vm.order = Order;
    vm.lineItems = LineItemsList;
    vm.removeItem = LineItemHelpers.RemoveItem;
    vm.pagingfunction = PagingFunction;
    vm.signnedinuser = LoggedinUser;
    vm.editreceipent = editreceipent;
    vm.updateRecipientDetails = updateRecipientDetails;
    vm.getCityState = getCityState;
    vm.checkLineItemsAddress = checkLineItemsAddress;
    vm.changeDeliveryDate = changeDeliveryDate;
    vm.changereceipentpopup = changereceipentpopup;
    vm.editreceipentpopup = editreceipentpopup;
    vm.changeReceipentfun = changeReceipentfun;
    vm.changeQuantity = changeQuantity;

    vm.changeDate = false;
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
            OrderCloud.As().LineItems.List(vm.order.ID, vm.lineItems.Meta.Page + 1, vm.lineItems.Meta.PageSize)
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

    var data = _.groupBy(vm.lineItems.Items, function(value){
        if(value.ShippingAddress != null){

            //totalCost += value.xp.TotalCost;
            return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.ShippingAddress.Zip;
        }
    });

    vm.groups = data;
    vm.linetotalvalue = 0;
    vm.lineVal = [];
    vm.lineTotal = {};
    vm.changereceipentarr = [];
    for (var n in vm.groups) {
        vm.lineVal.push(n);
        vm.lineTotal[n] = _.reduce(_.pluck(data[n], 'LineTotal'), function (memo, num) { return memo + num; }, 0);
    }

    console.log("vm.lineVal", vm.groups);

    vm.clearcart = function () {
        OrderCloud.Orders.Delete(vm.order.ID);
        $state.reload();
    }

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
        // OrderCloud.As().LineItems.Patch(vm.order.ID, date.ID, date.xp).then(function (res) {
        //     console.log(res);
        // })
        var data = [];
        data[0] = item;
        vm.updateRecipientDetails(data).then(function (s) {
            if (s = 'success') {
                vm.changeDate = false;
            }
        })

    }
    // vm.edIt = function () {
    //     alert('ss');
    //     $('.recipient-details').find('span').attr('contenteditable', 'true');

    // }

    function editreceipent(data) {
        console.log(data);
        var log = [];
        for (var i = 1; i < data.length; i++) {
            data[i].ShippingAddress = data[0].ShippingAddress;
        }
        // angular.forEach(data, function(value, key){
        //     var updatefeilds={"FirstName":value.ShippingAddress.FirstName, "LastName":value.ShippingAddress.LastName, "Zip":value.ShippingAddress.Zip};
        //     console.log(updatefeilds);
        //     OrderCloud.As().LineItems.PatchShippingAddress(vm.order.ID, value.ID, updatefeilds).then(function(res){
        //         console.log(res);
        //        // OrderCloud.As().LineItems.PatchShippingAddress(vm.order.ID, value.ID, updatefeilds).then(function(res1){
        //           //  console.log(res1);
        //             $state.reload();
        //         //});
        //     });
        // },log);
        // OrderCloud.As().LineItems.List(vm.order.ID).then(function (res) {

        // var samezip = null
        // angular.forEach(data, function (val1, key1, obj1) {
        //     samezip = _.find(res.Items, function (i) { return i.ShippingAddress.Zip == val1.ShippingAddress.Zip; });
        //     count++;

        // });
        //if (samezip == undefined) {
        vm.updateRecipientDetails(data).then(function (s) {
            if (s == 'Success') {
                $state.reload();
            }
        });
        // }
        // else{
        // angular.forEach(data, function(value, key){
        //     var updatefeilds={"FirstName":value.ShippingAddress.FirstName, "LastName":value.ShippingAddress.LastName, "Zip":value.ShippingAddress.Zip};
        //     console.log(updatefeilds);
        //     OrderCloud.As().LineItems.PatchShippingAddress(vm.order.ID, value.ID, updatefeilds).then(function(res){
        //         console.log(res);
        //        // OrderCloud.As().LineItems.PatchShippingAddress(vm.order.ID, value.ID, updatefeilds).then(function(res1){
        //           //  console.log(res1);
        //             $state.reload();
        //         //});
        //     });
        // },log);
        //}

        // });


    }


    function changereceipentpopup(item) {
        $uibModal.open({
            templateUrl: 'cart/templates/changereceipentpopup.tpl.html',
            backdropClass: 'changereceipentpopup',
            windowClass: 'changereceipentpopup',
            controller: 'ChangeReceipentPopupCtrl',
            controllerAs: 'changeReceipentPopup',
            resolve: {
                Lineitem: function () {
                    return item;
                }
            }
        });
    }

    function editreceipentpopup(data) {
        $uibModal.open({
            templateUrl: 'cart/templates/editreceipentpopup.tpl.html',
            backdropClass: 'changereceipentpopup',
            windowClass: 'changereceipentpopup',
            controller: 'EditReceipentPopupCtrl',
            controllerAs: 'editReceipentPopup',
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


    function changeReceipentfun(lineitem, addressforlineitem) {

        var data = []
        lineitem.ShippingAddress = addressforlineitem.ShippingAddress;
        data[0] = lineitem;
        console.log(lineitem, addressforlineitem);

        // var lastrecp = data, selectedaddr = [];
        // var newline = {
        //     "ProductID": lastrecp.ProductID,
        //     "Quantity": lastrecp.Quantity,
        //     "xp": lastrecp.xp
        // }
        // //OrderCloud.As().LineItems.List(vm.order.ID).then(function(ans){

        // OrderCloud.As().LineItems.List(vm.order.ID).then(function (ans) {
        //     console.log(ans);
        //     var shippaddr = {};
        //     selectedaddr = _.filter(ans.Items, function (obj) {
        //         return _.indexOf([changereceipent], obj.ShippingAddress.FirstName) > -1
        //     });
        //     console.log("selectedaddr", selectedaddr);
        //     console.log(selectedaddr.ShippingAddress);
        //     angular.forEach(selectedaddr, function (value, key) {
        //         console.log(value);
        //         shippaddr = {
        //             "City": value.ShippingAddress.City,
        //             "FirstName": value.ShippingAddress.FirstName,
        //             "LastName": value.ShippingAddress.LastName,
        //             "Street1": value.ShippingAddress.Street1,
        //             "Street2": value.ShippingAddress.Street2,
        //             "State": value.ShippingAddress.State,
        //             "Zip": value.ShippingAddress.Zip,
        //             "Country": value.ShippingAddress.Country,
        //             "Phone": value.ShippingAddress.Phone
        //         }
        //         OrderCloud.As().LineItems.Delete(vm.order.ID, data.ID);
        //         OrderCloud.As().LineItems.Create(vm.order.ID, newline).then(function (res) {
        //             console.log(res);
        //             OrderCloud.As().LineItems.SetShippingAddress(vm.order.ID, res.ID, shippaddr).then(function (resq) {
        //                 $state.reload()
        //             })
        //         });
        //     })
        // })
        //})
        vm.updateRecipientDetails(data).then(function (s) {
            if (s == 'Success') {
                $state.reload();
            }
        });
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
             OrderCloud.Categories.Get('c2_c1_c1').then(function (res2) {
                //OrderCloud.Categories.Get('c8_c9_c1').then(function (res2) {
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
        var newLineItems = []
        OrderCloud.As().LineItems.List(vm.order.ID).then(function (res) {
            if (res.Items.length > 1) {
                newLineItems = res.Items;
                var count = 0;

                angular.forEach(data, function (val1, key1, obj1) {
                    newLineItems.splice(_.indexOf(newLineItems, _.find(newLineItems, function (val) { return val.ID == val1.ID; })), 1);

                    count++;

                });
                console.log('newLineItems', newLineItems);

                // });
                if (count > 0) {
                    var times = data.length;
                    var i = 0
                    calliteration(data[i], i, data);
                    function calliteration(val1, i, data) {
                        if (times != 0) {
                            // vm.getCityState(val1, val1.ShippingAddress.Zip).then(function (z) {
                            //     if (z == 'zip') {
                                    vm.checkDeliverymethod(val1).then(function (r) {
                                        if (r == 'success') {
                                            if (newLineItems.length != 0) {
                                                vm.checkLineItemsId(newLineItems, val1).then(function (id) {
                                                    if (id == 'sameId') {
                                                        i < times ? i++ : i;
                                                        times--;
                                                        updateLineItemsArray(data).then(function (arr) {
                                                            if (arr == 'updatedarray') {
                                                                calliteration(data[i], i, data);
                                                            }
                                                        })

                                                    }
                                                    else if (id == 'notsameId') {
                                                        vm.checkLineItemsAddress(newLineItems, val1).then(function (address) {
                                                            newLineItems.push(val1);
                                                            if (address == 'sameAddress') {
                                                                i < times ? i++ : i;
                                                                times--;
                                                                calliteration(data[i], i, data);

                                                            }
                                                            if (address == 'notsameAddress') {
                                                                vm.calculateDeliveryCharges(val1).then(function (r1) {
                                                                    if (r1 == '1') {
                                                                        vm.updateLinedetails(vm.order.ID, val1).then(function (u) {
                                                                            if (u == 'updated') {
                                                                                i < times ? i++ : i;
                                                                                times--;
                                                                                calliteration(data[i], i, data);
                                                                            }
                                                                        })


                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }
                                                })

                                            }
                                            else {
                                                vm.calculateDeliveryCharges(val1).then(function (r1) {
                                                    if (r1 == '1') {
                                                        newLineItems.push(val1);
                                                        vm.updateLinedetails(vm.order.ID, val1).then(function (u) {
                                                            if (u == 'updated') {
                                                                i < times ? i++ : i;
                                                                times--;
                                                                calliteration(data[i], i, data);
                                                            }
                                                        })


                                                    }
                                                })
                                            }
                                        }
                                    });
                            //     }//comment
                            // });///comment

                        }
                        if (times == 0) {
                            defered.resolve('success');
                        }
                    }


                }


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
            //defered.resolve('success')

            console.log(newLineItems);
            // });
            function updateLineItemsArray(data) {
                var defered = $q.defer()
                OrderCloud.As().LineItems.List(vm.order.ID).then(function (res) {

                    newLineItems = res.Items;
                    var count = 0;

                    angular.forEach(data, function (val1, key1, obj1) {
                        newLineItems.splice(_.indexOf(newLineItems, _.find(newLineItems, function (val) { return val.ID == val1.ID; })), 1);

                        count++;

                    });
                    console.log('Updatedlineitemsarray', newLineItems);
                    defered.resolve('updatedarray');


                });

                return defered.promise;

            }
        });
        return defered.promise;
    }
    vm.updateLinedetails = updateLinedetails;
    function updateLinedetails(args, newline) {
        var defered = $q.defer()
        OrderCloud.As().LineItems.Update(args, newline.ID, newline).then(function (dat) {
            console.log("LineItemsUpdate", JSON.stringify(newline.ShippingAddress));
            OrderCloud.As().LineItems.SetShippingAddress(args, newline.ID, newline.ShippingAddress).then(function (data) {
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

            if (val.ShippingAddress.FirstName == line.ShippingAddress.FirstName && val.ShippingAddress.LastName == line.ShippingAddress.LastName && (val.ShippingAddress.Street1).split(/(\d+)/g)[1] == (line.ShippingAddress.Street1).split(/(\d+)/g)[1] && val.xp.DeliveryMethod == line.xp.DeliveryMethod && DateA == DateB) {
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
                            vm.updateLinedetails(vm.order.ID, val);
                        }
                    });
                    count++
                    OrderCloud.As().LineItems.Delete(vm.order.ID, line.ID).then(function (data) {
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

    console.log(angular.element(document.getElementById("changereceipentid")).scope());
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

        vm.editreceipent(Lineitems);
    });
    function changeQuantity(lineItem) {

        OrderCloud.As().LineItems.Get(vm.order.ID, lineItem.ID).then(function (data) {
            console.log("Lineitemdeleted", data);
            var lineitemFee = parseFloat(data.xp.TotalCost) - parseFloat(data.Quantity * data.UnitPrice);
            lineItem.xp.TotalCost = lineitemFee + (lineItem.Quantity * lineItem.UnitPrice);
            OrderCloud.As().LineItems.Update(vm.order.ID, lineItem.ID, lineItem).then(function (dat) {
                console.log("LineItemsUpdate", JSON.stringify(dat));
                OrderCloud.As().LineItems.SetShippingAddress(vm.order.ID, lineItem.ID, lineItem.ShippingAddress).then(function (data) {
                    console.log("SetShippingAddress", data);
                    alert("Data submitted successfully");
                    //vm.getLineItems();
                   
                });

            });
        });
    }

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
        OrderCloud.As().LineItems.List(order.ID)
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
        OrderCloud.As().LineItems.Patch(vm.order.ID, vm.prodrequestdata.ID, updateline).then(function (test) {
            $uibModalInstance.close();
        })
    }
}
function ChangeReceipentPopupController($uibModal, $scope, $uibModalInstance, Lineitem, $rootScope, CartService) {
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
function EditReceipentPopupController($uibModal, $scope, $uibModalInstance, Lineitems, $rootScope, CartService) {
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
