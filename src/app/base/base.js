angular.module('orderCloud')

.config(BaseConfig)
    .factory('BaseService', BaseService)
    .controller('BaseCtrl', BaseController)
    //  .controller( 'BaseLeftCtrl', BaseLeftController )
    .controller('BaseTopCtrl', BaseTopController)
    .controller('BaseDownCtrl', BaseDownController)
    .factory('LoginFact', LoginFact)
    .directive('windowHeight', windowHeightDirective)
    .directive('contTopPadding', contTopPaddingDirective)
    .directive('scroll', scrollDirective)
    .directive('phoneValidation', phoneValidationDirective)
    .directive('customEmailValidation', customEmailValidationDirective)
    .directive('confirmPassword', ConfirmPasswordValidatorDirective)
    .filter('categoriesAsPerSeason', CategoriesAsPerSeasonFilter)
    .filter('capitalize', CapitalizeFilter)
    .config(function($breadcrumbProvider) {
        $breadcrumbProvider.setOptions({
            // templateUrl: '../common/breadcrumbs/breadcrumb.tpl.html'
            template: "bootstrap3"
        });
    });;

function BaseConfig($stateProvider) {
    $stateProvider
        .state('base', {
            url: '',
            abstract: true,
            templateUrl: 'base/templates/base.tpl.html',
            views: {
                '': {
                    templateUrl: 'base/templates/base.tpl.html',
                    controller: 'BaseCtrl',
                    controllerAs: 'base'
                },
                'top@base': {
                    templateUrl: 'base/templates/base.top.tpl.html',
                    controller: 'BaseTopCtrl',
                    controllerAs: 'baseTop'
                },
                /*'left@base': {
                    templateUrl: 'base/templates/base.left.tpl.html',
                    controller: 'BaseLeftCtrl',
                    controllerAs: 'baseLeft'
                },*/
                'down@base': {
                    templateUrl: 'base/templates/base.down.tpl.html',
                    controller: 'BaseDownCtrl',
                    controllerAs: 'baseDown'
                }
            },
            resolve: {
                CurrentUser: function($q, $state, OrderCloud, buyerid, anonymous) {
                    var dfd = $q.defer();
                    OrderCloud.Me.Get()
                        .then(function(data) {
                            dfd.resolve(data);
                        })
                        .catch(function() {
                            if (anonymous) {
                                if (!OrderCloud.Auth.ReadToken()) {
                                    OrderCloud.Auth.GetToken('')
                                        .then(function(data) {
                                            OrderCloud.Auth.SetToken(data['access_token']);
                                        })
                                        .finally(function() {
                                            OrderCloud.BuyerID.Set(buyerid);
                                            dfd.resolve({});
                                        });
                                } else {
                                    OrderCloud.Auth.RemoveToken();
                                    OrderCloud.Auth.RemoveImpersonationToken();
                                    OrderCloud.BuyerID.Set(null);
                                    $state.reload();
                                    dfd.resolve();
                                }
                            } else {
                                OrderCloud.Auth.RemoveToken();
                                OrderCloud.Auth.RemoveImpersonationToken();
                                OrderCloud.BuyerID.Set(null);
                                $state.go('login');
                                dfd.resolve();
                            }
                        });
                    return dfd.promise;
                },
                AnonymousUser: function($q, OrderCloud, CurrentUser) {
                    CurrentUser.Anonymous = angular.isDefined(JSON.parse(atob(OrderCloud.Auth.ReadToken().split('.')[1])).orderid);
                },
                ticket: function(LoginFact) {
                    return LoginFact.Get()
                        .then(function(data) {
                            //                            console.log(data);
                            var ticket = data.data.ticket;
                            localStorage.setItem("alf_ticket", ticket);
                            localStorage.setItem("alfTemp_ticket", ticket);
                            return ticket;
                        })
                },

                getBuyer: function(OrderCloud) {
                    return OrderCloud.Buyers.Get().then(function(res) {
                        return res;
                    })
                },

                categoryImages: function(CategoryService, ticket) {
                    // var ticket = localStorage.getItem("alf_ticket");
                    return CategoryService.GetCategoryImages(ticket).then(function(res) {
                        return res.items;
                    });
                }
            }
        });
}

function BaseService($q, $localForage, Underscore, OrderCloud, CurrentOrder) {
    var catTree = []
    var service = {
        GetCategoryTree: _getCategoryTree,
        MinicartData: _minicartData,
        FlattenCategoryArray: _flattenCategoryArray
    };


    function _getCategoryTree() {
        var tree = [];
        var categories = [];
        var deferred = $q.defer();
        var queue = [];

        OrderCloud.Categories.List(null, 1, 100, null, null, null, 'all').then(function(data) {
            //    console.log(data);
            categories = categories.concat(data.Items);
            for (var i = 2; i <= data.Meta.TotalPages; i++) {
                queue.push(OrderCloud.Categories.List(null, i, 100, null, null, null, 'all'));
            }
            $q.all(queue).then(function(results) {
                angular.forEach(results, function(result) {
                    categories = categories.concat(result.Items);
                });

                //deferred.resolve(categories);

                function _getnode(node) {

                    var children = Underscore.where(categories, {
                        ParentID: node.ID
                    });
                    if (children.length > 0) {
                        node.children = children;
                        angular.forEach(children, function(child) {
                            return _getnode(child);
                        });
                    } else {
                        node.children = [];
                    }
                    return node;
                }

                angular.forEach(Underscore.where(categories, {
                    ParentID: null
                }), function(node) {
                    tree.push(_getnode(node));
                });
                deferred.resolve(tree);
            });
            //deferred.resolve(tree);
        });
        return deferred.promise;
    }

    function _flattenCategoryArray(categories, approach) {
        var array = [];
        if (approach == 'topDown') {
            var mergedArray = Underscore.pluck(categories, "children");
            mergedArray = Underscore.flatten(Underscore.compact(mergedArray));
            mergedArray.push(Underscore.pluck(mergedArray, "children"));
            mergedArray = Underscore.flatten(Underscore.compact(mergedArray));
            /*angular.forEach(mergedArray, function (element) {
             try {
             delete element["children"];
             } catch (e) {
             }
             })*/
            array.push(mergedArray);
            angular.forEach(categories, function(category) {
                category.parent = { Name: '' };
                array[0].push(Underscore.omit(category, 'children'));
            })

            return array[0];
        } else {
            angular.forEach(categories, function(element) {
                if (!element.parent) {
                    element.parent = { 'Name': '' };
                }
            })
            return categories;
        }
    };
    /*function _getCategoryTree() {
        var tree = [];
        var deferred = $q.defer();
        Categories.List(null, 'all', 1, 100).then(function(list) {
            console.log(list);
            function _getnode(node) {

                      var children = Underscore.where(categories, { ParentID: node.ID});
                      if (children.length > 0) {
                          node.children = children;
                          angular.forEach(children, function(child) {
                              return _getnode(child);
                          });
                      } else {
                          node.children = [];
                      }
                      return node;
                  }

                  angular.forEach(Underscore.where(categories, { ParentID: null}), function(node) {
                tree.push(_getnode(node));
            });

            deferred.resolve(tree);
        });
        return deferred.promise;

    }*/
    /*     function _adminLogin(){

        var data = $.param({
                grant_type: 'client_credentials',
                scope: ocscope,
                client_id: '8836BE8D-710A-4D2D-98BF-EDBE7227E3BB'

            });
            var defferred = $q.defer();

            $http({

                    method: 'POST',
                    dataType:"json",
                    url: authurl,
                    data: data,
                    headers: {
                        'Content-Type': 'application/json'
                    }

                }).success(function (data, status, headers, config) {
                   //return data.access_token;
                     OrderCloud.Auth.SetToken(data.access_token);
                    defferred.resolve(data);
                }).error(function (data, status, headers, config) {
                    defferred.reject(data);
                });
                return defferred.promise;
        }*/

    function _minicartData() {
        var dfd = $q.defer();
        CurrentOrder.Get().then(function(data) {
            var mincart = data;
            //console.log(data);
            dfd.resolve(mincart);
        });
        return dfd.promise;
    }
    return service;
}

