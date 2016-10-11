angular.module('orderCloud')

.config(staticPageConfig)
    .factory('staticPageData', staticPageData)
    .factory('StaticService', StaticService)
    .controller('contactCtrl', contactController)
    .controller('templateCtrl', templateController)
    .controller('template1Ctrl', template1Controller)
    .controller('historyCtrl', historyController)
    .controller('staticpageCtrl', staticpageController)
    .controller('perplePerksCtrl', perplePerksController)
    .controller('servicesCtrl', historyController)
    .controller('careAdviceCtrl', careAdviceController)
    .controller('perplePerksRegisteredCtrl', perplePerksRegisteredController)
    .controller('eventDescriptionCtrl', eventDescriptionController)
    .controller('FAQCtrl', FAQController)
    .controller('storeLocatorCtrl', storeLocatorController)
    .controller('workshopEventCtrl', workshopEventController)
    .controller('staticPageBaseCtrl', staticPageBaseController)
    .controller('ladingPageCtrl', ladingPageController)
    .controller('InspirationalModalCtrl', InspirationalModalController)
    .controller('eventCalenderModalCtrl', eventCalenderModalController)
    .directive('onFinishRender', onFinishRender)
    .controller('EventCtrl', deviceEventsController)
    .controller('eventsListingCtrl', eventsListingController)
    .filter('trim', TrimFilter);


function staticPageConfig($stateProvider) {
    $stateProvider
        .state('contactUs', {
            parent: 'base',
            url: '/contactUs',
            templateUrl: 'staticPage/templates/contact.tpl.html',
            controller: 'contactCtrl',
            controllerAs: 'contact'
        })
        .state('plantZone', {
            parent: 'base',
            url: '/plantZone',
            templateUrl: 'staticPage/templates/template.tpl.html',
            controller: 'templateCtrl',
            controllerAs: 'template'
        })

    .state('plantZone.staticPage', {
            url: '/staticPage/:pageName',
            templateUrl: 'staticPage/templates/StaticBaseForImage.tpl.html',
            controller: 'staticPageBaseCtrl',
            controllerAs: 'staticPageBase',
            resolve: {
                page: function($stateParams) {
                    return $stateParams.pageName;
                }
            }
        })
        .state('CareAdviceInformation', {
            parent: 'base',
            url: '/CareAdviceInformation/:pageName',
            templateUrl: 'staticPage/templates/template.tpl.html',
            controller: 'templateCtrl',
            controllerAs: 'template',
            resolve: {
                page: function($stateParams) {
                    return $stateParams.pageName;
                }
            },
            ncyBreadcrumb: {
                parent: "home",
                label: "<a href='CareAdviceInformation/{{base.name1.ID}}'>{{base.name1.Name}}</a>"
            }
        })
        .state('CareAdviceInformation.staticPage', {
            url: '/:parentName/:staticFileName',
            templateUrl: 'staticPage/templates/StaticBaseForImage.tpl.html',
            controller: 'staticPageBaseCtrl',
            controllerAs: 'staticPageBase',
            resolve: {
                page: function($stateParams, page) {
                    return $stateParams.staticFileName;
                },
                parentFolder: function($stateParams) {
                    return $stateParams.parentName;
                }
            },
            ncyBreadcrumb: {
                parent: "CareAdviceInformation",
                label: "<a>{{base.name2.Name}}</a>"
            }
        })
        .state('howto', {
            parent: 'base',
            url: '/howto',
            templateUrl: 'staticPage/templates/template1.tpl.html',
            controller: 'template1Ctrl',
            controllerAs: 'template1'
        })
        .state('history', {
            parent: 'base',
            url: '/history',
            templateUrl: 'staticPage/templates/history.tpl.html',
            controller: 'historyCtrl',
            controllerAs: 'history'
        })
        .state('CustomerService', {
            parent: 'base',
            url: '/CustomerService/:pageName',
            templateUrl: 'staticPage/templates/services.tpl.html',
            controller: 'historyCtrl',
            controllerAs: 'history',
            resolve: {
                page: function($stateParams, $state, $timeout) {
                    if ($stateParams.pageName.toLowerCase().indexOf("storelocator") >= 0) {
                        $timeout(function() {
                            $state.go("storelocator", {}, { location: "replace" });
                        }, 10);
                    } else {
                        return $stateParams.pageName;
                    }
                },
                fileName: function($stateParams) {
                    return $stateParams.fileName;
                }
            }
        })
        .state('Corporate', {
            parent: 'base',
            url: '/Corporate/:pageName/:fileName',
            templateUrl: 'staticPage/templates/services.tpl.html',
            controller: 'historyCtrl',
            controllerAs: 'history',
            resolve: {
                page: function($stateParams) {
                    return $stateParams.pageName;
                },
                fileName: function($stateParams) {
                    return $stateParams.fileName;
                }
            }
        })
        .state('heritage', {
            parent: 'base',
            url: '/heritage',
            templateUrl: 'staticPage/templates/staticpage.tpl.html',
            controller: 'staticpageCtrl',
            controllerAs: 'staticpage'
        })
        .state('purplePerks', {
            parent: 'base',
            url: '/purplePerks',
            templateUrl: 'staticPage/templates/perplePerks.tpl.html',
            controller: 'perplePerksCtrl',
            controllerAs: 'perplePerks'
        })
        .state('sympathy', {
            parent: 'base',
            url: '/sympathy',
            templateUrl: 'staticPage/templates/services.tpl.html',
            controller: 'servicesCtrl',
            controllerAs: 'services'
        })
        .state('Services', {
            parent: 'base',
            url: '/Services/:pageName/:fileName',
            templateUrl: 'staticPage/templates/services.tpl.html',
            controller: 'historyCtrl',
            controllerAs: 'history',
            resolve: {
                page: function($stateParams) {
                    return $stateParams.pageName;
                },
                fileName: function($stateParams) {
                    return $stateParams.fileName;
                }
            }
        })
        .state('careGuides', {
            parent: 'base',
            url: '/careGuides',
            templateUrl: 'staticPage/templates/careAdvice.tpl.html',
            controller: 'careAdviceCtrl',
            controllerAs: 'careAdvice'
        })
        .state('faqs', {
            parent: 'base',
            url: '/faqs',
            templateUrl: 'staticPage/templates/FAQ.tpl.html',
            controller: 'FAQCtrl',
            controllerAs: 'FAQ'
        })
        .state('perplePerksRegUser', {
            parent: 'base',
            url: '/perplePerksRegUser',
            templateUrl: 'staticPage/templates/perplePerksRegistered.tpl.html',
            controller: 'perplePerksRegisteredCtrl',
            controllerAs: 'perplePerksRegistered'
        })
        .state('eventsListing', {
            parent: 'base',
            url: '/elp?catId',
            templateUrl: 'staticPage/templates/eventsListing.tpl.html',
            controller: 'eventsListingCtrl',
            controllerAs: 'elp'
        })
        .state('eventDescription', {
            parent: 'base',
            url: '/eventDescription/:prodCode?prodId',
            templateUrl: 'staticPage/templates/eventDescription.tpl.html',
            controller: 'eventDescriptionCtrl',
            controllerAs: 'eventDes',
            resolve: {
                productDetail: function(PlpService, PdpService, $q, $stateParams, $http, OrderCloud, $cookieStore) {
                    console.log($cookieStore.get('BachmanStoreFront.token'));
                    var filter = { "xp.ProductCode": $stateParams.prodCode };
                    var deferred = $q.defer();
                    PdpService.GetProdCode($stateParams.prodCode).then(function(res) {
                        var inventoryFilteredList = []; // Array for Products with inventory
                        angular.forEach(res, function(value, key) {
                            var promise = PdpService.GetProdInventory(value.ID).then(function(res) {
                                //if (res.Available > 1) {
                                return value;
                                //}
                            });
                            console.log(promise);
                            inventoryFilteredList.push(promise);
                        });
                        $q.all(inventoryFilteredList).then(function(items) {
                            var data = items.filter(function(element) {
                                return element !== undefined;
                            });
                            deferred.resolve(data);
                        });
                    });
                    return deferred.promise;
                },
                selectedProduct: function($stateParams) {
                    return $stateParams.prodId;
                }
            }
        })
        .state('storelocator', {
            parent: 'base',
            url: '/storelocator',
            templateUrl: 'staticPage/templates/storeLocator.tpl.html',
            controller: 'storeLocatorCtrl',
            controllerAs: 'storeLocator'
        })
        .state('workshopEventLanding', {
            parent: 'base',
            url: '/workshopEventLanding',
            templateUrl: 'staticPage/templates/workshopEventLanding.tpl.html',
            controller: 'workshopEventCtrl',
            controllerAs: 'workshopEvent'
        })
        .state('events', {
            parent: 'base',
            url: '/events',
            templateUrl: 'staticPage/templates/events.tpl.html',
            controller: 'EventCtrl',
            controllerAs: 'event',
            resolve: {
                events: function(OrderCloud) {
                    //       return OrderCloud.Me.ListProducts(null, 1, 100, null, null, {categoryID : 'WorkshopsEvents_Information'}, null).then(function(eveList) {    
                    //          return eveList.Items;
                    // });  
                }
            }
        })

}
function StaticService($uibModal,Underscore, OrderCloud, $state) {
    var service = {
        OpenCalender: openCalender
    };
    return service;

    function openCalender() {
        if(!(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()))){
            $uibModal.open({
                animation: true,
                windowClass: 'quickViewModal',
                templateUrl: 'staticPage/templates/event-calender-model.tpl.html',
                controller: 'eventCalenderModalCtrl',
                controllerAs: 'eventCalenderModal',
                resolve: {
                    events: function() {
                        return OrderCloud.Me.ListProducts(null, 1, 100, null, null, { "xp.IsWorkshopEvent": true }, null).then(function(catList) {
                            var events = [];
                            angular.forEach(catList.Items, function(cat) {
                                events.push({
                                    id: cat.ID,
                                    title: cat.Name,
                                    start: new Date(cat.xp.EventDate), 
                                    productcode: cat.xp.ProductCode
                                })
                            });
                            return events;
                        });
                    }
                }
            });
        } else {
            $state.go('events');
        }
    } 
}

