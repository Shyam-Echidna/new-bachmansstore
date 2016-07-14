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
function orderConfirmationController($scope) {

	var vm = this;

}