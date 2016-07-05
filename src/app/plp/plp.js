angular.module('orderCloud')

    .config(PlpConfig)
    .factory('PlpService', PlpService)
    .factory('SharedData', SharedData)
    .controller('PlpCtrl', PlpController)
    .controller('QuickviewCtrl',QuickviewController)
    .controller('filterBtnCtrl',filterBtnController)
    .filter('colors', ColorFilter)
    .directive( 'ordercloudProductQuickView', ordercloudProductQuickViewDirective)
    .controller( 'ProductQuickViewCtrl', ProductQuickViewController)
    .controller ('ProductQuickViewModalCtrl', ProductQuickViewModalController)
    .controller('addedToCartCtrl',addedToCartController)
;

function PlpConfig($stateProvider) {
    $stateProvider
        .state('plp', {
            parent: 'base',
           // url:"/plp",
            url: '/plp/:catId',
           resolve: {
               productImages: function(PlpService){
                 var ticket = localStorage.getItem("alf_ticket");
                 return PlpService.GetProductImages(ticket).then(function(res){
                 return res.items;
                 });
                 },
                 productList: function (OrderCloud, $stateParams,productImages, alfcontenturl, Underscore) {
                     return OrderCloud.Me.ListProducts(null, 1, 100, null, null, null, $stateParams.catId).then(function(res){
                      var ticket = localStorage.getItem("alf_ticket");      
                      var imgcontentArray = [];
                      for(var i=0;i<res.Items.length;i++){
                        angular.forEach(Underscore.where(productImages, {title: res.Items[i].ID}), function (node) {
                            node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
                            imgcontentArray.push (node);
                        });
                        res.Items[i].imgContent = imgcontentArray;
                        imgcontentArray= [];
                      }
                      var groupedProducts = _.groupBy(res.Items, function(item) { 
                        return item.xp.SequenceNumber;
                      });
                     groupedProducts = Object.keys(groupedProducts).map(function (key) {return groupedProducts[key]});
                     console.log('Sequence grouped Products',groupedProducts);
                     var defaultGroupedProd = [];
                     angular.forEach(groupedProducts, function(value, key){
                        var data;
                        $.grep(value, function(e , i){ if(e.xp.IsDefaultProduct == 'true'){ 
                          data = i;
                        }});
                       //var maxValue = _.max(value, _.property('StandardPriceSchedule.PriceBreaks[0].Price'));
                      // var maxDate = _(value).map('StandardPriceSchedule.PriceBreaks[0]').flatten().max(Price);
                        var lowest = Number.POSITIVE_INFINITY;
                        var highest = Number.NEGATIVE_INFINITY;
                        var tmp;
                        //console.log("@@@" ,value.StandardPriceSchedule.PriceBreaks);
                        angular.forEach(value, function(prodValues, key){
                            tmp = prodValues.StandardPriceSchedule.PriceBreaks[0].Price;
                            if (tmp < lowest) lowest = tmp;
                            if (tmp > highest) highest = tmp;
                        });
                        
                        var price = "$"+lowest+" - $"+highest;
                        value[data].priceRange = price;
                          var b = value[data];
                          value[data] = value[0];
                          value[0] = b;
                          defaultGroupedProd.push(value);
                     });
                    console.log("default sequence grouped prod", defaultGroupedProd);
                      return defaultGroupedProd;
                      //test
                    })
                 }

            },
            templateUrl: 'plp/templates/plp.tpl.html',
            controller: 'PlpCtrl',
            controllerAs: 'plp'
        })

}