function ladingPageController(folder) {
    var vm = this;
    alert(JSON.stringify(folder));
}

function staticPageBaseController($http, $scope, page, $sce, alfcontenturl, parentFolder, $location, LoginFact, $stateParams, x2js, staticPageData, alfArticleData, alfcontentStaticSearchurl, alfStaticContenturl, alfcontentStaticSearchurlAtom, alfrescoStaticurl) {
    var vm = this;
    // vm.articleContentUrl =  localStorage.getItem("contentUrl")?localStorage.getItem("contentUrl"):'';
    // vm.locationpath =  localStorage.getItem("locationpath")?localStorage.getItem("locationpath"):'';
    // if(vm.locationpath.indexOf("documentLibrary")>=0)
    //     vm.locationpath = vm.locationpath.split("documentLibrary")[1];
    // vm.articleAuthor =  localStorage.getItem("articleAuthor")?localStorage.getItem("articleAuthor"):'';
    // vm.articleTitle = localStorage.getItem("articleTitle")?localStorage.getItem("articleTitle"):'';
    // if(localStorage.getItem("modifiedOn") && localStorage.getItem("modifiedOn").length > 15){
    //     var d = new Date(localStorage.getItem("modifiedOn"));
    //     var n = d.toString();
    //     var date = d.getDate();
    //     var year = d.getFullYear();
    //     vm.articleDate = date+" "+n.split(" ")[1]+" "+year;
    // }else{
    //     vm.articleDate = localStorage.getItem("modifiedOn")?localStorage.getItem("modifiedOn"):'';
    // }
    var getArticleDataFromID = function() {
        $http.get(alfArticleData + "?id=" + parentFolder + "&alf_ticket=" + localStorage.getItem("alfTemp_ticket"))
            .then(function(res) {
                console.log(res);
                vm.articleAuthor = res.data.properties.author;
                vm.articleTitle = res.data.properties.title;
                $scope.$emit("CurrentCatgory2", { "ID": "asfdasd", "Name": res.data.properties.parentSections[0].properties.title });
                vm.articleDate = res.data.properties.modified;
                vm.staticTempright = $sce.trustAsResourceUrl(alfStaticContenturl + res.data.contentUrl + "?alf_ticket=" + localStorage.getItem("alfTemp_ticket"));
                vm.relatedArticles = res.data.associations.relatedArticles;
                if (vm.relatedArticles)
                    $scope.$emit('update_parent_controller', vm.relatedArticles);
                if (res.data.associations.primaryImage && res.data.associations.primaryImage[0].contentUrl && res.data.associations.primaryImage[0].nodeType == 'ws:image') {
                    vm.articleBanner = "http://52.206.111.191:8080/alfresco/service" + res.data.associations.primaryImage[0].contentUrl + "?alf_ticket=" + localStorage.getItem("alfTemp_ticket");
                } else {
                    getMediaForArticle(res.data.displayPath);
                }
            }, function() {
                vm.staticTempright = $sce.trustAsHtml('<p>Article Data Not Found</p>');
            });
    }

    if (vm.articleContentUrl && vm.articleContentUrl != '') {
        vm.staticTempright = $sce.trustAsResourceUrl(alfcontenturl + vm.articleContentUrl + "?alf_ticket=" + localStorage.getItem("alfTemp_ticket"));
        console.log(alfStaticContenturl + vm.articleContentUrl + "&alf_ticket=" + localStorage.getItem("alfTemp_ticket"));
    } else {
        getArticleDataFromID();
    }


    var getMediaForArticle = function(path) {
        $http.get(alfrescoStaticurl + path.split("documentLibrary/")[1] + "/Media?alf_ticket=" + localStorage.getItem("alfTemp_ticket"))
            .then(function(res) {
                console.log(res);
                angular.forEach(res.data.items, function(item) {
                    if (item.fileName.indexOf(page.replace(".html", "")) >= 0) {
                        vm.articleBanner = "http://52.206.111.191:8080/alfresco/service/" + item.contentUrl + "?alf_ticket=" + localStorage.getItem("alfTemp_ticket");
                    }
                });
                console.log(vm.articleBanner);
            });
    }

    // vm.getThingsFromALfresco = function(parent, child){
    //     window.history.back();
    // }
}

function contactController() {
    var vm = this;
}

