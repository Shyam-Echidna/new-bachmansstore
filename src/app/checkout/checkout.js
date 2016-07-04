angular.module( 'orderCloud')

	.config( CheckoutConfig )
	.controller( 'CheckoutCtrl', CheckoutController )
;

function CheckoutConfig( $stateProvider ) {
	$stateProvider
		.state( 'checkout', {
			parent: 'base',
			url: '/checkout',
			templateUrl: 'checkout/templates/checkout.tpl.html',
			controller: 'CheckoutCtrl',
			controllerAs: 'checkout',
	 resolve: {
  

   }
		})
}
function CheckoutController( $scope, $window, HomeFact, PlpService, $q, $sce, alfcontenturl, CategoryService, Underscore, $rootScope) {

	var vm = this;

}