angular.module( 'orderCloud' )
    .config(AlgoliaConfig)
    .directive('algoliaSearch', AlgoliaSearchDirective)
    .controller('AlgoliaSearchCtrl', AlgoliaSearchController)
    .controller('AlgoliaSearchResultsCtrl', AlgoliaSearchResultsController)
    .factory('AlgoliaSvc', AlgoliaService)
    .filter('IndexType', IndexType)
    .filter('customOrderBy', CustomOrderBy)
;

function AlgoliaConfig($stateProvider) {
    $stateProvider.state('algoliaresults', {
        parent: 'base',
        url: '/search-results?searchterm&filters&productpage&infopage&tab&productssortby&infosortby&min&max',
        templateUrl: 'algolia/templates/algoliaSearchResults.tpl.html',
        controller: 'AlgoliaSearchResultsCtrl',
        controllerAs: 'algoliaSearchResults',
        resolve: {
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
                    AlgoliaSvc.Search(index, $stateParams.searchterm, null, {
                        facets: "*",
                        filters: PriceFilterString,
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
                            AlgoliaSvc.Search(index, $stateParams.searchterm, null, {
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
            ProductResultsWithPriceWindow: function($stateParams, PriceFilterString, AlgoliaSvc, FilterStrings, ProductSearchResult) {
                var index;
                if ($stateParams.productssortby) {
                    index = AlgoliaSvc.GetIndex($stateParams.productssortby);
                } else {
                    index = AlgoliaSvc.GetIndex('products');
                }
                if (PriceFilterString) {
                    return AlgoliaSvc.Search(index, $stateParams.searchterm, null, {
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
            InformationSearchResult: function(AlgoliaSvc, $stateParams) {
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
            },
            FacetList: function(ProductSearchResult, $stateParams) {
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
                var result = [];

                for (var i in ProductSearchResult.facets) {
                    var tempObj = {
                        name : i
                    };
                    var tempArray = [];
                    for (var x in ProductSearchResult.facets[i]) {
                        tempArray.push(x);
                    }
                    tempObj.list = tempArray;
                    result.push(tempObj);
                }

                return result;
            },
            Selections: function ($stateParams) {
                var result = [];
                if ($stateParams.filters) {
                    var arraySplit = $stateParams.filters.split(",");
                    arraySplit.forEach(function(e) {
                        result.push(e.split(":")[1])
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

        }
    })
}


function AlgoliaSearchDirective() {
    return {
        scope: {
            maxResults: "@",
            searchWidth: "@"
        },
        restrict: 'E',
        templateUrl: 'algolia/templates/algoliaSearchDirective.tpl.html',
        controller: 'AlgoliaSearchCtrl',
        controllerAs: 'algoliaSearch',
        replace: true
    }
}

function AlgoliaSearchController(AlgoliaSvc, $q, $scope, $state, Underscore) {

    var vm = this;
    vm.searchWidth = $scope.searchWidth;
    var productIndex = AlgoliaSvc.GetIndex('products');
    var infoIndex = AlgoliaSvc.GetIndex('Information');

    function getBothIndexes(value) {
        var deferred = $q.defer();
        var output = [];
        AlgoliaSvc.Search(productIndex, value, null, {hitsPerPage: 9})
            .then(function(data) {
                data.hits.forEach(function(e) {
                    e.index = 'products';
                });
                output = data.hits;
                AlgoliaSvc.Search(infoIndex, value, null, {hitsPerPage: 3})
                    .then(function(data2) {
                        data2.hits.forEach(function(e) {
                            e.index = 'information';
                        });
                        
                        output = output.concat(data2.hits);
                        vm.loading = false;
                        deferred.resolve(output);
                    })
            });
        return deferred.promise;
    }

    $scope.isOpen = function()  {
        return !$scope.submittedQuery && vm.searchTerm.length > 2;

    };

    vm.popupSearch = function(value) {
        vm.loading = true;
        $scope.popupOpen = true;
        console.log($scope.popupOpen);
        return getBothIndexes(value);
    };
    
    /*setTimeout(function(){
        var owlSearch = angular.element("#owl-carousel-search"); 
        owlSearch.owlCarousel({
            items:3,
            nav:true,
            margin:20
        });
    },200);*/

    $scope.submittedQuery = false;
    vm.goToAlgoliaResultsPage = function() {
        if (vm.loading) {
            angular.noop();
        } else {
            $scope.popupOpen = false;
            $state.go('algoliaresults', {searchterm: vm.searchTerm});
        }
        //takes you to algolia search results page with facets upon return key
    };

    var activeIndex;

    $scope.selectActive = function($index) {
        activeIndex = $index;
    };
    $scope.isActive = function($index) {
        return $index == activeIndex
    };


    
    $scope.selectMatch = function(match) {
        console.log(match);
        $state.go('catalog.product', {productid: match.model.Sku});
    };
    
    $scope.selectArticle = function(match) {
        //this will go to the specified article
    }

}

function AlgoliaSearchResultsController(AlgoliaSvc, ProductSearchResult, InformationSearchResult, Selections, FiltersObject, DisjunctiveFacets, FacetList, $stateParams, $state, $scope, alfcontenturl,OrderCloud,$sce, Underscore) {

    var vm = this;
    vm.FiltersObject = FiltersObject;
    vm.Selections = Selections;
    vm.ProductResults = ProductSearchResult;
    vm.InfoResults = InformationSearchResult;
    vm.CustomFacetList = FacetList;
    vm.disjunctives = DisjunctiveFacets;
    
    vm.setSearchTerm = $stateParams.searchterm;
    vm.currentProductPage = $stateParams.productpage;
    vm.currentInfoPage = $stateParams.infopage;
    vm.infoSortTerm = $stateParams.infosortby;
    vm.productSortTerm = $stateParams.productssortby;

    vm.priceValue = [parseInt($stateParams.min) || vm.ProductResults.facets_stats.Price.min, parseInt($stateParams.max) || vm.ProductResults.facets_stats.Price.max];


    vm.openOnLoad = true;
    vm.closeOthers = false;
    vm.facetFilters = {};
    vm.activeTab = parseInt($stateParams.tab) || 0;

    vm.toggleTab = function(index) {
        $stateParams.tab = index;
    }
    vm.toggleFacet = function(facet, value) {
        var currentFilter = $stateParams.filters;
        if (!currentFilter) {
            currentFilter = facet + ':' + value;
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
        $state.go('algoliaresults', {
            filters: currentFilter,
            productpage: vm.currentProductPage || 1,
            infopage: vm.currentInfoPage || 1,
            tab: vm.activeTab,
            infosortby: vm.infoSortTerm,
            productssortby: vm.productSortTerm,
            min: $stateParams.min || null,
            max: $stateParams.max || null
        },
            {reload: true});
    };

    vm.changePage = function(indexName) {
        $state.go('algoliaresults', {
            filters: $stateParams.filters,
            productpage: vm.currentProductPage || 1,
            infopage: vm.currentInfoPage || 1,
            tab: vm.activeTab,
            infosortby: vm.infoSortTerm,
            productssortby: vm.productSortTerm,
            min: $stateParams.min || null,
            max: $stateParams.max || null
        }, {reload: true})
    };

    vm.SortByProducts = function(indexName) {
        $state.go('algoliaresults', {
                filters: $stateParams.filters,
                productpage: vm.currentProductPage || 1,
                infopage: vm.currentInfoPage || 1,
                tab: vm.activeTab,
                infosortby: vm.infoSortTerm,
                productssortby: indexName,
                min: $stateParams.min || null,
                max: $stateParams.max || null
            },
            {reload: true})
    };
    vm.SortByInfo = function(indexName) {
        $state.go('algoliaresults', {
                filters: $stateParams.filters,
                productpage: vm.currentProductPage || 1,
                infopage: vm.currentInfoPage || 1,
                tab: vm.activeTab,
                infosortby: indexName,
                productssortby: vm.productSortTerm,
                min: $stateParams.min || null,
                max: $stateParams.max || null
            },
            {reload: true})
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

        $state.go('algoliaresults', {
                filters: $stateParams.filters,
                productpage: vm.currentProductPage || 1,
                infopage: vm.currentInfoPage || 1,
                tab: vm.activeTab,
                infosortby: vm.infoSortTerm,
                productssortby: vm.productSortTerm,
                min: newMin,
                max: newMax
            },
            {reload: true})
    };

    var ticket = localStorage.getItem("alf_ticket");
    AlgoliaSvc.GetHelpAndPromo(ticket).then(function(res){
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


    vm.shiftSelectedFacetRight= function(){
        var currentPos = angular.element('.search-facet-scroll').scrollLeft();
        var posToShift = angular.element('.search-facet-scroll span').width();
        angular.element('.search-facet-scroll').scrollLeft(currentPos + posToShift);
        angular.element('.facetLeftArrow').css({'display':'block'});
       // alert(currentPos);
        var scrollEnd = ((vm.Selections.length - 4) * posToShift) - 10;
        if(currentPos > scrollEnd){
          angular.element('.faceRightArrow').css({'display':'block'});
        } else{
          angular.element('.facetRightArrow').css({'display':'block'});
        }
      }
      vm.shiftSelectedFacetLeft= function(){
        var currentPos = angular.element('.search-facet-scroll').scrollLeft();
        var posToShift = angular.element('.search-facet-scroll span').width();
        angular.element('.search-facet-scroll').scrollLeft(currentPos - posToShift);
        angular.element('.facetRightArrow').css({'display':'block'});
        if(currentPos == 0){
          angular.element('.facetLeftArrow').css({'display':'block'});
        } else{
          angular.element('.facetLeftArrow').css({'display':'block'});
        }
      } 

}

function AlgoliaService(algolia, $q, OrderCloud, Underscore, $timeout, $http, alfcontenturl, alfrescourl) {

    var _client = algolia.Client("DC2GHSK48B", '3ffbd2c0a888682fbfb7a39e5f4e22f5');
    var lastBaseSearchValue = '';
    var lastBaseSearchResult = {};

    function _getIndex(indexName) {
        return _client.initIndex(indexName);
    }


    //filters is an object. check them out here... https://www.algolia.com/doc/javascript#search
    function _search(index, searchVal, searchType, filters) {
        var deferred = $q.defer();
        if (searchType == 'base' && lastBaseSearchValue == searchVal) {
            deferred.resolve(lastBaseSearchResult);
        } else {
            index.search(searchVal, filters)
                .then(function searchSuccess(content) {
                    if (searchType == 'base') {
                        lastBaseSearchValue = searchVal;
                        lastBaseSearchResult = content;
                    }
                    deferred.resolve(content);
                }, function searchFailure(err) {
                    console.log('Search Failure in Algolia Service Factory');
                    deferred.reject(err);
                });
        }

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

    var service = {
        GetIndex: _getIndex,
        Search: _search,
        GetHelpAndPromo:_getHelpAndPromo
    };
    return service;
}

function IndexType() {
    return function(matches, indexName) {
        var output = [];
        matches.forEach(function(e) {
            if (e.model.index == indexName) {
                output.push(e);
            }
        });
        return output;
    }
}

function CustomOrderBy() {
    return function(object) {

    }
}
