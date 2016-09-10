angular.module('orderCloud')

	.config(orderConfirmationConfig)
	.controller('orderConfirmationCtrl', orderConfirmationController)
	;

function orderConfirmationConfig($stateProvider) {
	$stateProvider
		.state('orderConfirmation', {
			parent: 'base',
			url: '/orderConfirmation/:userID/:ID',
			templateUrl: 'orderConfirmation/templates/orderConfirmation.tpl.html',
			controller: 'orderConfirmationCtrl',
			controllerAs: 'orderConfirmation',
			resolve: {
				Order: function ($stateParams, OrderCloud, $q) {
					var deferred = $q.defer();
					OrderCloud.Orders.Get($stateParams.ID)
						.then(function (order) {
							deferred.resolve(order);
						})
						.catch(function () {
							deferred.reject();
						});
					return deferred.promise;
				},
				LineItems: function (OrderCloud, LineItemHelpers, $q, $stateParams) {
					var deferred = $q.defer();
					OrderCloud.LineItems.List($stateParams.ID).then(function (res) {
						LineItemHelpers.GetProductInfo(res.Items).then(function () {
							deferred.resolve(res);
						});
					}).catch(function (err) {
						console.log(err);
						deferred.reject();
					})
					return deferred.promise;
				}
			}
		})
}
function orderConfirmationController($cookieStore, CurrentOrder, $state, OrderCloud, LineItemHelpers, Order, LineItems,ConstantContact) {

	var vm = this;
	//$('.orderConfirmationHeader').show();
    $('.base-header-inner').hide();
    $('.sticky-background').hide();
	vm.isLoggedIn = $cookieStore.get('isLoggedIn');
	vm.order = {};
	vm.newUser = {};
	vm.continueShopping = continueShopping;
	vm.order = Order;
	vm.lineItems = LineItems
	//vm.print = print;
	vm.registered = false;
	var sortItems = [
		{ 'value': 'What was your high school mascot?', 'label': 'What was your high school mascot?' },
		{ 'value': 'In what city were you born?', 'label': 'In what city were you born?' },
		{ 'value': 'What is the make or model of your first car?', 'label': 'What is the make or model of your first car?' },
		{ 'value': 'What is the name of your favorite teacher?', 'label': 'What is the name of your favorite teacher?' },
		{ 'value': 'What is your maternal grandmother’s first name?', 'label': 'What is your maternal grandmother’s first name?' },
		{ 'value': 'What is your favorite game?', 'label': 'What is your favorite game?' },
	];
	vm.sortItems = sortItems;
	vm.selectedItem = "What was your high school mascot?";
	vm.selectedMenu = 0;

	vm.changeSortSelection = function changeSortSelection(selcetedItem, itemIndex) {
		vm.selectedItem = selcetedItem;
		vm.selectedMenu = itemIndex;

	};

	// CurrentOrder.Get().then(function (order) {
	// 	console.log("order= " + order);
	//vm.order = Order;
	// });
	// CurrentOrder.GetID().then(function (orderID) {
	// 	console.log("orderID= " + order);
	// 	OrderCloud.LineItems.List(orderID).then(function (res) {
	// 		LineItemHelpers.GetProductInfo(res.Items).then(function () {
				//vm.lineItems = LineItems
	// 		});
	// 	}).catch(function (err) {
	// 		console.log(err);
	// 	})

	// });
	// Take from Billing Address
	// OrderCloud.Me.Get().then(function (res) {
	// 	vm.user = res;
	// });

	function continueShopping() {
		$state.go('home');
	}
    // function print(div) {
	// 	var printContents = document.getElementById(div).innerHTML;
	// 	var originalContents = document.body.innerHTML;

	// 	document.body.innerHTML = printContents;

	// 	window.print();

	// 	document.body.innerHTML = originalContents;
	// }
	vm.create = function () {
		//vm.newUser=Users;
		//vm.newUser={};
        //console.log(vm.newUser);
		vm.newUser.Firstname = vm.order.BillingAddress.FirstName;
		vm.newUser.Lastname = vm.order.BillingAddress.LastName;
		//vm.newUser.Email = vm.order.BillingAddress.xp.Email;
		vm.newUser.Phone = vm.order.BillingAddress.Phone;

		var user = {

			Username: 'john@gmail.com',//vm.newUser.Email,
			Password: vm.newUser.Password,
			FirstName: vm.newUser.Firstname,
			LastName: vm.newUser.Lastname,
			Email: 'john@gmail.com',//vm.newUser.Email,
			Phone: vm.newUser.Phone,
			// SecurityProfileID: "65c976de-c40a-4ff3-9472-b7b0550c47c3",
			Active: true,
            xp: {
                "SecurityQuestion": {
                    "Question": vm.selectedItem,
                    "Answer": vm.newUser.securityAnswer
                }
            }


        };

        OrderCloud.Users.Create(user).then(function (res) {
            console.log('1111', res);
            var userGroupAssignment = {
				"UserGroupID": "DcNHCSSokkKqfhLzGr0Qvg",
				"UserID": res.ID
            }
            OrderCloud.UserGroups.SaveUserAssignment(userGroupAssignment);
			/*            $uibModalInstance.dismiss('cancel');*/
            // $state.go('home');
			if (vm.purplePerks) {
				var Purple_perks = {

					"Name": "Purple Perks",
					"Balance": 0.0
				}
				OrderCloud.SpendingAccounts.Create(Purple_perks).then(function (data) {
					var assign = {
						"SpendingAccountID": data.ID,
						"UserID": res.ID
					}
					OrderCloud.SpendingAccounts.SaveAssignment(assign);
				});
			}

            vm.createConstantContactID(res);
			vm.registered = true;

        },
			function (data) {
				console.log(data);
				vm.signupError = "User already exists";
			})
        vm.createConstantContactID = function (user) {
			var obj = {
                "firstname": user.FirstName,
                "lastname": user.LastName,
                "email": user.Email,
                "lists": [
                    {
                        "id": "1156621276",
                        "status": "ACTIVE"
                    }
                ]
			}
			var newCCArray = [];
			ConstantContact.CreateContact(obj).then(function (res) {
				console.log('CCID', res.data);
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
				OrderCloud.Users.Patch(currentUserId, objID).then(function (ccRes) {
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
					"id": vm.newCCArray[0].id,
					"lists": list,
					"email_addresses": [{ "email_address": vm.newCCArray[0].email_addresses[0].email_address }]
				}
			ConstantContact.UpdateContact(objUp).then(function (response) {
				console.log('upres', response);
			})
			vm.submit(user);
        };

    };
}