function templateController($http, $scope, $rootScope, alfcontenturl, $state, $stateParams, LoginFact, BaseService, staticPageData, alfStaticUrls, $window, page) {
    var vm = this;
    $rootScope.showBreadCrumb = false;
    vm.bannerHideArticle = true;
    vm.folderIndex = 0;
    vm.active = 0;
    vm.articleSearch = {};
    vm.mainCatName = "";
    // vm.relatedArticles = "sdfsdfgsfd";
    vm.alCurrentPage = 1;
    var getFirstTag = true;
    var ticket = localStorage.getItem("alfTemp_ticket");
    var articleUrl = null;
    $scope.relatedArticles = [];
    $scope.$on("update_parent_controller", function(event, message) {
        $scope.relatedArticles = message;
    });
    $scope.$emit("CurrentCatgory1", { "ID": "CareGuidesInformation", "Name": "Care, Guides & Information" });
    vm.getThingsFromALfresco = function(parent, child, index) {
        setTimeout(function() {
            vm.active = index + 1;
        }, 10)
        vm.alCurrentPage = 1;
        this.articleSearch.description = "";
        vm.activeTab = child.title;
        vm.currentCategoryID = child.nodeRef.split("SpacesStore/")[1];
        articleUrl = alfStaticUrls.alfcontentStaticCategoryArticles + "?id=" + vm.currentCategoryID + "&page=0&alf_ticket=" + ticket;
        var route = parent + "/" + child.fileName;
        staticPageData.GetFolders(articleUrl).then(function(data) {
            vm.articleList = data;
        }, function(data) {
            vm.articleList.items = [];
        });
        //$scope.$emit("CurrentCatgory1", {"ID":page,"Name":child.title});
        //        LoginFact.GetArtcleList(ticket,route).then(function(response){
        //         console.log("GetArtcleList",response);
        //         vm.articleList = response;
        //        });
        $state.go('CareAdviceInformation', { pageName: page });
    }



    vm.getFirstThingsFromALfresco = function(pp, index) {
        if (pp.nodeType == 'ws:section' && pp.title != '' && getFirstTag) {
            this.articleSearch.description = "";
            vm.mainCatName = pp.title;
            if (page == undefined) {
                vm.isOpen = 0;
                vm.mainCatName = pp.title;
                getFirstTag = false;
                vm.tabsData = pp;
                vm.parentCategoryArticles(pp.nodeRef, 0);
            } else if (page == pp.displayName) {
                vm.mainCatName = pp.title;
                getFirstTag = false;
                vm.isOpen = index;
                vm.tabsData = pp;
                $scope.$emit("CurrentCatgory1", { "ID": page, "Name": pp.title });
                vm.parentCategoryArticles(pp.nodeRef, 0);
            }
        }
    }

    setTimeout(function() {
        var owl2 = angular.element("#owl-carousel-related-products");
        owl2.owlCarousel({
            //responsive: true,
            loop: true,
            nav: true,
            responsive: {
                0: {
                    items: 1
                },
                320: {
                    items: 2,
                },
                730: {
                    items: 3,
                },
                1024: {
                    items: 4
                }
            }
        });
    }, 1000);

    $scope.$watch(angular.bind(this, function() {
        return this.articleSearch.description;
    }), function(newVal) {
        if (newVal) {
            if (newVal.length > 3) {
                vm.alCurrentPage = 1;
                articleUrl = alfStaticUrls.alfcontentStaticSearchArticles + "?id=" + vm.currentCategoryID + "&page=0&term=" + decodeURIComponent(newVal) + "&alf_ticket=" + localStorage.getItem("alfTemp_ticket");
                staticPageData.GetFolders(articleUrl).then(function(data) {
                    vm.articleList = data;
                }, function(data) {
                    vm.articleList.items = [];
                });
            }
        } else {
            if (newVal == '') {
                vm.alCurrentPage = 1;
                articleUrl = alfStaticUrls.alfcontentStaticCategoryArticles + "?id=" + vm.currentCategoryID + "&page=0&alf_ticket=" + localStorage.getItem("alfTemp_ticket");
                staticPageData.GetFolders(articleUrl).then(function(data) {
                    vm.articleList = data;
                }, function(data) {
                    vm.articleList.items = [];
                });
            }
        }
    });

    vm.navigateToArticle = function(obj) {
        staticPageData.articleData = obj;
        if (obj.contentUrl.indexOf("/") == 0) {
            localStorage.setItem("contentUrl", obj.contentUrl.substring(1, obj.contentUrl.length));
        } else {
            localStorage.setItem("contentUrl", obj.contentUrl);
        }
        localStorage.setItem("articleAuthor", obj.author);
        localStorage.setItem("articleTitle", obj.title);
        if (obj.modifiedOn) {
            localStorage.setItem("modifiedOn", obj.modifiedOn);
        } else {
            localStorage.setItem("modifiedOn", obj.modified);
        }
        if (obj.location) {
            localStorage.setItem("locationpath", obj.location.path);
        } else {
            localStorage.setItem("locationpath", obj.displayPath);
        }
        var paramName = obj.fileName ? obj.fileName : obj.name;
        var parentFolderName = obj.displayPath.split('/');
        vm.bannerHideArticle = false;
        $state.go('.staticPage', { parentName: obj["node-uuid"], staticFileName: paramName });
    }

    vm.populateTabs = function(f, sf, index, event) {
        event.preventDefault();
        if (vm.isOpen != index) {
            vm.mainCatName = sf.title;
            var first = true;
            vm.activeTab = "";
            vm.active = 0;
            vm.isOpen = index;
            getFirstTag = true;
            vm.tabsData = sf;
            this.articleSearch.description = "";
            vm.parentCategoryArticles(sf.nodeRef, 0);
            $state.go('CareAdviceInformation', { pageName: sf.displayName });
        } else {
            vm.isOpen = undefined;
        }
    }

    vm.relatedArticlesLinks = function(article) {
        var category = article.displayPath.split('CareAdviceInformation/')[1];
        var name = category.substring(0, category.lastIndexOf("/"));
        $state.go('CareAdviceInformation.staticPage', { pageName: name, parentName: article.properties["node-uuid"], staticFileName: article.properties.name });
    }

    vm.pageChanged = function() {
        var newurls = articleUrl.split("page=");
        var paramurl = newurls[1].substr(newurls[1].indexOf("&"), newurls[1].length);
        articleUrl = newurls[0] + "page=" + vm.alCurrentPage + paramurl;
        console.log(articleUrl);
        staticPageData.GetFolders(articleUrl).then(function(data) {
            $window.scrollTo(0, 400);
            vm.articleList = data;
        }, function(data) {
            vm.articleList = { "items": [] };
        });
    };
    //    var keepGoing = true;
    //    vm.tabSetdata = function(folders){
    //        angular.forEach(folders.subfolders,function(item){
    //            if(keepGoing) {
    //                if(item.nodeType == 'ws:section' && item.title !=''){
    //                    vm.tabsData = item;
    //                    keepGoing = false;
    //                    return;
    //                }
    //            }
    //        });
    //    }

    vm.parentCategoryArticles = function(id, page) {
        vm.alCurrentPage = 1;
        vm.currentCategoryID = id.split("SpacesStore/")[1];
        articleUrl = alfStaticUrls.alfcontentStaticCategoryArticles + "?id=" + vm.currentCategoryID + "&page=" + page + "&alf_ticket=" + ticket;
        staticPageData.GetFolders(articleUrl).then(function(data) {
            vm.articleList = data;
        }, function(data) {
            vm.articleList = { "items": [] };
        });
    }

    vm.isFirstOpen = function(i) {
        if (vm.open == i) {
            return true;
        }
        return false;
    }

    var staticheaderHt = $('.base-header-desktop .base-header-inner').height();
    console.log('staticheaderHt' + staticheaderHt);
    var staticheaderHtmobile = $('.base-header-mobile .base-header-inner').height();
}

function template1Controller() {
    var vm = this;
    setTimeout(function() {
        var owl2 = angular.element("#owl-carousel-related-products");
        owl2.owlCarousel({
            //responsive: true,
            loop: true,
            nav: true,
            responsive: {
                0: {
                    items: 1
                },
                1024: {
                    items: 4
                }
            }
        });
    }, 1000)
    var staticheaderHtmobile = $('.base-header-mobile .base-header-inner').height();
    /*$('.mobile-how-to-nav').css('margin-top', staticheaderHtmobile);*/
}

