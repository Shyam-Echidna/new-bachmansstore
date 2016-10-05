angular.module( 'orderCloud' )

    .config( LoginConfig )
    .factory( 'LoginService', LoginService )
    .controller( 'LoginCtrl', LoginController )

;   

function LoginConfig( $stateProvider ) {
    $stateProvider
        .state( 'login', {
            parent: 'base',
            url: '/login/:token',
            templateUrl:'login/templates/login.tpl.html',
            controller:'LoginCtrl',
            controllerAs: 'login'
        })
}

function LoginService( $q, $window,  clientid, OrderCloud) {
    return {
        SendVerificationCode: _sendVerificationCode,
        ResetPassword: _resetPassword,
        GetCurrentUser:_GetCurrentUser,
        GetSignUpUpdateSubscription:_getSignUpUpdateSubscription
    };

    function _sendVerificationCode(email) {
        var deferred = $q.defer();

        var passwordResetRequest = {
            Email: email,
            ClientID: clientid,
            URL: encodeURIComponent($window.location.href) + '{0}'
        };

        PasswordResets.SendVerificationCode(passwordResetRequest)
            .then(function() {
                deferred.resolve();
            })
            .catch(function(ex) {
                deferred.reject(ex);
            });

        return deferred.promise;
    }

    function _resetPassword(resetPasswordCredentials, verificationCode) {
        var deferred = $q.defer();

        var passwordReset = {
            ClientID: clientid,
            Username: resetPasswordCredentials.ResetUsername,
            Password: resetPasswordCredentials.NewPassword
        };

        PasswordResets.ResetPassword(verificationCode, passwordReset).
            then(function() {
                deferred.resolve();
            })
            .catch(function(ex) {
                deferred.reject(ex);
            });

        return deferred.promise;
    }
    function _GetCurrentUser(){
         var dfd = $q.defer();

        OrderCloud.Me.Get().then(function(data) {
                                   dfd.resolve(data);
                                   console.log(data);
                                })
                                .catch(function(res){
                                    console.log(res);
                                    OrderCloud.Auth.RemoveToken();
                                    OrderCloud.BuyerID.Set(null);
                                    $state.go('login');
                                    dfd.resolve();
                                })
                                return dfd.promise;
    }
    function _getSignUpUpdateSubscription(ConstantContactId, subscriptionList){
      var params = {
            "ConstantContactId": ConstantContactId
        }
        return ConstantContact.GetSpecifiedContact(params).then(function (res) {

            var userSubscriptions = res.data.lists;
            if (userSubscriptions) {
                var userSubIds = Underscore.pluck(userSubscriptions, "id");
                angular.forEach(subscriptionList.data, function (subscription) {
                    if (userSubIds.indexOf(subscription.id) > -1) {
                        subscription.Checked = true;
                    }
                })
            }
            return subscriptionList.data;
        })

  }
}


