angular.module('orderCloud')

.config(staticPageConfig)
.factory('staticPageData', staticPageData )
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

;


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

		.state( 'plantZone.staticPage', {
			url: '/staticPage/:pageName',
			templateUrl: 'staticPage/templates/StaticBaseForImage.tpl.html',
			controller: 'staticPageBaseCtrl',
			controllerAs: 'staticPageBase',
			resolve:
			{
				page : function($stateParams){
					return $stateParams.pageName;
				}
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
		.state('customerService', {
			parent: 'base',
			url: '/customerService/:pageName',
			templateUrl: 'staticPage/templates/history.tpl.html',
			controller: 'historyCtrl',
			controllerAs: 'history',
			resolve:
						{
							page : function($stateParams){
								return $stateParams.pageName;
							}
						}
		})
		.state('corporate', {
			parent: 'base',
			url: '/corporate/:pageName/:fileName',
			templateUrl: 'staticPage/templates/services.tpl.html',
			controller: 'historyCtrl',
			controllerAs: 'history',
			resolve:
						{
							page : function($stateParams){
								return $stateParams.pageName;
							},
							fileName : function($stateParams){
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
		.state('services', {
			parent: 'base',
			url: '/services/:pageName/:fileName',
			templateUrl: 'staticPage/templates/services.tpl.html',
			controller: 'historyCtrl',
			controllerAs: 'history',
			resolve:
						{
							page : function($stateParams){
								return $stateParams.pageName;
							},
							fileName : function($stateParams){
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
		.state('eventDescription', {
			parent: 'base',
			url: '/eventDescription',
			templateUrl: 'staticPage/templates/eventDescription.tpl.html',
			controller: 'eventDescriptionCtrl',
			controllerAs: 'eventDescription'
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
//		.state('staticPage', {
//			parent: 'base',
//			url: '/staticPage/:pageName',
//			templateUrl: 'staticPage/templates/StaticBase.tpl.html',
//			controller: 'staticPageBaseCtrl',
//			controllerAs: 'staticPageBase',
//			resolve:
//			{
//				page : function($stateParams){
//					return $stateParams.pageName;
//				}
//			}
//		})
//        .state('staticPageImage', {
//			parent: 'base',
//			url: '/staticPageImage/:pageName',
//			templateUrl: 'staticPage/templates/StaticBaseForImage.tpl.html',
//			controller: 'staticPageBaseCtrl',
//			controllerAs: 'staticPageBase',
//			resolve:
//			{
//				page : function($stateParams){
//					return $stateParams.pageName;
//				}
//			}
//		});

}

function ladingPageController(folder) {
	var vm = this;
	alert(JSON.stringify(folder));
}

function staticPageBaseController($http,page,$sce,alfcontenturl, LoginFact,$stateParams,x2js,staticPageData,alfcontentStaticSearchurl,alfStaticContenturl,alfcontentStaticSearchurlAtom,alfrescoStaticurl) {
	var vm = this;
    console.log("staticPageData.articleData");
    var artileMetaData = staticPageData.articleData;
    vm.articleContentUrl =  localStorage.getItem("contentUrl");
    vm.locationpath =  localStorage.getItem("locationpath");
    vm.articleAuthor =  localStorage.getItem("articleAuthor");
    vm.articleTitle = localStorage.getItem("articleTitle");
    var d = new Date(localStorage.getItem("modifiedOn"));
    var n = d.toString();
    var date = d.getDate();
    var year = d.getFullYear();
    vm.articleDate = date+" "+n.split(" ")[1]+" "+year;
    vm.staticTempright = $sce.trustAsResourceUrl(alfStaticContenturl+vm.articleContentUrl+"?alf_ticket="+localStorage.getItem("alfTemp_ticket"));
    console.log(alfStaticContenturl+vm.articleContentUrl+"&alf_ticket="+localStorage.getItem("alfTemp_ticket"));
//	$http.get(alfcontentStaticSearchurl+page+"&alf_ticket="+localStorage.getItem("alfTemp_ticket")).then(function(res){
//        console.log(res);
//		var staticTemp = res.data.substring(res.data.indexOf("api/node"),res.data.indexOf("/"+page))+"/"+page;
//
//		console.log(alfStaticContenturl+staticTemp+"?alf_ticket="+localStorage.getItem("alfTemp_ticket"));
//		vm.staticTempright = $sce.trustAsResourceUrl(alfStaticContenturl+staticTemp+"?alf_ticket="+localStorage.getItem("alfTemp_ticket"));
//	});
    
//    $http.get(alfcontentStaticSearchurlAtom+page.replace(".html","banner.png")+"&alf_ticket="+localStorage.getItem("alfTemp_ticket"))
//    .then(function(res){
//        console.log(res);
//        var json = x2js.xml_str2json(res.data);
//        if(json&&json.feed&&json.feed.entry){
//            if(json.feed.entry.length>0){
//                vm.articleBanner = json.feed.entry[0].link["_href"]+"?alf_ticket="+localStorage.getItem("alfTemp_ticket")
//            }else{
//                vm.articleBanner = json.feed.entry.link["_href"]+"?alf_ticket="+localStorage.getItem("alfTemp_ticket");
//            }
//        }
//        console.log(vm.articleBanner);
//
//	});
    
    $http.get(alfrescoStaticurl.substring(0,alfrescoStaticurl.length-1)+vm.locationpath+"/Media?alf_ticket="+localStorage.getItem("alfTemp_ticket"))
    .then(function(res){
        console.log(res);
        angular.forEach(res.data.items,function(item){
            if(item.fileName.indexOf(page.replace(".html",""))>=0){
                vm.articleBanner = "http://52.206.111.191:8080/alfresco/service/"+item.contentUrl+"?alf_ticket="+localStorage.getItem("alfTemp_ticket");
            }
            
        });
        console.log(vm.articleBanner);

	});

    vm.getThingsFromALfresco = function(parent, child){
        window.history.back();
    }
}

function contactController() {
	var vm = this;

}

function templateController($http, alfcontenturl, $state, $stateParams ,LoginFact,BaseService,staticPageData) {
	var vm = this;
		vm.bannerHideArticle = true;
//    vm.subFolderList = BaseService.ListOfPages[0].subfolders;
      vm.folderIndex = 0;
      vm.active=0;
      vm.articleSearch={};
			vm.mainCatName = "";
      var getFirstTag = true;

    vm.getThingsFromALfresco = function(parent, child,index){
        vm.active = index;
	    	var ticket = localStorage.getItem("alfTemp_ticket");
	    	var route = parent+"/"+child;
	    	LoginFact.GetArtcleList(ticket,route).then(function(response){
	    		console.log("GetArtcleList",response);
	    		vm.articleList = response;
	    	});
				$state.go('plantZone');
    }
    vm.getFirstThingsFromALfresco = function(pp,parent, subFolder,index){
        console.log(index+" .... "+vm.active);
      //  vm.active = index;
        if(subFolder.nodeType == 'ws:section' && subFolder.title !='' && getFirstTag){
					vm.mainCatName = pp;
            console.log(index+" .... "+vm.active);
            getFirstTag = false;
            var ticket = localStorage.getItem("alfTemp_ticket");
            var route = parent+"/"+subFolder.fileName;
            LoginFact.GetArtcleList(ticket,route).then(function(response){
                console.log("GetArtcleList",response);
                vm.active = index;
                vm.articleList = response;
            });
        }
    }
    vm.isOpen = 0;
  //  vm.getThingsFromALfresco("CareGuidesInformation","All_Care_Guides_Information",0);
	setTimeout(function () {
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
    vm.navigateToArticle = function(obj){
        staticPageData.articleData = obj;
        localStorage.setItem("contentUrl",obj.contentUrl);
        localStorage.setItem("articleAuthor",obj.author);
        localStorage.setItem("articleTitle",obj.title);
        localStorage.setItem("modifiedOn",obj.modifiedOn);
        localStorage.setItem("locationpath",obj.location.path);
					vm.bannerHideArticle = false;
       // if(obj.fileName==="TemplateCareAllNoImage.html" || obj.fileName==="Bachmas_ServicesAllCareNoImage.html"){
            $state.go('.staticPage', {pageName:obj.fileName});
     //    }else{
       //     $state.go('staticPage', {pageName:obj.fileName});
    //    }
    }
    vm.populateTabs = function(f,sf,index){
      //  vm.folderIndex = index;
			vm.mainCatName = sf.title;
        var first = true;
        vm.isOpen = index;
        getFirstTag = true;
        vm.tabsData = sf;
        angular.forEach(sf.items, function(item,i) {

         if(item.nodeType == 'ws:section' && item.title !='' &first){
             first=false;
             vm.getThingsFromALfresco(f.fileName,item.fileName,i);
         }
        });
				$state.go('plantZone');

    }
    var keepGoing = true;
    vm.tabSetdata = function(folders){
        angular.forEach(folders.subfolders,function(item){
            if(keepGoing) {
            if(item.nodeType == 'ws:section' && item.title !=''){
                vm.tabsData = item;
                keepGoing = false;
                return;
            }
            }
        });
    }

    vm.isFirstOpen = function(i){
        if(vm.open == i){
            return true;
        }
        return false;
    }
	var staticheaderHt = $('.base-header-desktop .base-header-inner').height();
	/*		$('.base-header-desktop .base-header-inner').css('border', '1px solid red');*/
	console.log('staticheaderHt' + staticheaderHt);

	/*$('.plantZone-nav').css('margin-top', staticheaderHt);*/
	var staticheaderHtmobile = $('.base-header-mobile .base-header-inner').height();
	/*	$('.mobile-plantZone-nav').css('margin-top', staticheaderHtmobile);*/
}

function template1Controller() {
	var vm = this;
	setTimeout(function () {
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
	}, 1000)
	var staticheaderHtmobile = $('.base-header-mobile .base-header-inner').height();
	/*$('.mobile-how-to-nav').css('margin-top', staticheaderHtmobile);*/

}

function historyController($scope,alfStaticContenturl,$sce,$state,page,fileName,staticPageData,alfrescoStaticurl,$compile) {
	var vm = this;
	vm.isOpen = 2;
	var owlHistory = angular.element("#owl-carousel-history");
	vm.accordianOpen = function(index){
		if(vm.isOpen != index){
			vm.isOpen = index;
		}else{
			vm.isOpen = undefined;
		}
	}
	vm.alfStaticContenturl = alfStaticContenturl;
	vm.parentPathChilde = $state.current;
	vm.pageName = page;
	var curl = "";
//	if(fileName){
//		curl = decodeURIComponent(fileName);
//	}
//	if(page=="BachmansHistory"){
//		curl = "be6d48bd-c388-4aa8-b90d-4eb60d20ac82/BachmansHistory.html";
//	}else if(page=="BachmansHerritageRoom"){
//		curl = "b71a7268-b1bf-42ed-b780-ba8a1013ef62/BaseHeritageTemplateCorporate.html";
//	}
	vm.activeIndex = 0;
 	vm.siteToken = localStorage.getItem('alfTemp_ticket');
	///api/node/content/workspace/SpacesStore/c5567137-543e-47ba-822c-148a57dce11d/Untitled%20Document.docx
	staticPageData.GetFolders(alfrescoStaticurl+"Bachmans Quick Start/Bachmans Editorial/root/"+$state.$current+"/"+decodeURIComponent(page),vm.siteToken).then(function(data){
		console.log(data);
		angular.forEach(data.items,function(item){
			if(item.nodeType=="ws:article"){
                console.log("content url",alfStaticContenturl+item.contentUrl+"?alf_ticket="+localStorage.getItem("alfTemp_ticket"));
				vm.staticTempPage = $sce.trustAsResourceUrl(alfStaticContenturl+item.contentUrl+"?alf_ticket="+localStorage.getItem("alfTemp_ticket"));
                vm.articleTitle = item.fileName.replace(".html","");
			}
			if(item.fileName == "Media"){
				vm.getMediaData(alfrescoStaticurl+item.location.path+"/"+item.fileName);
			}
		})
	});

  vm.assignIndex = function(data,i){
		if(vm.parentPathChilde.name == data){
			vm.isOpen = i;
		}
	}
//	var dataUrl = alfrescoStaticurl+"Bachmans Quick Start/Bachmans Editorial/root/"+$state.$current+"/"+page+"/Media";

  vm.assignActiveIndex = function(data,i){
		var pages = decodeURIComponent(page).split('/');
		if(pages.length > 0){
			if(pages[0].toLowerCase() == data.fileName.toLowerCase()){
				vm.activeIndex = data.fileName;
				vm.activePageTitle = data.title;
				vm.childactiveIndex = pages[1];
                console.log(data);
                setTimeout(function(){
                    if(data.subfolders.items.length>3){
                        vm.childCount = 2;
                    }
                },1000)
				console.log(vm.activeIndex+"="+vm.activePageTitle+"="+vm.childactiveIndex);
			}
		}else{
			if(page.toLowerCase() == data.fileName.toLowerCase()){
				vm.activeIndex = data.fileName;
				vm.activePageTitle = data.title;
			}
		}
	}
	vm.changePageData = function(filename,folder){
		console.log(filename);
		console.log(folder);
		vm.activeIndex = folder.fileName;
		vm.childCount = 0;
		var param = folder.location.path.split(filename+'/')[1];
		if(param)
			param +="/"+folder.fileName;
		else
		 	param = folder.fileName;
		if(folder.subfolders && folder.subfolders.items){
			angular.forEach(folder.subfolders.items,function(item){
				if(item.nodeType=="ws:section"){
					vm.childCount ++;
				}
			})
		}
		if(vm.childCount > 2){
		//	alert(count);
		}else{
			$state.go(filename, {pageName:param});
		}
	}
 vm.showCarouselData = false;
  vm.getMediaData = function(url){
		staticPageData.GetFolders(url,vm.siteToken).then(function(data){
				console.log("mediaData",data);
				vm.carouselData = data.items;
				angular.forEach(data.items,function(carousel){
					if(carousel.nodeType=='ws:image' && carousel.fileName.indexOf(vm.articleTitle.replace(".html",""))>=0){
						vm.templateBannerImage = carousel.contentUrl;
					}
                    if(carousel.nodeType=="ws:section" && carousel.fileName=="articleImages"){
                       vm.loadArticleImages(alfrescoStaticurl+carousel.location.path+"/"+carousel.fileName);
                    }
				})
				if(vm.carouselData.length>2){
					vm.showCarouselData = true;
					setTimeout(function(){
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
							}
						});
					},1000);
				}else{
					$(".history-carousel").hide();
					vm.showCarouselData = false;
				}

		},function(data){
            $(".history-carousel").hide();
				console.log(data);
		});
	}
	//vm.getMediaData(dataUrl);
  vm.loadArticleImages = function(url){
		staticPageData.GetFolders(url,vm.siteToken).then(function(data){
				console.log("loadArticleImages",data);
                if(data.items.length > 0){
				    vm.articleImages = data.items;
                    setTimeout(function(){
                        var elem = angular.element("#articleImagesSlot");
                        var classn="col-md-3";
                        if(vm.articleTitle=="memoryMotifs"){
                            classn = "col-md-4";
                        }
                        var html = '<div class="'+classn+' portfolio-item" ng-repeat="articleImage in history.articleImages" ng-if="articleImage.nodeType==\'ws:image\'&& articleImage.fileName.indexOf(history.articleTitle)>=0"><a href="#"> <img class="img-responsive" ng-src="{{history.alfStaticContenturl}}{{articleImage.contentUrl}}?alf_ticket={{history.siteToken}}" alt=""> </a><div class="gallery-desc"><h3>{{articleImage.title}}</h3><p>{{articleImage.description}}</p></div></div>';
                        var el = $compile(angular.element(html))($scope);
                        elem.html(el);
                    },0)
                    
                }
            
        })
  }
}

function staticpageController($scope, $uibModalInstance) {
	var vm = this;
	/*$scope.status = {
		open1: true,
		open1: false
	};
	$scope.status = {
		open2: true,
		open2: false
	};
	$scope.status = {
		open3: true,
		open3: false
	};
	$scope.status = {
		open4: true,
		open4: false
	};
	$scope.status = {
		open5: true,
		open5: false
	};
	$scope.status = {
		open6: true,
		open6: false
	};*/
	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};
}

function perplePerksController() {
	var vm = this;

}

function servicesController($uibModal,$scope) {
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
		onInitialized : function(event){

			owlHistory.find('.grid_desc').on('click', function(){
				setTimeout(function(){
		         	var modalInstance = $uibModal.open({
						animation: true,
						templateUrl: 'staticPage/templates/inspirational.tpl.html',
						controller:'staticpageCtrl',
						controllerAs: 'staticpage'
		         	});

		         	modalInstance.result.then(function() {

		         	}, function() {
		            	angular.noop();
		         	});
		    	},200)

		   	});
		}
	});
}

function careAdviceController() {
	var vm = this;


}

function FAQController($scope) {
	var vm = this;
	/*$scope.status = {
		open1: true,
		open1: false
	};
	$scope.status = {
		open2: true,
		open2: false
	};
	$scope.status = {
		open3: true,
		open3: false
	};
	$scope.status = {
		open4: true,
		open4: false
	};
	$scope.status = {
		open5: true,
		open5: false
	};
	$scope.status = {
		open6: true,
		open6: false
	};
	$scope.status = {
		openfaqs: true,
		openfaqs: false
	};*/
}

function perplePerksRegisteredController() {
	var vm = this;

}

function eventDescriptionController($scope) {
	var vm = this;
	
}


/*For Workshop event controller function starts*/
function workshopEventController( $scope, $window, HomeFact, PlpService, $q, $sce, alfcontenturl, CategoryService, Underscore, $rootScope) {
	var vm = this;

    function EventsList(){

			 var ajaxarr = [];

        CategoryService.listChild("c10").then(function(catList) {

         angular.forEach(catList, function(cat) {
         var promise = PlpService.GetProductAssign(cat.ID);
         	ajaxarr.push(promise);
         });
       $q.all(ajaxarr).then(function(items){

         	var productArr = Underscore.flatten(items);

			var ajaxarr1 = [];
			for(var i=0;i<productArr.length;i++){

				var promise = PlpService.ProductList(productArr[i].ProductID).then(function(data){

					return PlpService.GetStandardPriceScheduleID(data);


				});
					ajaxarr1.push(promise);
			}

			 $q.all(ajaxarr1).then(function(items){
			console.log("items==",items) ;
			vm.eventsList = items;
			setTimeout(function(){
				var owl = angular.element("#owl-carousel-events");
				owl.owlCarousel({
					items:2,
					center:false,
					loop: false,
					nav:true,
					//navText: ['<span class="glyphicon glyphicon-menu-left" aria-hidden="true"></span>','<span class="glyphicon glyphicon-menu-right" aria-hidden="true"></span>'],
					navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>','<span class="events-arrow-next" aria-hidden="true"></span>'],
					autoWidth:true,
					//responsive: true,
					responsive : {
						0 : {
							/*stagePadding:30,*/
							margin:30
						},
						320 : {
							/*stagePadding:50,*/
							margin:5
						},
						560 : {
							/*stagePadding:50,*/
							margin:10
						},
						768 : {
							/*stagePadding:30,*/
							margin:20
						},
						1024 : {
							/*stagePadding:30,*/
							margin:20
						}
					},
					onInitialized : function(event){
						console.log("owl==",owl.find('.owl-item.active').last());
						owl.find('.owl-item.active').last().addClass('fadeGrid');
					}
  /*   onChanged: function(event){

      		owl.find('.owl-item').removeClass('fadeGrid');
      		console.log("owl==",owl.find('.active'));
        owl.find('.owl-item.active').last().addClass('fadeGrid');
     }*/

				});
				owl.on('changed.owl.carousel', function(event) {
					setTimeout(function(){
						console.log("owl==",owl.find('.owl-item.active'));
						owl.find('.owl-item').removeClass('fadeGrid');

						owl.find('.owl-item.active').last().addClass('fadeGrid');
					},200);
				})
			},1000)

		});
		});
        })

		}

	EventsList();

   var ticket = localStorage.getItem("alf_ticket");

	HomeFact.GetGridimgs(ticket).then(function(res){
		var gridImgs;
		vm.gridImgs = [];
		angular.forEach(res.items, function(item,key){
			gridImgs=alfcontenturl+item.contentUrl+"?alf_ticket="+ticket;
			vm.gridImgs.push(gridImgs);
		});

	});


}
/*For Workshop event controller function -- end*/


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
		.success(function (data) {
			var array = [];
			var filt = _.filter(data.stores, function (row) {
				array = _.uniq(_.union(array, row.serviceOffered));
			});
			$scope.serviceOffered = array;
		}).error(function (err) {});

	//-----Find store----------
	$scope.markers = [];
	var obj = {},
		infoWindow = new google.maps.InfoWindow();
	$scope.findStore = function () {
		//-----------Get Store Details-----------
		$http.get('https://api.myjson.com/bins/4wsk2').success(function (data) {
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
			filtData = _.filter(filtData, function (row) {
				for (var j = 0; j < row.serviceOffered.length; j++) {
					if (_.indexOf(serOffered.serviceOffered, row.serviceOffered[j]) > -1 == true)
						return _.indexOf(serOffered.serviceOffered, row.serviceOffered[j]) > -1;
					//-----------Get Distance-----------
					var request = {
						origin: new google.maps.LatLng(lat, lon),
						destination: new google.maps.LatLng(row.latitude, row.longitude),
						travelMode: google.maps.TravelMode["DRIVING"]
					};
					directionsService.route(request, function (response, status) {
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
		}).error(function (err) {});

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
		google.maps.event.addListener(autocomplete, 'place_changed', function () {
			//alert(input.value);
			var place = autocomplete.getPlace();
			lat = place.geometry.location.lat();
			lon = place.geometry.location.lng();
		});

	};

	var createMarker = function (info, i, icon) {
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
		marker.content = '<div class="infoWindowContent"><img src="' + info.imageUrl + '" style="width: 175px;float: right;"><span class="store-sl_no">'+i+'</span> <span class="store-InfoCity">'+info.city+'</span>'+","+' '+" "+'<span class="store-InfoCity">'+info.cityCode+'</span><br/> <span class="store-storeName">'+info.storeName+' </span><br/> <span class="store-storeAddr">'+info.storeAddress+'</span>'+","+'  <span class="store-storeAddr">'+info.city+'</span>'+","+'  <span class="store-CityCode">'+info.cityCode+'</span>'+","+'  <span class="store-storeZip">'+ info.zipCode+'<br/></span> <span class="store-storeAddr">'+info.phoneNumber+'</span>' +  '</div>';
		google.maps.event.addListener(marker, 'click', function () {
			infoWindow.setContent(marker.content);
			infoWindow.open(map, marker);
		});
		$scope.markers.push(marker);
		map.setCenter(marker.getPosition());
	}

	//-----Info window events----------
	$scope.openInfoWindow = function (e, selectedMarker) {
		e.preventDefault();
		google.maps.event.trigger(selectedMarker, 'click');
	}

	//-----Get Directions---------------
	$scope.getDirections = function (store) {
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
		directionsService.route(request, function (response, status) {
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

	$scope.makeDirectionMarker = function (position, icon, startAddr) {
		var marker2 = new google.maps.Marker({
			position: new google.maps.LatLng(position.lat(), position.lng()),
			map: map,
			icon: icon,
			title: ''
		});
		marker2.content = '<div class="infoWindowContent">' + startAddr + '</div>';
		google.maps.event.addListener(marker2, 'click', function () {
			infoWindow.setContent(marker2.content);
			infoWindow.open(map, marker2);
		});
		$scope.markers.push(marker2);
		map.setCenter(marker2.getPosition());
	};

	//----------Panel Show Hide-------------
	$scope.backToPanel1 = function () {
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
	$scope.chkStateChanged = function (bol, e, index) {
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
	$scope.getStoreInfo = function (store) {
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
	$scope.dateCheck = function (from, to, check) {
		var fDate, lDate, cDate;
		fDate = Date.parse(from);
		lDate = Date.parse(to);
		cDate = Date.parse(check);
		if ((cDate <= lDate && cDate >= fDate)) {
			return true;
		}
		return false;
	};


		$(".store_info .banner-rewards.storeLoc-Banner-Section .banner-left-wrap img.deskop-img").load(function(){
			var topBannerHeight = $(this).height();
			$('.store_info .banner-rewards.storeLoc-Banner-Section .promoBanner-firstSection img.desktop-img').css('height',topBannerHeight);
			/*$('.banner-rewards .promo-banner.promo-banner-top .promo-banner-txt').css('height',topBannerHeight);*/

		});

}


function staticPageData($http, $q, alfrescourl, alflogin, alfrescofoldersurl) {
    var service = {
			GetFolders:_getFolders
		};
		function _getFolders(url,ticket) {
			var defferred = $q.defer();
			$http({
				method: 'GET',
				dataType:"json",
				url: url+"?alf_ticket="+ticket,
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