function historyController($scope, alfcontenturl, $sce, $state, page, fileName, staticPageData, alfrescoStaticurl, $compile, $uibModal) {
    var vm = this;
    vm.isOpen = 2;
    var owlHistory = angular.element("#owl-carousel-history");
    vm.accordianOpen = function(index) {
        if (vm.isOpen != index) {
            vm.isOpen = index;
        } else {
            vm.isOpen = undefined;
        }
    }
    vm.alfStaticContenturl = alfcontenturl;
    vm.parentPathChilde = $state.current;
    vm.pageName = page;
    vm.activeIndex = 0;
    vm.siteToken = localStorage.getItem('alfTemp_ticket');
    staticPageData.GetFolders(alfrescoStaticurl + "Bachmans Quick Start/Bachmans Editorial/root/" + $state.$current + "/" + decodeURIComponent(page) + "?alf_ticket=" + vm.siteToken).then(function(data) {
        console.log(data);
        angular.forEach(data.items, function(item) {
            if (item.nodeType == "ws:article") {
                console.log("content url", alfcontenturl + item.contentUrl + "?alf_ticket=" + localStorage.getItem("alfTemp_ticket"));
                vm.staticTempPage = $sce.trustAsResourceUrl(alfcontenturl + item.contentUrl + "?alf_ticket=" + localStorage.getItem("alfTemp_ticket"));
                vm.articleTitle = item.fileName.replace(".html", "");
            }
            if (item.fileName == "Media") {
                vm.getMediaData(alfrescoStaticurl + item.location.path + "/" + item.fileName);
            }
        })
    });

    vm.assignIndex = function(data, i) {
        if (vm.parentPathChilde.name == data) {
            vm.isOpen = i;
        }
    }

    vm.assignActiveIndex = function(data, i) {
        var pages = decodeURIComponent(page).split('/');
        if (pages.length > 0) {
            if (pages[0].toLowerCase() == data.fileName.toLowerCase()) {
                vm.activeIndex = data.fileName;
                vm.activePageTitle = data.title;
                vm.childactiveIndex = pages[1];
                console.log(data);
                setTimeout(function() {
                    if (data.subfolders && data.subfolders.items) {
                        var childData = _.filter(data.subfolders.items, function(node){ return node.nodeType == 'ws:section'; });
                        if(childData.length > 1)
                            vm.childCount = 2;
                    }
                }, 1000);
                console.log(vm.activeIndex + "=" + vm.activePageTitle + "=" + vm.childactiveIndex);
            }
        } else {
            if (page.toLowerCase() == data.fileName.toLowerCase()) {
                vm.activeIndex = data.fileName;
                vm.activePageTitle = data.title;
            }
        }
    }

    vm.changePageData = function(filename, folder, activeFileName) {
        vm.activeIndex = activeFileName;
        vm.childCount = 0;
        var htmlName;
        var param = folder.location.path.split(filename + '/')[1];
        if (param)
            param += "/" + folder.fileName;
        else
            param = folder.fileName;
        if (folder.subfolders && folder.subfolders.items) {
            angular.forEach(folder.subfolders.items, function(item) {
                if (item.nodeType == "ws:section") {
                    vm.childCount++;
                } else if (item.nodeType == "ws:article") {
                    htmlName = item.fileName;
                }
            })
        }
        $state.go(filename, { pageName: param, fileName: htmlName });
    }

    vm.showCarouselData = false;
    vm.getMediaData = function(url) {
        staticPageData.GetFolders(url + "?alf_ticket=" + vm.siteToken).then(function(data) {
            console.log("mediaData", data);
            angular.forEach(data.items, function(carousel) {
                if (carousel.nodeType == 'ws:image' && carousel.fileName.indexOf(vm.articleTitle.replace(".html", "")) >= 0) {
                    vm.templateBannerImage = carousel.contentUrl;
                } else if (carousel.nodeType == "ws:section" && carousel.fileName == "articleImages") {
                    vm.loadArticleImages(alfrescoStaticurl.substring(0, alfrescoStaticurl.length - 1) + carousel.location.path + "/" + carousel.fileName);
                } else if (carousel.nodeType == "ws:section") {
                    if(carousel.fileName == "carouselImages"){
                        vm.carouselSlotHeader = carousel.title;
                        vm.loadCarouselImages(alfrescoStaticurl.substring(0, alfrescoStaticurl.length - 1) + carousel.location.path + "/" + carousel.fileName);
                    } else {
                        $(".history-carousel").hide();
                    }
                }
            });
        }, function(data) {
            $(".history-carousel").hide();
            console.log(data);
        });
    }

        //vm.getMediaData(dataUrl);
    vm.loadCarouselImages = function(url) {
        $(".history-carousel").show();
        staticPageData.GetFolders(url + "?alf_ticket=" + vm.siteToken).then(function(data) {
            vm.carouselData = _.filter(data.items, function(node){ return node.nodeType == 'ws:image'; });
            if (vm.carouselData.length > 0) {
                vm.showCarouselData = true;
                setTimeout(function() {
                    owlHistory.owlCarousel({
                        /*responsive: true,*/
                        loop: false,
                        animateOut: 'fadeOut',
                        nav: true,
                        navText: vm.carouselData.length>3?['<span class="weddingTrendArrowPrev" aria-hidden="true">next</span>', '<span class="weddingTrendArrowNext" aria-hidden="true">prev</span>']:[],
                        responsive: {
                            0: {
                                items: 1
                            },
                            1024: {
                                items: 4
                            }
                        }
                    });
                }, 1000);
            } else {
                $(".history-carousel").hide();
                vm.showCarouselData = false;
            }
        }, function(data) {
            $(".history-carousel").hide();
            console.log(data);
        });
    }

    vm.loadArticleImages = function(url) {
        staticPageData.GetFolders(url + "?alf_ticket=" + vm.siteToken).then(function(data) {
            console.log("loadArticleImages", data);
            if (data.items.length > 0) {
                vm.articleImages = _.filter(data.items, function(node){ return node.nodeType == 'ws:image'; });
                var elem = angular.element("#articleImagesSlot");
                var classn = "col-md-3";
                if (vm.articleTitle == "memoryMotifs") {
                    classn = "col-md-4 motifs-img";
                }
                var html = '<div class="' + classn + ' owl-carousel-item portfolio-item" ng-repeat="articleImage in history.articleImages | orderBy:natural(\'fileName\')" ng-if="articleImage.nodeType==\'ws:image\'&& articleImage.fileName.indexOf(history.articleTitle)>=0"><a href="#"> <img class="img-responsive" ng-src="{{history.alfStaticContenturl}}{{articleImage.contentUrl}}?alf_ticket={{history.siteToken}}" alt=""> </a><div class="gallery-desc"><h3>{{articleImage.title}}</h3><p>{{articleImage.description}}</p></div></div>';
                var owlHtml = "";
                if (elem.hasClass("owl-carousel-initial")) {
                    owlHtml = '<div class="owl-carousel owl-theme wedding-trend"><div class="owl-carousel-item portfolio-item" ng-repeat="articleImage in history.articleImages | orderBy:natural(\'fileName\')" ng-if="articleImage.nodeType==\'ws:image\'&& articleImage.fileName.indexOf(history.articleTitle)>=0"><a href="#"> <img class="img-responsive" ng-src="{{history.alfStaticContenturl}}{{articleImage.contentUrl}}?alf_ticket={{history.siteToken}}" alt=""> </a><div class="gallery-desc"><h3>{{articleImage.title}}</h3><p>{{articleImage.description}}</p></div></div></div>';
                    var el = $compile(angular.element(owlHtml))($scope);
                    elem.html(el);
                    setTimeout(function() {
                        angular.element(".owl-carousel").owlCarousel({
                            /*responsive: true,*/
                            loop:false,
                            animateOut: 'fadeOut',
                            nav: true,
                            navText: vm.articleImages.length>3?['<span class="weddingTrendArrowPrev" aria-hidden="true">next</span>', '<span class="weddingTrendArrowNext" aria-hidden="true">prev</span>']:[],
                            responsive: {
                                0: {
                                    items: 1
                                },
                                1000: {
                                    items: 4,
                                    margin: 20
                                },
                                1024: {
                                    items: 4,
                                    margin: 20
                                }
                            }
                        });
                    }, 1000);
                } else {
                    owlHtml = html;
                    var el = $compile(angular.element(owlHtml))($scope);
                    elem.html(el);
                }
            }
        })
    }

    vm.inspirationalPopup = function(imageData) {
        var modalInstance = null;
        if (imageData.title.trim().length > 0) {
            staticPageData.GetFolders(alfrescoStaticurl.substring(0, alfrescoStaticurl.length - 1) + imageData.location.path + "/" + imageData.title + "?alf_ticket=" + vm.siteToken).then(function(data) {
                console.log(data);
                var imagesData = _.filter(data.items, function(node){ return node.nodeType == 'ws:image'; });
                openInspirationModal(imagesData);
            }, function(data) {
                console.log(data);
            });
        }
    }

    function openInspirationModal(data) {
        var modalInstance = $uibModal.open({
            animation: false,
            backdropClass: 'inspirationalModal',
            windowClass: 'inspirationalModal',
            templateUrl: 'staticPage/templates/inspirational.tpl.html',
            controller: 'InspirationalModalCtrl',
            controllerAs: 'inspirational',
            resolve: {
                inspirationalImages: function() {
                    return data;
                }

            }
        });

        modalInstance.result.then(function() {
           // alert("popup closed");
        }, function() {
            angular.noop();
        });
    }

}

function InspirationalModalController($scope, inspirationalImages, $uibModalInstance, alfStaticContenturl, alfcontenturl) {
    var vm = this;
    vm.cancel = cancel;
    vm.alfStaticContenturl = alfcontenturl;
    vm.glImages = inspirationalImages;
    vm.siteToken = localStorage.getItem('alfTemp_ticket');

    function cancel() {
        $uibModalInstance.dismiss('cancel');
        //$scope.multipleRecipient.init();
    };
    $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
        //you also get the actual event object
        //do stuff, execute functions -- whatever...
        //        $('#gallery').finalTilesGallery({
        //            margin:5,
        //            minTileWidth:200,
        //            allowEnlargement:true,
        //            onComplete:function(){
        //                //alert("final tiles initilized");
        //            }
        //        });
        $('#gallerymikado').tilesGallery2({
            margin: 5,
            captionEffectDuration: 250,
            captionEffect: 'fade',
            captionEasing: 'swing',
            keepArea: false,
            enableTwitter: false,
            enableFacebook: false,
            enablePinterest: false,
            enableGplus: false,
            scrollEffect: ''
        });
        //jQuery(function () {jQuery('#jtg-1800 .tile a.mikado-lightbox').fancybox({});});
        //        var wall = new Freewall('.free-wall');
        //        wall.reset({
        //              selector: '.item',
        //              animate: true,
        //              cellW: 150,
        //              cellH: 'auto',
        //              onResize: function() {
        //                  wall.fitWidth();
        //              }
        //          });
        //        var images = wall.container.find('.item');
        //          images.find('img').load(function() {
        //              wall.fitWidth();
        //            });
        //        $('.photoset-grid-lightbox').photosetGrid({
        //          highresLinks: true,
        //          gutter: '2px',
        //        });
    });
    //    setTimeout(function(){
    //        
    //    },6000);
}

function onFinishRender($timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function() {
                    scope.$emit(attr.onFinishRender);
                });
            }
        }
    }
}

function staticpageController($scope, $uibModalInstance) {
    var vm = this;

    $scope.cancel = function() {
        $uibModalInstance.dismiss('cancel');
    };
}

function perplePerksController() {
    var vm = this;

}