function LoginController( OrderCloud,$state,$http, CurrentUser,$cookieStore, $stateParams, $exceptionHandler, LoginService, Underscore, buyerid, $scope, $uibModalInstance, $rootScope, $timeout, $window,emailSubscribeList,ConstantContact) {

    var vm = this;
      vm.user=CurrentUser;
  console.log("vm.user",vm.user);
    vm.token = $stateParams.token;
    vm.form = vm.token ? 'reset' : 'login';
    vm.setForm = function(form) {
        vm.form = form;
    };
    vm.credentials = {};
    if($cookieStore.get('rememberMe.userName')){
     
      vm.credentials.Username = $cookieStore.get('rememberMe.userName');
    } 
    /*vm.showScroll=function(){
      $uibModalInstance.opened.then(function() {
          $timeout(function() {
              $scope.$broadcast('rebuild:signUpScroll');
          },200);
        });
    }*/
    // START: function for sort options selection
      var sortItems=[
      {'value':'What was your high school mascot?','label':'What was your high school mascot?'},
      {'value':'In what city were you born?','label':'In what city were you born?'},
      {'value':'What is the make or model of your first car?','label':'What is the make or model of your first car?'},
      {'value':'What is the name of your favorite teacher?','label':'What is the name of your favorite teacher?'},
      {'value':'What is your maternal grandmother’s first name?','label':'What is your maternal grandmother’s first name?'},
      {'value':'What is your favorite game?','label':'What is your favorite game?'},
      ];
      vm.sortItems = sortItems;
      vm.selectedItem ="What was your high school mascot?";
      vm.selectedMenu = 0; 

      vm.changeSortSelection = function changeSortSelection(selcetedItem, itemIndex){
         vm.selectedItem =selcetedItem;
         vm.selectedMenu = itemIndex; 

      };
      // END: function for sort options selection
    
    vm.submit = function(credentials) {
        OrderCloud.Auth.GetToken( credentials )
            .then(function(data) {
                OrderCloud.BuyerID.Get() ? angular.noop() : OrderCloud.BuyerID.Set(buyerid);
                $cookieStore.put('anonToken', OrderCloud.Auth.ReadToken());
                OrderCloud.Auth.SetToken(data.access_token);
             // ImpersonationService.StopImpersonating();
             if(vm.rememberMe){
              $cookieStore.put('rememberMe.userName', credentials.Username);
             }
              $uibModalInstance.dismiss('cancel');
              vm.menuClass='unhide';
              angular.element('.menu-class').removeClass('hide');
              angular.element('.menu-class').addClass('unhide');
              angular.element('#info-bar-acc, .sticky #info-bar-acc').addClass('expandAccBlockLoggedIn');
              angular.element('.main-mobile-menu-container').toggleClass('show-hide');

              angular.element('.mobile-signout-guest').css('display','none');
              angular.element('.mobile-signout-notGuest').css('display','block');

              vm.loggedIn = true;
              $cookieStore.put('isLoggedIn', true); 

                  //$state.go('account.profile');
                $rootScope.$broadcast('getcurrentuser');
                LoginService.GetCurrentUser().then(function(res){
                    console.log(res);
                })
                
                //angular.element('#checkoutpage').scope().checkout.loginAsExistingUser(credentials);
                $state.reload('checkout');
            })
            .catch(function(ex) {
               // $exceptionHandler(ex);
               //vm.errormsg = "Email or Password is incorrect";
               vm.invaliduser = true;
               vm.lockedErr = ex.data.error;
               if(vm.lockedErr == "Exception of type 'Four51.DBExceptions+UserAccountLockedOut' was thrown."){
                  vm.errormsg = "You have exceeded the maximum log in attempts. Your account is locked, please contact Customer Representative.";
               }else if(vm.lockedErr == "Username not found or password incorrect."){
                  vm.errormsg = "Email or Password is incorrect";
               }
            })
            
    };

    var specialKeys = new Array();
    specialKeys.push(8);
    vm.IsNumeric = function ($e) {
        console.log($e);
        var keyCode = $e.which ? $e.which : $e.keyCode;
        var ret = ((keyCode >= 48 && keyCode <= 57) || specialKeys.indexOf(keyCode) != -1);
        if(!ret)
            $e.preventDefault();
    }

   /* $(document).on('click','.signUpLink',function($uibModalInstance,$timeout,$scope){

        $uibModalInstance.opened.then(function() {
          $timeout(function() {
              $scope.$broadcast('rebuild:signUpScroll');
          },3000);
        });
    });*/

  /*  $(document).on('click','.signUpLink,.sign-up',function(){
        $('.loginLink').parent('h3').removeClass('form-active');
        $('.signUpLink').parent('h3').addClass('form-active');
        $('.signUpForm').removeClass('ng-hide').show();
        $('.logInForm').hide();

    })
     $(document).on('click','.loginLink,.log-in',function(){
        $('.signUpLink').parent('h3').removeClass('form-active');
        $('.loginLink').parent('h3').addClass('form-active');
        $('.signUpForm').hide();
        $('.logInForm').show();
        $('.login-det').show();
        $('.forgot-possword-block').hide();

    })
     $(document).on('click','.forgot-pwd-link',function(){
        $('.login-det').hide();
        $('.forgot-possword-block').show();

    })
     $(document).on('click','.forgot-login-link',function(){
        $('.login-det').show();
        $('.forgot-possword-block').hide();

    })*/
    vm.forgotPassword = function() {
        LoginService.SendVerificationCode(vm.credentials.Email)
            .then(function() {
                vm.setForm('verificationCodeSuccess');
                vm.credentials.Email = null;
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.resetPassword = function() {
        LoginService.ResetPassword(vm.credentials, vm.token)
            .then(function() {
                vm.setForm('resetSuccess');
                vm.token = null;
                vm.credentials.ResetUsername = null;
                vm.credentials.NewPassword = null;
                vm.credentials.ConfirmPassword = null;
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
                vm.credentials.ResetUsername = null;
                vm.credentials.NewPassword = null;
                vm.credentials.ConfirmPassword = null;
            });
    };
    vm.resetPasswordLink =function(){
      vm.resetLinkConrfirm = true;
    }
    /*vm.showSignUpForm = function(){
        vm.showSignUp = true;
        vm.showLogin = true;
    };*/

    vm.loginTab = 1;
    vm.showPPReg = true;
    vm.showLogin = function(){
      vm.loginTab = 1;
      vm.showPPReg = true;
    }
    vm.showSignUp = function(){
      vm.loginTab = 2;
      vm.showPPReg = false;
    }
    vm.showForgotPassword = function(){
        vm.loginTab = 3;
        vm.showPPReg = true;
    }
    vm.cancel = function () {
        $uibModalInstance.dismiss('cancel');
        vm.menuClass='unhide';
        $('.menu-class').removeClass('hide');
        $('.menu-class').addClass('unhide');
        $('.main-mobile-menu-container').toggleClass('show-hide');
    };
    vm.emailSubscription = false;
    vm.signUpLoginForm = true;

    vm.create = function() {
       //vm.newUser=Users;
       //vm.newUser={};
       var user = {

                  Username: vm.newUser.Email,
                  Password: vm.newUser.Password,
                  FirstName: vm.newUser.Firstname,
                  LastName: vm.newUser.Lastname,
                  Email: vm.newUser.Email,
                  Phone:'('+vm.newUser.Phone1+')' +' '+ vm.newUser.Phone2 + '-'+ vm.newUser.Phone3,
                 // SecurityProfileID: "65c976de-c40a-4ff3-9472-b7b0550c47c3",
                  Active: true,
            xp:{
                "SecurityQuestion":{
                    "Question":vm.selectedItem,
                    "Answer":vm.newUser.securityAnswer
                },
                "CreatedFrom":"web"
            }


        };

        OrderCloud.Users.Create(user).then(function(res){
            console.log('1111',res);
            var userGroupAssignment =  {
              "UserGroupID": "DcNHCSSokkKqfhLzGr0Qvg",
              "UserID": res.ID
            }
            OrderCloud.UserGroups.SaveUserAssignment(userGroupAssignment);
/*            $uibModalInstance.dismiss('cancel');*/
            // $state.go('home');
                 // start  user integartion to Egle
                var data = {
                        "CustomerID":res.ID,
                        "Action":"create"
                        }
        $http({

                method: 'POST',
                dataType:"json",
                url:"https://Four51TRIAL104401.jitterbit.net/Bachmans_Dev/four51_to_eagle_filecreate",
                data: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }

            }).success(function (data, status, headers, config) {
            }).error(function (data, status, headers, config) {
            });
            // endof user integartion to Egle
            if(vm.newUser.PurplePerksChecked)
            {
          var Purple_perks=  {

                "Name": "Purple Perks",
                "Balance": 0.0
              }
              OrderCloud.SpendingAccounts.Create(Purple_perks).then(function(data){
             var assign = {
                "SpendingAccountID": data.ID,
                "UserID":res.ID
                }
              OrderCloud.SpendingAccounts.SaveAssignment(assign);
              });
          }
            vm.menuClass='unhide';
            angular.element('.menu-class').removeClass('hide');
            angular.element('.menu-class').addClass('unhide');
            angular.element('#info-bar-acc, .sticky #info-bar-acc').addClass('expandAccBlockLoggedIn');            angular.element('.guest-in-mob').css('display','none');
            angular.element('.main-mobile-menu-container').toggleClass('show-hide');
            angular.element('.mobile-signout-guest').css('display','none');
            angular.element('.mobile-signout-notGuest').css('display','block');
       
            angular.element('.email-subscription').css('display','block');
            vm.emailSubscription = true;
            vm.signUpLoginForm = false;
            vm.createConstantContactID(res);
            vm.subscribeToList = emailSubscribeList.data;
            console.log("subscribeToList--",vm.subscribeToList);
        },
        function(data){
            console.log(data);
            vm.signupError = "User already exists";
        })
        vm.createConstantContactID = function(user){
          var obj = {
                "firstname": user.FirstName,
                "lastname": user.LastName,
                "email": user.Email,
                "lists":[
                    {
                        "id":"1156621276",
                        "status": "ACTIVE"
                    }
                ]
          }
          var newCCArray = [];
          ConstantContact.CreateContact(obj).then(function (res) {
            console.log('CCID',res.data);
            newCCArray.push(res.data);
            vm.newCCArray = newCCArray;
            var objID = {
                "xp": {
                     "ConstantContact": {
                      "ID": res.data.id
                    }
                  }
            }
            /*if(vm.newCCArray[0].lists[0] == "1156621276"){
            }*/
            var currentUserId = user.ID;
            OrderCloud.Users.Patch(currentUserId, objID).then(function(ccRes){
              //console.log('ccPatchedID',ccRes);
            })
          })
        }
        vm.signUpUpdateContact = function () {
          //console.log('2222',vm.newCCArray);
          var list = Underscore.filter(vm.subscribeToList, function (subscription) {
            return subscription.Checked == true;
          })
          var
            objUp = {
              "id":vm.newCCArray[0].id,
              "lists":list,
              "email_addresses": [{"email_address":vm.newCCArray[0].email_addresses[0].email_address}]
          }
          ConstantContact.UpdateContact(objUp).then(function(response) {
            console.log('upres',response);
          })
          vm.submit(user);
        };

    };     

}