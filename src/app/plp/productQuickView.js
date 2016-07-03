// angular.module('orderCloud')
//     .directive( 'ordercloudProductQuickView', ordercloudProductQuickViewDirective)
//     .controller( 'ProductQuickViewCtrl', ProductQuickViewController)
//     .controller ('ProductQuickViewModalCtrl', ProductQuickViewModalController)
// ;

// function ordercloudProductQuickViewDirective(){
//     return{
//         scope:{
//             product: '='
//         },
//         restrict:'E',
//         templateUrl:'plp/templates/quick-view.tpl.html',
//         controller:'ProductQuickViewCtrl',
//         controllerAs:'productQuickView'
//     }
// }

// function ProductQuickViewController ($uibModal){
//     var vm = this;
//     console.log(product);
//     vm.open = function (product){
//         $uibModal.open({
//             animation:true,
//             size:'lg',
//             templateUrl: 'plp/templates/quick-view-model.tpl.html',
//             controller: 'ProductQuickViewModalCtrl',
//             controllerAs: 'productQuickViewModal',

//             resolve: {
//                 SelectedProduct: function (OrderCloud) {
//                     return OrderCloud.Me.GetProduct(product.ID);
//                 },
//                 SpecList: function(OrderCloud, $q) {
//                     var queue = [];
//                     var dfd = $q.defer();
//                     OrderCloud.Specs.ListProductAssignments(null, product.ID)
//                         .then(function(data) {
//                             angular.forEach(data.Items, function(assignment) {
//                                 queue.push(OrderCloud.Specs.Get(assignment.SpecID));
//                             });
//                             $q.all(queue)
//                                 .then(function(result) {
//                                     var specOptionsQueue = [];
//                                     angular.forEach(result, function(spec) {
//                                         spec.Value = spec.DefaultValue;
//                                         spec.OptionID = spec.DefaultOptionID;
//                                         spec.Options = [];
//                                         if (spec.OptionCount) {
//                                             specOptionsQueue.push((function() {
//                                                 var d = $q.defer();
//                                                 OrderCloud.Specs.ListOptions(spec.ID, null, 1, spec.OptionCount)
//                                                     .then(function(optionData) {
//                                                         spec.Options = optionData.Items;
//                                                         d.resolve();
//                                                     });
//                                                 return d.promise;
//                                             })());
//                                         }
//                                     });
//                                     $q.all(specOptionsQueue).then(function() {
//                                         dfd.resolve(result);
//                                     });
//                                 });
//                         })
//                         .catch(function(response) {

//                         });
//                     return dfd.promise;
//                 }
//             }
//         });
//     };
// }

// function ProductQuickViewModalController(/*$uibModalInstance, SelectedProduct, SpecList, AddToOrder*/){
//     var vm = this;

// }