function servicesController($uibModal, $scope) {
    var vm = this;
    var owlHistory = angular.element("#owl-carousel-services");
    owlHistory.owlCarousel({

        /*responsive: true,*/
        loop: true,
        animateOut: 'fadeOut',
        nav: true,
        navText: ['<span class="pdtCarousalArrowPrev" aria-hidden="true">next</span>', '<span class="pdtCarousalArrowNext" aria-hidden="true">prev</span>'],
        responsive: {
            0: {
                items: 1
            },
            1024: {
                items: 4
            }
        },
        onInitialized: function(event) {

            owlHistory.find('.grid_desc').on('click', function() {
                setTimeout(function() {
                    var modalInstance = $uibModal.open({
                        animation: true,
                        templateUrl: 'staticPage/templates/inspirational.tpl.html',
                        controller: 'staticpageCtrl',
                        controllerAs: 'staticpage'
                    });

                    modalInstance.result.then(function() {

                    }, function() {
                        angular.noop();
                    });
                }, 200)

            });
        }
    });
}

function careAdviceController() {
    var vm = this;


}

function FAQController($scope) {
    var vm = this;

}

function perplePerksRegisteredController() {
    var vm = this;
}

function eventDescriptionController($scope, PdpService, productDetail, selectedProduct, OrderCloud, $q, HomeFact,$state) {
    var vm = this;
    console.log(productDetail);

    vm.eventList = productDetail;
    console.log('gggggg', vm.eventList);

    var queue = [];

    function attachPriceSchedule(item) {
        return OrderCloud.Products.ListAssignments(item.ID).then(function(list) {
            return OrderCloud.PriceSchedules.Get(list.Items[0].StandardPriceScheduleID).then(function(PriceSchedule) {
                item.PriceSchedule = PriceSchedule;
                return item;
            });
        });
    }
    var eventsProducts = productDetail;

    angular.forEach(eventsProducts, function(item) {
        queue.push(attachPriceSchedule(item));
    });

    $q.all(queue).then(function(Products) {
        var eventListGroupByDate = _.groupBy(Products, function(num) {
            return num.xp.EventDate });
        vm.eventListGroupByDate = eventListGroupByDate;
        //console.log('gggggg',vm.eventListGroupByDate);
    })

    vm.detailsPage = function($event) {
        var id = $($event.target).parents('.staticSeqId').attr('data-prodid');
        var seq = $($event.target).parents('.staticSeqId').attr('data-sequence');
        if (typeof id != "undefined") {
            var href = "/eventDescription/" + seq + "/prodId=" + id;
            $state.go('eventDescription', { 'prodCode': seq, 'prodId': id });
        } else {
            var href = "/eventDescription/" + seq;
            $state.go('eventDescription', { 'prodCode': seq });
        }

    }

    HomeFact.GetEventsList().then(function(res) {
        console.log('GetEventsList', res);
        var queue = [];
        var eventListGroupByProductCode = _.groupBy(res, function(num) {
            return num.xp.ProductCode });
        vm.eventListGroupByProductCode = eventListGroupByProductCode;
        console.log('PC', eventListGroupByProductCode);
        setTimeout(function() {
            var owl = angular.element("#owl-carousel-eventsUpcoming");
            owl.owlCarousel({
                items: 2,
                center: false,
                loop: false,
                nav: true,
                navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>', '<span class="events-arrow-next" aria-hidden="true"></span>'],
                autoWidth: true,
                responsive: {
                    0: {
                        margin: 30
                    },
                    320: {
                        margin: 5
                    },
                    560: {
                        margin: 10
                    },
                    768: {
                        margin: 20
                    },
                    1024: {
                        margin: 20
                    }
                },
                onInitialized: function(event) {
                    console.log("owl==", owl.find('.owl-item.active').last());
                    owl.find('.owl-item.active').last().addClass('fadeGrid');
                }
            });
            owl.on('changed.owl.carousel', function(event) {
                setTimeout(function() {
                    console.log("owl==", owl.find('.owl-item.active'));
                    owl.find('.owl-item').removeClass('fadeGrid');

                    owl.find('.owl-item.active').last().addClass('fadeGrid');
                }, 200);
            })
        }, 1000)
    });

    /*vm.showEventLocation = function(pdtCode, id, locXP, index){
        console.log(pdtCode);
        console.log(id);
        console.log(locXP);
        vm.ss = vm.eventListGroupByDate[pdtCode];
        vm.ss[index].xp.Location.City =locXP.Location.City;
        console.log(vm.ss);
    }
*/
}




/*For Workshop event controller function starts*/
function workshopEventController($state, $uibModal, $scope, $window, HomeFact, PlpService, $q, $sce, alfcontenturl, CategoryService, Underscore, $rootScope, OrderCloud,getBuyer,StaticService) {
    var vm = this;
    var siteEditorHome = getBuyer.xp.SiteEditor.HomePage;
    vm.open = function () {
        StaticService.OpenCalender();
    }
/*    vm.open = function () {
        // getEventDate().then(function(events){
            if(!(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()))){
            $uibModal.open({
                animation: true,
                windowClass: 'quickViewModal',
                templateUrl: 'staticPage/templates/event-calender-model.tpl.html',
                controller: 'eventCalenderModalCtrl',
                controllerAs: 'eventCalenderModal',

                resolve: {

                    events: function() {
                        return OrderCloud.Me.ListProducts(null, 1, 100, null, null, { "xp.IsWorkshopEvent": true }, null).then(function(catList) {
                            var events = [];
                            angular.forEach(catList.Items, function(cat) {
                                events.push({
                                    id: cat.ID,
                                    title: cat.Name,
                                    start: new Date(cat.xp.EventDate),
                                    //end : new Date(cat.xp.EndDate) // Uncomment if we have date range 
                                    productcode: cat.xp.ProductCode
                                })
                            });
                            return events;
                        });

                    }
                }
            });
        } else {
            //Mobile device
            $state.go('events');
        }
        // })
    } */  

    function getEventDate() {
        var deferred = $q.defer();
        return OrderCloud.Me.ListProducts(null, 1, 100, null, null, { categoryID: 'WorkshopsEvents_Information' }, null).then(function(eveList) {

            deferred.resolve(eveList);
        });
        return deferred.promise;
    }

    function EventsList() {

        var ajaxarr = [];

        CategoryService.listChild("WorkshopsEvents").then(function(catList) {

            angular.forEach(catList, function(cat) {
                var promise = PlpService.GetProductAssign(cat.ID);
                ajaxarr.push(promise);
            });
            $q.all(ajaxarr).then(function(items) {

                var productArr = Underscore.flatten(items);

                var ajaxarr1 = [];
                for (var i = 0; i < productArr.length; i++) {

                    var promise = PlpService.ProductList(productArr[i].ProductID).then(function(data) {

                        return PlpService.GetStandardPriceScheduleID(data);


                    });
                    ajaxarr1.push(promise);
                }

                $q.all(ajaxarr1).then(function(items) {
                    console.log("items==", items);
                    vm.eventsList = items;
                    setTimeout(function() {
                        var owl = angular.element("#owl-carousel-events");
                        owl.owlCarousel({
                            items: 2,
                            center: false,
                            loop: false,
                            nav: true,
                            //navText: ['<span class="glyphicon glyphicon-menu-left" aria-hidden="true"></span>','<span class="glyphicon glyphicon-menu-right" aria-hidden="true"></span>'],
                            navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>', '<span class="events-arrow-next" aria-hidden="true"></span>'],
                            autoWidth: true,
                            //responsive: true,
                            responsive: {
                                0: {
                                    /*stagePadding:30,*/
                                    margin: 30
                                },
                                320: {
                                    /*stagePadding:50,*/
                                    margin: 5
                                },
                                560: {
                                    /*stagePadding:50,*/
                                    margin: 10
                                },
                                768: {
                                    /*stagePadding:30,*/
                                    margin: 20
                                },
                                1024: {
                                    /*stagePadding:30,*/
                                    margin: 20
                                }
                            },
                            onInitialized: function(event) {
                                    console.log("owl==", owl.find('.owl-item.active').last());
                                    owl.find('.owl-item.active').last().addClass('fadeGrid');
                                }
                                /*   onChanged: function(event){

                                            owl.find('.owl-item').removeClass('fadeGrid');
                                            console.log("owl==",owl.find('.active'));
                                      owl.find('.owl-item.active').last().addClass('fadeGrid');
                                   }*/

                        });
                        owl.on('changed.owl.carousel', function(event) {
                            setTimeout(function() {
                                console.log("owl==", owl.find('.owl-item.active'));
                                owl.find('.owl-item').removeClass('fadeGrid');

                                owl.find('.owl-item.active').last().addClass('fadeGrid');
                            }, 200);
                        })
                    }, 1000)

                });
            });
        })

    }

    EventsList();

    var ticket = localStorage.getItem("alf_ticket");

    HomeFact.GetEventsList().then(function(res) {
        console.log('GetEventsList', res);

        var eventListGroupByEventType = _.groupBy(res, function(num) {
            return num.xp.CurrentFineline });
        vm.eventListGroupByEventType = eventListGroupByEventType;

        var eventListIdeaHouse = _.groupBy(eventListGroupByEventType.IDHSE, function(num) {
            return num.xp.ProductCode });
        vm.eventListIdeaHouse = eventListIdeaHouse;
        setTimeout(function() {
            var owl = angular.element("#owl-carousel-eventsTIH");
            owl.owlCarousel({
                items: 4,
                loop: false,
                nav: true,
                navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>', '<span class="events-arrow-next" aria-hidden="true"></span>']
            });
        }, 1000);

        console.log('ET', eventListIdeaHouse);
        var eventListGroupByProductCode = _.groupBy(res, function(num) {
            return num.xp.ProductCode });
        vm.eventListGroupByProductCode = eventListGroupByProductCode;
        console.log('PC', eventListGroupByProductCode);
        setTimeout(function() {
            var owl = angular.element("#owl-carousel-eventsAll");
            owl.owlCarousel({
                items: 2,
                center: false,
                loop: false,
                nav: true,
                navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>', '<span class="events-arrow-next" aria-hidden="true"></span>'],
                autoWidth: true,
                responsive: {
                    0: {
                        margin: 30
                    },
                    320: {
                        margin: 5
                    },
                    560: {
                        margin: 10
                    },
                    768: {
                        margin: 20
                    },
                    1024: {
                        margin: 20
                    }
                },
                onInitialized: function(event) {
                    console.log("owl==", owl.find('.owl-item.active').last());
                    owl.find('.owl-item.active').last().addClass('fadeGrid');
                }
            });
            owl.on('changed.owl.carousel', function(event) {
                setTimeout(function() {
                    console.log("owl==", owl.find('.owl-item.active'));
                    owl.find('.owl-item').removeClass('fadeGrid');

                    owl.find('.owl-item.active').last().addClass('fadeGrid');
                }, 200);
            })
        }, 1000);
    });

    HomeFact.GetGridimgs(ticket).then(function(res) {
        console.log('GI', res);
        var gridImgs;
        vm.gridImgs = [];
        angular.forEach(res.items, function(item, key) {
            gridImgs = alfcontenturl + item.contentUrl + "?alf_ticket=" + ticket;
            vm.gridImgs.push(gridImgs);
        });

        vm.topGridImg = alfcontenturl + res.items[0].contentUrl + "?alf_ticket=" + ticket;
        vm.topGridTitle = res.items[0].title;
        vm.topGridDescription = res.items[0].description;
        vm.topGridBtnTxt = res.items[0].author;
    });
}