function BaseController($scope, $cookieStore, getBuyer, CurrentUser, defaultErrorMessageResolver, validator, $timeout, $window, BaseService, $state, LoginService, $rootScope, LoginFact, OrderCloud, alfcontenturl, $sce, $http, PlpService, $q, ticket, Underscore, CategoryService, HomeFact, categoryImages, $location, CurrentOrder) {
    var vm = this;
    vm.currentUser = CurrentUser;
    var siteEditorHome = getBuyer.xp.SiteEditor.HomePage;
    $scope.$on("CurrentCatgory1", function(evt, data) {
        vm.name1 = data;
    });
    $scope.$on("CurrentCatgory2", function(evt, data) {
        vm.name2 = data;
    });
    $scope.$on("CurrentCatgory3", function(evt, data) {
        vm.name3 = data;
    });
    setInterval(function() {
        LoginFact.Get().then(function(data) {
            var ticket = data.data.ticket;
            localStorage.setItem("alf_ticket", ticket);
            localStorage.setItem("alfTemp_ticket", ticket);
        })
    }, 90000);

    defaultErrorMessageResolver.getErrorMessages().then(function(errorMessages) {
        errorMessages['customPassword'] = 'Password must be at least eight characters long and include at least one letter and one number';
        //regex for customPassword = ^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!$%@#£€*?&]{8,}$
        errorMessages['customPassword123'] = 'Password Should Be Alphanumeric';
    });
    $rootScope.$on('getcurrentuser', function() {

        LoginService.GetCurrentUser().then(function(res) {
            console.log(res);
            vm.currentUser = res;
            vm.showuserdetail = true;
        })

    });

    vm.currentPath = $location.path();
    $scope.is = function(name) {
        return $state.is(name);

    }
    $rootScope.showBreadCrumb = false;
    vm.alf_ticket = ticket;
    //console.log('asdfghj',minicartData);
    vm.currentOrder = BaseService.MinicartData();
    //  console.log(vm.currentOrder);

    /*window.onorientationchange = function () {
      window.location.reload();
    }*/

    if ($(window).height() <= 1024) {
        /*vm.tab_menu = function(pID,childCount,cID) {
            $('.menu-container li.sub-nav a').toggle(function() {
                console.log('aaaaaaaaaaaaaaaaaa');
            }, function(pID,childCount,cID) {
                  $state.go('category', {parentId:pID,childCount:childCount,ID:cID});
            });
        }*/
        vm.tab_menu = function() {
            $('.menu-container li.sub-nav a').toggle(function() {
                //           console.log(1111111111111111);
            }, function() {
                //             console.log(22222222222222222222);
            });;
        }
    }
    // vm.openMenuLevel1 = function(){
    // vm.openMenuCont= true;
    // }
    /*  Addresses.Delete("2hxd8n5f7kuG0-S10-laQg",false).then(function (res) {
          console.log("Adredd==",res);
      }, function(res){
          console.log("Adds err==",res);
      })*/
    /*var data = {
        "accessToken": Auth.GetToken(),
        "buyerID": "Bachmans",
        "orderID": "0gJSiYk1qE6YZrci9n3F8Q"
    };*/
    /*$http.post('https://Four51TRIAL104401.jitterbit.net/Four51OnPrem/v1/CalculateTax',data).then(function(res){
        console.log("alvalara==",res);
    });*/
    /*  var userdata = {

          "firstname": "ravi",
          "lastname": "prakash",
          "email":"raviprakash.k@echidnainc.com"
      }
      $http.post('https://Four51TRIAL104401.jitterbit.net/Bachmans_Dev/constantcontact',userdata).then(function(res){
          console.log("alvalara==",res);
      });*/

    //  console.log("categoryImages",categoryImages);

    $(window).scroll(function() {
        var headerHt = $('.base-header-inner').height();
        var stickyHeaderHt = $('.base-header.sticky .base-header-top .main-logo').height();
        $('.base-header.sticky .base-header-top .delivery-details').css('height', stickyHeaderHt);
        if ($(this).scrollTop() > headerHt * 2) {
            $('.base-header-sticky').css({ 'top': 0 });
            $('.base-header-mobile').addClass("sticky");
            /* $('#BaseTop2').addClass('base-header-sticky sticky');
             $('.base-header-inner').css({'position':'fixed','top':'0'});*/
        } else {
            $('.base-header-sticky').css({ 'top': -headerHt });
            $('.base-header-mobile').removeClass("sticky");
            /*$('#BaseTop2').removeClass('base-header-sticky sticky');
            $('.base-header-inner').css({'position':'absolute','top':'0'});*/
        }
    });


    //web megamenu hover
    setTimeout(function() {

        $(".menu-hover-cont1").hover(bodyScrollHide, bodyScrollAuto);

        function preventDefault(e) {
            e = e || window.event;
            if (e.preventDefault)
                e.preventDefault();
            e.returnValue = false;
        }

        function preventDefaultForScrollKeys(e) {
            if (keys[e.keyCode]) {
                preventDefault(e);
                return false;
            }
        }

        function disableScroll() {
            if (window.addEventListener) // older FF
                window.addEventListener('DOMMouseScroll', preventDefault, false);
            window.onwheel = preventDefault; // modern standard
            window.onmousewheel = document.onmousewheel = preventDefault; // older browsers, IE
            window.ontouchmove = preventDefault; // mobile
            document.onkeydown = preventDefaultForScrollKeys;
            //angular.element('.breadcrumb-box').css('display','none');
        }

        function enableScroll() {
            if (window.removeEventListener)
                window.removeEventListener('DOMMouseScroll', preventDefault, false);
            window.onmousewheel = document.onmousewheel = null;
            window.onwheel = null;
            window.ontouchmove = null;
            document.onkeydown = null;
            //angular.element('.breadcrumb-box').css('display','block');
        }

        function bodyScrollHide() {
            disableScroll();
            if ($(window).width() <= 1024) {
                enableScroll();
            }
        }

        function bodyScrollAuto() {
            enableScroll();
            if ($(window).width() <= 1024) {
                enableScroll();
            }
        }

        vm.megaMenuTab = function() {
            if ($(window).height() <= 602) {
                $('body').css({ 'position': 'initial' });
                //$('#DashboardDown .base-footer, .main-container').toggleClass('hideContainer');
            }
            $('body').toggleClass('megaMenuTabScroll');
            vm.hideOnClickTab = !vm.hideOnClickTab;
            $('.menu-hover-cont1:hover').toggleClass('menu-height');
        }

        vm.megaMenuTabSticky = function() {
            if ($(window).height() <= 602) {
                $('body').css({ 'position': 'initial' });
                $('#DashboardDown .base-footer, .main-container').toggleClass('hideContainer');
            }
            $('body').toggleClass('megaMenuTabScrollSticky');
            $('body').scrollTop(200);
            $('.base-header-non-sticky').toggleClass('headerHide');
            $('.base-header.sticky').toggleClass('megaMenuTabScrollStickyTop');
            vm.hideOnClickTabSticky = !vm.hideOnClickTabSticky;
        }
    }, 200);


    vm.nextL3 = function() {
        var posByValue = $('.menuScrollCont ul li').width();
        var jumpToposition = $('.menuScrollCont ul').scrollLeft();
        $('.menuScrollCont ul').scrollLeft(jumpToposition + (posByValue * 3) + 120);
        var ltRtArw = $('.menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');
        $('.menuScrollCont-arrow p.menu-next').css('opacity', '1');
        $('.menuScrollCont-arrow p.menu-prev').css('opacity', '1');
        if (ltRtArw.hasClass('Left')) {
            $('.menuScrollCont-arrow p.menu-next').css('opacity', '0');
        } else if (ltRtArw.hasClass('Right')) {
            $('.menuScrollCont-arrow p.menu-next').css('opacity', '1');
        }
    }
    vm.prevL3 = function() {
        var posByValue = $('.menuScrollCont ul li').width();
        var jumpToposition = $('.menuScrollCont ul').scrollLeft();
        $('.menuScrollCont ul').scrollLeft(jumpToposition - (posByValue * 3) - 120);
        $('.menuScrollCont-arrow p.menu-next').css('opacity', '1');
        $('.menuScrollCont-arrow p.menu-prev').css('opacity', '1');
        var ltRtArw = $('.menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');
        if (jumpToposition == 0) {
            $('.menuScrollCont-arrow p.menu-prev').css('opacity', '0');
        } else {
            $('.menuScrollCont-arrow p.menu-prev').css('opacity', '1');
        }
    }

    vm.nextL3Sticky = function() {
        var posByValue1 = $('.sticky .menuScrollCont ul li').width();
        var jumpToposition = $('.sticky .menuScrollCont ul').scrollLeft();
        $('.sticky .menuScrollCont ul').scrollLeft(jumpToposition + (posByValue1 * 3) + 120);
        var ltRtArw = $('.sticky .menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');
        $('.sticky .menuScrollCont-arrow p.menu-next').css('opacity', '1');
        $('.sticky .menuScrollCont-arrow p.menu-prev').css('opacity', '1');
        if (ltRtArw.hasClass('Left2')) {
            $('.sticky .menuScrollCont-arrow p.menu-next').css('opacity', '0');
        } else if (ltRtArw.hasClass('Right2')) {
            $('.sticky .menuScrollCont-arrow p.menu-next').css('opacity', '1');
        }
    }
    vm.prevL3Sticky = function() {
        var posByValue1 = $('.sticky .menuScrollCont ul li').width();
        var jumpToposition = $('.sticky .menuScrollCont ul').scrollLeft();
        $('.sticky .menuScrollCont ul').scrollLeft(jumpToposition - (posByValue1 * 3) - 120);
        $('.sticky .menuScrollCont-arrow p.menu-next').css('opacity', '1');
        $('.sticky .menuScrollCont-arrow p.menu-prev').css('opacity', '1');
        var ltRtArw = $('.sticky .menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');
        if (jumpToposition == 0) {
            $('.sticky .menuScrollCont-arrow p.menu-prev').css('opacity', '0');
        } else {
            $('.sticky .menuScrollCont-arrow p.menu-prev').css('opacity', '1');
        }
    }

    vm.nextL3Tab = function() {
        var posByValue2 = $('.menuLiContTab .menuScrollCont ul li').width();
        var jumpToposition2 = $('.menuLiContTab .menuScrollCont ul').scrollLeft();
        $('.menuLiContTab .menuScrollCont ul').scrollLeft(jumpToposition2 + (posByValue2 * 3) + 120);
        var ltRtArw = $('.menuLiContTab .menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');
        $('.menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity', '1');
        $('.menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity', '1');
        if (ltRtArw.hasClass('Left3')) {
            $('.menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity', '0');
        } else if (ltRtArw.hasClass('Right3')) {
            $('.menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity', '1');
        }
    }
    vm.prevL3Tab = function() {
        var posByValue2 = $('.menuLiContTab .menuScrollCont ul li').width();
        var jumpToposition2 = $('.menuLiContTab .menuScrollCont ul').scrollLeft();
        $('.menuLiContTab .menuScrollCont ul').scrollLeft(jumpToposition2 - (posByValue2 * 3) - 120);
        $('.menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity', '1');
        $('.menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity', '1');
        var ltRtArw = $('.menuLiContTab .menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');
        if (jumpToposition2 == 0) {
            $('.menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity', '0');
        } else {
            $('.menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity', '1');
        }
    }

    vm.nextL3StickyTab = function() {
        var posByValue3 = $('.sticky .menuLiContTab .menuScrollCont ul li').width();
        var jumpToposition3 = $('.sticky .menuLiContTab .menuScrollCont ul').scrollLeft();
        $('.sticky .menuLiContTab .menuScrollCont ul').scrollLeft(jumpToposition3 + (posByValue3 * 3) + 120);
        var ltRtArw = $('.sticky .menuLiContTab .menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');
        $('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity', '1');
        $('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity', '1');
        if (ltRtArw.hasClass('Left4')) {
            $('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity', '0');
        } else if (ltRtArw.hasClass('Right4')) {
            $('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity', '1');
        }
    }
    vm.prevL3StickyTab = function() {
        var posByValue3 = $('.sticky .menuLiContTab .menuScrollCont ul li').width();
        var jumpToposition3 = $('.sticky .menuLiContTab .menuScrollCont ul').scrollLeft();
        $('.sticky .menuLiContTab .menuScrollCont ul').scrollLeft(jumpToposition3 - (posByValue3 * 3) - 120);
        $('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-next').css('opacity', '1');
        $('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity', '1');
        var ltRtArw = $('.sticky .menuLiContTab .menu-container li.sub-nav:hover .subcat.menu-l2-container li.submaincat_link_div:nth-last-child(4)');
        if (jumpToposition3 == 0) {
            $('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity', '0');
        } else {
            $('.sticky .menuLiContTab .menuScrollCont-arrow p.menu-prev').css('opacity', '1');
        }
    }

    /*setTimeout(function () {
    $('.classForMenuArrow').hover(function(){
      if($('.menu-hover-cont3-inner').height() > 350){
        $('.menuScrollCont-arrow').css('border','1px solid red')
      }
    })
  }, 200);
*/
    if ($(window).width() <= 1110) {
        setTimeout(function() {
            var serviceWidth = $('.service-list').width();
            $(".scrollServiceLeft").click(function() {
                $(".service-list div").scrollLeft(0);
            });
            $(".scrollServiceRight").click(function() {
                $(".service-list div").scrollLeft(serviceWidth);
            });
        }, 200);
    }

    if ($(window).width() <= 1024) {
        setTimeout(function() {
            var infoHeaderWidth = $('.header-info-bar-position').width();
            var infoHeaderSearchWidth = $('#info-bar-search').width();
            var infoHeaderWidthSub = $('#info-bar-cart').width() + $('#info-bar-acc').width() + 1;
            $("#info-bar-search").hover(hideOtherLink, showOtherLink);

            function hideOtherLink() {
                $(this).css({ 'width': infoHeaderWidth - infoHeaderWidthSub });
                $('.info-search-text').css('width', infoHeaderWidth - infoHeaderWidthSub - infoHeaderSearchWidth);
                $('.info-bar-care, .info-bar-events').css({ 'display': 'none' });
                $('.info-bar-search:after').css('border', 'none');
            }

            function showOtherLink() {
                $(this).css('width', infoHeaderSearchWidth);
                setTimeout(function() {
                    $('.info-bar-care, .info-bar-events').css('display', 'block');
                }, 500)
            }

            /* $("#info-bar-acc, #info-bar-cart").hover(hideOtherLink2, showOtherLink2);

             function hideOtherLink2() {
               $('.info-bar-care, .info-bar-events').css({'display': 'none'});

             }
             function showOtherLink2() {
               $('.info-bar-care, .info-bar-events').css('display', 'block');
             }*/


        }, 200);
    }
    if ($(window).width() > 1024) {
        setTimeout(function() {

            $(".info-bar-search").hover(expandSearchWidth, collapseSearchWidth);

            function expandSearchWidth() {
                var ww = $('.expandAccBlockLoggedIn').width() - 90;
                if ($cookieStore.get('isLoggedIn')) {
                    $('.info-bar-acc').addClass('donotXpandAcc');
                    var expSearchWidthValue = $('.header-info-bar-position').width() - $('.header-info-bar').width();
                    $(this).css('width', expSearchWidthValue + 80 + ww);
                } else {
                    var expSearchWidthValue = $('.header-info-bar-position').width() - $('.header-info-bar').width();
                    $(this).css('width', expSearchWidthValue + 80);
                }
            }

            /*if($('.algolia-search-input').hasClass('red')){
          var expVal = $('.header-info-bar').width();
          $('.info-bar-search').css('width', expVal + 80 );
          alert(expVal);
        }
*/
            function collapseSearchWidth() {
                if ($cookieStore.get('isLoggedIn')) {
                    $('.info-bar-acc').removeClass('donotXpandAcc');
                }
                $(this).css('width', '90px');
            }

            $(".info-bar-cart").hover(expandSearchWidth, collapseSearchWidth);


        }, 200);
    }

    /*if($(window).width() > 1024){
        setTimeout(function(){
            $('#info-bar-search .info-search-text input').focus(function(){
                $('.info-bar-search').addClass('info-bar-search-expand');
            });
            $('#info-bar-search .info-search-text input').focusout(function(){
                $('.info-bar-search').removeClass('info-bar-search-expand');
            });
        },200)
    }*/

    vm.menuClass = "unhide";

    vm.initialSetup = function() {

        vm.menu1 = false;
        vm.menu2 = false;
        vm.menu3 = false;

        $('.main-mobile-menu-container').toggleClass('show-hide');
        $('.main-mobile-menu-container').css({ 'overflow-y': 'auto' });
        $('.mobile-dropdown-cont2').css('overflow-y', 'hidden');
        $('.mobile-dropdown-cont3').css('overflow-y', 'hidden');
        $('.mobile-dropdown-cont4').css('overflow-y', 'hidden');

        // $('.base-header-mobile').toggleClass('removeSticky');
        // $('body').toggleClass('hideBodyScroll');

        var windowHeight = $(window).height();
        var mobHeaderHt = $('.base-header.base-header-mobile').height();
        //alert(windowHeight);
        $('.main-mobile-menu-container.dropdown-menu').css('height', windowHeight - mobHeaderHt);
        $('.mobile-dropdown-cont2').css({ 'height': windowHeight - mobHeaderHt });
        $('.mobile-dropdown-cont3').css('height', windowHeight - mobHeaderHt);
        $('.mobile-dropdown-cont4').css('height', windowHeight - mobHeaderHt);

        // var menuheight = $('.main-mobile-menu-container').innerHeight();
        // $('#DashboardContent').height(menuheight);

        if (vm.menuClass = "unhide") {
            vm.menuClass = "hide";
        } else {
            vm.menuClass = "unhide";
        }

        if ($('.menu-class').hasClass('unhide')) {
            $('.menu-class').addClass('hide');
            $('.menu-class').removeClass('unhide');
            $('.main-mobile-menu-container').addClass('unhide');
        } else {
            $('.menu-class').addClass('unhide')
            $('.menu-class').removeClass('hide');
            $('.main-mobile-menu-container').addClass('hide');

        }

        $rootScope.showBreadCrumb = false;

    }

    vm.initialSetup2 = function() {

        vm.menu1 = false;
        vm.menu2 = false;
        vm.menu3 = false;
        $('.main-mobile-menu-container').css('overflow-y', 'auto');
        $('.mobile-dropdown-cont2').css('overflow-y', 'hidden');
        $('.mobile-dropdown-cont3').css('overflow-y', 'hidden');
        $('.mobile-dropdown-cont4').css('overflow-y', 'hidden');

    }
    vm.openMenuLevel1 = function() {
            vm.menu1 = true;
            vm.menu2 = false;
            vm.menu3 = false;

            $('.main-mobile-menu-container').css('overflow-y', 'hidden');
            $('.mobile-dropdown-cont2').css('overflow-y', 'auto');
            $('.mobile-dropdown-cont3').css('overflow-y', 'hidden');
            $('.mobile-dropdown-cont4').css('overflow-y', 'hidden');



            //ev.stopPropagation();
        }
        /*vm.openMenuLevel2 = function(){
            $timeout(function(){
                vm.menu1= true;
                vm.menu2= true;
                vm.menu3= false;
            },200);
            //ev.stopPropagation();
        }
        vm.openMenuLevel3 = function(){
            $timeout(function(){
                vm.menu1= true;
                vm.menu2= true;
                vm.menu3= true;
            },200);
            //ev.stopPropagation();
        }*/
    vm.openMenuLevel2 = function(obj) {

        $('.main-mobile-menu-container').css({ 'overflow-y': 'hidden' });
        $('.mobile-dropdown-cont2').css('overflow-y', 'hidden');
        $('.mobile-dropdown-cont3').css('overflow-y', 'auto');
        $('.mobile-dropdown-cont4').css('overflow-y', 'hidden');

        if (obj.childCount > 0) {
            vm.menu1 = true;
            vm.menu2 = true;
            vm.menu3 = false;
        } else {
            if (obj.ID == "c11") {

                vm.menu1 = true;
                vm.menu2 = true;
                vm.menu3 = false;
            } else {
                $state.go('category', { childCount: obj.childCount, ID: obj.ID });
            }
        }
        vm.giftCardPlp = function() {
                $state.go('category', { childCount: obj.childCount, ID: 'c11' });
            }
            //ev.stopPropagation();
    }
    vm.openMenuLevel3 = function(obj, index) {
        $('.main-mobile-menu-container').css({ 'overflow-y': 'hidden' });
        $('.mobile-dropdown-cont2').css('overflow-y', 'hidden');
        $('.mobile-dropdown-cont3').css('overflow-y', 'hidden');
        $('.mobile-dropdown-cont3').scrollTop(0);
        $('.mobile-dropdown-cont4').css('overflow-y', 'auto');
        vm.SubIndex = index;
        if (obj.childCount > 0) {
            vm.menu1 = true;
            vm.menu2 = true;
            vm.menu3 = true;
        } else {

            $state.go('category', { childCount: obj.childCount, ID: obj.ID });

        }
        //ev.stopPropagation();
    }

    vm.logoClick = function($event) {
        /*  if($scope.menuClass == "unhide"){
            alert(10);
        $scope.menuClass = "unhide";
    }*/
        // vm.initialSetup();
        vm.menu1 = false;
        vm.menu2 = false;
        vm.menu3 = false;
        //if($scope.menuClass == "unhide"){
        $scope.menuClass = "unhide";
        vm.menuClass = "unhide";
        //}
        vm.isopen = false;
        $state.go('home');
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
                768: {
                    /*stagePadding:30,*/
                    margin: 20
                }
            }
        });
        $('.main-mobile-menu-container').removeClass('show-hide');
    }
    $rootScope.$on('$stateChangeSuccess', function(e, toState) {
        $scope.menuClass = "unhide";
        vm.menuClass = "unhide";
        vm.hideOnClick = false;

        $window.scrollTo(0, 0);
        vm.isopen = false;

        $('body').css('overflow-y', 'auto');

        vm.hideOnClickTab = false;
        vm.hideOnClickTabSticky = false;

        $('body').removeClass('megaMenuTabScroll');
        $('body').removeClass('megaMenuTabScrollSticky');
        //$('body').removeClass('hideBodyScroll');

        if ($('.main-mobile-menu-container').hasClass('show-hide')) {
            $('.main-mobile-menu-container').removeClass('show-hide');
        }

        angular.element(".zoomContainer").remove();

    });
    $rootScope.$on('$stateChangeStart', function(e, toState) {
        //$('body').removeClass('hideBodyScroll');
    });

    vm.isShowing = function(index) {
        return vm.SubIndex === index;
    }

    /*vm.stateChange = function (obj) {
      $state.go('category', {
        childCount: obj.childCount,
        ID: obj.ID
      });
    }*/
    vm.stateChange = function(obj) {
        console.log("qwerty", obj);
        if (obj.children > 0) {
            $state.go('category', {
                childCount: obj.childCount,
                ID: obj.ID
            });
        } else {
            $state.go('plp', {
                catId: obj.ID
            });
        }
    }

    vm.mobileMenu = function(data) {

        vm.url = "#/home";
    }
    vm.removeHomeSroll = function() {
        //$('body').removeClass('hideBodyScroll');
        //vm.isopen = false;
    }

    /*BaseService.AdminLogin().then(function(res){
         console.log("token==",res);

          Auth.SetToken(res.access_token);*/
    // if(AdminLogin) {
    var megamenuImgs = [];
    /*  CategoryService.GetCategoryImages(ticket).then(function (res) {

          angular.forEach(Underscore.where(res.items, {title: 'megamenu'}), function (node) {
              node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
              megamenuImgs.push(node);
          });
          console.log("megamenuImgs==", megamenuImgs);
      });*/
    BaseService.GetCategoryTree().then(function(data) {

        angular.forEach(Underscore.where(categoryImages, { title: 'megamenu' }), function(node) {
            node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
            megamenuImgs.push(node);
        });
        //  console.log("megamenuImgs==", megamenuImgs);
        angular.forEach(megamenuImgs, function(image) {
            angular.forEach(data, function(cat) {
                var lool = image.displayName.indexOf(cat.ID) > -1
                if (lool) {
                    cat["imgcontent"] = image;
                }
            });
        })
        vm.tree = data;
        //  $rootScope.cattree = data;
        $rootScope.cattree = BaseService.FlattenCategoryArray(data, 'topDown')
    });
    //$state.go($state.current.name);
    // }
    //});

    if (ticket) {
        // var ticket = localStorage.getItem("alf_ticket");
        LoginFact.GetLogo(ticket).then(function(data) {
            if ($cookieStore.get('isLoggedIn')) {
                vm.currentUser = CurrentUser;
                angular.element('#info-bar-acc, .sticky #info-bar-acc').addClass('expandAccBlockLoggedIn');
                angular.element('.mobile-signout-guest').css('display', 'none');
                angular.element('.mobile-signout-notGuest').css('display', 'block');
            }
            //        console.log(data);
            var logo = alfcontenturl + data.items[1].contentUrl + "?alf_ticket=" + ticket;
            vm.logo = $sce.trustAsResourceUrl(logo);
            var headerlinks = alfcontenturl + data.items[0].contentUrl + "?alf_ticket=" + ticket;
            $http({
                method: 'GET',
                dataType: "json",
                url: headerlinks,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(function(data, status, headers, config) {
                //            console.log("headerlinks==", data);
                vm.delivery = data[2];
                vm.contactdetails = data[1].contactdetails;
                vm.storeloc = data[0].staticlinks[0];
                vm.contact = data[0].staticlinks[1];
                vm.information = data[0].staticlinks[2];
                vm.workshop = data[0].staticlinks[3];
            }).error(function(data, status, headers, config) {
                //            console.log(data);
            });
        });
        LoginFact.GetServices(ticket, siteEditorHome.Services).then(function(data) {
            //        console.log("GetServices==",data.items);
            var services_mobile = [];
            var services = [];
            /*for(var i=0;i<data.items.length;i++){
                data.items[i].contentUrl  = alfcontenturl+data.items[i].contentUrl+"?alf_ticket="+ticket;

            }*/
            angular.forEach(Underscore.where(data.items), function(node) {

                if (node.title === 'mobile') {

                    services_mobile.push(alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket);
                } else {
                    node.contentUrl = alfcontenturl + node.contentUrl + "?alf_ticket=" + ticket;
                    services.push(node);
                }
            });
            vm.services = services;
            vm.services_mobile = services_mobile;

        });
        LoginFact.GetContactInfo(ticket, siteEditorHome.Contactbar).then(function(res) {
            vm.contactImgs = [];
            vm.contacttitle = [];
            vm.description = [];
            angular.forEach(res.items, function(item) {
                var quicklink = $sce.trustAsResourceUrl(alfcontenturl + item.contentUrl + "?alf_ticket=" + ticket);
                //  var title  = $sce.trustAsHtml(item.title);
                vm.contactImgs.push(quicklink);
                vm.contacttitle.push(item.title);
                vm.description.push(item.description);
            })
        });
        LoginFact.GetBrandSpot(ticket).then(function(data) {
            vm.brandSpot = alfcontenturl + data.items[1].contentUrl + "?alf_ticket=" + ticket;
            vm.history = $sce.trustAsHtml(data.items[1].description);
            var footerlinks = alfcontenturl + data.items[0].contentUrl + "?alf_ticket=" + ticket;
            $http({
                method: 'GET',
                dataType: "json",
                url: footerlinks,
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(function(data, status, headers, config) {
                vm.footerlinks = data;

            }).error(function(data, status, headers, config) {
                console.log(data);
            });
        });
        /* LoginFact.GetStaticTemp(ticket).then(function(res){
           console.log("static temp", res);
             vm.staticTempleft = $sce.trustAsResourceUrl(alfcontenturl+res.items[0].contentUrl+"?alf_ticket="+ticket);
             //vm.staticTempright = $sce.trustAsResourceUrl(alfcontenturl+res.items[2].contentUrl+"?alf_ticket="+ticket);
           })*/
        LoginFact.GetFolders(ticket).then(function(res) {
            //console.log("static temp GetFolders", res);
            var ajaxarr = [];
            var deferred = $q.defer();
            angular.forEach(res.items, function(item) {
                var d = $q.defer();
                ajaxarr.push(LoginFact.GetSubFolders(ticket, item.fileName).then(function(response) {
                    // console.log("static temp GetSubFolders", response);
                    item["subfolders"] = response.items;
                    angular.forEach(response.items, function(subitem, i) {
                        LoginFact.GetSubSubFolders(ticket, item.fileName, subitem.fileName).then(function(responseSub) {
                            //     console.log("static temp GetSubSubFolders", response);
                            item["subfolders"][i]["subfolders"] = responseSub
                        });
                    });
                    deferred.resolve(item);
                    d.resolve();
                    //deferred.resolve(item);
                    //d.resolve();

                    return item;
                }))
            })

            // angular.forEach(list.Items, function (item) {
            //              var promise = Categories.Get(item.CategoryID);
            //              ajaxarr.push(promise);
            //          });
            //          $q.all(ajaxarr).then(function (items) {
            //              console.log("_categoryDeatil==", items);
            //              deferred.resolve(items);

            //          });

            $q.all(ajaxarr).then(function(all) {
                vm.ListOfPages = all;
            });

        });

        //     LoginFact.GetFolders(ticket).then(function(res){
        //     console.log("static temp GetFolders", res);
        //     var ajaxarr = [];
        //     var deferred = $q.defer();
        //     angular.forEach(res.items,function(item){
        //       var d = $q.defer();
        //       ajaxarr.push(LoginFact.GetSubFolders(ticket, item.fileName).then(function(response){
        //         console.log("static temp GetSubFolders", response);
        //         item["subfolders"]=response
        //         deferred.resolve(item);
        //         d.resolve();
        //         return item;
        //       }))
        //     })
        //
        //     // angular.forEach(list.Items, function (item) {
        //  //              var promise = Categories.Get(item.CategoryID);
        //  //              ajaxarr.push(promise);
        //  //          });
        //  //          $q.all(ajaxarr).then(function (items) {
        //  //              console.log("_categoryDeatil==", items);
        //  //              deferred.resolve(items);
        //
        //  //          });
        //
        //     $q.all(ajaxarr).then(function(all){
        //       vm.ListOfPages = all;
        //
        //     });
        //
        //   });

        LoginFact.GetPerplePerksSvg(ticket).then(function(res) {

            var quicklinkPP = alfcontenturl + res.items[3].contentUrl + "?alf_ticket=" + ticket;
            vm.quicklinkPP = $sce.trustAsResourceUrl(quicklinkPP);

            var quicklinkPPHover = alfcontenturl + res.items[4].contentUrl + "?alf_ticket=" + ticket;
            vm.quicklinkPPHover = $sce.trustAsResourceUrl(quicklinkPPHover);

        });
        LoginFact.GetArun().then(function(res) {
            console.log('arun', res)

        });

    }
    /*floating header*/

    /*   $scope.navClass = 'sticky';
       $scope.constantheader = 'nohide';
       angular.element($window).bind(
        "scroll", function() {
             if(window.pageYOffset > 0) {
               $scope.navClass = 'sticky';
             } else {
               $scope.navClass = 'nosticky';
             }
             $scope.$apply();
       });*/
    (function($) {

        $.belowthefold = function(lookIn, elements, settings) {
            var fold = $(lookIn).height() + $(lookIn).scrollTop();
            //console.log(elements);
            return $(elements).filter(function() {
                return fold <= $(this).offset().top - settings.threshold;
            });
        };

        $.abovethetop = function(lookIn, elements, settings) {
            var top = $(lookIn).scrollTop();
            return $(elements).filter(function() {
                return top >= $(this).offset().top + $(this).height() - settings.threshold;
            });
        };

        $.rightofscreen = function(lookIn, elements, settings) {
            var fold = $(lookIn).width() + $(lookIn).scrollLeft();
            return $(elements).filter(function() {
                return fold <= $(this).offset().left - settings.threshold;
            });
        };

        $.leftofscreen = function(lookIn, elements, settings) {
            var left = $(lookIn).scrollLeft();
            return $(elements).filter(function() {
                return left >= $(this).offset().left + $(this).width() - settings.threshold;
            });

        };

    })(jQuery);

    // Call it
    $.belowthefold("#lookInMe", ".peek", { threshold: 0 }).addClass("Below");
    $.abovethetop("#lookInMe", ".peek", { threshold: 0 }).addClass("Above");
    $.leftofscreen("#lookInMe", ".peek", { threshold: 0 }).addClass("Left");
    $.rightofscreen("#lookInMe", ".peek", { threshold: 0 }).addClass("Right");

    $.leftofscreen("#lookInMe2", ".peek2", { threshold: 0 }).addClass("Left2");
    $.rightofscreen("#lookInMe2", ".peek2", { threshold: 0 }).addClass("Right2");

    $.leftofscreen("#lookInMe3", ".peek3", { threshold: 0 }).addClass("Left3");
    $.rightofscreen("#lookInMe3", ".peek3", { threshold: 0 }).addClass("Right3");

    $.leftofscreen("#lookInMe4", ".peek4", { threshold: 0 }).addClass("Left4");
    $.rightofscreen("#lookInMe4", ".peek4", { threshold: 0 }).addClass("Right4");

    vm.hideShowMenuArrow = function() {
        setTimeout(function() {
            var contToHideShow = $('.menu-hover-cont3-inner');
            $('.menu-hover-cont2.menu-container').addClass('thisIsHovered');
            if (contToHideShow.scrollWidth > contToHideShow.offsetWidth) {
                $('.menuScrollCont-arrow').css('display', 'block');
            } else {
                $('.menuScrollCont-arrow').css('display', 'none');
            }
        }, 200)
    }

    vm.thisHoveredOut = function() {
        setTimeout(function() {
            $('.menu-hover-cont2.menu-container').removeClass('thisIsHovered');
        }, 200)
    }

    function _getBrowserName() {
        var browserClass = "";
        if ((navigator.userAgent.indexOf("Opera") || navigator.userAgent.indexOf('OPR')) != -1) {
            browserClass = "opera";
        } else if (!( /*@cc_on!@*/ false || !!document.documentMode) && (!!window.StyleMedia)) {
            browserClass = "edge";
        } else if (navigator.userAgent.indexOf("Chrome") != -1) {
            browserClass = "chrome";
        } else if (navigator.userAgent.indexOf("Safari") != -1) {
            browserClass = "safari";
        } else if (navigator.userAgent.indexOf("Firefox") != -1) {
            browserClass = "firefox";
        } else if ((navigator.userAgent.indexOf("MSIE") != -1) || (!!document.documentMode == true)) //IF IE > 10
        {
            browserClass = "ie";
        }
        if (browserClass)
            angular.element('body').addClass(browserClass);
    }
    _getBrowserName();
}


function BaseTopController(LoginFact, $cookieStore, BaseService, $uibModal, $rootScope, LoginService, $state, OrderCloud, alfcontenturl) {
    var vm = this;

    /* BaseService.GetCategoryTree().then(function(data){

         console.log("tree ==",data);
         vm.tree = data;
     });*/
    // console.log(Tree);

    vm.searchPopup = function() {
        vm.searchMobCont = true;
        $('body').css({ 'position': 'fixed', 'width': '100%' });

        var windowHeightSearch = $(window).height();
        var mobHeaderHtSearch = $('.base-header.base-header-mobile').height();

        $('.searchPopupCont').css('height', windowHeightSearch - mobHeaderHtSearch);
    }
    vm.searchPopupClose = function() {
            vm.searchMobCont = false;
            $('body').css({ 'position': 'initial', 'width': '100%' });
        }
        /*vm.searchPopup = function() {
            console.log('mobileHeaderHt' + mobileHeaderHt);
            var modalInstance = $uibModal.open({
                animation: true,
                backdropClass: 'searchPopupCont',
                template: '<div class="search_cont">'+
                            '<div class="search_cont_header">'+
                                '<div class="input-search">'+
                                    '<input type="text" placeholder="SEARCH" />'+
                                '</div>'+
                                '<div class="close-search" ng-click="cancel()">'+
                                    '<a>'+
                                        '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"'+
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
                                        '</svg>'+
                                    '</a>'+
                                '</div>'+
                            '</div>'+
                        '</div>',
                controller:'LoginCtrl',
                controllerAs: 'login',
                size: 'sm'
            });


            modalInstance.result.then(function() {

            }, function() {
                angular.noop();
            });
        }*/
        /* if(!$cookieStore.get('isLoggedIn')){
           // signout
           vm.signIn_Out = 'SIGN UP / LOGIN';
           vm.loggedOut = false;
           angular.element('.mobile-signout').removeClass('mobile-signout-notGuest');
           angular.element('.mobile-signout').addClass('mobile-signout-guest');

         }
         else{
           // signin
           vm.signIn_Out = 'SIGN OUT';
           vm.loggedOut = true;
           angular.element('.mobile-signout').removeClass('mobile-signout-guest');
           angular.element('.mobile-signout').addClass('mobile-signout-notGuest');
         }*/
    vm.login = function() {
        if (!$cookieStore.get('isLoggedIn')) {

            var modalInstance = $uibModal.open({
                animation: false,
                backdropClass: 'loginModalBg',
                windowClass: 'loginModalBg',
                templateUrl: 'login/templates/login.modal.tpl.html',
                controller: 'LoginCtrl',
                controllerAs: 'login',
                resolve: {
                    emailSubscribeList: function(ConstantContact) {
                        return ConstantContact.GetListOfSubscriptions();
                    },
                    CurrentUser: function($q, $state, OrderCloud) {
                        var dfd = $q.defer();
                        OrderCloud.Me.Get()
                            .then(function(data) {
                                dfd.resolve(data);
                            })
                            .catch(function() {
                                OrderCloud.Auth.RemoveToken();
                                OrderCloud.Auth.RemoveImpersonationToken();
                                // OrderCloud.BuyerID.Set(null);
                                $state.go('home');
                                dfd.resolve();
                            });
                        return dfd.promise;
                    }
                }
            });

            modalInstance.result.then(function() {

            }, function() {
                angular.noop();
            });
        } else {
            $state.go('account.profile');
        }
    }
    vm.logout = function() {
        $cookieStore.remove('isLoggedIn');

        angular.element('#info-bar-acc, .sticky #info-bar-acc').removeClass('expandAccBlockLoggedIn');
        angular.element('.mobile-signout-guest').css('display', 'block');
        angular.element('.mobile-signout-notGuest').css('display', 'none');
        angular.element('.main-mobile-menu-container').toggleClass('show-hide');
        OrderCloud.Auth.RemoveToken();
        OrderCloud.Auth.RemoveImpersonationToken();
        OrderCloud.Auth.SetToken($cookieStore.get('anonToken'));
        $state.go('home');
        vm.showuserdetail = false;
        if ($('.main-mobile-menu-container').hasClass('show-hide')) {
            $('.main-mobile-menu-container').removeClass('show-hide');
        } else {
            $('.main-mobile-menu-container').addClass('show-hide');
        }
    };

}

function BaseDownController(LoginFact, BaseService, $sce, alfcontenturl, $http) {
    var vm = this;
    /*BaseService.GetCategoryTree().then(function(data){

        console.log("tree ==",data);
        vm.tree = data;
    });*/
    /*   var ticket = localStorage.getItem("alf_ticket");
        LoginFact.GetBrandSpot(ticket).then(function(data){
        vm.brandSpot = alfcontenturl+data.items[1].contentUrl+"?alf_ticket="+ticket;
        vm.history = $sce.trustAsHtml(data.items[1].description);
        var footerlinks = alfcontenturl+data.items[0].contentUrl+"?alf_ticket="+ticket;
         $http({
            method: 'GET',
            dataType:"json",
            url: footerlinks,
            headers: {
                'Content-Type': 'application/json'
            }
        }).success(function (data, status, headers, config) {
            vm.footerlinks = data;

        }).error(function (data, status, headers, config) {
            console.log(data);
        });
});*/

}

function LoginFact($http, $q, alfrescourl, alflogin, alfStaticlogin, alfrescofoldersurl, alfrescoStaticurl) {
    var service = {
        Get: _get,
        GetLogo: _getLogo,
        GetBrandSpot: _getBrandSpot,
        GetServices: _getServices,
        GetContactInfo: _getContactInfo,
        GetStaticTemp: _getStaticTemp,
        GetFolders: _getFolders,
        GetSubFolders: _getSubFolders,
        GetSubSubFolders: _getSubSubFolders,
        GetArtcleList: _getArtcleList,
        GetPerplePerksSvg: _getPerplePerksSvg,
        GetContactList: _getcontactlist,
        CreateContactList: _createcontactlist,
        UpdateEmailPreference: _updateemailpreference,
        GetArun: _getArun
    };
    return service;

    function _getcontactlist() {
        var defferred = $q.defer();
        $http({
            method: 'GET',
            dataType: "json",
            url: 'https://four51trial104401.jitterbit.net/Bachmans_Dev/getContactList',
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

    function _getArun() {
        var data = {
            "card_number": "7777001112223333"
        };
        var defferred = $q.defer();

        $http({

            method: 'POST',
            dataType: "json",
            url: "https://Four51TRIAL104401.jitterbit.net/BachmansOnPrem/PurplePerksBalanceCheck",
            //  url: "http://192.168.100.184:8080/alfresco/service/api/login",
            //  url: "http://103.227.151.31:8080/alfresco/service/api/login",

            data: JSON.stringify(data),
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

    function _get() {
        var data = {

            username: "admin",
            password: "Bachmans"
        };
        var defferred = $q.defer();

        $http({

            method: 'POST',
            dataType: "json",
            url: alflogin,
            //  url: "http://192.168.100.184:8080/alfresco/service/api/login",
            //  url: "http://103.227.151.31:8080/alfresco/service/api/login",

            data: JSON.stringify(data),
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

    function _getLogo(ticket) {

        var defferred = $q.defer();

        $http({

            method: 'GET',
            dataType: "json",
            url: alfrescourl + "Header/Logo?alf_ticket=" + ticket,

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

    function _getBrandSpot(ticket) {

        var defferred = $q.defer();

        $http({

            method: 'GET',
            dataType: "json",
            url: alfrescourl + "Footer/BrandSpot?alf_ticket=" + ticket,
            //  url: alfrescourl+"HomePage/Quicklinks?alf_ticket="+ticket,

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
    // ending of getcontactlist service
    function _createcontactlist(userData) {
        var defferred = $q.defer();
        $http({
            method: 'POST',
            dataType: "json",
            data: JSON.stringify(userData),
            url: 'https://four51trial104401.jitterbit.net/Bachmans_Dev/createConstantContact',
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
    //Starting CreateList functionality

    //Ending CreateList Functionality
    //Starting updateemailpreference
    function _updateemailpreference(u_data) {
        var defferred = $q.defer();
        $http({
            method: 'PUT',
            dataType: "json",
            data: JSON.stringify(u_data),
            url: 'https://four51trial104401.jitterbit.net/Bachmans_Dev/updateContact',
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
    //End of updateemailpreference


    function _getServices(ticket, root) {

        var defferred = $q.defer();

        $http({

            method: 'GET',
            dataType: "json",
            url: alfrescourl + "HomePage/Services/" + root + "?alf_ticket=" + ticket,
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

    function _getContactInfo(ticket, root) {
        var defferred = $q.defer();
        $http({
            method: 'GET',
            dataType: "json",
            url: alfrescourl + "HomePage/Contactbar/" + root + "?alf_ticket=" + ticket,
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

    function _getStaticTemp(ticket) {
        var defferred = $q.defer();
        $http({
            method: 'GET',
            dataType: "json",
            url: alfrescourl + "StaticTemplate/leftPanel?alf_ticket=" + ticket,
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

    function _getPerplePerksSvg(ticket) {
        var defferred = $q.defer();
        $http({
            method: 'GET',
            dataType: "json",
            url: alfrescourl + "CategoryPage/QuickLinks?alf_ticket=" + ticket,
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


    function _getFolders(ticket) {
        var defferred = $q.defer();
        $http({
            method: 'GET',
            dataType: "json",
            //url: alfrescofoldersurl+"StaticTemplate/StaticPageCategories?alf_ticket="+ticket,
            url: alfrescoStaticurl + "Bachmans Quick Start/Bachmans Editorial/root?alf_ticket=" + localStorage.getItem('alfTemp_ticket'),
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

    function _getSubFolders(ticket, subfolder) {
        var defferred = $q.defer();
        $http({
            method: 'GET',
            dataType: "json",
            url: alfrescoStaticurl + "Bachmans Quick Start/Bachmans Editorial/root/" + subfolder + "?alf_ticket=" + localStorage.getItem('alfTemp_ticket'),
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

    function _getSubSubFolders(ticket, parentfolder, subfolder) {
        var defferred = $q.defer();
        $http({
            method: 'GET',
            dataType: "json",
            url: alfrescoStaticurl + "Bachmans Quick Start/Bachmans Editorial/root/" + parentfolder + "/" + subfolder + "?alf_ticket=" + localStorage.getItem('alfTemp_ticket'),
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

    function _getArtcleList(ticket, route) {
        var defferred = $q.defer();
        $http({
            method: 'GET',
            dataType: "json",
            //url: alfrescofoldersurl+"StaticTemplate/StaticPageCategories/"+route+"?alf_ticket="+ticket,
            url: alfrescoStaticurl + "Bachmans Quick Start/Bachmans Editorial/root/CareAdviceInformation/" + route + "?alf_ticket=" + localStorage.getItem('alfTemp_ticket'),
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


}

function windowHeightDirective($window) {
    return {
        restrict: 'A',
        link: function(scope, element) {
            scope.windowHeight = $window.innerHeight - 60;
            scope.windowHeightFull = $window.innerHeight;
        }
    };
}

function contTopPaddingDirective() {
    return {
        restrict: 'A',
        link: function(scope) {
            scope.pageTopPadding =
                angular.element('.base-header-desktop .base-header-inner').height() + 9;
            if (angular.element(window).width() <= 810) {
                scope.pageTopPadding = angular.element('.base-header-mobile .base-header-inner').height();
            }
            /*angular.element(window).scroll(function() {
              var headerHt = angular.element('.base-header-inner').height();
              if(angular.element(this).scrollTop() > headerHt){
                scope.pageTopPadding = (angular.element('.base-header-desktop .base-header-inner').height() - 10) +
                (angular.element('.base-header.sticky').height());
              }
              else{
                scope.pageTopPadding =
                angular.element('.base-header-desktop .base-header-inner').height() + 9;
              }
            });*/
        }
    };
}


function scrollDirective($window) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            angular.element($window).bind("scroll", function() {
                if (this.pageYOffset >= 100) {
                    scope.boolChangeClass = true;
                    console.log('Scrolled below header.');
                } else {
                    scope.boolChangeClass = false;
                    console.log('Header is in view.');
                }
                scope.$apply();
            });
        }
    };
}


function phoneValidationDirective($parse) {

    return {
        restrict: 'A',
        require: ['ngModel'],
        link: function(scope, element, attrs, ctrls) {
            var model = ctrls[0],
                form = ctrls[1];

            scope.next = function() {
                return model.$valid
            }

            scope.$watch(scope.next, function(newValue, oldValue) {
                if (newValue && model.$dirty) {
                    var nextinput = element.parent().next().find('input');
                    if (nextinput.length === 1) {
                        nextinput[0].focus();
                    }
                }
            })
        }
    }
}

function customEmailValidationDirective(defaultErrorMessageResolver) {
    defaultErrorMessageResolver.getErrorMessages().then(function(errorMessages) {
        errorMessages['customEmail'] = 'Please enter a valid email address';
    });

    return {
        restrict: 'A',
        require: 'ngModel',

        link: function(scope, element, attributes, ngModel) {
            ngModel.$validators.customEmail = function(modelValue) {
                var pattern = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;
                return pattern.test(modelValue);
            };

            scope.$watch('customEmail', function() {
                console.log('---');
                ngModel.$validate();
            });
        }
    };
}

function ConfirmPasswordValidatorDirective(defaultErrorMessageResolver) {
    defaultErrorMessageResolver.getErrorMessages().then(function(errorMessages) {
        errorMessages['confirmPassword'] = 'Password does not match';
    });

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            confirmPassword: '=confirmPassword'
        },
        link: function(scope, element, attributes, ngModel) {
            ngModel.$validators.confirmPassword = function(modelValue) {
                return modelValue === scope.confirmPassword;
            };

            scope.$watch('confirmPassword', function() {
                ngModel.$validate();
            });
        }
    };
}

function CategoriesAsPerSeasonFilter($filter) {
    return function(item, appCstTime) {
        var newArray = [];
        for (var i = 0; i < item.length; i++) {
            if (item[i].xp) {
                var startDate = item[i].xp.StartDate;
                var endDate = item[i].xp.EndDate;
                var startDate = $filter('date')(new Date(startDate), 'MM/dd');
                var endDate = $filter('date')(new Date(endDate), 'MM/dd');
                var cstTime = $filter('date')(new Date(appCstTime), 'MM/dd');
                //var cstTime = date+month;
                if ((startDate < cstTime) && (endDate > cstTime)) {
                    newArray.push(item[i]);
                }
            }
        }
        return newArray;
    }
}

function CapitalizeFilter() {
    return function(input) {
        if (input !== null) {
            return input.replace(/\w\S*/g, function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }
        return input;
    }
}
