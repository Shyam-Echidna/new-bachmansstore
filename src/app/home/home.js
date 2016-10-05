angular.module( 'orderCloud' )

	.config( HomeConfig )
	.controller( 'HomeCtrl', HomeController )
	.factory('HomeFact', HomeFact )
;

function HomeConfig( $stateProvider ) {
	$stateProvider
		.state( 'home', {
			parent: 'base',
			url: '/home',
			templateUrl: 'home/templates/home.tpl.html',
			controller: 'HomeCtrl',
			controllerAs: 'home',
			ncyBreadcrumb: {
				label: "<a href='/home'>Home</a>"
			},
			resolve: {
				getBuyer : function(OrderCloud){
					return OrderCloud.Buyers.Get().then(function(res){
						return res;
					})
				}
			}
		})
}
function HomeController( $scope, OrderCloud, $window,HomeFact, PlpService, $q, $sce, alfcontenturl, CategoryService, Underscore, $rootScope, $state, getBuyer) {

	var vm = this;
	$rootScope.showBreadCrumb = false;
	var siteEditorHome = getBuyer.xp.SiteEditor.HomePage;
	vm.detailsPage = function($event){
		var id = $($event.target).parents('.staticSeqId').attr('data-prodid');
		var seq= $($event.target).parents('.staticSeqId').attr('data-sequence');
		if (typeof id != "undefined") {
			var href = "/eventDescription/" + seq + "/prodId=" + id;
			$state.go('eventDescription', { 'prodCode': seq, 'prodId': id });
		} else {
			var href = "/eventDescription/" + seq;
			$state.go('eventDescription', { 'prodCode': seq });
		}

	}
	/*vm.eventsProducts = GetAllEvents;
	 console.log('vm.eventsProducts',vm.eventsProducts);
	 OrderCloud.Products.List("isEvent", 1, 100, "xp", null, null).then(function(res){
	 console.log('eventsProducts',res);
	 vm.eventsProducts = res.Items;
	 setTimeout(function(){
	 var owl = angular.element("#owl-carousel-eventsAll");
	 owl.owlCarousel({
	 items:2,
	 center:false,
	 loop: false,
	 nav:true,
	 navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>','<span class="events-arrow-next" aria-hidden="true"></span>'],
	 autoWidth:true,
	 responsive : {
	 0 : {
	 margin:30
	 },
	 320 : {
	 margin:5
	 },
	 560 : {
	 margin:10
	 },
	 768 : {
	 margin:20
	 },
	 1024 : {
	 margin:20
	 }
	 },
	 onInitialized : function(event){
	 console.log("owl==",owl.find('.owl-item.active').last());
	 owl.find('.owl-item.active').last().addClass('fadeGrid');
	 }
	 });
	 owl.on('changed.owl.carousel', function(event) {
	 setTimeout(function(){
	 console.log("owl==",owl.find('.owl-item.active'));
	 owl.find('.owl-item').removeClass('fadeGrid');

	 owl.find('.owl-item.active').last().addClass('fadeGrid');
	 },200);
	 })
	 },1000)
	 });*/

	function EventsList(){
		var ajaxarr = [];
		CategoryService.listChild("WorkshopsEvents").then(function(catList) {
			angular.forEach(catList, function(cat) {
				//  var promise = OrderCloud.Me.ListProducts(cat.ID);
				var promise =  OrderCloud.Me.ListProducts(null, 1, 100, null, null, null, cat.ID).then(function(res){
					return res.Items
				})
				ajaxarr.push(promise);
			});
			$q.all(ajaxarr).then(function(items){
				console.log("events===",Underscore.flatten(items));
				vm.eventsList = Underscore.flatten(items);
				setTimeout(function(){
					var owl = angular.element("#owl-carousel-events");
					owl.owlCarousel({
						items:2,
						center:false,
						loop: false,
						nav:true,
						navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>','<span class="events-arrow-next" aria-hidden="true"></span>'],
						autoWidth:true,
						responsive : {
							0 : {
								margin:30
							},
							320 : {
								margin:5
							},
							560 : {
								margin:10
							},
							768 : {
								margin:20
							},
							1024 : {
								margin:20
							}
						},
						onInitialized : function(event){
							console.log("owl==",owl.find('.owl-item.active').last());
							owl.find('.owl-item.active').last().addClass('fadeGrid');
						}
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

	}
	function EventsList1(){

		var ajaxarr = [];

		CategoryService.listChild("WorkshopsEvents").then(function(catList) {

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
	//var vm = this;

	vm.status = {
		isFirstOpen: true,
		isFirstDisabled: false
	};
	if($(window).width() <= 768){
		var store = 0;
		vm.alertMe = function(indx) {
			var moveToPos = $('.services-offered ul.nav-tabs li').width();

			if(store < indx){
				if(indx>1){
					var moveToPos = $('.services-offered ul.nav-tabs li').width();
					var pos = $('.services-offered ul.nav-tabs').scrollLeft()+ moveToPos;
					$('.services-offered ul.nav-tabs').scrollLeft(pos);
					store = indx;
				}
			}
			else if(store > indx){
				if(indx<6){
					var moveToPos = $('.services-offered ul.nav-tabs li').width();
					var pos = $('.services-offered ul.nav-tabs').scrollLeft()- moveToPos;
					$('.services-offered ul.nav-tabs').scrollLeft(pos);
					store = indx;
				}
			}
			else {
				var moveToPos = $('.services-offered ul.nav-tabs li').width();
				var pos = $('.services-offered ul.nav-tabs').scrollLeft()- moveToPos;
				$('.services-offered ul.nav-tabs').scrollLeft(pos);
			}
		};
	}

	// static masonry

	if($(window).width() <= 768){
		/*$(".grid-item:nth-child(1) .mobile-img").load(function(){
		 var inspHtHome = $(this).height();
		 $('.grid.repeatable-blocks').css('height', inspHtHome*3 );

		 $('.grid-item:nth-child(1)').css('height', inspHtHome);
		 $('.grid-item:nth-child(6)').css('height', inspHtHome);

		 $('.grid-item:nth-child(2)').css('top', inspHtHome);
		 $('.grid-item:nth-child(3)').css('top', inspHtHome);
		 $('.grid-item:nth-child(4)').css('top', inspHtHome + inspHtHome/2);
		 $('.grid-item:nth-child(5)').css('top', inspHtHome + inspHtHome/2);

		 $('.grid-item:nth-child(2)').css('height', inspHtHome/2);
		 $('.grid-item:nth-child(3)').css('height', inspHtHome/2);
		 $('.grid-item:nth-child(4)').css('height', inspHtHome/2);
		 $('.grid-item:nth-child(5)').css('height', inspHtHome/2);

		 $('.grid-item:nth-child(6)').css('top', inspHtHome*2);
		 });*/
	}
	else{
		/*var inspHtHome ='';
		 $(".grid-item .desktop-img").load(function(){
		 inspHtHome = $(this).height();
		 });
		 $('.grid.repeatable-blocks').css('height', inspHtHome + inspHtHome/2);

		 $('.grid-item:nth-child(1)').css('height', inspHtHome);


		 $('.grid-item:nth-child(6)').css('height', inspHtHome);

		 $('.grid-item:nth-child(4)').css('top', inspHtHome);
		 $('.grid-item:nth-child(5)').css('top', inspHtHome);

		 $('.grid-item:nth-child(2)').css('height', inspHtHome/2);
		 $('.grid-item:nth-child(3)').css('height', inspHtHome/2);
		 $('.grid-item:nth-child(4)').css('height', inspHtHome/2);
		 $('.grid-item:nth-child(5)').css('height', inspHtHome/2);

		 $('.grid-item:nth-child(6)').css('top', inspHtHome/2);*/
	}

	/*var owl = angular.element("#owl-carousel-events");
	 owl.owlCarousel({
	 items:1,
	 loop:true,
	 nav:true,
	 stagePadding:150,
	 autoWidth:true,
	 //responsive: true,
	 responsive : {
	 0 : {
	 stagePadding:30,
	 margin:0,
	 },
	 320: {
	 stagePadding:30,
	 margin:5,
	 },
	 769 : {
	 stagePadding:30,
	 margin:20,
	 }
	 },
	 margin:20
	 });*/

	/*var $grid = $('.grid').masonry({
	 itemSelector: '.grid-item',
	 percentPosition: true,
	 columnWidth: '.grid-sizer',
	 gutter: 20
	 });
	 // layout Isotope after each image loads
	 $grid.imagesLoaded().progress( function() {
	 $grid.masonry();
	 });*/
	//setTimeout(function(){
	//$rootScope.homeservices()
	//},100);
	//$rootScope.homeservices = function(){


	var ticket = localStorage.getItem("alf_ticket");

	HomeFact.GetGridimgs(ticket, siteEditorHome.GridSystem).then(function(res){
		var gridImgs;
		vm.gridImgs = [];
		angular.forEach(res.items, function(item,key){
			if(item.nodeType == "ws:article"){
				vm.gridImgTemplate = $sce.trustAsResourceUrl(alfcontenturl+item.contentUrl+"?alf_ticket="+localStorage.getItem("alfTemp_ticket"));;
			}
			//gridImgs=alfcontenturl+item.contentUrl+"?alf_ticket="+ticket;
			//vm.gridImgs.push(gridImgs);
		});
		// vm.topGridImg = alfcontenturl+res.items[0].contentUrl+"?alf_ticket="+ticket;
		// vm.topGridTitle = res.items[0].title;
		// vm.topGridDescription = res.items[0].description;
		// vm.topGridBtnTxt = res.items[0].author;
	});


	HomeFact.GetHeroBanner(ticket, siteEditorHome.HeroBanner).then(function(res){

		console.log("GetHeroBanner",res);
		var heroBanners = [];
		var heroBanners_mobile = [];
		angular.forEach(Underscore.where(res.items), function (node) {

			if (node.title === 'mobile') {

				heroBanners_mobile.push(alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket);
			}
			else {
				node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
				heroBanners.push(node);
			}
		});
		vm.heroBanners = heroBanners;
		vm.heroBanners_mobile = heroBanners_mobile;
		setTimeout(function(){
			angular.element("#owl-carousel-banner").owlCarousel({
				//responsive: true,
				items:1,
				dots:true,
				loop:true,
				autoplay:true,
				autoplayHoverPause:true,
			});

			animateOut: 'fadeOut'
		},500);
	});

	HomeFact.GetQuicklinks(ticket, siteEditorHome.Quicklinks).then(function(res){
		vm.quicklinks = [];
		vm.title = [];
		angular.forEach(res.items, function(item){
			var quicklink = $sce.trustAsResourceUrl(alfcontenturl+item.contentUrl+"?alf_ticket="+ticket);
			var title  = $sce.trustAsHtml(item.title);
			vm.quicklinks.push(quicklink);
			vm.title.push(title);
		})

	});


	HomeFact.GetPromotions(ticket, siteEditorHome.Promotions).then(function(res){
		console.log("banner== ",res);
		vm.topPromo = alfcontenturl+res.items[0].contentUrl+"?alf_ticket="+ticket;
		vm.leftPromo = alfcontenturl+res.items[1].contentUrl+"?alf_ticket="+ticket;
		vm.rightPromo = alfcontenturl+res.items[2].contentUrl+"?alf_ticket="+ticket;
		vm.topPromoMobile = alfcontenturl+res.items[7].contentUrl+"?alf_ticket="+ticket;

		vm.topPromoTitle = res.items[0].title;
		vm.topPromoDescription = res.items[0].description;
		vm.topPromoBtnTxt = res.items[0].author;
		vm.leftPromoTitle = res.items[1].title;
		vm.leftPromoBtnTxt = res.items[1].author;
		var ppSvg = alfcontenturl + res.items[2].contentUrl + "?alf_ticket=" + ticket;
		vm.ppSvg = $sce.trustAsResourceUrl(ppSvg);
		vm.ppSvgTitle = res.items[2].title;
		vm.ppSvgDescription = res.items[2].description;
		vm.ppSvgBtnTxt = res.items[2].author;
		var ppText = alfcontenturl + res.items[3].contentUrl + "?alf_ticket=" + ticket;
		vm.ppText = $sce.trustAsResourceUrl(ppText);
		$(".banner-rewards .promo-banner-main .promo-banner-left img.desktop-img").load(function(){
			var topBannerHeight = $(this).height();
			$('.rewards-txt-main').css('height',topBannerHeight);
			$('.rewards-txt-main .rewards-txt').css('height',topBannerHeight);
		});


	});
	PlpService.GetProductImages(ticket).then(function(res){
		var  productImages = res.items;

		HomeFact.GetFeaturedProducts().then(function(res){
			var ajaxarr = [];
			var ticket = localStorage.getItem("alf_ticket");
			var imgcontent;
			/*for(var i=0;i<res.length;i++){
			 angular.forEach(Underscore.where(productImages, {title: res[i].ID}), function (node) {
			 node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
			 imgcontent = node;
			 });
			 res[i].imgContent = imgcontent;
			 }*/

			for(var i=0;i<res.length;i++){
				var matchedFeaturedImage = Underscore.where(productImages, {title: res[i].ID});
				if(matchedFeaturedImage.length > 0){
					angular.forEach(matchedFeaturedImage, function (node) {
						node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
						imgcontent = node;
					});
					res[i].imgContent = imgcontent;
				}else{
					res[i].imgContent= {};
					res[i].imgContent['contentUrl'] = 'assets/images/noimg.jpg';
				}
			}

			vm.featuredProducts = res;

			setTimeout(function(){
				var pdtCarousal = angular.element("#owl-pdt-carousel");
				pdtCarousal.owlCarousel({
					loop: true,
					center: true,
					margin:12,
					nav:true,
					navText: ['<span class="pdtCarousalArrowPrev" aria-hidden="true">next</span>','<span class="pdtCarousalArrowNext" aria-hidden="true">prev</span>'],
					callbacks: true,
					URLhashListener: true,
					autoplayHoverPause: true,
					startPosition: 'URLHash',
					responsiveClass:true,
					responsive:{
						// breakpoint from 0 up
						0:{
							items:1,
							stagePadding:120,
						},
						// breakpoint from 328 up..... mobile portrait
						320:{
							items:1,
							dots:true,
							stagePadding:30,
							margin:45,
						},
						// breakpoint from 328 up..... mobile landscape
						568:{
							items:1,
							dots:true,
							stagePadding:100,
							margin:30
						},
						960:{
							items:1,
							dots:true,
							stagePadding:200,
							margin:10
						},
						// breakpoint from 768 up
						768:{
							items:1,
							dots:true,
							stagePadding:120
						},
						1024:{
							items:2,
							dots:true,
							stagePadding:80
						},
						1200:{
							items:2,
							dots:true,
							stagePadding:10,
							margin:0
						},
						1500:{
							items:3,
							dots:true,
							stagePadding:80,
							margin:0
						}
					},
					onInitialized : function(event){
						var tmp_owl = this;
						pdtCarousal.find('.owl-item').on('click', function(){
							tmp_owl.to( $(this).index() - (pdtCarousal.find(".owl-item.cloned").length / 2 ));
							var carousal_id = $(this).attr('data-role');
							//switchExpertise(carousal_id);
						});
						console.log($(this).index());
						var pdtOwlItemWidth = $('.pdt-carousel .owl-item.center.active').width();

						//$('.pdt-carousel .pdtCarousalArrowPrev').css({'left':-pdtOwlItemWidth/2 - 14});
						//$('.pdt-carousel .pdtCarousalArrowNext').css({'right':-pdtOwlItemWidth/2 - 14});

						//$('.pdt-carousel .pdtCarousalArrowPrev').css({'background-position':pdtOwlItemWidth/2 + 14 });
						//$('.pdt-carousel .pdtCarousalArrowNext').css({'background-position':pdtOwlItemWidth/2 + 14 });

						$('.pdt-carousel .pdtCarousalArrowPrev').css({'margin-right': pdtOwlItemWidth/2 + 14});
						$('.pdt-carousel .pdtCarousalArrowNext').css({'margin-left': pdtOwlItemWidth/2 + 14 });
						if((navigator.userAgent.indexOf("MSIE") != -1 ) || (!!document.documentMode == true )) //IF IE > 10
						{
							$('.pdt-carousel .pdtCarousalArrowPrev').css({'margin-right': pdtOwlItemWidth/2 + 7});
							$('.pdt-carousel .pdtCarousalArrowNext').css({'margin-left': pdtOwlItemWidth/2 + 7 });
						}
					},
					onChanged : function(){
						setTimeout(function(){
							var carousal_id = pdtCarousal.find('.owl-item.center .expertise_fields').attr('data-role');

							//switchExpertise(carousal_id);

							//switchExp(carousal_id);

							console.log(carousal_id);
						},300);
					}
				});
			},1000);
			// });
		});
	});
	//};
	HomeFact.GetEventsList().then(function(res){
		console.log('GetEventsList',res);
		var queue = [];
		var eventListGroupByProductCode = _.groupBy(res, function(num){ return num.xp.ProductCode });
		vm.eventListGroupByProductCode = eventListGroupByProductCode;
		console.log('PC',eventListGroupByProductCode);
		setTimeout(function(){
			var owl = angular.element("#owl-carousel-eventsAll");
			owl.owlCarousel({
				items:2,
				center:false,
				loop: false,
				nav:true,
				navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>','<span class="events-arrow-next" aria-hidden="true"></span>'],
				autoWidth:true,
				responsive : {
					0 : {
						margin:30
					},
					320 : {
						margin:5
					},
					560 : {
						margin:10
					},
					768 : {
						margin:20
					},
					1024 : {
						margin:20
					}
				},
				onInitialized : function(event){
					console.log("owl==",owl.find('.owl-item.active').last());
					owl.find('.owl-item.active').last().addClass('fadeGrid');
				}
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

}
function HomeFact($http, $q, $exceptionHandler, alfrescourl, OrderCloud){

	var service = {
		GetHeroBanner:_getHeroBanner,
		GetPromotions:_getPromotions,
		GetFeaturedProducts:_getFeaturedProducts,
		GetQuicklinks:_getQuicklinks,
		GetGridimgs:_getGridimgs,
		GetEventsList: _getEventsList,
		AttachPriceSchedule: attachPriceSchedule
	};
	return service;

	function _getHeroBanner(ticket,root) {
		var defferred = $q.defer();
		$http({
			method: 'GET',
			dataType:"json",
			url:  alfrescourl+"HomePage/HeroBanner/"+root+"?alf_ticket="+ticket,
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
	function _getFeaturedProducts(){
		//	var filters = {xp:{Featured : true}};
		// var filter ={
		// "xp.Featured":true
		// };
		// var defferred = $q.defer();
		// OrderCloud.Me.ListProducts(null, 1, 100, null, null, filter, null).then(function(res){
		// console.log("462==",res);
		// defferred.resolve(res.Items);
		// })

		// return defferred.promise;
		var defferred = $q.defer();

		$http({
			method: 'GET',
			dataType:"json",
			url:"https://api.ordercloud.io/v1/me/products?xp.Featured=true",

			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + OrderCloud.Auth.ReadToken()
			}

		}).success(function (data, status, headers, config) {

			defferred.resolve(data.Items);
		}).error(function (data, status, headers, config) {
		});
		return defferred.promise;
	}
	function _getPromotions(ticket,root) {
		var defferred = $q.defer();
		$http({
			method: 'GET',
			dataType:"json",
			url:  alfrescourl+"HomePage/Promotions/"+root+"?alf_ticket="+ticket,
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

	function _getQuicklinks(ticket, root) {
		var defferred = $q.defer();
		$http({
			method: 'GET',
			dataType:"json",
			url: alfrescourl+"HomePage/Quicklinks/"+root+"?alf_ticket="+ticket,
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

	function _getGridimgs(ticket, root) {
		var defferred = $q.defer();
		$http({
			method: 'GET',
			dataType:"json",
			url: alfrescourl+"HomePage/GridSystem/"+root+"?alf_ticket="+ticket,
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
	function _getEventsList() {
		var defferred = $q.defer();
		OrderCloud.Products.List(null, 1, 100, null, null, { "xp.IsWorkshopEvent": true },null).then(function(res){
			var queue = [];

			angular.forEach(res.Items, function(item) {
				queue.push(attachPriceSchedule(item));
			});

			$q.all(queue).then(function(Products){
				defferred.resolve(Products);
			})
		})
		return defferred.promise;
	}
	function attachPriceSchedule(item) {
		return OrderCloud.Products.ListAssignments(item.ID).then(function (list) {
			return OrderCloud.PriceSchedules.Get(list.Items[0].StandardPriceScheduleID).then(function (PriceSchedule) {
				item.PriceSchedule = PriceSchedule;
				return item;
			});
		});
	}
}