function deviceEventsController(events, $scope) {
    var vm = $(this);
    var a = '[{"ReplenishmentPriceSchedule":null,"StandardPriceSchedule":{"ID":"UwQam8nUQkqslYEckG00Iw","Name":"price3","ApplyTax":false,"ApplyShipping":false,"MinQuantity":1,"MaxQuantity":10,"UseCumulativeQuantity":false,"RestrictedQuantity":false,"OrderType":"Standard","PriceBreaks":[{"Quantity":1,"Price":210}],"xp":null},"ID":"cat9_cat2_prod5","Name":"Ideas House Ticket","Description":"rdfgdfgfd.","QuantityMultiplier":1,"ShipWeight":null,"ShipHeight":null,"ShipWidth":null,"ShipLength":null,"Active":true,"Type":"Static","InventoryEnabled":false,"InventoryNotificationPoint":null,"VariantLevelInventory":false,"SpecCount":0,"xp":{"EventDate":"2016-09-11","slot":"9 AM-10 AM","productNote":"qwerty","SpecsOptions":{"Size":"11 AM-12 PM"},"SequenceNumber":"340600122278","ProductCode":"340600122278"},"AllowOrderExceedInventory":false,"InventoryVisible":false,"VariantCount":0,"ShipFromAddressID":null},{"ReplenishmentPriceSchedule":null,"StandardPriceSchedule":{"ID":"dUdG2OoXYUOBANzzYnPe6Q","Name":"Home Decor & Accents ","ApplyTax":false,"ApplyShipping":false,"MinQuantity":1,"MaxQuantity":null,"UseCumulativeQuantity":false,"RestrictedQuantity":false,"OrderType":"Standard","PriceBreaks":[{"Quantity":1,"Price":69}],"xp":null},"ID":"cat9_cat1_prod5","Name":"Succulent Container Design Workshop","Description":"gfdgdf","QuantityMultiplier":1,"ShipWeight":null,"ShipHeight":null,"ShipWidth":null,"ShipLength":null,"Active":true,"Type":"Static","InventoryEnabled":false,"InventoryNotificationPoint":null,"VariantLevelInventory":false,"SpecCount":0,"xp":{"EventDate":"2016-08-18","Live":true,"":true,"slot":"9 AM-10 AM","venue":"305 Avenue Garden,minneapolis,MN,55401,Room NO 16,Max Store","SequenceNumber":"340600122278","ProductCode":"340600122278","IsBaseProduct":true,"BaseImageUrl":"","BaseDescription":"Sample Workshop Description","BaseProductTitle":"April Succulent Container Design Workshop","SpecsOptions":{"Size":"9 AM-10 AM"}},"AllowOrderExceedInventory":false,"InventoryVisible":false,"VariantCount":0,"ShipFromAddressID":null}]';
    var events = JSON.parse(a);
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var monthArr = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    var eventsArr = [];
    angular.forEach(events, function(value, key) {
        var date = new Date(value.xp.EventDate);
        value.day = date.getDate();
        value.Month = monthArr[date.getMonth()];
        value.week = days[date.getDay()];
        value.price = value.StandardPriceSchedule.PriceBreaks[0].Price;
        var isAvailable = date > new Date();
        if (isAvailable) { value.isAvailable = true; } else { value.isAvailable = false; }
        eventsArr.push(value);
    });
    $scope.events = eventsArr;
}

/*For Workshop event controller function -- end*/

function eventCalenderModalController($scope , $http, events, $state, $uibModalInstance,$compile,uiCalendarConfig){
     $scope.events=[] 
     $scope.events = events;
 
     
    //with this you can handle the events that generated by clicking the day(empty spot) in the calendar
    $scope.dayClick = function( date, allDay, jsEvent, view ){
        //alert("with date selction");
    };

    //with this you can handle the click on the events
    $scope.eventClick = function(event) {
        // console.log(event);   
        $uibModalInstance.dismiss('cancel');
        $state.go('eventsListing', { 'catId': event.id });
    };

    $scope.renderView = function(view) {
        var monthArr = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        var prevMonth = new Date(view.calendar.getDate()).getMonth() - 1;
        var nxtMonth = new Date(view.calendar.getDate()).getMonth() + 1;

        $('.fc-icon-right-single-arrow').text(monthArr[nxtMonth >= 12 ? 0 : nxtMonth]);
        $('.fc-icon-left-single-arrow').text(monthArr[prevMonth <= -1 ? 11 : prevMonth]);

        //  $('.fc-event-container').closest('table').find('thead tr td').eq($('.fc-event-container').);
    };

    $scope.eventRender = function( event, element, view ) { 
        element.attr({'tooltip': event.title,
                     'tooltip-append-to-body': true});
        $compile(element)($scope);
    };
    
     $scope.eventsF = function (start, end, timezone, callback) {
      var s = new Date(start).getTime() / 1000;
      var e = new Date(end).getTime() / 1000;
      var m = new Date(start).getMonth();
      var events = [{title: 'Feed Me ' + m,start: s + (50000),end: s + (100000),allDay: false, className: ['customFeed']}];
      callback(events);
    };
    /* config object */
    $scope.uiConfig = {
              calendar:{
                height: 550,
                editable: false,
                header:{
                  left: 'prev',
                  center: 'title',
                  right: 'next',
                  buttonIcons: false
                },
                //dayClick: $scope.dayClick,
                eventClick: $scope.eventClick,
                eventRender: $scope.eventRender,
                viewRender: $scope.renderView,
                eventLimit: 4, // If you set a number it will hide the itens
                eventLimitText: "Events available",
                columnFormat: {
                   month: 'dddd'
                } 
              }    
    };

    /* event sources array*/
    $scope.eventSources = [$scope.events];
}


