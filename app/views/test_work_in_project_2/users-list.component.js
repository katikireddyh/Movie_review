//Component to display the list of users for a company
//I put on my robe and wizard hat...
(function(angular) {
  'use strict';

  angular
    .module('partnerAdmin.components')
    .component('partnerUsersList', {
      templateUrl: 'app/partnerAdmin/components/users/users-list.html',
      controller: PartnerUsersListController,
      bindings: {
        menuOptions: '<'
      }
    });

  /** @ngInject **/
  function PartnerUsersListController($log, partnerAdminService, modalService, storageHelper, notificationService, portalService, $state, $timeout, $scope) {
    var $ctrl = this;
    $ctrl.$onInit = $onInit;
    $ctrl.getUsers = getUsers;
    $ctrl.showAddUserForm = showAddUserForm;
    $ctrl.showEditUserForm = showEditUserForm;
    $ctrl.checked = false;
    $ctrl.getAllUsers = getAllUsers;

    $ctrl.usersList = [];
    $ctrl.totalUsers = 0;
    $ctrl.usersPerPage = 0;
    $ctrl.getPermissions = getPermissions;
    $ctrl.companyId = undefined;
    $ctrl.deleteUser = deleteUser;

    $ctrl.currentPage = 1;
    $ctrl.pageChanged = pageChanged;
    $ctrl.loggedUser = loggedUser;
    $ctrl.filterUsers = filterUsers;
    $ctrl.userOffices = userOffices;


    function $onInit() {
      // $log.debug('initializing the users list page');
      $ctrl.companyId = storageHelper.getItem('company'); //Get company id when the user has been authenticated
      if($ctrl.companyId) {
        $ctrl.getUsers();
      } else {
        notificationService.updateNotification('error', "Oops! Something went wrong, please try again.");
      }
      $ctrl.getPermissions();
    }


    function pageChanged(pageNumber) {
      $ctrl.getUsers(pageNumber);
    }

    //Get the list of users
    function getUsers(page, showLoading) {
      var inactive;
      if($ctrl.checked) { inactive = 1 };
      $ctrl.currentPage = page ? page : $ctrl.currentPage;
      if(!showLoading) notificationService.loading();
      partnerAdminService.getUsers($ctrl.companyId, inactive, $ctrl.currentPage, $ctrl.query).then(function(response) {
        $log.debug('received response from the get users method of admin http service', response.data);
        $ctrl.usersList = response.data.users;
        $ctrl.totalUsers = response.data.paging.total_entries;
        $ctrl.usersPerPage = response.data.paging.per_page;
      });
    }

    function getAllUsers() {
      $ctrl.checked = !$ctrl.checked;
      $ctrl.getUsers();
    }

    function filterUsers() {
      var inactive;
      if($ctrl.checked) { inactive = 1 };
      $ctrl.getUsers(1, true);
    }

    $scope.$watch('$ctrl.query', function ()
    {
      filterUsers();
    });

    //Display the Edit User form and set up bindings for it
    function showEditUserForm(user) {
      $log.debug('inside the show edit user form method with given id', user.id);
      if (user.can_edit) {
        $state.go('base.users.edit', { 'user_id' : user.id, 'can_delete' : user.can_delete });
      } else {
        notificationService.updateNotification('error', "Oops! You are not authorized to edit this user, please try again.");
      }
    }

    //Display the Add User form
    function showAddUserForm() {
      $state.go('base.users.add');
    }

    function getPermissions() {
      partnerAdminService.getPermissions().then(function(response) {
        $log.debug('received response from the get permissions method of admin http service', response.data);
        $ctrl.permissions = response.data;
      });
    }

    function loggedUser(user) {
      return (user.id === portalService.user.getUser().uid)
    }

    function userOffices(user) {
      if (user.company_admin) return ['All'];
      if (user.offices.length === 0) return ['None'];
      return user.offices.map(function(office) { return office.name })
    }

    function deleteUser(user) {
      var header = "Confirm User Delete";
      var text = "Are you sure you want to delete User: " + user.name + " ?";
      var cb = function() {
        partnerAdminService.deleteUser($ctrl.companyId, user.id)
        .then(function(){
          getUsers();
        });
      };
      modalService.confirm(header, text, cb);
    }
  }
})(angular);
