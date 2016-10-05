angular.module('orderCloud')

	.config(CheckoutConfig)
	.controller('CheckoutCtrl', CheckoutController)
	.controller('editCtrl', EditController)
	.factory('checkOutService', checkOutService)
    .directive('maxLength', maxLength);


function CheckoutConfig($stateProvider) {
	$stateProvider
		.state('checkout', {
			parent: 'base',
			url: '/checkout',
			templateUrl: 'checkout/templates/checkout.tpl.html',
			controller: 'CheckoutCtrl',
			controllerAs: 'checkout',
			resolve: {
                LineItems: function (OrderCloud, $rootScope, $q, CurrentOrder, toastr, $state, LineItemHelpers, PdpService) {
					var deferred = $q.defer();
					CurrentOrder.GetID()
						.then(function (data) {
							OrderCloud.Orders.Get(data).then(function (order) {
								var order = order;
								OrderCloud.LineItems.List(order.ID).then(function (res) {
									LineItemHelpers.GetProductInfo(res.Items)

										.then(function () {
											console.log("res,", res);
											angular.forEach(res.Items, function (val, key) {
                                                console.log(val, key);
                                                PdpService.GetProductCodeImages(val.ProductID).then(function (res1) {
                                                    console.log(res1);
                                                    val.productimages = res1[0];
                                                })
                                            })
											deferred.resolve(res);
										});

								}).catch(function () {
									deferred.resolve(null);
								});
							})
						}).catch(function () {
                            //toastr.error('You do not have an active open order.', 'Error');
                            $state.go('home');
                            deferred.resolve(null);
                        });
					return deferred.promise;
                },
                Order: function ($rootScope, $q, $state, toastr, TaxService, CurrentOrder, OrderCloud) {
                    var dfd = $q.defer();
                    CurrentOrder.GetID().then(function (orderID) {
                        console.log("orderID", orderID);
						TaxService.GetTax(orderID)
							.then(function () {
								OrderCloud.Orders.Get(orderID).then(function (order) {
                                    console.log("order", order);
                                    angular.element('.base-header-inner').hide();
									angular.element('.sticky-background').hide();
									angular.element('.orderConfirmationHeader').show();
                                    dfd.resolve(order);
                                }).catch(function () {
                                    dfd.resolve(null);
                                });
                            });
                    })
						.catch(function () {
							dfd.resolve();
						});
                    return dfd.promise;
                },
				Buyers: function (OrderCloud, $q) {
					var deferred = $q.defer();
					OrderCloud.Buyers.Get().then(function (res) {
						console.log("resasd,", res);
						deferred.resolve(res);
					}).catch(function () {
						deferred.resolve(null);
					});
					return deferred.promise;
				},
				CreditCard: function (OrderCloud, $q) {
					var deferred = $q.defer();
					OrderCloud.Me.ListCreditCards().then(function (res) {
                        console.log("CreditCard,", res);
						deferred.resolve(res);
					}).catch(function () {
						deferred.resolve(null);
					});
					return deferred.promise;
				},
				LoggedinUser: function (OrderCloud, $q) {
					var deferred = $q.defer();

					OrderCloud.Me.Get().then(function (res) {
						console.log("LoggedinUser", res);

						deferred.resolve(res);
					})
					return deferred.promise;
				}
			}
		})
}
function checkOutService($q, $http, OrderCloud) {
	var service = {
		getCityState: _getCityState,
		getSetLineItem: _getSetLineItem,
        createCreditCard: _createCreditCard,
		getAddressBook: _getAddressBook
	}

	function _getAddressBook() {
		var defered = $q.defer();
		OrderCloud.Me.ListAddresses(null, null, 100, null, null, { "Billing": true }).then(function (res) {
			console.log(res);
			defered.resolve(res.Items);
		});
		return defered.promise;
	}



	function _getCityState(zip) {
		var defered = $q.defer();
		$http.defaults.headers.common['Authorization'] = undefined;
		$http.get('http://maps.googleapis.com/maps/api/geocode/json?address=' + zip).then(function (res) {
			var city, state, country;
			angular.forEach(res.data.results[0].address_components, function (component, index) {
				var types = component.types;
				angular.forEach(types, function (type, index) {
					if (type == 'locality') {
						city = component.long_name;
					}
					if (type == 'administrative_area_level_1') {
						state = component.short_name;
					}
					if (type == 'country') {
                        country = component.short_name;
                    }
				});
			});
			defered.resolve({ "City": city, "State": state, 'Country': country });
		});
		return defered.promise;
	}
	function _getSetLineItem(line) {
		return {
			lineitem: line
		}
	}
	function _addCreditCard(card, billingAddress, vm) {
		var d = $q.defer();
		card = angular.copy(card);
		card.ExpMonth = card.ExpMonth.substring(0, 2);
		card.ExpYear = card.ExpYear.toString();
		card.ExpYear = card.ExpYear.substring(2, 4);
		billingAddress.Phone = "(" + billingAddress.Phone1 + ") " + billingAddress.Phone2 + "-" + billingAddress.Phone3;
		billingAddress.Country = "US";
		billingAddress.Billing = true;
		delete billingAddress.ID;
		_getCardType(card.CardNumber).then(function (cardtype) {
			card.CardType = cardtype;
			CreditCardService.Create(card).then(function (res) {
				if (res.ResponseBody.ID) {
					OrderCloud.As().Me.CreateAddress(billingAddress).then(function (res1) {
						OrderCloud.As().Me.PatchCreditCard(res.ResponseBody.ID, { "xp": { "BillingAddressID": res1.ID } }).then(function (res2) {
							console.log(res2);
						});
					});
					d.resolve("1");
				} else {
					vm.TransactionError = res.messages;
					d.resolve("0");
				}
			});
		});
		return d.promise;
	}

	function _CompareDate(endDate) {
		var d = $q.defer();
		$.ajax({
			method: "GET",
			dataType: "json",
			contentType: "application/json",
			url: GetCstTime
		}).success(function (res) {
			if (endDate == res.date)
				d.resolve("1");
			else
				d.resolve(res);
		}).error(function (err) {
			console.log("err" + err);
		});
		d.resolve("1");
		return d.promise;
	}

    function _createCreditCard(data) {
        var defered = $q.defer();
        OrderCloud.CreditCards.Create(data).then(function (response) {
            defered.resolve(response);
        });
        return defered.promise;
    }
	return service;
}
function CheckoutController($scope, $uibModal, $state, HomeFact, PlpService, $q, CreditCardService, TaxService, CurrentOrder, $sce, alfcontenturl, CategoryService, Underscore, $rootScope, LineItems, Order, OrderCloud, Buyers, CreditCard, LoggedinUser, LoginService, $cookieStore, $http, buyerid, checkOutService, AddressValidationService, $filter, PdpService, PPBalance, GCBalance, GC_PP_Redemption) {
    console.log(LoggedinUser);
    $('.base-header-inner').hide();
    //$('.orderConfirmationHeader').show();
    $('.sticky-background').hide();
	var vm = this;
	var date = new Date();
	vm.lineItems = [];
	vm.openACCItems = { "name": 'signin' };
	vm.signin = true;
	vm.delivery = false;
	vm.selected = false;
	vm.limit = 3;
	vm.more = true;
	vm.edit = false;
	vm.recipient = [];
	vm.recipient[0] = true;
	vm.message = false;
	vm.today = new Date();
	vm.tomorrow = date.setDate(date.getDate() + 1);
	vm.payment = false;
	vm.giftcardcheckbox = false;
	vm.editbillingaddr = false;
	vm.newcard = false;
    vm.addPaymentInfo = {};
	vm.DeliveryRuns = Buyers.xp.DeliveryRuns[0];
	vm.changedeliveryDate = changedeliveryDate;
	vm.getGuestLineItems = getGuestLineItems
	vm.changePreference = changePreference;
	vm.gotoNext = gotoNext;
	vm.ordersummarydata = LineItems;
	console.log("vm.ordersummarydata", vm.ordersummarydata);
	vm.orderdata = Order;
	vm.orderTotal = angular.copy(Order.Total);
	vm.init = init;
	vm.creditcards = CreditCard;
	vm.signnedinuser = LoggedinUser;
	vm.updateLinedetails = updateLinedetails;
	vm.notsameDay = [];
	vm.class = "active-date"
	vm.calculateDeliveryCharges = calculateDeliveryCharges;
    vm.bachmanscharge = bachmanscharge;
	vm.getCreditCardsBillingAddress = getCreditCardsBillingAddress;
	vm.orderDtls = { "SpendingAccounts": {} };
	vm.addPaymentInfo = {};
	vm.getCreditCardsBillingAddress(vm.creditcards.Items);
	vm.addTaxtoLineItem = addTaxtoLineItem;
	vm.selecteditem = {};
	vm.nonWiredSubTotalCall = nonWiredSubTotalCall
	PdpService.CompareDate().then(function (datatime) {
		vm.cstDateTime = new Date(datatime);
	});
	checkOutService.getAddressBook().then(function (res) {
		vm.addressBook = res;
	})
	var num = $filter('date')(new Date(), "yy");
    var years = [];
    for (var i = 0; i < 12; i++) {
        years.push(parseInt(num) + i);
    }
    vm.years = years;
	var addressValidated = true;
    if (vm.signnedinuser.ID != "gby8nYybikCZhjMcwVPAiQ") {

        vm.openACCItems.name = 'delivery';
        vm.openACCItems['signinFunc'] = true;
        $rootScope.$on('getcurrentuser1', function () {
			LoginService.GetCurrentUser().then(function (res) {
				console.log(res);
				// vm.currentUser = res;
				vm.user = res.LastName + " " + res.FirstName
				vm.showuserdetail = true;
			})

		});
        //vm.user = LoggedinUser.LastName + " " + LoggedinUser.FirstName
        vm.user = LoggedinUser.FirstName + " " + LoggedinUser.LastName
        lineItemsData();
        vm.bachmanscharge();
    }
	vm.init();
	console.log("vm.creditcards", vm.creditcards);
    $rootScope.$on("ChangedDetails", function (events, lineitem) {
        vm.editedShippingaddress = lineitem;
	});
	function getGuestLineItems(user) {
		vm.user = user;
		if (user == 'Guest') {
			vm.signin = false;
			vm.delivery = true;
            lineItemsData();
            vm.openACCItems.name = 'delivery';
            vm.openACCItems['signinFunc'] = true;
			console.log("lineItems", vm.lineItems);
		}
	}
    function lineItemsData() {
        vm.lineItems = LineItems.Items;
		angular.forEach(vm.lineItems, function (val, key, obj) {
			if (val.xp.deliveryDate)
				val.xp.deliveryDate = new Date(val.xp.deliveryDate);
		});
		var data;
		vm.lineItems = _.groupBy(vm.lineItems, function (value) {
			if (value.ShippingAddress != null) {
				//totalCost += value.xp.TotalCost;
				return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.ShippingAddress.Zip + '' + new Date(value.xp.deliveryDate) + '' + value.xp.DeliveryMethod
			}


		});

    }
	function changedeliveryDate(lineitems, date) {
		//todo vm.nonWiredSubTotalCall also;
		var a = new Date(lineitems[0].xp.deliveryDate);
		var b = new Date(date);

		var DateA = Date.UTC(a.getFullYear(), a.getMonth() + 1, a.getDate());
		var DateB = Date.UTC(b.getFullYear(), b.getMonth() + 1, b.getDate());
		if (DateA != DateB) {
			var count = 0;
			angular.forEach(lineitems, function (line) {
				line.xp.deliveryDate = new Date(date);
				if (count == 0) {
					vm.calculateDeliveryCharges(line);
				}
				else {
					line.xp.TotalCost = parseFloat(line.UnitPrice) * parseFloat(line.Quantity);
				}
				count++;
			});
		}

		// var data = [];
		// data[0] = item;
        // vm.updateRecipientDetails(data).then(function (s) {
        //     if (s = 'success') {
        //         //vm.changeLineDate[index] = false;
		// 		alert("datec hanged ...");
        //     }
        // })
		// if (line.xp.MinDays.MinToday) {
		// 	var a = new Date(line.xp.MinDays.MinToday);
		// 	var b = new Date(date);

		// 	var DateA = Date.UTC(a.getFullYear(), a.getMonth() + 1, a.getDate());
		// 	var DateB = Date.UTC(b.getFullYear(), b.getMonth() + 1, b.getDate());
		// 	if (DateA == DateB) {
		// 		line.xp.deliveryDate = new Date(date);
		// 	}

		// }
		// else {
		// 	if (DateA != DateB) {
		//line.xp.deliveryDate = new Date(date);
		// 	}
		// }

		// if (vm.class === "active-date")
		// 	vm.class = " ";
		// else
		// 	vm.class = "active-date";
		//line.xp.deliveryDate = new Date(date);
	}

    function calculateDeliveryCharges(line) {
		// var d = $q.defer();
        PdpService.GetDeliveryOptions(line, line.xp.DeliveryMethod).then(function (res) {

            var obj = {};

            if (line.xp.DeliveryMethod == 'LocalDelivery') {

                PdpService.CompareDate(line.xp.deliveryDate).then(function (data) {
                    if (data == '1') {

                        angular.forEach(res[line.xp.DeliveryMethod], function (val, key) {
                            obj[key] = val;
                        }, true);
                        line.xp.deliveryFeesDtls = obj;
                        // if(!line.xp.DeliveryMethod)
                        // 	line.xp.DeliveryMethod = DeliveryMethod;
                        line.xp.TotalCost = 0;
                        angular.forEach(line.xp.deliveryFeesDtls, function (val, key) {

                            line.xp.TotalCost += parseFloat(val);

                        });
                        if (line.xp.TotalCost > 250) {
                            line.xp.Discount = line.xp.TotalCost - 250;
                            line.xp.TotalCost = 250;
                        }
                        line.xp.TotalCost = line.xp.TotalCost + (line.Quantity * line.UnitPrice);
						// d.resolve('1');

                    }
                    else {
                        delete res.LocalDelivery.SameDayDelivery;
                        angular.forEach(res[line.xp.DeliveryMethod], function (val, key) {
                            obj[key] = val;
                        }, true);
                        line.xp.deliveryFeesDtls = obj;
                        // if(!line.xp.DeliveryMethod)
                        // 	line.xp.DeliveryMethod = DeliveryMethod;
                        line.xp.TotalCost = 0;
                        angular.forEach(line.xp.deliveryFeesDtls, function (val, key) {

                            line.xp.TotalCost += parseFloat(val);

                        });
                        if (line.xp.TotalCost > 250) {
                            line.xp.Discount = line.xp.TotalCost - 250;
                            line.xp.TotalCost = 250;
                        }
                        line.xp.TotalCost = line.xp.TotalCost + (line.Quantity * line.UnitPrice);
                        //d.resolve('1');
                    }
                    //d.resolve(1);
                })
                //d.resolve(1);
            }
            else {

                delete res.LocalDelivery.SameDayDelivery;
                angular.forEach(res[line.xp.DeliveryMethod], function (val, key) {
                    obj[key] = val;
                }, true);
                line.xp.deliveryFeesDtls = obj;
                // if(!line.xp.DeliveryMethod)
                // 	line.xp.DeliveryMethod = DeliveryMethod;
                line.xp.TotalCost = 0;
                angular.forEach(line.xp.deliveryFeesDtls, function (val, key) {

                    line.xp.TotalCost += parseFloat(val);

                });
                if (line.xp.TotalCost > 250) {
                    line.xp.Discount = line.xp.TotalCost - 250;
                    line.xp.TotalCost = 250;
                }
                line.xp.TotalCost = line.xp.TotalCost + (line.Quantity * line.UnitPrice);
                //d.resolve('1');

            }




            //delete line.xp.Discount;

        });
		// return d.promise;

    }
	function changePreference(line, preference, run) {
		//line.xp.DeliveryRuns = preference;
		line.xp.DeliveryRun = run;

	}
	function gotoNext(index) {
		for (var i = 0; i < LineItems.Items.length; i++) {
			if (i == index + 1) {
				vm.recipient[i] = true;
			}
			else {
				vm.recipient[i] = false;
			}
		}
	}

    vm.changeAcItem = function (item) {
        vm.openACCItems.name = item;
    }

    vm.loginpopup = function () {
		var modalInstance = $uibModal.open({
			animation: true,
			backdropClass: 'loginModalBg',
			windowClass: 'loginModalBg',
			templateUrl: 'login/templates/login.modal.tpl.html',
			controller: 'LoginCtrl',
			controllerAs: 'login',
			resolve: {
				emailSubscribeList: function (ConstantContact) {
					return ConstantContact.GetListOfSubscriptions();
				},
				CurrentUser: function ($q, $state, OrderCloud) {
					var dfd = $q.defer();
					OrderCloud.Me.Get()
						.then(function (data) {
							dfd.resolve(data);
						})
						.catch(function () {
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
		modalInstance.result.then(function () {

		}, function () {
			angular.noop();
		});
    }
    vm.logout = function () {
		$cookieStore.remove('isLoggedIn');
		OrderCloud.Auth.RemoveToken();
        OrderCloud.Auth.RemoveImpersonationToken();
        $state.go('home');
        angular.element('#info-bar-acc, .sticky #info-bar-acc').removeClass('expandAccBlockLoggedIn');
    }

	function init() {
		var data = _.groupBy(vm.ordersummarydata.Items, function (value) {
			if (value.ShippingAddress != null) {
				//totalCost += value.xp.TotalCost;
				value.xp.deliveryDate = new Date(value.xp.deliveryDate);
				return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.ShippingAddress.Zip + '' + new Date(value.xp.deliveryDate) + '' + value.xp.DeliveryMethod;
			}
		});
		console.log(vm.orderdata.ID);
		vm.groups = data;
		vm.nonWiredSubTotalCall(vm.orderdata);

		PdpService.CheckTime().then(function (res) {
			var a = new Date();
			var DateA = Date.UTC(a.getFullYear(), a.getMonth() + 1, a.getDate());
			var count = 0;
			angular.forEach(vm.groups, function (line) {
				var b = new Date(line[0].xp.deliveryDate);
				var DateB = Date.UTC(b.getFullYear(), b.getMonth() + 1, b.getDate());
				if (DateA == DateB) {
					if (res == 'notsameday') {
						vm.notsameDay[count] = true;
						//line[0].xp.notsameDay = true;
						var c = new Date(line[0].xp.MinDays.MinToday);
						var dateC = Date.UTC(c.getFullYear(), c.getMonth() + 1, c.getDate() + 1);
						var dateD = Date.UTC(c.getFullYear(), c.getMonth() + 1, c.getDate());
						if (dateC != dateD)
							line[0].xp.MinDays.MinToday = dateC;
					}

				}
				count++
			})
		})


		console.log("vm.groups", vm.groups);
		vm.linetotalvalue = 0;
		vm.lineVal = [];
		vm.lineTotal = {};
		for (var n in data) {
			vm.lineVal.push(n);
			vm.lineTotal[n] = _.reduce(_.pluck(data[n], 'LineTotal'), function (memo, num) { return memo + num; }, 0);
		}
	}

	function updateLinedetails(newline, last) {
		///todo line item edited and shoud update correct line item;
		if (last) {
			vm.signin = false;
			vm.delivery = false;
			vm.payment = true;
			vm.openACCItems.name = 'payment';
			vm.openACCItems['deliveryFunc'] = true;
		}

		if (newline.length > 1) {
			for (var i = 0; i < newline.length; i++) {
				if (i != 0) {
					//newline[i].ShippingAddress = newline[0].ShippingAddress;
					newline[i].xp = newline[0].xp;
				}
                //do not use update, you will set anything not listed above to null.
				OrderCloud.LineItems.Patch(Order.ID, newline[i].ID, { xp: newline[i].xp }).then(function (dat) {
					console.log("LineItems Data", dat);
					// OrderCloud.LineItems.SetShippingAddress(Order.ID, newline[i].ID, newline[i].ShippingAddress).then(function (data) {
					// 	console.log("1234567890", data);

					// 	alert("Data submitted successfully");
					// });
				});
			}
		} else {
			OrderCloud.LineItems.Patch(Order.ID, newline[0].ID, { xp: newline[0].xp }).then(function (dat) {
				console.log("LineItems Data", dat);
				// OrderCloud.LineItems.SetShippingAddress(Order.ID, newline[0].ID, newline[0].ShippingAddress).then(function (data) {
				// 	console.log("1234567890", data);
                //     // vm.openACCItems.name = 'payment';
                //     // vm.openACCItems['deliveryFunc'] = true;
				// 	//alert("Data submitted successfully");
				// });
			});
		}
        // vm.openACCItems.name = 'payment';
        // vm.openACCItems['deliveryFunc'] = true;
	}

	vm.setBillAddressForm = function (billingAddress) {
		vm.billingAddress = billingAddress;
		PdpService.GetPhoneNumber(billingAddress.Phone).then(function (resPhones) {
			vm.billingAddress.Phone1 = resPhones[0];
			vm.billingAddress.Phone2 = resPhones[1];
			vm.billingAddress.Phone3 = resPhones[2];
		});
		vm.billingAddress.Zip = parseInt(billingAddress.Zip);
	}

	vm.selectedPaymentTab = function (tab) {
		vm.selectedPaymentTabValue = tab;
	};

    vm.EditBillAddressForm = function (index, card) {
		if (vm['EditBillAddress' + index]) {
			vm['EditBillAddress' + index] = false;
			vm.billingAddress = {};
			vm.addPaymentInfo.card = {};
			vm.showBillingEditForm = false;
		} else {
			vm.addPaymentInfo.card = {};
			vm['EditBillAddress' + index] = true;
			vm.showBillingEditForm = true;
			vm.billingAddress = card.BillingAddress;
		}

	}

	vm.setBillingAddress = function (index, card) {
		vm.SelectedBillingAddressOption = undefined;
		vm.BillingAddressOption = 'AddressBook';
		if (card && card.BillingAddress) {
			vm.addPaymentInfo.card = card;
			delete vm.addPaymentInfo.card.CVV;
			vm.billingAddress = card.BillingAddress;
		} else {
			vm.billingAddress = {};
			vm.addPaymentInfo.card = {};
			vm.showBillingEditForm = false;
		}
	}

	vm.updateBillingAddress = function (data) {
		if (vm.cardsEditForm[index].$dirty && vm.cardsEditForm[index].$valid && data.ID) {
			OrderCloud.Me.UpdateAddress(data.ID, data).then(function (res) {
				console.log(res);
			});
		}
	}

    vm.paymentInfoReview = function () {
		if (vm.orderTotal > 0) {
			if (vm.selectedPaymentTabValue == 'PO' && vm.signnedinuser.xp.PO && vm.signnedinuser.xp.PO.PORequired == 'Yes') {
				vm.reviewOrder();
			} else if (vm.signnedinuser.ID != 'gby8nYybikCZhjMcwVPAiQ' && vm.selectedCard) {
				if (vm.selectedCard == "newCreditCard") {
					if (vm.newBillingForm.$valid && vm.newCreditCardForm.$valid) {
						if (vm.billingAddress.saveCardFuture) {
							vm.addressValdation(vm.billingAddress).then(function () {
								vm.reviewOrder();
							}, function () {
								alert("address not found");
							});

						} else {
							validateCardType();
						}
					} else {
						//alert("plese fill add card form");
					}
				} else if (vm.selectedCard.ID && vm.addPaymentInfo.card && vm.addPaymentInfo.card.CVV) {
					vm.setBillingAddressonOrder(vm.billingAddress);
					vm.reviewOrder();
				} else {
					//alert("Please Enter CVV Number");
				}
			} else if (vm.addCreditCardForm && vm.addCreditCardForm.$valid && vm.addPaymentInfo && vm.billingAddress) {
				vm.billingAddress.Phone = '(' + vm.billingAddress.Phone1 + ')' + " " + vm.billingAddress.Phone2 + '-' + vm.billingAddress.Phone3;
				vm.selectedCard = vm.addPaymentInfo.card;
				validateCardType();
			} else {
				//alert("plese select the card and billingAddress");
			}
		} else {
			vm.reviewOrder();
		}
    }

	function validateCardType() {
		getCardType(vm.addPaymentInfo).then(function (type) {
			vm.setBillingAddressonOrder(vm.billingAddress);
			vm.reviewOrder();
		}, function () {
			//alert("card Number is not valid");
		});
	}

    function addCreditCard() {
		vm.billingAddress.Phone = '(' + vm.billingAddress.Phone1 + ')' + " " + vm.billingAddress.Phone2 + '-' + vm.billingAddress.Phone3;
		vm.billingAddress.Billing = true;
		vm.billingAddress.xp["IsDefault"] = false;
		getCardType(vm.addPaymentInfo).then(function (type) {
			vm.addPaymentInfo.card.CardType = type;
			vm.setBillingAddressonOrder(vm.billingAddress);
			CreditCardService.Create(vm.addPaymentInfo.card).then(function (res) {
				if (res && res.ResponseBody && res.ResponseBody.ID) {
					vm.selectedCard = res.ResponseBody;
					OrderCloud.Me.CreateAddress(vm.billingAddress).then(function (res1) {
						OrderCloud.Me.PatchCreditCard(res.ResponseBody.ID, { "xp": { "BillingAddressID": res1.ID } }).then(function (res2) {
							console.log(res2);
						});
						vm.createdAddress = res1;
						vm.existingCardAuthCapture(vm.selectedCard);
					});
				} else {
					vm.ErrorMessage = res.messages;
				}
			});
		}, function () {
			//alert("card Number is not valid");
		});

	}

	vm.addressValdation = function (billingAddress) {
		var defered = $q.defer();
		AddressValidationService.Validate(billingAddress).then(function (res) {
			if (res.ResponseBody.ResultCode == 'Success') {
				var validatedAddress = res.ResponseBody.Address;
				var zip = validatedAddress.PostalCode.substring(0, 5);
				billingAddress.Zip = parseInt(zip);
				billingAddress.City = validatedAddress.City;
				billingAddress.State = validatedAddress.Region;
				billingAddress.Country = validatedAddress.Country;
				addressValidated = true;
				defered.resolve();
			} else {
				addressValidated = false;
				defered.reject();
			}
		});
		return defered.promise;
	}

	function getCreditCardsBillingAddress(creditCards) {
		angular.forEach(creditCards, function (item) {
			if (item.xp && item.xp.BillingAddressID) {
				OrderCloud.Me.GetAddress(item.xp.BillingAddressID).then(function (res) {
					PdpService.GetPhoneNumber(res.Phone).then(function (resPhones) {
						res.Phone1 = resPhones[0];
						res.Phone2 = resPhones[1];
						res.Phone3 = resPhones[2];
					});
					res.Zip = parseInt(res.Zip);
					item.BillingAddress = res;
				});
			}
		});
	}

	function getCardType(addPaymentInfo) {
		var cards = {
			// "Electron": /^(4026|417500|4405|4508|4844|4913|4917)\d+$/,
			// "Maestro": /^(5018|5020|5038|5612|5893|6304|6759|6761|6762|6763|0604|6390)\d+$/,
			// "Dankort": /^(5019)\d+$/,
			// "Interpayment": /^(636)\d+$/,
			// "Unionpay": /^(62|88)\d+$/,
			"Visa": /^4[0-9]{12}(?:[0-9]{3})?$/,
			"MasterCard": /^5[1-5][0-9]{14}$/,
			"AmericanExpress": /^3[47][0-9]{13}$/,
			//"Diners": /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
			"Discover": /^6(?:011|5[0-9]{2})[0-9]{12}$/,
			//"Jcb": /^(?:2131|1800|35\d{3})\d{11}$/
        };
        var defered = $q.defer();
		var type;
		if (addPaymentInfo && addPaymentInfo.card) {
			for (var key in cards) {
				if (cards[key].test(addPaymentInfo.card.CardNumber)) {
					type = key;
				}
			}
		}
		if (type)
			defered.resolve(type);
		else
			defered.reject();

		return defered.promise;
	}

    vm.reviewOrder = function () {
		vm.openACCItems.name = 'review';
		vm.openACCItems['paymentFunc'] = true;
	}

    vm.validateBachmanCharges = function (bcdata) {
        if (bcdata && bcdata.bachmanscharge) {
            if (bcdata.bachmanscharge == "useExisting") {
                var d1 = new Date();
                var d2 = new Date(vm.bachmanschargeacc.StartDate);
                if (new Date(vm.bachmanschargeacc.StartDate) <= new Date(angular.copy(vm.cstDateTime)) && new Date(vm.bachmanschargeacc.EndDate) >= new Date(angular.copy(vm.cstDateTime))) {
					var amount = vm.orderdata.Total < vm.bachmanschargeacc.Balance ? vm.orderdata.Total : vm.orderdata.Total > vm.bachmanschargeacc.Balance ? vm.bachmanschargeacc.Balance : 100;
					vm.ApplySpendingAccCharges(vm.bachmanschargeacc, amount, vm.orderdata, "Bachman Charges")
                }
            } else if (bcdata.bachmanscharge == "custom" && bcdata.customChargeCode) {
				var d1 = new Date();
                var d2 = new Date(vm.bachmanschargeacc.StartDate);
                if (new Date(vm.bachmanschargeacc.StartDate) <= new Date(angular.copy(vm.cstDateTime)) && new Date(vm.bachmanschargeacc.EndDate) >= new Date(angular.copy(vm.cstDateTime))) {
                    if (parseInt(bcdata.customChargeCode) < vm.orderdata.Subtotal) {
						vm.ApplySpendingAccCharges(vm.bachmanschargeacc, bcdata.customChargeCode, vm.orderdata, "Bachman Charges")
                    } else {
                        //alert("entered amount is greaterthan total");
                    }
                }
            }
        }
    }

	vm.validatePurpleperks = function (ppdata) {
		if (vm.usePurplePerks) {
			var amount = vm.orderdata.Total < vm.purplePerksAcc.Balance ? vm.orderdata.Total : vm.orderdata.Total > vm.purplePerksAcc.Balance ? vm.purplePerksAcc.Balance : 0;
			vm.ApplySpendingAccCharges(vm.purplePerksAcc, amount, vm.orderdata, "Purple Perks")
		} else {
			if (vm.orderDtls.SpendingAccounts.PurplePerks)
				delete vm.orderDtls.SpendingAccounts.PurplePerks;
			vm.SumSpendingAccChrgs();
		}
    }

    vm.validateGiftCard = function (giftCardData) {
		//   if(LoggedinUser.ID == "gby8nYybikCZhjMcwVPAiQ"){
		if (giftCardData && giftCardData.giftCardno) {
			OrderCloud.SpendingAccounts.Get(giftCardData.giftCardno).then(function (data) {
				console.log("Gift Card", data);
				$http.post(GCBalance, { "card_number": giftCardData.giftCardno }).success(function (res2) {
					if (res2.card_value && res2.card_value != data.Balance && res2.card_value != "cardNumber not available")
						data.Balance = res2.card_value;
					vm.UserSpendingAcc[data.Name] = data;
					var d1 = new Date();
					var d2 = new Date(data.EndDate);
					if (new Date(data.StartDate) <= new Date(angular.copy(vm.cstDateTime)) && new Date(data.EndDate) >= new Date(angular.copy(vm.cstDateTime))) {
						vm.orderDtls.SpendingAccounts.GiftCard = {
							"ID": data.ID,
							"Name": "Gift Card applied",
							"Amount": (data.Balance > vm.orderdata.Total) ? vm.orderdata.Total : data.Balance
						};
						vm.SumSpendingAccChrgs();
					} else {
						//alert("gift card is expired");
					}
				});
			});
		}
		//        }else{
		//            vm.giftcard(giftCardData);
		//        }
    }

	vm.ApplySpendingAccCharges = function (obj, amount, orderDtls, type) {
        if (type == "Bachman Charges")
            vm.orderDtls.SpendingAccounts.BachmansCharges = {
                "ID": obj.ID,
				"Name": "Bachman's Charge applied",
                "Amount": amount
            };
        if (type == "Purple Perks")
            vm.orderDtls.SpendingAccounts.PurplePerks = {
                "ID": obj.ID,
				"Name": "Purple Perks applied",
                "Amount": amount
            };
        vm.SumSpendingAccChrgs(orderDtls);
    }

    vm.SumSpendingAccChrgs = function () {
        var sum = 0;
        angular.forEach(vm.orderDtls.SpendingAccounts, function (val, key) {
            //if(key!="Cheque")
            sum = sum + val.Amount;
        }, true);
        if (_.isEmpty(vm.orderDtls.SpendingAccounts)) {
            vm.orderTotal = vm.orderdata.Subtotal + vm.orderdata.ShippingCost + vm.orderdata.TaxCost;
        } else {
            vm.orderTotal = vm.orderdata.Subtotal + vm.orderdata.ShippingCost - sum + vm.orderdata.TaxCost;
        }
		return sum;
    }

	vm.deleteSpendingAcc = function (ChargesType) {
		delete vm.orderDtls.SpendingAccounts[ChargesType];
		vm.SumSpendingAccChrgs();
	};

	function spendingAccountsRedeemtion(SpendingAccounts) {
		var PaymentType, TempStoredArray = [], dat = new Date(angular.copy(vm.cstDateTime)), d = $q.defer(), params;
		angular.forEach(SpendingAccounts, function (val, key) {
			PaymentType = { "Type": "SpendingAccount", "SpendingAccountID": val.ID, "Description": key, "Amount": val.Amount, "xp": null };
			if (key == "Cheque" || key == "PaidCash") {
				PaymentType.Type = "PurchaseOrder";
				delete PaymentType.ID;
				if (key == "Cheque")
					PaymentType.xp = { "ChequeNo": val.ChequeNo };
			}
			TempStoredArray.push(OrderCloud.Payments.Create(vm.orderdata, PaymentType));
		}, true);
		$q.all(TempStoredArray).then(function (result) {
			var TempStoredCreatedArray = [];
			angular.forEach(result, function (val, key) {
				TempStoredCreatedArray.push(OrderCloud.Payments.CreateTransaction(vm.orderdata.ID, val.ID, { "Type": val.Type, "DateExecuted": (dat.getMonth() + 1) + "/" + dat.getDate() + "/" + dat.getFullYear(), "Amount": val.Amount, "xp": null }));
			}, true);
			$q.all(TempStoredCreatedArray).then(function (result2) {
				//console.log("===========>>>"+result2);
				//d.resolve("1");
				var TempStoredCustomArray = [];
				params = {
					"date": (dat.getMonth() + 1) + "-" + dat.getDate() + "-" + dat.getFullYear(),
					"customerId": vm.orderdata.FromUserID,
					"cardNumber": "7777001112223333",
					"cardAmount": "",
					"orderId": vm.orderdata.ID,
					"numberOfGiftCardsRedemeed": "1",
					"redemption": ""
				};
				angular.forEach(result2, function (val, key) {
					if (val.Description == "PurplePerks") {
						params.redemption = "P";
						params.cardNumber = val.RedemptionCode;
						params.cardAmount = parseFloat(vm.UserSpendingAcc['Purple Perks'].Balance) - parseFloat(val.Amount);// Remaining amount in card
						TempStoredCustomArray.push($http.post(GC_PP_Redemption, params));
					}
					if (val.Description == "GiftCard") {
						params.redemption = "G";
						params.cardNumber = val.RedemptionCode;
						params.cardAmount = parseFloat(vm.UserSpendingAcc['Gift Card'].Balance) - parseFloat(val.Amount);// Remaining amount in card
						TempStoredCustomArray.push($http.post(GC_PP_Redemption, params));
					}
				}, true);
				$q.all(TempStoredCustomArray).then(function (result) {
					console.log("========>>>>>>" + result);
				});
			});
			// $q.all(TempStoredCreatedArray).then(function (result2) {
			// 	console.log("===========>>>" + result2);
			// 	d.resolve("1");
			// });
		});
		return d.promise;
	}


	vm.editPopUp = function (lineitem) {
		vm.edit = true;
		var modalInstance = $uibModal.open({
			animation: false,
			backdropClass: 'edittModal',
			windowClass: 'editModal',
			templateUrl: 'checkout/templates/edit.tpl.html',
			controller: 'editCtrl',
			controllerAs: 'edit',
			resolve: {
				Order: function ($q, CurrentOrder) {
                    var dfd = $q.defer();
                    CurrentOrder.GetID()
                        .then(function (data) {
							OrderCloud.Orders.Get(data).then(function (order) {
								dfd.resolve(order)
                            })
                        })
                        .catch(function () {
                            dfd.resolve(null);
                        });
                    return dfd.promise;
                },
				LineItem: function () {
                    return lineitem;
				}

			}
		});

		modalInstance.result.then(function () {

		}, function () {
			angular.noop();
		});
	}

	function viewMore() {
		vm.more = false;
		vm.limit = LineItems.Items.length;
	}
	function viewLess() {
		vm.more = true;
		vm.limit = 3;
	}
	function addRecipient() {

	}
	//	vm.giftcard = function (data) {
	//		console.log(data);
	//		console.log(vm.signnedinuser);
	//		OrderCloud.UserGroups.ListUserAssignments(null, vm.signnedinuser.ID).then(function (dat) {
	//			OrderCloud.SpendingAccounts.Get(data).then(function (resp) {
	//				console.log(resp);
	//			})
	//		})
	//	}

	vm.loginAsExistingUser = function (credentials) {
        var anonUserToken = OrderCloud.Auth.ReadToken();
        OrderCloud.Auth.GetToken(credentials)
            .then(function (token) {
                //$rootScope.$broadcast('userLoggedIn');
                OrderCloud.Auth.SetToken(token.access_token);
                OrderCloud.Me.Get().then(function (res) {
					console.log("LoggedinUser", res);
                    vm.signnedinuser = res;
				})
				OrderCloud.Me.ListCreditCards().then(function (res) {
					console.log("CreditCard,", res);
					vm.creditcards = res;
				})
                OrderCloud.Orders.TransferTempUserOrder(anonUserToken)
                    .then(function () {
						$rootScope.$broadcast('getcurrentuser1');
						angular.element('#info-bar-acc, .sticky #info-bar-acc').addClass('expandAccBlockLoggedIn');
                        vm.openACCItems.name = 'delivery';
                        vm.openACCItems['signinFunc'] = true;
                        $state.reload();
                    }, function () {
						$state.reload('checkout');
						vm.openACCItems.name = 'delivery';
                        vm.openACCItems['signinFunc'] = true;
					})
            });
	};

	//	OrderCloud.SpendingAccounts.ListAssignments(null, vm.signnedinuser.ID).then(function (result) {
	//		angular.forEach(result.Items, function (value, key) {
	//			console.log(value);
	//			OrderCloud.SpendingAccounts.Get(value.SpendingAccountID).then(function (data) {
	//				if (data.Name == "Purple Perks") {
	//					vm.purpleperksacc = data;
	//				}
	//			})
	//		})
	//	})

	function bachmanscharge() {
		OrderCloud.SpendingAccounts.ListAssignments(null, vm.signnedinuser.ID).then(function (result) {
            if (result.Items && result.Items.length > 0) {
				var TempStoredArray = [];
				angular.forEach(result.Items, function (val, key) {
					TempStoredArray.push(OrderCloud.SpendingAccounts.Get(val.SpendingAccountID));
				}, true);
				$q.all(TempStoredArray).then(function (result1) {
					var TempStoredCustomArray = [];
					angular.forEach(result1, function (val, key) {
						if (val.Name == "Purple Perks") {
							vm.purplePerksAcc = val;
							TempStoredCustomArray.push($http.post(PPBalance, { "card_number": val.RedemptionCode }));
						}
						if (val.Name == "Bachmans Charge")
							vm.bachmanschargeacc = val;
					}, true);
					$q.all(TempStoredCustomArray).then(function (result2) {
						angular.forEach(result2, function (val, key) {
							var row = _.findWhere(result1, { RedemptionCode: val.config.data.card_number });
							if (val.data.card_value && val.data.card_value != row.Balance && val.data.card_value != "cardNumber not available")
								row.Balance = val.data.card_value;
							vm.purplePerksAcc = row;
						}, true);
					});
				});
            }
		});
	}
	vm.hideBillingAddress = function () {
		$('.gift-card-opt').on('click', function () { $('.billing-addr-cont').hide() });
	}
	vm.showBillingAddress = function () {
		$('.credit-card-opt').on('click', function () { $('.billing-addr-cont').show() });
	}

	vm.setBillingAddressonOrder = function (address) {
		OrderCloud.Orders.SetBillingAddress(vm.orderdata.ID, address, null).then(function (data) {
			console.log(data);
		});
	}

	vm.submitOrder = function () {
		spendingAccountsRedeemtion().then(function (res1) {
			if (res1 == "1") {
				vm.placeOrder();
			}
		});
	}

    vm.placeOrder = function () {
		vm.orderdata.Total = vm.orderTotal;
		if (vm.orderdata.Total > 0 && vm.selectedCard && vm.selectedPaymentTabValue != 'PO') {
            if (vm.selectedCard.ID) {
				if (vm.addPaymentInfo.card.CVV) {
					vm.selectedCard.CVV = vm.addPaymentInfo.card.CVV;
					vm.existingCardAuthCapture(vm.selectedCard);
				} else {
					//alert("CVV Not Entered");
				}
            } else if (vm.selectedCard == "newCreditCard" && vm.billingAddress.saveCardFuture) {
				addCreditCard();
			} else if (vm.addPaymentInfo.card.CVV) {
				//vm.selectedCard.CVV = vm.addPaymentInfo.card.CVV;
				getCardType(vm.addPaymentInfo).then(function (type) {
					vm.addPaymentInfo.card.cardType = type;
					CreditCardService.SingleUseAuthCapture(vm.addPaymentInfo.card, vm.orderdata)
						.then(function () {
							OrderCloud.Orders.Submit(vm.orderdata.ID)
								.then(function () {
									TaxService.CollectTax(vm.orderdata.ID)
										.then(function (data) {
											console.log(data);
											vm.addTaxtoLineItem(data);
											CurrentOrder.Remove();
											$state.go('orderConfirmation', { userID: vm.orderdata.FromUserID, ID: vm.orderdata.ID });
										});
								});
						});
				}, function () {
					//alert("card Number is not valid");
				});
			} else {
				//alert("CVV Not Entered");
			}
        } else {
			OrderCloud.Orders.Submit(vm.orderdata.ID).then(function () {
				if (vm.selectedPaymentTabValue == 'PO') {
					vm.order.xp.PONumber = vm.CurrentUser.xp.PO.PONumber;
					OrderCloud.Orders.Update(vm.order.ID, vm.order);
				}
				TaxService.CollectTax(vm.orderdata.ID)
					.then(function (data) {
						console.log(data);
						vm.addTaxtoLineItem(data);
						CurrentOrder.Remove();
						$state.go('orderConfirmation', { userID: vm.orderdata.FromUserID, ID: vm.orderdata.ID });
					})
			});

		}
    }

	vm.existingCardAuthCapture = function (cardData) {
		CreditCardService.ExistingCardAuthCapture(cardData, vm.orderdata)
			.then(function () {
				OrderCloud.Orders.Submit(vm.orderdata.ID)
					.then(function () {
						TaxService.CollectTax(vm.orderdata.ID)
							.then(function (data) {
								console.log(data);
								vm.addTaxtoLineItem(data);
								CurrentOrder.Remove();
								$state.go('orderConfirmation', { userID: vm.orderdata.FromUserID, ID: vm.orderdata.ID });
							})
					});
			});
	}

	function addTaxtoLineItem(data) {
        var promise = [];
		var count = 0;
		angular.forEach(data.ResponseBody.TaxLines, function (item) {
			promise[count] = callTaxtoLineItem(item);
			count++
		});
		function callTaxtoLineItem(item) {
			var defer = $q.defer();
			OrderCloud.LineItems.Patch(Order.ID, item.LineNo, { xp: { Tax: item.Tax } }).then(function (data) {
				defer.resolve(data);
			});
			return defer.promise;
		}
		$q.all(promise).then(function (result2) {
			console.log("===========>>>" + result2);
		});
	}
	function nonWiredSubTotalCall(order) {
		OrderCloud.LineItems.List(order.ID).then(function (resitems) {
			var data = _.groupBy(resitems.Items, function (value) {
				if (value.ShippingAddress != null) {
					//totalCost += value.xp.TotalCost;
					value.xp.deliveryDate = new Date(value.xp.deliveryDate);
					return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.ShippingAddress.Zip + '' + new Date(value.xp.deliveryDate) + '' + value.xp.DeliveryMethod;
				}
			});
			var groups = data;
			TaxService.GetTax(order.ID).then(function (res) {
				var tempArr = [], obj = {}, obj2 = {};
				_.filter(groups, function (arr) {
					_.each(arr, function (obj) {
						if (obj.xp.Status != "OnHold") {
							order.xp.NonWiredSubtotal += LineTotal;
						}
						var row = _.findWhere(res.ResponseBody.TaxLines, { LineNo: obj.ID });
						angular.forEach(row.TaxDetails, function (val) {

							obj[val.JurisType] = val.JurisName;
						}, true);
					});
				});


				angular.forEach(res.ResponseBody.TaxLines, function (val, key) {

				}, true);
				$q.all(tempArr).then(function (res2) {

				});
			});

			if (order.xp.NonWiredSubtotal && order.xp.NonWiredSubtotal > 0) {
				OrderCloud.As().Me.Patch(order.ID, { "xp": { "NonWiredSubtotal": order.xp.NonWiredSubtotal } }).then(function (res) {
					console.log("Success");
				}).catch(function (err) {
					console.log("Failure");
				});
			}

		}).catch(function (err) {
			console.log(err)
		});

	}

}
function EditController($uibModalInstance, LineItem, Order, checkOutService, $rootScope) {
	var vm = this;
	vm.getCityState = getCityState;
	vm.changeDetails = changeDetails;
	vm.init = init;
	init();
	vm.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
	function getCityState(line, zip) {
		checkOutService.getCityState(zip).then(function (res) {
			line.ShippingAddress.City = res.City;
			line.ShippingAddress.State = res.State;
			line.ShippingAddress.Country = res.Country
		});
	}
	function init() {
		if (LineItem) {
			vm.lineitem = LineItem;
			if (vm.lineitem.ShippingAddress.Phone) {
				vm.lineitem.ShippingAddress.Phone1 = vm.lineitem.ShippingAddress.Phone.slice(0, 3);
				vm.lineitem.ShippingAddress.Phone2 = vm.lineitem.ShippingAddress.Phone.slice(3, 6);
				vm.lineitem.ShippingAddress.Phone3 = vm.lineitem.ShippingAddress.Phone.slice(6);
			}
		}
	}
	function changeDetails(lineitem) {
		if (lineitem.ShippingAddress.Phone1 && lineitem.ShippingAddress.Phone2 && lineitem.ShippingAddress.Phone3) {

			lineitem.ShippingAddress.Phone = lineitem.ShippingAddress.Phone1 + lineitem.ShippingAddress.Phone2 + lineitem.ShippingAddress.Phone3;
		}
		return $rootScope.$emit("ChangedDetails", lineitem)

	}
}
function maxLength() {
	return {
		restrict: "A",
		link: function (scope, elem, attrs) {
			var limit = parseInt(attrs.maxLength);
			angular.element(elem).on("keypress", function (e) {
				if (this.value.length == limit) {
					e.preventDefault();
					$(this).next().focus();
				}
				if (this.value.length == (limit - 1)) {
					$(this).next().focus();
				}
			});
		}
	}
};