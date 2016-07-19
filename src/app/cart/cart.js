angular.module('orderCloud')

    .config(CartConfig)
    .controller('CartCtrl', CartController)
    .controller('MiniCartCtrl', MiniCartController)
    .controller('ProductRequestCtrl', ProductRequestController)
    .controller('ChangeReceipentPopupCtrl', ChangeReceipentPopupController)
    .directive('ordercloudMinicart', OrderCloudMiniCartDirective)

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
                Order: function($rootScope, $q, $state, toastr, CurrentOrder, OrderCloud) {
                    var dfd = $q.defer();
                    CurrentOrder.GetID()
                        .then(function(data) {
                            OrderCloud.As().Orders.Get(data).then(function(order){
                                console.log(order);
                                dfd.resolve(order);
                            })
                        })
                        .catch(function() {
                            dfd.resolve(0);
                        });
                    return dfd.promise;
                },/*
                CurrentOrderResolve: function(Order, $state) {
                    if (!Order) {
                        $state.go('home');
                    }
                },*/
                LineItemsList: function($q, $state, Order, Underscore, OrderCloud, toastr, LineItemHelpers) {
                    var dfd = $q.defer();
                    if(Order!=0){
                        OrderCloud.As().LineItems.List(Order.ID)
                        .then(function(data) {
                            if (!data.Items.length) {
                                toastr.error("Your order does not contain any line items.", 'Error');
                                if ($state.current.name === 'cart') {
                                    $state.go('home');
                                }
                                dfd.reject();
                            }
                            else {
                                LineItemHelpers.GetProductInfo(data.Items)
                                    .then(function() {
                                        dfd.resolve(data);
                                    });
                            }
                        })
                        .catch(function() {
                            toastr.error("Your order does not contain any line items.", 'Error');
                            dfd.reject();
                        });
                    }
                    else{
                        dfd.resolve(0);
                    }
                    
                    return dfd.promise;
                },
                LoggedinUser: function(OrderCloud, $q){
                    var deferred = $q.defer();
                    OrderCloud.Me.Get().then(function(res){
                        console.log(res);
                        deferred.resolve(res);
                    })
                    return deferred.promise;
                }
            }
        });
}

