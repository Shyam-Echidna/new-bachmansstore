angular.module('orderCloud')

	.config(orderConfirmationConfig)
	.controller('orderConfirmationCtrl', orderConfirmationController)
	;

function orderConfirmationConfig($stateProvider) {
	$stateProvider
		.state('orderConfirmation', {
			parent: 'base',
			url: '/orderConfirmation',
			templateUrl: 'orderConfirmation/templates/orderConfirmation.tpl.html',
			controller: 'orderConfirmationCtrl',
			controllerAs: 'orderConfirmation'
		})
}
function orderConfirmationController($cookieStore, CurrentOrder, $state, OrderCloud) {

	var vm = this;
	vm.isLoggedIn = $cookieStore.get('isLoggedIn');
	vm.order = {};
	vm.continueShopping = continueShopping;

	CurrentOrder.Get().then(function (order) {
		console.log("order= " + order);
		vm.order = order;
		
	});
	OrderCloud.Me.Get().then(function (res) {
		vm.user=res;
	});
		function continueShopping() {
			$state.go('home');
		}
	}