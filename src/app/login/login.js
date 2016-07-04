angular.module( 'orderCloud' )

    .config( LoginConfig )
    .factory( 'LoginService', LoginService )
    .controller( 'LoginCtrl', LoginController )

;

function LoginConfig( $stateProvider ) {
    $stateProvider
        .state( 'login', {
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
        GetCurrentUser:_GetCurrentUser
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
}


function LoginController( OrderCloud,$state, $stateParams, $exceptionHandler, LoginService, buyerid, $scope, $uibModalInstance, $rootScope, $timeout ) {

    var vm = this;
    vm.token = $stateParams.token;
    vm.form = vm.token ? 'reset' : 'login';
    vm.setForm = function(form) {
        vm.form = form;
    };

    vm.showScroll=function(){
      $uibModalInstance.opened.then(function() {
          $timeout(function() {
              $scope.$broadcast('rebuild:signUpScroll');
          },200);
        });
    }
    
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
    
    vm.submit = function() {
        OrderCloud.Auth.GetToken( vm.credentials )
            .then(function(data) {
                OrderCloud.BuyerID.Get() ? angular.noop() : OrderCloud.BuyerID.Set(buyerid);
                OrderCloud.Auth.SetToken(data.access_token);
             // ImpersonationService.StopImpersonating();
              $uibModalInstance.dismiss('cancel');
                //$state.go('account.profile');
                $rootScope.$broadcast('getcurrentuser');
                LoginService.GetCurrentUser().then(function(res){
                    console.log(res);
                })
            })
            .catch(function(ex) {
               // $exceptionHandler(ex);
               vm.errormsg = "Email or Password is incorrect!!";
               vm.invaliduser = true;
            })
            $('#info-bar-acc, .sticky #info-bar-acc').addClass('expandAccBlockLoggedIn');
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
    /*vm.showSignUpForm = function(){
        vm.showSignUp = true;
        vm.showLogin = true;
    };*/

    vm.loginTab = 1;
    vm.showLogin = function(){
        vm.loginTab = 1;
    }
    vm.showSignUp = function(){
        vm.loginTab = 2;
        
    }
    vm.showForgotPassword = function(){
        vm.loginTab = 3;
    }
    vm.cancel = function () {
        $uibModalInstance.dismiss('cancel');
        vm.menuClass='unhide';
        $('.menu-class').removeClass('hide');
        $('.menu-class').addClass('unhide');
    };
    vm.create = function() {
       //vm.newUser=Users;
       //vm.newUser={};
        //console.log(vm.newUser);

        var user = {

                  Username: vm.newUser.Email,
                  Password: vm.newUser.Password,
                  FirstName: vm.newUser.Firstname,
                  LastName: vm.newUser.Lastname,
                  Email: vm.newUser.Email,
                  Phone:vm.newUser.Phone1 + vm.newUser.Phone2 + vm.newUser.Phone3,
                  SecurityProfileID: "65c976de-c40a-4ff3-9472-b7b0550c47c3",
                  Active: true,
            xp:{
                "SecurityQuestion":{
                    "Question":vm.newUser.securityQuestion,
                    "Answer":vm.newUser.securityAnswer
                }
            }


        };
        OrderCloud.Users.Create(user).then(function(res){
            console.log(res);
            $uibModalInstance.dismiss('cancel');
               // $state.go('home');

        },
        function(data){
            console.log(data);
        })
        
         $('#info-bar-acc, .sticky #info-bar-acc').addClass('expandAccBlockSignedIn');

    };
        
}