function CartController($q, $uibModal, $rootScope, $timeout, $scope, $state, OrderCloud, Order, LineItemHelpers, LineItemsList, PdpService, LoggedinUser) {
    var vm = this;
    vm.order = Order;
    vm.lineItems = LineItemsList;
    vm.removeItem = LineItemHelpers.RemoveItem;
    vm.pagingfunction = PagingFunction;
    vm.signnedinuser = LoggedinUser;
    console.log(vm.order);
    vm.updateQuantity = function(cartOrder,lineItem){
        $timeout.cancel();
        $timeout(function(){
            LineItemHelpers.UpdateQuantity(cartOrder,lineItem);
        },800);
    };

    function PagingFunction() {
        var dfd = $q.defer();
        if (vm.lineItems.Meta.Page < vm.lineItems.Meta.TotalPages) {
            OrderCloud.As().LineItems.List(vm.order.ID, vm.lineItems.Meta.Page + 1, vm.lineItems.Meta.PageSize)
                .then(function(data) {
                    vm.lineItems.Meta = data.Meta;
                    vm.lineItems.Items = [].concat(vm.lineItems.Items, data.Items);
                    LineItemHelpers.GetProductInfo(vm.lineItems.Items)
                        .then(function() {
                            dfd.resolve(vm.lineItems);
                        });
                });
        }
        else dfd.reject();
        return dfd.promise;
    }

    $rootScope.$on('OC:UpdateOrder', function(event, OrderID) {
        OrderCloud.Orders.Get(OrderID)
            .then(function(data) {
                vm.order = data;
            });
    });

    $rootScope.$on('OC:UpdateLineItem', function(event,Order) {
            OrderCloud.LineItems.List(Order.ID)
                .then(function (data) {
                    LineItemHelpers.GetProductInfo(data.Items)
                        .then(function () {
                            vm.lineItems = data;
                        });
                });
    });

    vm.wishlist = function(productID){
        alert("test");
        PdpService.AddToWishList(productID);
    }

    var data = _.groupBy(vm.lineItems.Items, function(value){
        if(value.ShippingAddress != null){
            //totalCost += value.xp.TotalCost;
            return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName;
        }
    });

    vm.groups = data;
    vm.linetotalvalue=0;
    vm.lineVal = [];
    vm.lineTotal = {};
    vm.changereceipentarr=[];
    for(var n in vm.groups){
        vm.lineVal.push(n);
        vm.lineTotal[n] = _.reduce(_.pluck(data[n], 'LineTotal'), function(memo, num){ return memo + num; }, 0);
    }
    console.log("vm.lineVal", vm.groups);

    vm.clearcart = function(){
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

    vm.productrequestpopup = function(lineItem){
        console.log(lineItem);
        $uibModal.open({
            templateUrl: 'cart/templates/productrequest.tpl.html',
            backdropClass:'productrequestpopup',
            windowClass:'productrequestpopup',
            controller: 'ProductRequestCtrl',
            controllerAs: 'productRequest',
            resolve:{
                prodrequestdata: function(){
                    return lineItem;
                },
                Order: function(){
                    var order = vm.order 
                    return order;
                }
            }
        });
    }

    vm.deliverydate = function(date){
        console.log(date);
        OrderCloud.As().LineItems.Patch(vm.order.ID, date.ID,date.xp).then(function(res){
            console.log(res);
        })
    }
    vm.edIt=function(){
         alert('ss');
        $('.recipient-details').find('span').attr('contenteditable','true');

    }
    vm.editreceipent = function(data){
        console.log(data);
        var log=[];
        angular.forEach(data, function(value, key){
            var updatefeilds={"FirstName":value.ShippingAddress.FirstName, "LastName":value.ShippingAddress.LastName, "Zip":value.ShippingAddress.Zip};
            console.log(updatefeilds);
            OrderCloud.As().LineItems.PatchShippingAddress(vm.order.ID, value.ID, updatefeilds).then(function(res){
                console.log(res);
                OrderCloud.As().LineItems.PatchShippingAddress(vm.order.ID, value.ID, updatefeilds).then(function(res1){
                    console.log(res1);
                    $state.reload();
                });
            });
        },log);
    }

    vm.changereceipentpopup = function(){
        $uibModal.open({
            templateUrl: 'cart/templates/changereceipentpopup.tpl.html',
            backdropClass:'changereceipentpopup',
            windowClass:'changereceipentpopup',
            controller: 'ChangeReceipentPopupCtrl',
            controllerAs: 'changeReceipentPopup',
            resolve:{

            }
        });
    }

    OrderCloud.SpendingAccounts.ListAssignments(null, vm.signnedinuser.ID).then(function(result){
        angular.forEach(result.Items, function(value, key) {
            console.log(value);
            OrderCloud.SpendingAccounts.Get(value.SpendingAccountID).then(function(data){
                if(data.Name=="Purple Perks"){
                    vm.purpleperksacc=data;
                }
            })
        })
    })

    vm.changeReceipentfun = function(data, changereceipent){
        console.log(data, changereceipent);
        var lastrecp=data, selectedaddr=[];
        var newline={
            "ProductID": lastrecp.ProductID,
            "Quantity": lastrecp.Quantity,
            "xp": lastrecp.xp
        }
        //OrderCloud.As().LineItems.List(vm.order.ID).then(function(ans){
            
            OrderCloud.As().LineItems.List(vm.order.ID).then(function(ans){
                console.log(ans);
                var shippaddr = {};
                selectedaddr=_.filter(ans.Items, function(obj) {
                    return _.indexOf([changereceipent],obj.ShippingAddress.FirstName) > -1
                });
                console.log("selectedaddr",selectedaddr);
                console.log(selectedaddr.ShippingAddress);
                angular.forEach(selectedaddr, function(value, key){
                    console.log(value);
                    shippaddr={
                        "City": value.ShippingAddress.City,
                        "FirstName": value.ShippingAddress.FirstName,
                        "LastName": value.ShippingAddress.LastName,
                        "Street1": value.ShippingAddress.Street1,
                        "Street2": value.ShippingAddress.Street2,
                        "State": value.ShippingAddress.State,
                        "Zip": value.ShippingAddress.Zip,
                        "Country": value.ShippingAddress.Country,
                        "Phone": value.ShippingAddress.Phone
                    }
                    OrderCloud.As().LineItems.Delete(vm.order.ID, data.ID);
                    OrderCloud.As().LineItems.Create(vm.order.ID, newline).then(function(res){
                        console.log(res);
                        OrderCloud.As().LineItems.SetShippingAddress(vm.order.ID,res.ID,shippaddr).then(function(resq){
                            $state.reload()
                        })
                    });
                })
            })
        //})
    }
    console.log(angular.element(document.getElementById("changereceipentid")).scope());
}

function MiniCartController($q, $state, $rootScope, OrderCloud, LineItemHelpers, CurrentOrder) {
    var vm = this;
    vm.LineItems = {};
    vm.Order = null;
    vm.showLineItems = false;


    vm.getLI = function(){
        CurrentOrder.Get()
        .then(function(data) {
            vm.Order = data;
            if (data) vm.lineItemCall(data);
        });
    };

    vm.getLI();

    vm.checkForExpress = function() {
        var expressCheckout = false;
        angular.forEach($state.get(), function(state) {
            if (state.url && state.url == '/expressCheckout') {
                expressCheckout = true;
                return expressCheckout;
            }
        });
        return expressCheckout;
    };

    vm.checkForCheckout = function() {
        var checkout = false;
        angular.forEach($state.get(), function(state) {
            if (state.url && state.url == '/checkout') {
                checkout = true;
                return checkout;
            }
        });
        return checkout;
    };

    vm.goToCart = function() {
        $state.go('cart', {}, {reload: true});
    };

    vm.lineItemCall = function /*getLineItems*/(order) {
        var dfd = $q.defer();
        var queue = [];
        OrderCloud.As().LineItems.List(order.ID)
            .then(function(li) {
                vm.LineItems = li;
                if (li.Meta.TotalPages > li.Meta.Page) {
                    var page = li.Meta.Page;
                    while (page < li.Meta.TotalPages) {
                        page += 1;
                        queue.push(OrderCloud.LineItems.List(order.ID, page));
                    }
                }
                $q.all(queue)
                    .then(function(results) {
                        angular.forEach(results, function(result) {
                            vm.LineItems.Items = [].concat(vm.LineItems.Items, result.Items);
                            vm.LineItems.Meta = result.Meta;
                        });
                        dfd.resolve(LineItemHelpers.GetProductInfo(vm.LineItems.Items.reverse()));
                    });
            });
        return dfd.promise;
    };

    $rootScope.$on('LineItemAddedToCart', function() {
        CurrentOrder.Get()
            .then(function(order) {
                vm.lineItemCall(order);
                vm.showLineItems = true;
            });
    });


    $rootScope.$on('OC:RemoveOrder', function(){ //broadcast is in build > src > app > common > line items
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

function ProductRequestController($uibModal, $scope, $stateParams, prodrequestdata, $uibModalInstance, OrderCloud, Order){
    var vm=this;
    vm.order=Order;
    vm.prodrequestdata= prodrequestdata;   
    vm.cancel = function(){
        $uibModalInstance.close();
    }

    vm.save = function(data){
        console.log(data);
        var updateline = {"xp":data};
        OrderCloud.As().LineItems.Patch(vm.order.ID, vm.prodrequestdata.ID, updateline).then(function(test){
            $uibModalInstance.close();
        })
    }
}
function ChangeReceipentPopupController($uibModal, $scope, $uibModalInstance){
    var vm=this;
    vm.oneAtATime=true;
    vm.selectedRecipient=false;
    vm.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    vm.changedtls = function(data){
        console.log(data);
        console.log($scope);
    }
}