function storeLocatorController($scope, $timeout, $http, $compile) {
    //-----Get current location----------
    var map, lat, lon,
        directionsDisplay = new google.maps.DirectionsRenderer({
            draggable: true,
            suppressMarkers: true
        }),
        directionsService = new google.maps.DirectionsService();
    //navigator.geolocation.getCurrentPosition(function (position) {
    /*lat = position.coords.latitude;
    lon = position.coords.longitude;*/
    lat = "44.9706756";
    lon = "-93.3315183";

    var mapOptions = {
        zoom: 10,
        center: new google.maps.LatLng(lat, lon),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    directionsDisplay.setMap(map);
    //directionsDisplay.setPanel(document.getElementById("directions"));
    //});
    /*$timeout(function(){
        google.maps.event.trigger(map, "resize");
        map.setCenter(new google.maps.LatLng(77.5945627, 77.5945627));
    },500);*/
    document.getElementById("panel2").style.display = "none";

    //-------------Services offered----------------
    $http.get('https://api.myjson.com/bins/4wsk2')
        .success(function(data) {
            var array = [];
            var filt = _.filter(data.stores, function(row) {
                array = _.uniq(_.union(array, row.serviceOffered));
            });
            $scope.serviceOffered = array;
        }).error(function(err) {});

    //-----Find store----------
    $scope.markers = [];
    var obj = {},
        infoWindow = new google.maps.InfoWindow();
    $scope.findStore = function() {
        //-----------Get Store Details-----------
        $http.get('https://api.myjson.com/bins/4wsk2').success(function(data) {
            //--------filter an array------------
            if ($scope.zipCode)
                obj.zipCode = parseInt($scope.zipCode);
            else
                delete obj.zipCode;
            if ($scope.txtCity)
                obj.city = $scope.txtCity;
            else
                delete obj.city;
            if (document.getElementById("selectedVal").value != "select")
                obj.state = document.getElementById("selectedVal").value;
            else
                delete obj.state;

            var filtData = _.where(data.stores, obj);
            filtData = _.filter(filtData, function(row) {
                for (var j = 0; j < row.serviceOffered.length; j++) {
                    if (_.indexOf(serOffered.serviceOffered, row.serviceOffered[j]) > -1 == true)
                        return _.indexOf(serOffered.serviceOffered, row.serviceOffered[j]) > -1;
                    //-----------Get Distance-----------
                    var request = {
                        origin: new google.maps.LatLng(lat, lon),
                        destination: new google.maps.LatLng(row.latitude, row.longitude),
                        travelMode: google.maps.TravelMode["DRIVING"]
                    };
                    directionsService.route(request, function(response, status) {
                        if (status == google.maps.DirectionsStatus.OK) {
                            row.distance = Math.round(((response.routes[0].legs[0].distance.value) * 0.000621371192) * 10) / 10;
                        }
                    });

                    if (arr.length == 0)
                        return filtData;
                }
            });
            $scope.storesData = filtData;

            for (var i = 0; i < $scope.storesData.length; i++) {
                createMarker($scope.storesData[i], i + 1, icon);
            }
            //----------Panel Show Hide-------------
            if ($scope.storesData.length > 0) {
                document.getElementById("panel1").style.display = "none";
                document.getElementById("panel2").style.display = "block";
                $scope.noStoresFound = false;
            } else {
                $scope.noStoresFound = true;
            }
        }).error(function(err) {});

        //-----------Remove Markers-----------
        for (var k = 0; k < $scope.markers.length; k++) {
            $scope.markers[k].setMap(null);
        }

        //-----------Create Markers-------------------
        var icon = {
            url: "assets/images/markerIcon.png", //url
            scaledSize: new google.maps.Size(35, 53), // scaled size
            origin: new google.maps.Point(0, 0), // origin
            anchor: new google.maps.Point(0, 0) // anchor
        };

        //----------Search for places-------------
        var input = document.getElementById('startAddress');
        var autocomplete = new google.maps.places.Autocomplete(input, {
            types: ["geocode"]
        });
        autocomplete.bindTo('bounds', map);
        google.maps.event.addListener(autocomplete, 'place_changed', function() {
            //alert(input.value);
            var place = autocomplete.getPlace();
            lat = place.geometry.location.lat();
            lon = place.geometry.location.lng();
        });

    };

    var createMarker = function(info, i, icon) {
        if ((icon.url).includes("Location_B") && $scope.storeDtls) {
            info = $scope.storeDtls;
        } else {
            console.log("Stores Details" + info);
        }
        var marker = new google.maps.Marker({
            map: map,
            animation: google.maps.Animation.DROP,
            position: new google.maps.LatLng(info.latitude, info.longitude),
            title: "",
            icon: icon
        });
        marker.content = '<div class="infoWindowContent"><img src="' + info.imageUrl + '" style="width: 175px;float: right;"><span class="store-sl_no">' + i + '</span> <span class="store-InfoCity">' + info.city + '</span>' + "," + ' ' + " " + '<span class="store-InfoCity">' + info.cityCode + '</span><br/> <span class="store-storeName">' + info.storeName + ' </span><br/> <span class="store-storeAddr">' + info.storeAddress + '</span>' + "," + '  <span class="store-storeAddr">' + info.city + '</span>' + "," + '  <span class="store-CityCode">' + info.cityCode + '</span>' + "," + '  <span class="store-storeZip">' + info.zipCode + '<br/></span> <span class="store-storeAddr">' + info.phoneNumber + '</span>' + '</div>';
        google.maps.event.addListener(marker, 'click', function() {
            infoWindow.setContent(marker.content);
            infoWindow.open(map, marker);
        });
        $scope.markers.push(marker);
        map.setCenter(marker.getPosition());
    }

    //-----Info window events----------
    $scope.openInfoWindow = function(e, selectedMarker) {
        e.preventDefault();
        google.maps.event.trigger(selectedMarker, 'click');
    }

    //-----Get Directions---------------
    $scope.getDirections = function(store) {
        //$scope.startAddress;
        var request = {
            origin: new google.maps.LatLng(lat, lon),
            destination: new google.maps.LatLng(store.latitude, store.longitude),
            travelMode: google.maps.TravelMode["DRIVING"]
        };

        var icon1 = {
            url: "assets/images/Location_A.png", //url
            scaledSize: new google.maps.Size(35, 53), // scaled size
            origin: new google.maps.Point(0, 0), // origin
            anchor: new google.maps.Point(0, 0) // anchor
        };
        var icon2 = {
            url: "assets/images/Location_B.png", //url
            scaledSize: new google.maps.Size(35, 53), // scaled size
            origin: new google.maps.Point(0, 0), // origin
            anchor: new google.maps.Point(0, 0) // anchor
        };
        directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);
                //----------Custom icons for directions-----
                var leg = response.routes[0].legs[0];
                $scope.makeDirectionMarker(leg.start_location, icon1, leg.start_address);
                createMarker(store, 1, icon2);
            }
        });
        for (var k = 0; k < $scope.markers.length; k++) {
            $scope.markers[k].setMap(null);
        }
    };

    $scope.makeDirectionMarker = function(position, icon, startAddr) {
        var marker2 = new google.maps.Marker({
            position: new google.maps.LatLng(position.lat(), position.lng()),
            map: map,
            icon: icon,
            title: ''
        });
        marker2.content = '<div class="infoWindowContent">' + startAddr + '</div>';
        google.maps.event.addListener(marker2, 'click', function() {
            infoWindow.setContent(marker2.content);
            infoWindow.open(map, marker2);
        });
        $scope.markers.push(marker2);
        map.setCenter(marker2.getPosition());
    };

    //----------Panel Show Hide-------------
    $scope.backToPanel1 = function() {
        document.getElementById("panel1").style.display = "block";
        document.getElementById("panel2").style.display = "none";
        indexObj = JSON.parse(sessionStorage.indexObj2);
        serOffered.serviceOffered = JSON.parse(sessionStorage.obj3);
        $scope.serviceOffered.indexObj = JSON.parse(sessionStorage.indexObj2);
        arr = JSON.parse(sessionStorage.obj3);
    }
    var arr = [],
        serOffered = {},
        indexObj = {};
    $scope.chkStateChanged = function(bol, e, index) {
        if (bol == true) {
            arr.push((e.currentTarget).value);
            serOffered.serviceOffered = arr;
        } else {
            if (arr.length > 0) {
                arr = _.without(arr, (e.currentTarget).value);
                serOffered.serviceOffered = arr;
                if (arr.length == 0)
                    delete serOffered.serviceOffered;
            } else {
                delete serOffered.serviceOffered;
            }
        }
        indexObj[index] = bol;
        $scope.serviceOffered.indexObj = indexObj;
        if (document.getElementById("panel2").style.display == "block") {
            $scope.findStore();
        } else {
            sessionStorage.obj3 = JSON.stringify(serOffered.serviceOffered);
            sessionStorage.indexObj2 = JSON.stringify(indexObj);
        }
    };
    $scope.getStoreInfo = function(store) {
        var len = store.workingHrs.length,
            data, index;
        for (var i = 0; i < len; i++) {
            data = store.workingHrs[i]['storeHrs' + (i + 1)];
            data.mon_fri = data.mon_fri.split('-');
            if (data.sun != "Closed")
                data.sun = data.sun.split('-');
            if (data.sat != "Closed")
                data.sat = data.sat.split('-');
            if (data.startDate) {
                var dt = new Date();
                data.startDate = (data.startDate) + "/" + dt.getFullYear();
                data.endDate = (data.endDate) + "/" + dt.getFullYear();
                dt = dt.getMonth() + 1 + "/" + dt.getDate() + "/" + dt.getFullYear();
                if ($scope.dateCheck(data.startDate, data.endDate, dt)) {
                    index = i;
                } else
                    data.futureDate = data.startDate;
            }
        }
        //if(index)
        //(store.workingHrs).splice(0,0,(store.workingHrs).splice(index,1)[0]); // Shift Current Store Hours
        document.getElementById("myclass").style.display = "none";
        document.getElementById("store_details").style.display = "block";
        $scope.storeDtls = store;
    };
    $scope.dateCheck = function(from, to, check) {
        var fDate, lDate, cDate;
        fDate = Date.parse(from);
        lDate = Date.parse(to);
        cDate = Date.parse(check);
        if ((cDate <= lDate && cDate >= fDate)) {
            return true;
        }
        return false;
    };


    $(".store_info .banner-rewards.storeLoc-Banner-Section .banner-left-wrap img.deskop-img").load(function() {
        var topBannerHeight = $(this).height();
        $('.store_info .banner-rewards.storeLoc-Banner-Section .promoBanner-firstSection img.desktop-img').css('height', topBannerHeight);
        /*$('.banner-rewards .promo-banner.promo-banner-top .promo-banner-txt').css('height',topBannerHeight);*/

    });

}


