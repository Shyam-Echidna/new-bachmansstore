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
    .controller('wishlistModalCtrl',wishlistModalController)
    .directive('prodColors', ProdColorsDirective)
    .directive('newLabel', NewLabelDirective)
;

function PlpConfig($stateProvider) {
    $stateProvider
        .state('plp', {
            parent: 'base',           
            //url: '/plp/:catId',
            url: '/plp?catId&filters&productpage&infopage&tab&productssortby&infosortby&min&max',
                     ncyBreadcrumb: {
                    label: 'plp page',
            parent:'category'
                  },
           resolve: {
               
            ticketTemp: function (LoginFact) {
                return LoginFact.GetTemp()
                    .then(function (data) {
                        console.log('555555555Alf',data);
                        var ticket = data.data.ticket;
                        localStorage.setItem("alfTemp_ticket", ticket);
                        return ticket;
                    }, function () {
                        return "";
                    })
            },
            DisjunctiveFacets: function ($stateParams) {
                if ($stateParams.filters) {
                    var result = [];
                    var filterArray = $stateParams.filters.split(',');
                    var firstDisjunctive = filterArray[0].split(":")[0];
                    result.push(firstDisjunctive);
                    filterArray.forEach(function (x) {
                        if (x.split(":")[0] != firstDisjunctive) {
                            result.push(x.split(":")[0])
                        }
                    });
                    return result;
                } else {
                    return null;
                }


            },
            PriceFilterString: function($stateParams) {
                var string = '';
                if ($stateParams.min || $stateParams.max) {
                    if ($stateParams.min && ! $stateParams.max) {
                        string = 'Price>=' + $stateParams.min;
                    } else if ($stateParams.max && !$stateParams.min) {
                        string = 'Price<=' + $stateParams.max;
                    } else {
                        string = 'Price>=' + $stateParams.min + ' AND Price<=' + $stateParams.max;
                    }
                }
                console.log(string);
                return string;
            },
            FilterStrings: function ($stateParams, DisjunctiveFacets, PriceFilterString) {
                //This function builds up the main query string and the lesser query string for the disjunctive facet search
                // learn more about disjunctive searching here... https://www.algolia.com/doc/search/filtering-faceting#disjunctive-faceting
                if (!$stateParams.filters) {
                    return [];
                }
                 else {
                    var filterArray = $stateParams.filters.split(',');
                    var facetObject = {};
                    filterArray.forEach(function (d) {
                        var keyVal = d.split(":");
                        if (!facetObject[keyVal[0]]) {
                            facetObject[keyVal[0]] = [];
                        }
                        facetObject[keyVal[0]].push(keyVal[1]);
                    });
                    var primaryDisjunctiveFacetObject = {};
                    var secondaryDisjunctiveFacetObject = {};
                    angular.copy(facetObject, primaryDisjunctiveFacetObject);
                    angular.copy(facetObject, secondaryDisjunctiveFacetObject);
                    var loopArray = [facetObject];
                    if (DisjunctiveFacets.length > 1) {
                        delete primaryDisjunctiveFacetObject[DisjunctiveFacets[0]];
                        delete primaryDisjunctiveFacetObject[DisjunctiveFacets[1]];
                        delete secondaryDisjunctiveFacetObject[DisjunctiveFacets[1]];
                        loopArray.push(primaryDisjunctiveFacetObject, secondaryDisjunctiveFacetObject);
                    } else if (DisjunctiveFacets.length > 0) {
                        delete primaryDisjunctiveFacetObject[DisjunctiveFacets[0]];
                        loopArray.push(primaryDisjunctiveFacetObject);
                    }
                    var result = [];
                    for (var i = 0; i < loopArray.length; i++) {
                        var filterString = '';
                        var first = true;
                        for (var key in loopArray[i]) {
                            filterString += first ? '' : ' AND ';
                            first = false;
                            if (facetObject[key].length > 1) {
                                var tempString = "(";
                                var firstMultiple = true;
                                facetObject[key].forEach(function (e) {
                                    tempString += firstMultiple ? "" : " OR ";
                                    firstMultiple = false;
                                    var keyString = "";
                                    if (key.indexOf(" ") > -1) {
                                        keyString = '"' + key + '"';
                                    } else {
                                        keyString = key;
                                    }
                                    tempString += (typeof e == 'string' && e.indexOf(" ") > -1 && e.indexOf(" to ") == -1) ? keyString + ':' + '"' + e + '"' : keyString + ":" + e;
                                });
                                tempString += ')';
                                filterString += tempString;
                            } else {
                                var newVal;
                                if (typeof facetObject[key][0] == 'string' && facetObject[key][0].indexOf(" ") > -1 && facetObject[key][0].indexOf(" to ") == -1) {
                                    newVal = key.indexOf(" ") > -1 ? '"' + key + '"' + ":" + '"' + facetObject[key][0] + '"' : key + ":" + '"' + facetObject[key][0] + '"';

                                } else {
                                    newVal = key.indexOf(" ") > -1 ? '"' + key + '"' + ":" + facetObject[key][0] : key + ":" + facetObject[key][0];
                                }
                                filterString += newVal;
                            }
                        }
                        if (PriceFilterString == '') {
                            result.push(filterString);
                        }
                        else if (filterString.length > 0) {
                            result.push(filterString + ' AND ' + PriceFilterString);
                        } else {
                            result.push(PriceFilterString);
                        }

                    }
                    console.log(result);
                    return result;
                }

            },
            ProductSearchResult: function (AlgoliaSvc, $stateParams, $q, DisjunctiveFacets, FilterStrings, PriceFilterString) {
                var index;
                if ($stateParams.productssortby) {
                    index = AlgoliaSvc.GetIndex($stateParams.productssortby);
                } else {
                    index = AlgoliaSvc.GetIndex('products');
                }


                var deferred = $q.defer();
                var queue = [];
                var facets = ["*"].concat(DisjunctiveFacets);
                var count = 0;
                if (FilterStrings.length == 0) {
                    AlgoliaSvc.Search(index, $stateParams.catId, null, {
                        facets: "*",
                        filters:PriceFilterString,
                        hitsPerPage: 9,
                        page: $stateParams.productpage - 1 || 0
                    })
                        .then(function(d) {
                            deferred.resolve(d);
                        })
                } else {
                    FilterStrings.forEach(function (e) {
                        queue.push(function () {
                            var d = $q.defer();
                            AlgoliaSvc.Search(index, $stateParams.catId, null, {
                                facets: facets[count],
                                hitsPerPage: 9,
                                filters: e,
                                page: $stateParams.productpage - 1 || 0
                            })
                                .then(function (data) {
                                    d.resolve(data);
                                });
                            return d.promise;
                        }());
                        count++;
                    });
                    $q.all(queue)
                        .then(function (data) {
                            var result = data[0];
                            if (DisjunctiveFacets.length > 1) {
                                result.facets[DisjunctiveFacets[0]] = data[1].facets[DisjunctiveFacets[0]];
                                result.facets[DisjunctiveFacets[1]] = data[2].facets[DisjunctiveFacets[1]];
                            } else if (DisjunctiveFacets.length > 0) {
                                result.facets[DisjunctiveFacets[0]] = data[1].facets[DisjunctiveFacets[0]];
                            }
                            deferred.resolve(result);
                        });
                }
                return deferred.promise;

            },
              productImages: function(PlpService){
                 var ticket = localStorage.getItem("alf_ticket");
                 return PlpService.GetProductImages(ticket).then(function(res){
                 return res.items;
                 });
                 },
            ProductResultsWithVarients : function(productImages,ProductSearchResult, PdpService, $q, Underscore, alfcontenturl){
                     console.log("200 ===",ProductSearchResult);
                      var deferred = $q.defer();
                var ajaxarr = [];
                 angular.forEach(ProductSearchResult.hits, function (node) {
                   var promise =  PdpService.GetSeqProd(node.SequenceNumber)
                   ajaxarr.push(promise);
                 });
                 $q.all(ajaxarr).then(function(items){
                    console.log("items==",items);
                      var ticket = localStorage.getItem("alf_ticket");      
                      var imgcontentArray = [];
                     var imgcontentArray1=[];
                      for(var i=0;i<items.length;i++){
                     var item = items[i].Items;
                        // var item = items[i];
                    for(var j=0;j<item.length;j++){
                        var matchedImage = Underscore.where(productImages, {title: item[j].ID});
                        if(matchedImage.length > 0){
                        angular.forEach(matchedImage, function (node) {
                                node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
                                item[j].imgcontent = node;
                               imgcontentArray.push(item[j]);
                        });
                        }else{
                              item[j].imgcontent= {};
                              item[j].imgcontent['contentUrl'] = 'http://192.168.97.27:8080/share/proxy/alfresco/slingshot/node/content/workspace/SpacesStore/70589018-507f-4bed-a752-b0f7f578057c/noimg.jpg'+"?alf_ticket=" + ticket;;
                              imgcontentArray.push(item[j]);
                    }
                       
                    
                    }
                    imgcontentArray1.push(imgcontentArray);
                    imgcontentArray = []; 
                }
                console.log("items after ==",imgcontentArray1);
                  var defaultGroupedProd = [];
                     angular.forEach(imgcontentArray1, function(value, key){
                        var data;
                        $.grep(value, function(e , i){ if(e.xp.IsDefaultProduct == 'true' || e.xp.IsDefaultProduct == true){ 
                          data = i;
                        }
                    });
                        if(data == undefined){
                            console.log("value==",value);
                        }
                       //var maxValue = _.max(value, _.property('StandardPriceSchedule.PriceBreaks[0].Price'));
                      // var maxDate = _(value).map('StandardPriceSchedule.PriceBreaks[0]').flatten().max(Price);
                        var lowest = Number.POSITIVE_INFINITY;
                        var highest = Number.NEGATIVE_INFINITY;
                        var tmp;
                        //console.log("@@@" ,value.StandardPriceSchedule.PriceBreaks);
                        var isNew = false;
                        angular.forEach(value, function(prodValues, key){
                            tmp = prodValues.StandardPriceSchedule.PriceBreaks[0].Price;
                            if (tmp < lowest) lowest = tmp;
                            if (tmp > highest) highest = tmp;
                            var d = new Date(prodValues.xp.DateAdded);
                            var date= new Date(d.setMonth(d.getMonth() + 1)) > new Date();
                            if(date){isNew = true;}

                        });
                        var price;
                        if(lowest !=highest){
                            price = "$"+lowest+" - $"+highest;
                        }
                        else{
                           price = "$"+lowest; 
                        }
                        if(isNew){
                            value[data].isNew = true;
                        }
                       /* var price;
 +                         if(lowest != highest){ //check prices are different
 +                          price = "$"+lowest+" - $"+highest;
 +                         }else{
 +                           price = "$"+lowest;
 +                         }*/
                        //var price = "$"+lowest+" - $"+highest;
                        value[data].priceRange = price;
                          var b = value[data];
                          value[data] = value[0];
                          value[0] = b;
                          defaultGroupedProd.push(value);
                     });
                     console.log("final ==",defaultGroupedProd);
                      deferred.resolve(defaultGroupedProd);
                 });
                return deferred.promise;
            },
            ProductResultsWithPriceWindow: function($stateParams, PriceFilterString, AlgoliaSvc, FilterStrings, ProductSearchResult) {
                var index;
                if ($stateParams.productssortby) {
                    index = AlgoliaSvc.GetIndex($stateParams.productssortby);
                } else {
                    index = AlgoliaSvc.GetIndex('products');
                }
                if (PriceFilterString) {
                    return AlgoliaSvc.Search(index, $stateParams.catId, null, {
                        facets: "*",
                        filters: FilterStrings[0] ? FilterStrings[0].replace(" AND " + PriceFilterString, "").replace(PriceFilterString, "") : "",
                        hitsPerPage: 3,
                        page: $stateParams.productpage - 1 || 0
                    })
                        .then(function(d) {
                            if (d.hits.length < 3) {
                                ProductSearchResult.NotEnoughForPricing = true;
                            }
                            if (!ProductSearchResult.facets_stats) {
                                ProductSearchResult.facets_stats = {Price: {}};
                            }
                            ProductSearchResult.facets_stats.Price.ceiling = d.facets_stats.Price.max;
                            ProductSearchResult.facets_stats.Price.floor = d.facets_stats.Price.min;
                        })
                }

            },
        /*    InformationSearchResult: function(AlgoliaSvc, $stateParams) {
                var infoIndex;
                if ($stateParams.infosortby) {
                    infoIndex = AlgoliaSvc.GetIndex($stateParams.infosortby);
                } else {
                    infoIndex = AlgoliaSvc.GetIndex('Information');
                }
                return AlgoliaSvc.Search(infoIndex, $stateParams.searchterm, null, {
                    hitsPerPage: 10,
                    page: $stateParams.infopage - 1 || 0
                })
                    .then(function(data) {
                        return data;
                    })
            },*/
            CurrentCatgory: function($stateParams, OrderCloud, $q){
              return OrderCloud.Categories.Get($stateParams.catId, "bachmans").then(function(res){
              return res;
              });  

            },
            FacetList: function(ProductSearchResult, $stateParams, OrderCloud, $q) {
                 var deferred = $q.defer();
                if ($stateParams.filters) {
                    var tempArray = $stateParams.filters.split(",");
                    tempArray.forEach(function(e) {
                        if (!ProductSearchResult.facets[e.split(":")[0]]) {
                            ProductSearchResult.facets[e.split(":")[0]] = {};
                            ProductSearchResult.facets[e.split(":")[0]][e.split(":")[1]] = 0;
                        }
                        else if (ProductSearchResult.facets[e.split(":")[0]] && !ProductSearchResult.facets[e.split(":")[0]][e.split(":")[1]]) {
                            console.log(e.split(":")[0]);
                            ProductSearchResult.facets[e.split(":")[0]][e.split(":")[1]] = 0;
                        }
                    });
                }
                console.log(ProductSearchResult.facets);
                OrderCloud.Categories.Get($stateParams.catId, "bachmans").then(function(res){

                     OrderCloud.Categories.List(null, 1, 100, null, null, {"parentID":res.ParentID}, "all").then(function(res){
                        console.log("Categories === ", res);
                        var categoryList  = _.pluck(res.Items, 'Name');
                        console.log("categoryList == ",categoryList);
                          var result = [];

                for (var i in ProductSearchResult.facets) {
                    var tempObj = {
                        name : i
                    };
                    if(i == "Category"){
                        tempObj.list = categoryList;
                    }
                    else
                    {
                    var tempArray = [];
                    for (var x in ProductSearchResult.facets[i]) {
                        tempArray.push(x);
                    }
                    tempObj.list = tempArray;
                }
                    result.push(tempObj);
                }
                deferred.resolve(result);
                });

                });
              return deferred.promise;
            },
            Selections: function ($stateParams) {
                var result = [];
                if ($stateParams.filters) {
                    var arraySplit = $stateParams.filters.split(",");
                    arraySplit.forEach(function(e) {
                        result.push({"facetname":e.split(":")[0],"value":e.split(":")[1]})
                    })
                }
                return result;
            },
            FiltersObject: function ($stateParams) {
                var result = {};
                if ($stateParams.filters) {
                    var arraySplit = $stateParams.filters.split(",");
                    arraySplit.forEach(function (e) {
                        var keyValArray = e.split(":");
                        if (!result[keyValArray[0]]) {
                            result[keyValArray[0]] = {};
                        }
                        result[keyValArray[0]][keyValArray[1]] = true;
                    })
                }
                return result;
            }

            },
            templateUrl: 'plp/templates/plp.tpl.html',
            controller: 'PlpCtrl',
            controllerAs: 'plp'
        })

}