function PlpService($q, OrderCloud, Underscore, $timeout, $http, alfcontenturl, alfrescourl, $cookieStore) {

    var service = {
        GetProductAssign: _getProductAssign,
        ProductList: _productList,
        GetStandardPriceScheduleID: _getStandardPriceScheduleID,
        GetPriceSchedules: _getPriceSchedules,
        GetProductImages: _getProductImages,
        GetCategoryDeatil: _categoryDeatil,
        GetProductList:_getProductList,
        GetPlpBanner:_getPlpBanner,
        GetHybridBanner:_getHybridBanner,
        GetHelpAndPromo:_getHelpAndPromo,
        GetPromoSvgDesign:_getPromoSvgDesign,
        GetAddToCart:_getAddToCart
    }

function _getProductList(res, productImages){
 var productId = res.ID || res.ProductID;
 var ticket = localStorage.getItem("alf_ticket");
        var deferred = $q.defer();
        var StandardPriceSchedule;
        var imgContent;
        angular.forEach(Underscore.where(productImages, {title: productId}), function (node) {
            node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
            imgContent = node;
        });
        OrderCloud.Me.GetProduct(productId).then(function(list){
            data["imgContent"] = imgContent;
            deferred.resolve(list);
        });
         return deferred.promise;
    }

    function _getProductAssign(cattId) {
        var deferred = $q.defer();
        OrderCloud.Categories.ListProductAssignments(cattId).then(function (list) {
            deferred.resolve(list.Items);
        });
        return deferred.promise;
    }

    function _productList(productId) {
        var deferred = $q.defer();
        OrderCloud.Products.Get(productId).then(function (list) {
            deferred.resolve(list);
        });
        return deferred.promise;
    }

    function _categoryDeatil(productId) {
        var deferred = $q.defer();
        var ajaxarr = [];
        OrderCloud.Categories.ListProductAssignments('', productId).then(function (list) {
            angular.forEach(list.Items, function (item) {
                var promise = OrderCloud.Categories.Get(item.CategoryID);
                ajaxarr.push(promise);
            });
            $q.all(ajaxarr).then(function (items) {
                console.log("_categoryDeatil==", items);
                deferred.resolve(items);

            });
        });
        return deferred.promise;
    }

    function _getStandardPriceScheduleID(res, productImages) {
        console.log("productImages==", productImages);
        var productId = res.ID || res.ProductID;
        var ticket = localStorage.getItem("alf_ticket");
        var deferred = $q.defer();
        var StandardPriceSchedule;
        var imgContent;
        angular.forEach(Underscore.where(productImages, {title: productId}), function (node) {
            node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
            imgContent = node;
        });
        var listAssQueue = [];
        listAssQueue.push(OrderCloud.Products.ListAssignments(productId).then(function (list) {
            var d = $q.defer();
            _getPriceSchedules(list.Items[0].StandardPriceScheduleID).then(function (success) {
                StandardPriceSchedule = success;
                _productList(productId).then(function(data){
                    data["StandardPriceSchedule"] = StandardPriceSchedule;
                    data["imgContent"] = imgContent;
                    if(data.Type == "VariableText"){
                        OrderCloud.Specs.ListProductAssignments(null, data.ID).then(function(response){
                            data.specID = response.Items[0].SpecID;
                            OrderCloud.Specs.ListOptions(response.Items[0].SpecID).then(function(res){
                                data.listOptions = res.Items;
                                //console.log("res"+JSON.stringify(res));
                                //console.log("data"+JSON.stringify(data));
                                var size = response.Items[0].SpecID.split('_');
                                var len = size.length,obj2 = {}, options = [];
                                var  w = [];
                                for (var i=0;i<len;i++){
                                    w[size[i+1]] = [];
                                }
                                var filt = _.filter(res.Items, function(row,index){
                                    _.each(row.Value.split('_'), function(val,index){
                                        w[size[index+1]].push(val);
                                    });
                                });
                                for (var i=1;i<len;i++){
                                    var obj = {};
                                    obj.Type = size[i];
                                    obj.Option = _.uniq(w[size[i]]);
                                    options.push(obj);
                                }
                                data["options"] = options;
                                data.varientsOption = options[0].Option[0]+"_"+options[1].Option[0];
                                var filt = _.findWhere(data.listOptions, {ID: data.varientsOption});
                                console.log(filt);
                                data.prodPrice = filt.PriceMarkup;
                                console.log(JSON.stringify(data));
                            });
                        });
                    }
                    deferred.resolve(data);
                    d.resolve();
                });
            });

            return d.promise;
        }));
        return deferred.promise;
    }


    function _getPriceSchedules(PriceScheduleID) {
        var deferred = $q.defer();
        OrderCloud.PriceSchedules.Get(PriceScheduleID).then(function (list) {
            deferred.resolve(list);
        });
        return deferred.promise;

    }

    function _getProductImages(ticket) {
        var defferred = $q.defer();
        $http({
            method: 'GET',
            dataType: "json",
            url: alfrescourl + "Media/Products?alf_ticket=" + ticket,

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

    function _getPlpBanner(ticket) {
      var defferred = $q.defer(); 
      $http({
        method: 'GET',
        dataType:"json",
        url:  alfrescourl+"ProductListing/HeroBanner?alf_ticket="+ticket,
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

    function _getHybridBanner(ticket) {
      var defferred = $q.defer(); 
      $http({
        method: 'GET',
        dataType:"json",
        url:  alfrescourl+"ProductListing/HybridBanner?alf_ticket="+ticket,
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
    function _getPromoSvgDesign(ticket) {
      var defferred = $q.defer(); 
      $http({
      method: 'GET',
      dataType:"json",
      url: alfrescourl+"CategoryPage/Promotions?alf_ticket="+ticket,
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
    function _getAddToCart(ticket) {
      var defferred = $q.defer(); 
      $http({
      method: 'GET',
      dataType:"json",
      url: alfrescourl+"ProductListing/AddToCart?alf_ticket="+ticket,
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


function PlpController(SharedData, $state, $uibModal,$q, Underscore, $stateParams,PlpService, productList, $scope, alfcontenturl,OrderCloud,$sce) {

    var vm = this;
    vm.productList = productList;
        // START: function for facet selection logic
    vm.selection=[];


    //Function for clear all facets
    vm.clearSelection = function(){
       vm.selection = [];
       vm.facetName = {};
    }
    // Function for navigation to PDP
    vm.detailsPage = function($event){
      var id = $($event.target).parents('.prodImagewrap').attr('data-prodid');
      var seq= $($event.target).parents('.prodImagewrap').attr('data-sequence');
      
      var href= "/pdp/"+ seq + "/prodId="+id;
      $state.go('pdp', { 'sequence':seq , 'prodId':id });
    }


    vm.selectionLength = vm.selection.length;

     /*var owl2 = angular.element("#owl-carousel-selected-cat");   
      owl2.owlCarousel({
        nav:true,
        autoWidth:true
      });*/
      /*vm.facetOwlReinitialise = function(){
        owl2.trigger('destroy.owl.carousel');
        owl2.find('.owl-stage-outer').children().unwrap();
        if(vm.selection.length > vm.selectionLength){
          setTimeout(function(){
            owl2.owlCarousel({
              loop:false,
              nav:true,
              autoWidth:true,
              onInitialized: fixOwl,
              onRefreshed: fixOwl
            }); 
            var facetOwlWidth = $('#owl-carousel-selected-cat .owl-stage-outer .owl-stage').width();
            $('#owl-carousel-selected-cat .owl-stage-outer .owl-stage').css('width',facetOwlWidth + 2);
          },100);
          
        }
      }*/
 
     /* var fixOwl = function(){
        var $stage = $('.owl-stage'),
            stageW = $stage.width(),
            $el = $('.owl-item'),
            elW = 0;
        $el.each(function() {
            elW += $(this).width()+ +($(this).css("margin-right").slice(0, -2))
        });
        if ( elW > stageW ) {
            $stage.width( elW );
        };
      }*/

      vm.togglFaceteSelection = function togglFaceteSelection(facetName, isFromTopBar) {
        var idx = vm.selection.indexOf(facetName);
        // is currently selected
        if(isFromTopBar){
          vm.facetName[facetName] = false;
           ///vm.facetOwlReinitialise();
        }
        if (idx > -1) {
          vm.selection.splice(idx, 1);
         //vm.facetOwlReinitialise();

        }
        // is newly selected
        else {
          vm.selection.push(facetName);
         //vm.facetOwlReinitialise();
        }
      };

      // END:function for facet selection logic

      // START: function for sort options selection
      var sortItems=[
      {'value':'BestSellers','label':'Best Sellers'},
      {'value':'Relavance','label':'Relavance'},
      {'value':'PriceHighesttoLowest','label':'Price Highest to Lowest'},
      {'value':'PriceLowesttoHighest','label':'Price Lowest to Highest'},
      {'value':'AZ','label':'A - Z'},
      {'value':'ZA','label':'Z - A'},
      ];
      vm.sortItems = sortItems;
      vm.selectedItem ="Best Sellers";
      vm.selectedMenu = 0; 

      vm.changeSortSelection = function changeSortSelection(selcetedItem, itemIndex){
         vm.selectedItem =selcetedItem;
         vm.selectedMenu = itemIndex; 

      };
      // END: function for sort options selection

      // START : Function for pagination
          vm.data = [{"name":"Bell","id":"K0H 2V5"},{"name":"Octavius","id":"X1E 6J0"},{"name":"Alexis","id":"N6E 1L6"},{"name":"Colton","id":"U4O 1H4"},{"name":"Abdul","id":"O9Z 2Q8"},{"name":"Ian","id":"Q7W 8M4"},{"name":"Eden","id":"H8X 5E0"},{"name":"Britanney","id":"I1Q 1O1"},{"name":"Ulric","id":"K5J 1T0"},{"name":"Geraldine","id":"O9K 2M3"},{"name":"Hamilton","id":"S1D 3O0"},{"name":"Melissa","id":"H9L 1B7"},{"name":"Remedios","id":"Z3C 8P4"},{"name":"Ignacia","id":"K3B 1Q4"},{"name":"Jaime","id":"V6O 7C9"},{"name":"Savannah","id":"L8B 8T1"},{"name":"Declan","id":"D5Q 3I9"},{"name":"Skyler","id":"I0O 4O8"},{"name":"Lawrence","id":"V4K 0L2"},{"name":"Yael","id":"R5E 9D9"},{"name":"Herrod","id":"V5W 6L3"},{"name":"Lydia","id":"G0E 2K3"},{"name":"Tobias","id":"N9P 2V5"},{"name":"Wing","id":"T5M 0E2"},{"name":"Callum","id":"L9P 3W5"},{"name":"Tiger","id":"R9A 4E4"},{"name":"Summer","id":"R4B 4Q4"},{"name":"Beverly","id":"M5E 4V4"},{"name":"Xena","id":"I8G 6O1"},{"name":"Yael","id":"L1K 5C3"},{"name":"Stacey","id":"A4G 1S4"},{"name":"Marsden","id":"T1J 5J3"},{"name":"Uriah","id":"S9S 8I7"},{"name":"Kamal","id":"Y8Z 6X0"},{"name":"MacKensie","id":"W2N 7P9"},{"name":"Amelia","id":"X7A 0U3"},{"name":"Xavier","id":"B8I 6C9"},{"name":"Whitney","id":"H4M 9U2"},{"name":"Linus","id":"E2W 7U1"},{"name":"Aileen","id":"C0C 3N2"},{"name":"Keegan","id":"V1O 6X2"},{"name":"Leonard","id":"O0L 4M4"},{"name":"Honorato","id":"F4M 8M6"},{"name":"Zephr","id":"I2E 1T9"},{"name":"Karen","id":"H8W 4I7"},{"name":"Orlando","id":"L8R 0U4"},{"name":"India","id":"N8M 8F4"},{"name":"Luke","id":"Q4Y 2Y8"},{"name":"Sophia","id":"O7F 3F9"},{"name":"Faith","id":"B8P 1U5"},{"name":"Dara","id":"J4A 0P3"},{"name":"Caryn","id":"D5M 8Y8"},{"name":"Colton","id":"A4Q 2U1"},{"name":"Kelly","id":"J2E 2L3"},{"name":"Victor","id":"H1V 8Y5"},{"name":"Clementine","id":"Q9R 4G8"},{"name":"Dale","id":"Q1S 3I0"},{"name":"Xavier","id":"Z0N 0L5"},{"name":"Quynn","id":"D1V 7B8"},{"name":"Christine","id":"A2X 0Z8"},{"name":"Matthew","id":"L1H 2I4"},{"name":"Simon","id":"L2Q 7V7"},{"name":"Evan","id":"Z8Y 6G8"},{"name":"Zachary","id":"F4K 8V9"},{"name":"Deborah","id":"I0D 4J6"},{"name":"Carl","id":"X7H 3J3"},{"name":"Colin","id":"C8P 0O1"},{"name":"Xenos","id":"K3S 1H5"},{"name":"Sonia","id":"W9C 0N3"},{"name":"Arsenio","id":"B0M 2G6"},{"name":"Angela","id":"N9X 5O7"},{"name":"Cassidy","id":"T8T 0Q5"},{"name":"Sebastian","id":"Y6O 0A5"},{"name":"Bernard","id":"P2K 0Z5"},{"name":"Kerry","id":"T6S 4T7"},{"name":"Uriel","id":"K6G 5V2"},{"name":"Wanda","id":"S9G 2E5"},{"name":"Drake","id":"G3G 8Y2"},{"name":"Mia","id":"E4F 4V8"},{"name":"George","id":"K7Y 4L4"},{"name":"Blair","id":"Z8E 0F0"},{"name":"Phelan","id":"C5Z 0C7"},{"name":"Margaret","id":"W6F 6Y5"},{"name":"Xaviera","id":"T5O 7N5"},{"name":"Willow","id":"W6K 3V0"},{"name":"Alden","id":"S2M 8C1"},{"name":"May","id":"L5B 2H3"},{"name":"Amaya","id":"Q3B 7P8"},{"name":"Julian","id":"W6T 7I6"},{"name":"Colby","id":"N3Q 9Z2"},{"name":"Cole","id":"B5G 0V7"},{"name":"Lana","id":"O3I 2W9"},{"name":"Dieter","id":"J4A 9Y6"},{"name":"Rowan","id":"I7E 9U4"},{"name":"Abraham","id":"S7V 0W9"},{"name":"Eleanor","id":"K7K 9P4"},{"name":"Martina","id":"V0Z 5Q7"},{"name":"Kelsie","id":"R7N 7P2"},{"name":"Hedy","id":"B7E 7F2"},{"name":"Hakeem","id":"S5P 3P6"}];
 
          vm.viewby = 9;
          vm.totalItems = productList.length;
          vm.currentPage = 1;
          vm.itemsPerPage = vm.viewby;
          vm.maxSize = 5; //Number of pager buttons to show

          vm.setPage = function (pageNo) {
            $scope.currentPage = pageNo;
          };

          vm.pageChanged = function() {
            console.log('Page changed to: ' + vm.currentPage);
            
          };

        vm.setItemsPerPage = function(num) {
          vm.itemsPerPage = num;
          vm.currentPage = 1; 
          angular.element(".sorted-products")[0].scrollTop=0;
        }
      // END : Function for pagination


// Start : color selection

vm.selectedColorIndex = 0;
vm.selectColor = function($index, $event, prod){
  vm.selectedColorIndex = $index;
   //console.log(prodId.imgContent);
   $($event.target).parents('.product-box').find('img')[0].src = prod.imgContent[0].contentUrl;
   $($event.target).parents('.product-box').find('.product-name-plp span').text(prod.Name);
   //$($event.target).parents('.product-box').find('.Price').text('$'+prod.StandardPriceSchedule.PriceBreaks[0].Price);
   $($event.target).parents('.product-box').find('.prodImagewrap').attr('data-sequence', prod.xp.SequenceNumber);
   $($event.target).parents('.product-box').find('.prodImagewrap').attr('data-prodid', prod.ID);
   SharedData.SelectedProductId = prod.ID;
   SharedData.SelectedSequence = prod.xp.SequenceNumber;
   $event.stopPropagation();
 
}
// END : End color selection
   setTimeout(function(){
    angular.element("#owl-carousel-feature-products").owlCarousel({
          //responsive: true,
            loop:false,
            nav:true,
            //autoWidth:true,
            responsive:{
                0:{ items:1 },
                320:{
                    items:2,
                    nav:false,
                    dots:true,
                },
                730 :{ 
                    items:3,
                },
                1024:{ 
                    items:3
                },
                1440:{ 
                    items:4
                }
            }

    });
    },500);

 /*vm.addedToCartPopUp = function() {
     // alert(10000);
     setTimeout(function(){
         var modalInstance = $uibModal.open({
             animation: true,
             backdropClass: 'addedToCartModal',
             templateUrl: 'plp/templates/added-to-cart.tpl.html',
             controller:'CartCopyCtrl',
             controllerAs: 'cartCopy'
         });

         modalInstance.result.then(function() {

         }, function() {
             angular.noop();
         });
     },1000)
 }*/


 vm.addedToCartPopUp = function() {
     // alert(10000);
     setTimeout(function(){
         var modalInstance = $uibModal.open({
             animation: false,
             backdropClass: 'addedToCartModal',
             windowClass: 'addedToCartModal',
             templateUrl: 'plp/templates/added-to-cart.tpl.html',
             controller:'addedToCartCtrl',
             controllerAs: 'addedToCart'
         });

         modalInstance.result.then(function() {

         }, function() {
             angular.noop();
         });
     },1000)


    
    }

 vm.filterBtnModal = function() {
     // alert(10000);
        var modalInstance = $uibModal.open({
            animation: true,
            backdropClass: 'filterBtnModal',
            windowClass: 'filterBtnModal',
            templateUrl: 'plp/templates/filter-modal.tpl.html',
             controller:'filterBtnCtrl',
             controllerAs: 'filterBtn'
            // size: 'sm'
        });

        modalInstance.result.then(function() {
            
        }, function() {
            angular.noop();
        });

    
    }


        /*setTimeout(function(){
        var owl2 = angular.element("#owl-carousel-selected-cat");   
        owl2.owlCarousel({
            //responsive: true,
            loop:false,
            nav:true,
            autoWidth:true,
            responsive:{
                0:{ items:1 },
                320:{
                    items:1,
                },
                730 :{ 
                    items:3,
                },
                1024:{ 
                    items:4
                }
            }
        });
        },1000)*/

        
    //plp-hybrid carousel

        setTimeout(function(){
        var owl2 = angular.element("#owl-carousel-plp-hybrid");   
        owl2.owlCarousel({
            //responsive: true,
            loop:false,
            nav:true,
            responsive:{
                0:{ items:1 },
                320:{
                    items:1,
                },
                730 :{ 
                    items:1,
                },
                960:{ 
                    items:3
                }
            }
        });
        },1000)



  vm.shiftSelectedCategoryRight= function(){
    var currentPos = angular.element('#owl-carousel-selected-cat').scrollLeft();
    var posToShift = angular.element('#owl-carousel-selected-cat .owl-carousel-item').width();
    angular.element('#owl-carousel-selected-cat').scrollLeft(currentPos + posToShift);
    angular.element('.plp-page .selected-list .left-part div .list-items .catLeftArrow').css({'display':'inline-block','visibility':'visible'});
   // alert(currentPos);
    var scrollEnd = ((vm.selection.length - 4) * posToShift) - 10;
    if(currentPos > scrollEnd){
      angular.element('.plp-page .selected-list .left-part div .list-items .catRightArrow').css({'display':'inline-blockone','visibility':'hidden'});
    } else{
      angular.element('.plp-page .selected-list .left-part div .list-items .catRightArrow').css({'display':'inline-block','visibility':'visible'});
    }
  }
  vm.shiftSelectedCategoryLeft= function(){
    var currentPos = angular.element('#owl-carousel-selected-cat').scrollLeft();
    var posToShift = angular.element('#owl-carousel-selected-cat .owl-carousel-item').width();
    angular.element('#owl-carousel-selected-cat').scrollLeft(currentPos - posToShift);
    angular.element('.plp-page .selected-list .left-part div .list-items .catRightArrow').css({'display':'inline-block','visibility':'visible'});
    if(currentPos == 0){
      angular.element('.plp-page .selected-list .left-part div .list-items .catLeftArrow').css({'display':'inline-blockone','visibility':'hidden'});
    } else{
      angular.element('.plp-page .selected-list .left-part div .list-items .catLeftArrow').css({'display':'inline-block','visibility':'visible'});
    }
  }      
  /* Plp banner from alfresco */
  var ticket = localStorage.getItem("alf_ticket");

  PlpService.GetPlpBanner(ticket).then(function(res){
    vm.plpBannerImg = alfcontenturl+res.items[0].contentUrl+"?alf_ticket="+ticket;
    vm.plpBannerTitle = res.items[0].title;
  });
  
  PlpService.GetHybridBanner(ticket).then(function(res){

    var hybridBanners = [];

    angular.forEach(Underscore.where(res.items), function (node) {
      node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
      hybridBanners.push(node);
    });
    vm.hybridBanners = hybridBanners;      

  });  

  PlpService.GetHelpAndPromo(ticket).then(function(res){
    vm.needHelp = alfcontenturl+res.items[4].contentUrl+"?alf_ticket="+ticket;
    vm.needHelpTitle = res.items[0].title;
    vm.needHelpDescription = res.items[0].description;  

    vm.leftPromo = alfcontenturl+res.items[1].contentUrl+"?alf_ticket="+ticket;
    vm.leftPromoTitle = res.items[1].title;
    vm.leftPromoDescription = res.items[1].description;    
    vm.leftPromoButton = res.items[1].author;  

    var giftCard = alfcontenturl + res.items[2].contentUrl + "?alf_ticket=" + ticket;
    vm.giftCard = $sce.trustAsResourceUrl(giftCard);
    vm.giftCardTitle = res.items[2].title;
    vm.giftCardDescription = res.items[2].description;    

  }); 
  PlpService.GetPromoSvgDesign(ticket).then(function(res){
    var plp_promo_svgDesign = alfcontenturl + res.items[6].contentUrl + "?alf_ticket=" + ticket;
    vm.plp_promo_svgDesign = $sce.trustAsResourceUrl(plp_promo_svgDesign);
  });

  $.fn.is_on_screen = function(){
     
    var win = $(window);
     
    var viewport = {
        top : win.scrollTop(),
        left : win.scrollLeft()
    };
    viewport.right = viewport.left + win.width();
    viewport.bottom = viewport.top + win.height();
     
    var bounds = this.offset();
    bounds.right = bounds.left + this.outerWidth();
    bounds.bottom = bounds.top + this.outerHeight();
     
    return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
     
  };

  /*$(window).scroll(function(){ // bind window scroll event
    var navbarTop = $('.sticky .base-header-inner').height();
    var showAfterHt = $('.plpBannerPlusHybrid').height();
    if($(this).scrollTop()>showAfterHt){
      if( $('.target').length > 0 ) { // if target element exists in DOM
        if( $('.target').is_on_screen() ) { // if target element is visible on screen after DOM loaded
          $('.fixThisBar').css({'display':'none'}); 

          } else {
          $('.fixThisBar').css({'display':'block','top':navbarTop}); 
        }
      }
    }
  });*/
}

function QuickviewController($scope, $uibModalInstance) {
    var vm = this;


    vm.productInfo = angular.element(document.getElementById("plpPage")).scope().productInfo;

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

  //qvick view carousel

        setTimeout(function(){
        var owl2 = angular.element("#owl-carousel-qv-images");   
        owl2.owlCarousel({
            //responsive: true,
            loop:false,
            nav:true,
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
        },1000)

}



function filterBtnController($scope, $uibModalInstance) {
    var vm = this;
      $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    vm.selection=[];
     
      /*vm.facetOwlReinitialise = function(){
        
      }*/

    //Function for clear all facets
    vm.selectionLength = vm.selection.length;
    vm.clearSelection = function(){
       vm.selection = [];
       vm.facetName = {};
    }

    
   /* setTimeout(function(){
        var owl3 = angular.element("#owl-carousel-selected-cat-mobile"); 
        owl3.owlCarousel({
            loop:false,
            nav:true
        });
    },300)*/
    /*vm.initilizeMblFilter = function(){
      owl3.trigger('destroy.owl.carousel');
        owl3.find('.owl-stage-outer').children().unwrap();
        if(vm.selection.length > vm.selectionLength){
          setTimeout(function(){
            owl3.owlCarousel({
              loop:false,
              nav:true,
              items:2
            }); 
          },100);
          
        }
    }*/
     vm.togglFaceteSelection = function togglFaceteSelection(facetName, isFromTopBar) {
        var idx = vm.selection.indexOf(facetName);
        // is currently selected
        if(isFromTopBar){
          vm.facetName[facetName] = false;
          //vm.initilizeMblFilter();
        }
        if (idx > -1) {
          vm.selection.splice(idx, 1);
          //vm.initilizeMblFilter();

        }
        // is newly selected
        else {
          vm.selection.push(facetName);
          //vm.initilizeMblFilter();
        }
      };
    // selected cat-mobile

}

function ColorFilter(){
  //console.log('filter', size);
   // return function(colors, Size){
    return function(colors){
     // console.log(Size);
      var unique = {};
      var distinct = [];
      var distinctObj = [];
      for( var i in colors ){
      if(typeof(colors[i].xp) !== 'undefined'){
       if( typeof(unique[colors[i].xp.SpecsOptions.Color]) == "undefined"){
        distinct.push(colors[i].xp.SpecsOptions.Color);
        distinctObj.push(colors[i]);
       }
       unique[colors[i].xp.SpecsOptions.Color] = 0;
      }
    }
      return distinctObj
    }

}

function ordercloudProductQuickViewDirective(){
    return{
        scope:{
            product: '='
        },
        replace:true,
        restrict:'E',
        templateUrl:'plp/templates/quick-view.tpl.html',
        controller:'ProductQuickViewCtrl',
        controllerAs:'productQuickView'
    }
}

function ProductQuickViewController ($uibModal , SharedData){
    var vm = this;
    
    vm.open = function (product){
     console.log(product);
        $uibModal.open({
            animation:true,
            windowClass:'quickViewModal',
            templateUrl: 'plp/templates/quick-view-model.tpl.html',
            controller: 'ProductQuickViewModalCtrl',
            controllerAs: 'productQuickViewModal',

            resolve: {
                SelectedProduct: function (OrderCloud) {
                    return _.groupBy(product, function(item) { 
                        return item.xp.SpecsOptions.Size;
                    });
                },
                productImages : function(PdpService, $stateParams, $q, $http){
                  return PdpService.GetProductCodeImages(product[0].ID);
                },
                selectedProductID : function(){
                  return SharedData.SelectedProductId;
                }
            }
        });
    };
}

function ProductQuickViewModalController(selectedProductID,SelectedProduct,$timeout, $scope, PdpService, productImages, $uibModalInstance){
    var vm = this;
     $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $uibModalInstance.opened.then(function() {
          $timeout(function() {
              $scope.$broadcast('rebuild:qvScroll');
          },200);
        });

    vm.selectedSizeIndex = 0;  // stores selected size index from vm.productDetails
    vm.selectedProductIndex = 0; // stores selected product index under size array from vm.productDetails       
    vm.defaultSizeIndex =0; 
    vm.sizeGroupedProducts = [];
    var sizeGroupedProducts = SelectedProduct;
    vm.productDetails = Object.keys(sizeGroupedProducts).map(function (key) {return sizeGroupedProducts[key]});;
    angular.forEach(vm.productDetails, function(value, key){
    $.grep(value, function(e , i){ 
      if(e.ID == selectedProductID) {
       vm.selectedSizeIndex = key;
       vm.selectedProductIndex = i;
      }
    });
  });
  console.log('Size grouped QV products  ', vm.productDetails);
  vm.isSizeAvailable = vm.productDetails[0][0].length;
  $scope.qty =1;
  $scope.multireceipentText = '<p>Is this for multiple receipents?</p> <button>YES</button><button>NO</button>'
  
  vm.setQvImage = function($event){
    $($event.target).parents('.category-pdt-carousel').find('#img-min-height img').attr('src',$($event.target).attr('src'));
  }

  vm.selectVarients = function(selectedSize){
    vm.productVarientImages = [];
    vm.sizeGroupedProducts = sizeGroupedProducts[selectedSize];
    vm.selectedColorIndex = 0;
    vm.gotoPdp = "/pdp/"+sizeGroupedProducts[selectedSize][vm.selectedProductIndex].xp.SequenceNumber+"?prodId="+sizeGroupedProducts[selectedSize][vm.selectedProductIndex].ID ; 
    $('body').find('.detail-container .prod_title').text(vm.sizeGroupedProducts[0].Name);
    PdpService.GetProductCodeImages(sizeGroupedProducts[selectedSize][vm.selectedProductIndex].ID).then(function(res){
    $timeout(function(){
      vm.productVarientImages = res;
       var owl2 = angular.element("#owl-carousel-qv-images");   
    owl2.trigger('destroy.owl.carousel');
    setTimeout(function(){
        owl2.owlCarousel({
            loop:true,
            nav:false,
            dots:true,
            //dotsContainer:'#carousel-custom-dots',
            //dotsEach:true,
            //autoWidth:true
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
    },200);
   
    });
  };
  $scope.radio = {selectedSize:null};
  
  vm.selectedSizeBoxIndex = 0;
  vm.sizeBoxItemClicked = function ($index) {
    vm.selectedSizeIndex = $index;

    // qv image min height -start
    var imgMinHeight = parseInt($('.owl-stage-outer').height())+20+'px';
     // alert(pdpDetailBoxHt);
      $('#img-min-height').css('min-height',imgMinHeight);

      // qv image min height -end
  }

  vm.selectedColorIndex = 0;
  vm.productVarientImages = productImages;
  console.log('testimg', vm.productVarientImages)
  vm.colorItemClicked = function ($index, $event, prod) {
     vm.productVarientImages = [];
  vm.selectedProductIndex = $index;
   vm.gotoPdp = "/pdp/"+sizeGroupedProducts[prod.xp.SpecsOptions.Size][vm.selectedProductIndex].xp.SequenceNumber+"?prodId="+sizeGroupedProducts[prod.xp.SpecsOptions.Size][vm.selectedProductIndex].ID ; 
   
  $($event.target).parents('.detail-container').find('h3').text(prod.Name);
  $($event.target).parents('.product-box').find('.Price').text('$'+prod.StandardPriceSchedule.PriceBreaks[0].Price);
  
  PdpService.GetProductCodeImages(prod.ID).then(function(res){
    $timeout(function(){
  vm.productVarientImages =  res;

   // qv image min height -start
    var imgMinHeight = parseInt($('.owl-stage-outer').height())+20+'px';
     // alert(pdpDetailBoxHt);
      $('#img-min-height').css('min-height',imgMinHeight);

      // qv image min height -end

  var owl2 = angular.element("#owl-carousel-qv-images");   
    owl2.trigger('destroy.owl.carousel');
    setTimeout(function(){
        owl2.owlCarousel({
            loop:true,
            nav:false,
            dots:true,
            //dotsContainer:'#carousel-custom-dots',
           //dotsEach:true,
            //autoWidth:true
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
     },200);
 
  });
   

  }
  //  var owl2 = angular.element("#owl-carousel-qv-images");   
  // owl2.trigger('destroy.owl.carousel');
  //    setTimeout(function(){
  //     owl2.owlCarousel({
  //         loop:false,
  //         nav:true,
  //         navText: ['<span class="" aria-hidden="true"><img src="assets/images/cat4.png"/></span>'],
  //         dots:true,
  //         dotsContainer:'#carousel-custom-dots',
  //         dotsEach:true,
  //         navContainer:'.demo',
  //         responsive:{
  //             0:{ items:1 },
  //             320:{
  //                 items:1,
  //             },
  //             730 :{ 
  //                 items:1,
  //             },
  //             1024:{ 
  //                 items:1
  //             }
  //         }
  //     });
  // },300);
}


function addedToCartController($scope, $uibModalInstance,$q, alfcontenturl,OrderCloud,PlpService,$timeout) {
    var vm = this;
      $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    

     $uibModalInstance.opened.then(function() {
    $timeout(function() {
        $scope.$broadcast('rebuild:cartScroll');
    },1000);

});
 setTimeout(function(){
    var owlC = angular.element("#owlC");   
    owlC.owlCarousel({
      loop:true,
      margin:10,
      nav:true,
      responsive:{
          0:{
              items:1
          },
          600:{
              items:3
          },
          1000:{
              items:5
          }
      }
    })
    },1000)

    
        // added to cart carousel-pdt
    /* setTimeout(function(){
        var owl2 = angular.element("#owl-carousel-added-cart-pdt");   
        owl2.owlCarousel({
            //responsive: true,
            loop:false,
            nav:true,
            //autoWidth:true,
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
        },1000)*/

      // added to cart carousel-frequent-pdt
     /*setTimeout(function(){
        var owlcart = angular.element("#owl-carousel-added-cart-frequent-pdt");   
        owlcart.owlCarousel({
            //responsive: true,
            loop:true,
            nav:true,
            margin:30,
            responsive:{
                0:{ items:1 },
                320:{
                    items:2,
                },
                730 :{ 
                    items:3,
                },
                1024:{ 
                    items:5
                }
            }
        });
        },1000)*/
    var ticket = localStorage.getItem("alf_ticket");
    PlpService.GetAddToCart(ticket).then(function(res){
      vm.pdt1 = alfcontenturl+res.items[0].contentUrl+"?alf_ticket="+ticket;
      vm.pdt2 = alfcontenturl+res.items[1].contentUrl+"?alf_ticket="+ticket;
      vm.pdt3 = alfcontenturl+res.items[2].contentUrl+"?alf_ticket="+ticket;
      vm.pdt4 = alfcontenturl+res.items[3].contentUrl+"?alf_ticket="+ticket;
      vm.pdt5 = alfcontenturl+res.items[4].contentUrl+"?alf_ticket="+ticket;
      vm.pdt6 = alfcontenturl+res.items[5].contentUrl+"?alf_ticket="+ticket;
      vm.pdt7 = alfcontenturl+res.items[6].contentUrl+"?alf_ticket="+ticket;
      vm.pdt8 = alfcontenturl+res.items[7].contentUrl+"?alf_ticket="+ticket;
      vm.pdt9 = alfcontenturl+res.items[8].contentUrl+"?alf_ticket="+ticket;
    });


    /* cart popup pdts scroll */
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

  function SharedData() {

    var service = {
        
    }
  return service;    
  }