function staticPageData($http, $q, alfrescourl, alflogin, alfrescofoldersurl) {
    var service = {
        GetFolders: _getFolders
    };

    function _getFolders(url, ticket) {
        var defferred = $q.defer();
        $http({
            method: 'GET',
            dataType: "json",
            url: url,
            headers: {
                'Content-Type': 'application/json'
            }
        }).success(function(data, status, headers, config) {
            defferred.resolve(data);
        }).error(function(data, status, headers, config) {
            defferred.reject(data);
        });
        return defferred.promise;
    }
    return service;


}

function eventsListingController(PlpService, $stateParams, alfStaticContenturl, $q, alfcontenturl, $sce, HomeFact, $state) {
    var vm = this;

    // START: function for sort options selection
    var sortItems = [
        { 'value': 'New', 'label': 'New', 'index': 'products' },
        { 'value': 'PriceHighesttoLowest', 'label': 'Price Highest to Lowest', 'index': 'products_price_desc' },
        { 'value': 'PriceLowesttoHighest', 'label': 'Price Lowest to Highest', 'index': 'products_price_asc' },
        { 'value': 'BestSellers', 'label': 'Best Sellers', 'index': 'products' },
        { 'value': 'Local Delivery', 'label': 'Local Delivery', 'index': 'products' },
        { 'value': 'Nationwide Delivery', 'label': 'Nationwide Delivery', 'index': 'products' },
        { 'value': 'Most Popular', 'label': 'Most Popular', 'index': 'products' },
        { 'value': 'AZ', 'label': 'A - Z', 'index': 'products' },
        { 'value': 'ZA', 'label': 'Z - A', 'index': 'products_name_desc' },
    ];
    vm.sortItems = sortItems;
    if ($stateParams.productssortby == undefined) {
        vm.selectedItem = "Best Sellers";
        vm.selectedMenu = 0;
    } else {

        var slectItem = Underscore.where(vm.sortItems, { index: $stateParams.productssortby });
        vm.selectedItem = slectItem[0].label;
    }

    vm.changeSortSelection = function changeSortSelection(selcetedItem, itemIndex) {
        vm.selectedItem = selcetedItem;
        vm.selectedMenu = itemIndex;

    };

    vm.SortByProducts = function(indexName, selcetedItem) {
        /*   $state.go('elp', {
               filters: $stateParams.filters,
               productpage: vm.currentProductPage || 1,
               productssortby: indexName,
               min: $stateParams.min || null,
               max: $stateParams.max || null
           },
               { reload: true })*/
        vm.selectedItem = selcetedItem;
    };
    // END: function for sort options selection
    var ticket = localStorage.getItem("alf_ticket");
    PlpService.GetHelpAndPromo(ticket).then(function(res) {
        vm.needHelp = alfcontenturl + res.items[4].contentUrl + "?alf_ticket=" + ticket;
        vm.needHelpTitle = res.items[0].title;
        vm.needHelpDescription = res.items[0].description;

        vm.leftPromo = alfcontenturl + res.items[1].contentUrl + "?alf_ticket=" + ticket;
        vm.leftPromoTitle = res.items[1].title;
        vm.leftPromoDescription = res.items[1].description;
        vm.leftPromoButton = res.items[1].author;

        var giftCard = alfcontenturl + res.items[2].contentUrl + "?alf_ticket=" + ticket;
        vm.giftCard = $sce.trustAsResourceUrl(giftCard);
        vm.giftCardTitle = res.items[2].title;
        vm.giftCardDescription = res.items[2].description;

    });
    PlpService.GetPromoSvgDesign(ticket).then(function(res) {
        var elp_promo_svgDesign = alfcontenturl + res.items[6].contentUrl + "?alf_ticket=" + ticket;
        vm.elp_promo_svgDesign = $sce.trustAsResourceUrl(elp_promo_svgDesign);
    });

    vm.detailsPage = function($event) {
        var id = $($event.target).parents('.contentSide').attr('data-prodid');
        var seq = $($event.target).parents('.contentSide').attr('data-sequence');
        if (typeof id != "undefined") {
            var href = "/eventDescription/" + seq + "/prodId=" + id;
            $state.go('eventDescription', { 'prodCode': seq, 'prodId': id });
        } else {
            var href = "/eventDescription/" + seq;
            $state.go('eventDescription', { 'prodCode': seq });
        }
    }

    HomeFact.GetEventsList().then(function(res) {
        console.log('GetEventsList', res);
        var eventListGroupByEventType = _.groupBy(res, function(num) {
            return num.xp.CurrentFineline });

        var eventCat = $stateParams.catId;

        //var resByPc = eventListGroupByEventType[eventCat];
        //console.log('resByPc',resByPc);

        if (eventCat == 'WorkshopsEvent') {
            vm.eventListGroupByEventType = res;
        } else if (eventCat == 'WorkshopsEvents_TicktedEvents_DesignWorkshops') {
            vm.eventListGroupByEventType = eventListGroupByEventType.DESWS;
        } else if (eventCat == 'WorkshopsEvents_TicktedEvents_HowToClasses') {
            vm.eventListGroupByEventType = eventListGroupByEventType.HTCLS;
        }else if (eventCat == 'WorkshopsEvents_TicktedEvents_IdeasHouse') {
            vm.eventListGroupByEventType = eventListGroupByEventType.IDHSE;
        } else if (eventCat == 'WorkshopsEvents_FreeEvents') {
            vm.eventListGroupByEventType = eventListGroupByEventType.WorkshopsEvents_FreeEvents_BachmansEvents;
            var eventListGroupByEventType2 = eventListGroupByEventType.WorkshopsEvents_FreeEvents_HorticulturalMeetings;
            angular.forEach(eventListGroupByEventType2, function(item) {
                vm.eventListGroupByEventType.push(item);
            })
        }
        if (vm.eventListGroupByEventType == undefined) {
            vm.noEventsFound = "NO PRODUCTS FOUND";
        }
        //console.log('ELPET',vm.eventListGroupByEventType);
        $q.all(vm.eventListGroupByEventType).then(function(events) {
            var eventListGroupByProductCode = _.groupBy(events, function(num) {
                return num.xp.ProductCode });
            vm.eventListGroupByProductCode = eventListGroupByProductCode;
            console.log('ELPC', vm.eventListGroupByProductCode);
        })


    });

}



function TrimFilter() {
    return function(input) {
        if(input != undefined){
            return input.substring(0, input.length - 4);
        }
    }
}