function PlpService($q, OrderCloud, Underscore, $timeout, $http, alfcontenturl, alfrescourl, $cookieStore, alfrescoStaticurl,$stateParams) {

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
        GetAddToCart:_getAddToCart,
        GetPlpBannerAlf:_getPlpBannerAlf
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
    function _getPlpBannerAlf(ticket) {

    var selectedPLpCatID = $stateParams.catId;
    console.log('selectedPLpCatID', selectedPLpCatID);

    var catName = underscoreToSlash(selectedPLpCatID);
     console.log('selectedPLpCatID2', catName);

      var defferred = $q.defer(); 
      $http({
      method: 'GET',
      dataType:"json",
      url: alfrescoStaticurl+"Categories/"+catName+"/Media?alf_ticket="+localStorage.getItem('alfTemp_ticket'),
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



function PlpController(FacetList, FiltersObject, CurrentCatgory,ProductResultsWithVarients, Selections, ProductSearchResult, SharedData, $state, $uibModal,$q, Underscore, $stateParams,PlpService, /*productList, */$scope, alfcontenturl,OrderCloud,$sce,alfStaticContenturl) {


    var vm = this;
   vm.productList = ProductResultsWithVarients;
    vm.ProductResults = ProductSearchResult;
     vm.FiltersObject = FiltersObject;
     console.log("FiltersObject == ",FiltersObject);
        // START: function for facet selection logic
      //  vm.Selections = [];
      vm.FiltersObject = FiltersObject;
         vm.Selections = Selections;
         vm.currentProductPage = $stateParams.productpage;
   console.log("CurrentCatgory==",CurrentCatgory);

   vm.CurrentCatgory = CurrentCatgory;
 vm.CustomFacetList = FacetList;
// vm.priceValue = [parseInt($stateParams.min) || vm.ProductResults.facets_stats.Price.min, parseInt($stateParams.max) || vm.ProductResults.facets_stats.Price.max];
  vm.toggleFacet = function(facet, value) {
        var currentFilter = $stateParams.filters;
        if (!currentFilter) {
             currentFilter =  "Category" + ':' + CurrentCatgory.Name;
             currentFilter += ',' + facet + ':' + value;
            
        } else {
            if (currentFilter.indexOf(facet + ':' + value) > -1) {
                currentFilter = currentFilter.replace(facet + ":" + value + ",", "");
                currentFilter = currentFilter.replace(facet + ":" + value, "");
            } else {
                currentFilter += ',' + facet + ':' + value;
                }
            }
        if (currentFilter.slice(-1) == ",") {
            console.log('hit');
            currentFilter = currentFilter.substring(0, currentFilter.length - 1);

        }
        $state.go('plp', {
            filters: currentFilter,
            productpage: vm.currentProductPage || 1,
            infopage: vm.currentInfoPage || 1,
            tab: vm.activeTab,
            infosortby: vm.infoSortTerm,
            productssortby: vm.productSortTerm/*,
            min: $stateParams.min || null,
            max: $stateParams.max || null*/
        },
            {reload: true});
    };
     vm.changePage = function() {
        $state.go('plp', {
            filters: $stateParams.filters,
            productpage: vm.currentProductPage || 1,
           // infopage: vm.currentInfoPage || 1,
            //tab: vm.activeTab,
           // infosortby: vm.infoSortTerm,
           // productssortby: vm.productSortTerm,
          min: $stateParams.min || null,
            max: $stateParams.max || null
        }, {reload: true})
    };

      vm.SortByProducts = function(indexName, selcetedItem) {
        $state.go('plp', {
                filters: $stateParams.filters,
                productpage: vm.currentProductPage || 1,
                //infopage: vm.currentInfoPage || 1,
               //tab: vm.activeTab,
               // infosortby: vm.infoSortTerm,
                productssortby: indexName,
                min: $stateParams.min || null,
                max: $stateParams.max || null
            },
            {reload: true})
        vm.selectedItem =selcetedItem;
    };

     vm.changePriceRange = function() {
        console.log('hehehehe');
        var newMin;
        var newMax;
        if (vm.sliderValue[0] != vm.priceValue[0]) {
            newMin = vm.sliderValue[0];
        } else {
            newMin = $stateParams.min || null;
        }
        if (vm.sliderValue[1] != vm.priceValue[1]) {
            newMax = vm.sliderValue[1]
        } else {
            newMax = $stateParams.max || null;
        }

        $state.go('plp', {
                filters: $stateParams.filters,
                productpage: vm.currentProductPage || 1,
               // infopage: vm.currentInfoPage || 1,
               // tab: vm.activeTab,
               // infosortby: vm.infoSortTerm,
                productssortby: vm.productSortTerm,
                min: newMin,
                max: newMax
            },
            {reload: true})
    };

    //Function for clear all facets
    vm.clearSelection = function(){
       vm.selection = [];
       vm.facetName = {};
      angular.element('.plp-page .selected-list .left-part div .list-items .catLeftArrow').css({'display':'none','visibility':'hidden'});
      angular.element('.plp-page .selected-list .left-part div .list-items .catRightArrow').css({'display':'none','visibility':'hidden'});
    }
    // Function for navigation to PDP
    vm.detailsPage = function($event){
      var id = $($event.target).parents('.prodImagewrap').attr('data-prodid');
      var seq= $($event.target).parents('.prodImagewrap').attr('data-sequence');
      if(typeof id != "undefined"){
         var href= "/pdp/"+ seq + "/prodId="+id;
         $state.go('pdp', { 'sequence':seq , 'prodId':id });
       }else{
        var href= "/pdp/"+ seq ;
        $state.go('pdp', { 'sequence':seq });
      }
    }


   // vm.selectionLength = vm.selection.length;

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
  vm.togglFaceteSelection = function(facetName, value) {

        vm.toggleFacet(facetName, value);
     /*   var idx = vm.selection.indexOf(facetName);
        // is currently selected
        if(isFromTopBar){
          vm.facetName[facetName] = false;
           vm.facetOwlReinitialise();
        }
        if (idx > -1) {
          vm.selection.splice(idx, 1);
         vm.facetOwlReinitialise();

        }
        // is newly selected
        else {
          vm.selection.push(facetName);
         vm.facetOwlReinitialise();
        }*/
      };

      // END:function for facet selection logic

      // START: function for sort options selection
      var sortItems=[
      {'value':'New','label':'New', 'index' : 'products'},      
      {'value':'PriceHighesttoLowest','label':'Price Highest to Lowest', 'index' : 'products_price_desc'},
      {'value':'PriceLowesttoHighest','label':'Price Lowest to Highest','index' : 'products_price_asc'},
      {'value':'BestSellers','label':'Best Sellers', 'index' : 'products'},
      {'value':'Local Delivery','label':'Local Delivery', 'index' : 'products'},
      {'value':'Nationwide Delivery','label':'Nationwide Delivery', 'index' : 'products'},
      {'value':'Most Popular','label':'Most Popular', 'index' : 'products'},
      {'value':'AZ','label':'A - Z', 'index' : 'products'},
      {'value':'ZA','label':'Z - A',  'index' : 'products_name_desc'},

      /*{'value':'BestSellers','label':'Best Sellers'},
      {'value':'Relevance','label':'Relevance'},
      {'value':'PriceHighesttoLowest','label':'Price Highest to Lowest'},
      {'value':'PriceLowesttoHighest','label':'Price Lowest to Highest'},
      {'value':'AZ','label':'A - Z'},
      {'value':'ZA','label':'Z - A'},*/
      ];
      vm.sortItems = sortItems;
      if($stateParams.productssortby == undefined){
      vm.selectedItem ="Best Sellers";
      vm.selectedMenu = 0; 
  }
  else{

var slectItem = Underscore.where(vm.sortItems, {index:$stateParams.productssortby});
vm.selectedItem = slectItem[0].label;
  }

      vm.changeSortSelection = function changeSortSelection(selcetedItem, itemIndex){
         vm.selectedItem =selcetedItem;
         vm.selectedMenu = itemIndex; 

      };
      // END: function for sort options selection

      // START : Function for pagination
          vm.data = [{"name":"Bell","id":"K0H 2V5"},{"name":"Octavius","id":"X1E 6J0"},{"name":"Alexis","id":"N6E 1L6"},{"name":"Colton","id":"U4O 1H4"},{"name":"Abdul","id":"O9Z 2Q8"},{"name":"Ian","id":"Q7W 8M4"},{"name":"Eden","id":"H8X 5E0"},{"name":"Britanney","id":"I1Q 1O1"},{"name":"Ulric","id":"K5J 1T0"},{"name":"Geraldine","id":"O9K 2M3"},{"name":"Hamilton","id":"S1D 3O0"},{"name":"Melissa","id":"H9L 1B7"},{"name":"Remedios","id":"Z3C 8P4"},{"name":"Ignacia","id":"K3B 1Q4"},{"name":"Jaime","id":"V6O 7C9"},{"name":"Savannah","id":"L8B 8T1"},{"name":"Declan","id":"D5Q 3I9"},{"name":"Skyler","id":"I0O 4O8"},{"name":"Lawrence","id":"V4K 0L2"},{"name":"Yael","id":"R5E 9D9"},{"name":"Herrod","id":"V5W 6L3"},{"name":"Lydia","id":"G0E 2K3"},{"name":"Tobias","id":"N9P 2V5"},{"name":"Wing","id":"T5M 0E2"},{"name":"Callum","id":"L9P 3W5"},{"name":"Tiger","id":"R9A 4E4"},{"name":"Summer","id":"R4B 4Q4"},{"name":"Beverly","id":"M5E 4V4"},{"name":"Xena","id":"I8G 6O1"},{"name":"Yael","id":"L1K 5C3"},{"name":"Stacey","id":"A4G 1S4"},{"name":"Marsden","id":"T1J 5J3"},{"name":"Uriah","id":"S9S 8I7"},{"name":"Kamal","id":"Y8Z 6X0"},{"name":"MacKensie","id":"W2N 7P9"},{"name":"Amelia","id":"X7A 0U3"},{"name":"Xavier","id":"B8I 6C9"},{"name":"Whitney","id":"H4M 9U2"},{"name":"Linus","id":"E2W 7U1"},{"name":"Aileen","id":"C0C 3N2"},{"name":"Keegan","id":"V1O 6X2"},{"name":"Leonard","id":"O0L 4M4"},{"name":"Honorato","id":"F4M 8M6"},{"name":"Zephr","id":"I2E 1T9"},{"name":"Karen","id":"H8W 4I7"},{"name":"Orlando","id":"L8R 0U4"},{"name":"India","id":"N8M 8F4"},{"name":"Luke","id":"Q4Y 2Y8"},{"name":"Sophia","id":"O7F 3F9"},{"name":"Faith","id":"B8P 1U5"},{"name":"Dara","id":"J4A 0P3"},{"name":"Caryn","id":"D5M 8Y8"},{"name":"Colton","id":"A4Q 2U1"},{"name":"Kelly","id":"J2E 2L3"},{"name":"Victor","id":"H1V 8Y5"},{"name":"Clementine","id":"Q9R 4G8"},{"name":"Dale","id":"Q1S 3I0"},{"name":"Xavier","id":"Z0N 0L5"},{"name":"Quynn","id":"D1V 7B8"},{"name":"Christine","id":"A2X 0Z8"},{"name":"Matthew","id":"L1H 2I4"},{"name":"Simon","id":"L2Q 7V7"},{"name":"Evan","id":"Z8Y 6G8"},{"name":"Zachary","id":"F4K 8V9"},{"name":"Deborah","id":"I0D 4J6"},{"name":"Carl","id":"X7H 3J3"},{"name":"Colin","id":"C8P 0O1"},{"name":"Xenos","id":"K3S 1H5"},{"name":"Sonia","id":"W9C 0N3"},{"name":"Arsenio","id":"B0M 2G6"},{"name":"Angela","id":"N9X 5O7"},{"name":"Cassidy","id":"T8T 0Q5"},{"name":"Sebastian","id":"Y6O 0A5"},{"name":"Bernard","id":"P2K 0Z5"},{"name":"Kerry","id":"T6S 4T7"},{"name":"Uriel","id":"K6G 5V2"},{"name":"Wanda","id":"S9G 2E5"},{"name":"Drake","id":"G3G 8Y2"},{"name":"Mia","id":"E4F 4V8"},{"name":"George","id":"K7Y 4L4"},{"name":"Blair","id":"Z8E 0F0"},{"name":"Phelan","id":"C5Z 0C7"},{"name":"Margaret","id":"W6F 6Y5"},{"name":"Xaviera","id":"T5O 7N5"},{"name":"Willow","id":"W6K 3V0"},{"name":"Alden","id":"S2M 8C1"},{"name":"May","id":"L5B 2H3"},{"name":"Amaya","id":"Q3B 7P8"},{"name":"Julian","id":"W6T 7I6"},{"name":"Colby","id":"N3Q 9Z2"},{"name":"Cole","id":"B5G 0V7"},{"name":"Lana","id":"O3I 2W9"},{"name":"Dieter","id":"J4A 9Y6"},{"name":"Rowan","id":"I7E 9U4"},{"name":"Abraham","id":"S7V 0W9"},{"name":"Eleanor","id":"K7K 9P4"},{"name":"Martina","id":"V0Z 5Q7"},{"name":"Kelsie","id":"R7N 7P2"},{"name":"Hedy","id":"B7E 7F2"},{"name":"Hakeem","id":"S5P 3P6"}];
 
          vm.viewby = 9;
          vm.totalItems = ProductResultsWithVarients.length;
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
                1900:{ 
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
             backdropClass:'addedToCartModal',
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
            animation: false,
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
    vm.wishlistModal = function() {
        var modalInstance = $uibModal.open({
            animation: false,
            windowClass: 'wishlistModal',
            templateUrl: 'plp/templates/wishlist-model.tpl.html',
            controller:'wishlistModalCtrl',
            controllerAs: 'wishlistModal'
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
    PlpService.GetPlpBannerAlf(ticket).then(function(res){
        var clpContentPlp = [];
        if(res.items.length>0){
            angular.forEach(Underscore.where(res.items), function (node) {
                node.contentUrl = alfStaticContenturl + node.contentUrl+"?alf_ticket="+localStorage.getItem("alfTemp_ticket");
                clpContentPlp.push(node);
            });
        }else{
            clpContentPlp.push({contentUrl : 'assets/images/placement_for_PLP_ASpot.jpg',
                            displayName : 'PLP_ASpot'});
        }
        vm.clpContentPlp = clpContentPlp;

        console.log("clpContentPlp...", vm.clpContentPlp);
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
  vm.btnText = 'ADD TO WISHLIST';
  vm.addToWL = function(){
    vm.btnText = $sce.trustAsHtml('<span class="svg-added">'+
                  '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 137.5 93.3" style="enable-background:new 0 0 137.5 93.3;" xml:space="preserve">'+
                      '<g>'+
                        '<path d="M116.3,23.6L70.2,69.7l-8.7,8.7c-1.1,1.1-2.7,1.8-4.3,1.8s-3.2-0.6-4.3-1.8l-8.7-8.7l-23-23c-1.1-1.1-1.8-2.7-1.8-4.3 s0.6-3.2,1.8-4.3l-0.1,0.1c1.1-1.1,2.7-1.8,4.3-1.8s3.2,0.6,4.3,1.8l27.5,27.3L107.6,15c1.1-1.1,2.7-1.8,4.3-1.8s3.2,0.6,4.3,1.8 l0,0c1.1,1.1,1.8,2.7,1.8,4.3S117.4,22.5,116.3,23.6z"/>'+
                      '</g>'+
                  '</svg>'+
                '</span> ADDED');
  }
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
//wishlistpopup
function wishlistModalController($scope, $uibModalInstance) {
    var vm = this;
    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
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
            product: '=product',
            selectedproductinfo: '=selectedproductinfo',
            featuredselectedproductinfo:'=featuredselectedproductinfo'
        },
        replace:true,
        restrict:'E',
        templateUrl:'plp/templates/quick-view.tpl.html',
        controller:'ProductQuickViewCtrl',
        controllerAs:'productQuickView'
    }
}

 function ProductQuickViewController ($uibModal, $scope ){
    var vm = this;
    
    vm.open = function (product, selectedproductinfo, featuredselectedproductinfo){
     console.log(product);
        $uibModal.open({
            animation:true,
            windowClass:'quickViewModal',
            templateUrl: 'plp/templates/quick-view-model.tpl.html',
            controller: 'ProductQuickViewModalCtrl',
            controllerAs: 'productQuickViewModal',

            resolve: {
                productDetail: function (OrderCloud) {
                    return product;
                },
                productImages : function(PdpService, $stateParams, $q, $http){
                  return PdpService.GetProductCodeImages(product[0].ID);
                },
                selectedProduct : function(){
                    var productObj = $scope.$parent.$parent.plp.selectedProductInfo;
                    var featuredProductObj = $scope.$parent.$parent.plp.FeaturedselectedProductInfo;
                    if(featuredselectedproductinfo === undefined){
                        return productObj[selectedproductinfo].prodId 
                    }else if(selectedproductinfo === undefined){
                        return featuredProductObj[featuredselectedproductinfo].prodId 
                    } 
                },
             /*   extraProductImages: function (PlpService) {
                  var ticket = localStorage.getItem("alf_ticket");
                  return PlpService.GetProductImages(ticket).then(function (res) {
                    return res.items;
                  });
                },*/
                extraProducts: function ( Underscore, PdpService, alfcontenturl, PlpService) {

                  var imageData = PdpService.GetExtras();
                  var res = Object.keys(imageData).map(function (key) { return imageData[key] });
                  var ticket = localStorage.getItem("alf_ticket");
                  var imgcontentArray = [];
                 return  PlpService.GetProductImages(ticket).then(function (imgs) {
                    //return res.items;
                       for (var i = 0; i < res.length; i++) {
                    for (var j = 0; j < res[i].length; j++) {
                      angular.forEach(Underscore.where(imgs.items, { title: res[i][j].Skuid }), function (node) {
                        node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
                        imgcontentArray.push(node);
                      });
                      res[i][j].imgContent = imgcontentArray;
                      imgcontentArray = [];
                    }
                  }
                   return res;
                  });
               
                 

                }
            }
        });
    };
}

function ProductQuickViewModalController(productDetail, extraProducts, selectedProduct, $timeout, $scope, PdpService, productImages, $uibModalInstance){
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
  vm.sizeGroupedProducts = []; // stores prodcuts in accrging to size 
  vm.productVarientImages = productImages; // stores product images based on selcted size and color
  vm.defaultSizeIndex = 0; // static value to retrieve size
  vm.selectedProductId = 0; //Holds selected SKU Id
  var activeProducts = null;
  var availableColors, availableSizes =[];
  $scope.radio = { selectedSize: -1 , selectedColor : -1};
  vm.wishListTxt = "ADD TO WISHLIST"; //Default text for wishlist button
  vm.displayWishList = false; // TO display wishlist text after server check


  availableSizes = DisplaySizes(productDetail, true);
  vm.allSizes = availableSizes;
  availableColors = DisplayColors(productDetail, true);
  vm.allColors = availableColors;


  if (selectedProduct !== undefined) {
      $.grep(productDetail, function (e, i) {
        if (e.ID == selectedProduct) {
          vm.gotoPdp = "/pdp/"+e.xp.ProductCode+"?prodId="+e.ID;
          $scope.radio.selectedColor = e.xp.SpecsOptions.Color;
          $scope.radio.selectedSize = e.xp.SpecsOptions.Size;
          vm.productTitle = e.Name;
          vm.prodDesription = e.Description;
          var selectedSizeHold = angular.copy(availableSizes);
          var selectedColorHold = angular.copy(availableColors);
          DisplaySelectedColor(e.xp.SpecsOptions.Size, _.findIndex(selectedSizeHold, function (item) { 
             if(e.xp.SpecsOptions.Size === null || e.xp.SpecsOptions.Size === null){
              return item.xp.SpecsOptions.Size == e.xp.SpecsOptions.Size 
             }else{
             return item.xp.SpecsOptions.Size.toLowerCase() == e.xp.SpecsOptions.Size.toLowerCase() 
             }
            })
            );
            DisplaySelectedSize(e.xp.SpecsOptions.Color, _.findIndex(selectedColorHold, function (item) { 
             if(e.xp.SpecsOptions.Color === null || e.xp.SpecsOptions.Color === null){
              return item.xp.SpecsOptions.Color == e.xp.SpecsOptions.Color 
             }else{
             return item.xp.SpecsOptions.Color.toLowerCase() == e.xp.SpecsOptions.Color.toLowerCase() 
             }
            })
            );
          }
      });
  } else {
    vm.selectedSizeIndex = -1;
    vm.selectedProductIndex = -1;
    vm.baseTitle = false;
    var baseData;
    $.grep(productDetail, function (e, i) {
      if (e.xp.IsBaseProduct == 'true') {
        baseData = i;
        vm.gotoPdp = "/pdp/"+e.xp.ProductCode;
        vm.productTitle = e.xp.BaseProductTitle;
        vm.prodDesription = e.xp.BaseDescription;
      }
    });
  }

  //Extras for products
  vm.productExtras = extraProducts;
   vm.SelectExtra = function(selectedExtra, $event){
      $('.dropdown.open button p').text(selectedExtra);
    }
  vm.setQvImage = function($event){
    $($event.target).parents('.category-pdt-carousel').find('#img-min-height img').attr('src',$($event.target).attr('src'));
  }


  // Function to get colors for selected size
  vm.selectVarients = function (selectedSize, $index) {
    DisplaySelectedColor(selectedSize, $index);
  };
  

  // function to retrieve images for selected size and color
  vm.selectColor = function ($index,  color) {
    DisplaySelectedSize(color, $index );
  }

  vm.selectedColorIndex = 0;
  vm.productVarientImages = productImages;
  console.log('testimg', vm.productVarientImages)

 // Add to wishList
  vm.addToWishList = function (productID) {
    if (productID > 1) {
      WishListHandler(productID, false);
    } else {
      //alert('Please Select a product from available options');
      vm.cartErrPlp = 'Please Select a product from available options';
    }
  }


  // FUnction to display all available colors
  function DisplayColors(prodcuts, IsObjectRequired){
    console.log("All Product",prodcuts);
      var unique = {};
        var distinct = [];
        var distinctObj = [];
    for( var i in prodcuts ){
            if(typeof(prodcuts[i].xp) !== 'undefined'){
             if( typeof(unique[prodcuts[i].xp.SpecsOptions.Color]) == "undefined"){
              distinct.push(prodcuts[i].xp.SpecsOptions.Color);
              distinctObj.push(prodcuts[i]);
             }
             unique[prodcuts[i].xp.SpecsOptions.Color] = 0;
            }
          }
          if(IsObjectRequired)
      return distinctObj;
          else
        return distinct;
      
  }

  // FUnction to display all available sizes
  function DisplaySizes(prodcuts, IsObjectRequired){
    console.log("All Product",prodcuts);
      var unique = {};
        var distinct = [];
        var distinctObj = [];
    for( var i in prodcuts ){
            if(typeof(prodcuts[i].xp) !== 'undefined'){
             if( typeof(unique[prodcuts[i].xp.SpecsOptions.Size]) == "undefined"){
              distinct.push(prodcuts[i].xp.SpecsOptions.Size);
              distinctObj.push(prodcuts[i]);
             }
             unique[prodcuts[i].xp.SpecsOptions.Size] = 0;
            }
          }
          if(IsObjectRequired)
      return distinctObj;
      else
        return distinct;
  }

  // Function to get selected product
  function DisplayProduct(selectedSku){
    vm.productTitle = selectedSku.Name;
    vm.prodDesription = selectedSku.Description;
    vm.selectedProductId = selectedSku.ID;
    vm.gotoPdp = "/pdp/"+selectedSku.xp.ProductCode+"?prodId="+selectedSku.ID;
    WishListHandler(selectedSku.ID, true);
    PdpService.GetProductCodeImages(selectedSku.ID).then(function (res) {
      vm.productVarientImages = res;
      var owl2 = angular.element("#owl-carousel-pdp-banner");
      owl2.trigger('destroy.owl.carousel');
      setTimeout(function () {
        owl2.owlCarousel({
          loop: false,
          nav: true,
          navText: ['<span class="" aria-hidden="true"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 90" style="enable-background:new 0 0 50 90;" xml:space="preserve"><style type="text/css">.st0{fill:none;stroke:#8c58b5;stroke-width:8;stroke-miterlimit:10;}</style><polyline class="st0" points="10,11.7 41.3,46.4 10,81.1 "/></svg></span>', '<span class="" aria-hidden="true"><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 90" style="enable-background:new 0 0 50 90;" xml:space="preserve"><style type="text/css">.st0{fill:none;stroke:#8c58b5;stroke-width:8;stroke-miterlimit:10;}</style><polyline class="st0" points="10,11.7 41.3,46.4 10,81.1 "/></svg></span>'],
          dots: true,
          items: 1
        });

        if ($(window).width() > 1024) {
          $(".elevateZoom").elevateZoom({
            easing: true,
            responsive: true,
            lensSize: 100,
            zoomWindowWidth: 500,
            zoomWindowHeight: 500,
          
            borderSize: 1,
            zoomWindowOffetx: 150
          });
        }
        if ($(window).width() <= 1024) {
          $(".elevateZoom").pinchzoomer();
        }
      }, 300);
    });
  }


  function DisplaySelectedColor(selectedSize, $index){
    vm.selectedSizeIndex = $index;
    // vm.selectedProductIndex = -1;
    var prodFiltered = _.filter(productDetail, function(_obj) {
       if(_obj.xp.SpecsOptions.Size === null || selectedSize === null){
                return (_obj.xp.SpecsOptions.Size == selectedSize)
            }else{
                return (_obj.xp.SpecsOptions.Size == selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == selectedSize)
            }
    });
    var imAvailableColors = angular.copy(availableColors);
    prodFiltered = DisplayColors(prodFiltered, false);
    prodFiltered = _.filter( imAvailableColors, function(color) {
      if(_.contains(prodFiltered, color.xp.SpecsOptions.Color)){
        color.isNotAvailable = false;
        return color;
      }
      else{
        color.isNotAvailable = true;
        return color;
      }
    });
    vm.allColors = prodFiltered;
    if($scope.radio.selectedSize != -1 && $scope.radio.selectedColor != -1){
      var selectedSku = _.filter(productDetail, function(_obj) {
            return ((_obj.xp.SpecsOptions.Size == $scope.radio.selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == $scope.radio.selectedSize) && (_obj.xp.SpecsOptions.Color == $scope.radio.selectedColor || _obj.xp.SpecsOptions.Color.toLowerCase() == $scope.radio.selectedColor))
      });
      if(selectedSku.length ==1){
        
        DisplayProduct(selectedSku[0]);
      }else{
        console.log('PDP PRODUCT ERROR :: ', selectedSku);
      }
    }
  }


  function  DisplaySelectedSize( color, $index ){

    var colorFiltered = _.filter(productDetail, function(_obj) { // filters SKU with  selected color
         if(_obj.xp.SpecsOptions.Color === null || color === null){
                return (_obj.xp.SpecsOptions.Color == color)
            }else{
                return (_obj.xp.SpecsOptions.Color.toLowerCase() == color.toLowerCase())
            }
    });
    colorFiltered = DisplaySizes(colorFiltered, false); // sizes availavle for seelcted color 
    var imAvailableSizes = angular.copy(availableSizes); //copy for all available sizes
    colorFiltered = _.filter( imAvailableSizes, function(size) { // Adds isNotAvailable attribute for Sizes based on selected dolor
      if(_.contains(colorFiltered, size.xp.SpecsOptions.Size)){
        size.isNotAvailable = false;
        return size;
      }
      else{
        size.isNotAvailable = true;
        return size;
      }
    });
     vm.allSizes = colorFiltered; // bind the sizes to DOM
     vm.selectedProductIndex = $index; // Active state for selected color
     if($scope.radio.selectedSize != -1 && $scope.radio.selectedColor != -1){ // change prodcut if size and color is selected
      var selectedSku = _.filter(productDetail, function(_obj) {
        return ((_obj.xp.SpecsOptions.Size == $scope.radio.selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == $scope.radio.selectedSize) && (_obj.xp.SpecsOptions.Color == $scope.radio.selectedColor || _obj.xp.SpecsOptions.Color.toLowerCase() == $scope.radio.selectedColor))
      });
      if(selectedSku.length == 1){
             
        DisplayProduct(selectedSku[0]); // displays selected product info
      }else{
        console.log('PDP PRODUCT ERROR ::', selectedSku);
      }
    }
  }



  function WishListHandler(productId, isOnload){
    vm.wishListTxt = "Add To WishList";
    vm.displayWishList = false;
    PdpService.AddToWishList(productId, isOnload).then(function (item) {
        if(item == true){
          vm.wishListTxt ="ADDED";
          //Product Added confirmation popup here
        }
        else if(item == false){
          vm.wishListTxt ="ADDED Already";
          //Product Already in list  popup here
        }
        vm.displayWishList = true;
      });
  }


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


function ProdColorsDirective(){
    return{
        scope:{
            product: '=product',
            selectedproductinfo: '=selectedproductinfo',
            featuredselectedproductinfo: '=featuredselectedproductinfo'
        },
        restrict:'E',
        transclude: true,
        controller: ProductColorCtrl ,
        templateUrl:'plp/templates/prod-colors.tpl.html',
        controllerAs :'prodctrl'
        // template:'<span>fdgsdfg</span>'
    }
 }

 function ProductColorCtrl($scope, Underscore){
            var vm = $(this);
           var groupedProducts = $scope.product;
            var defaultGroupedProd = [];
            var sizeGroupedProducts = _.groupBy(groupedProducts, function(item) { 
                // return "'"+item.xp.SpecsOptions.Size+"'";
                return item.xp.SpecsOptions.Size;
            });
           var data;
           $.grep(groupedProducts, function(e , i){ if(e.xp.IsDefaultProduct == 'true' || e.xp.IsDefaultProduct == true)  data = i;});
           var dafaultSize = groupedProducts[data].xp.SpecsOptions.Size; // pushing default product on top
           
           var defaultSizeGroupedProd = sizeGroupedProducts[dafaultSize];
           if(dafaultSize !== null){
           if(dafaultSize.toLowerCase() !== 'standard' ){
            angular.forEach(sizeGroupedProducts["STANDARD"], function(standardValue, key){
                defaultSizeGroupedProd.push(standardValue); // pushing standard size products
            });
           }
            
           angular.forEach(sizeGroupedProducts, function(sizeValue, key){
             if(dafaultSize !== key && key !== 'standard'){
               angular.forEach(sizeValue, function(prodVal, key){
                defaultSizeGroupedProd.push(prodVal); // pushin  remaining SKU
            });
            }
           });
       }

           // Color filtering for default size criteria
           var unique = {};
            var distinct = [];
            var distinctObj = [];
            for( var i in defaultSizeGroupedProd ){
            if(typeof(defaultSizeGroupedProd[i].xp) !== 'undefined'){
             if( typeof(unique[defaultSizeGroupedProd[i].xp.SpecsOptions.Color]) == "undefined"){
              distinct.push(defaultSizeGroupedProd[i].xp.SpecsOptions.Color);
              distinctObj.push(defaultSizeGroupedProd[i]);
             }
             unique[defaultSizeGroupedProd[i].xp.SpecsOptions.Color] = 0;
            }
          }
           $scope.SrotedColors = distinctObj;
            $scope.selectedColorIndex = -1;
           $scope.selectColor = function($index, $event, prod){
            $scope.selectedColorIndex = $index;
            var productObj = $scope.$parent.$parent.plp.selectedProductInfo;
                var featuredProductObj = $scope.$parent.$parent.plp.FeaturedselectedProductInfo;
                var selectedProductParentIndex = $scope.selectedproductinfo;
                var FeaturedProductParentIndex = $scope.featuredselectedproductinfo;
                if(!FeaturedProductParentIndex){
                    productObj[selectedProductParentIndex].prodId = prod.ID;
                }else if(!selectedProductParentIndex){
                    featuredProductObj[FeaturedProductParentIndex].prodId = prod.ID;
            }
             //console.log(prodId.imgContent);
             $($event.target).parents('.product-box').find('img')[0].src = prod.imgcontent.contentUrl;
             $($event.target).parents('.product-box').find('.product-name-plp span').text(capFil(prod.Name));
             //$($event.target).parents('.product-box').find('.Price').text('$'+prod.StandardPriceSchedule.PriceBreaks[0].Price);
             $($event.target).parents('.product-box').find('.prodImagewrap').attr('data-sequence', prod.xp.SequenceNumber);
             $($event.target).parents('.product-box').find('.prodImagewrap').attr('data-prodid', prod.ID);
             SharedData.SelectedProductId = prod.ID;
             SharedData.SelectedSequence = prod.xp.SequenceNumber;
             $event.stopPropagation();
           }


    }
function capFil(inpt){
  if (inpt !== null) {

      return inpt.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    }
    return inpt;
} 
function NewLabelDirective(){
     return{
        scope:{
            product: '=newLabel'
        },
       link: function (scope, element, attrs)
        {
             var d = new Date(scope.product.xp.DateAdded);
             var isNew = new Date(d.setMonth(d.getMonth() + 1)) > new Date();
             if(isNew){
                element.html('<div class="ribbon-wrapper"><div class="ribbon-front"><p>New</p></div></div>');
             }
        }
    }
}
function underscoreToSlash(input){
      return input.replace(/_/g, '/');
} 