const MainRoutes = {
  path: '/main',
  meta: {
    requiresAuth: true
  },
  redirect: '/main',
  component: () => import('@/layouts/dashboard/DashboardLayout.vue'),
  children: [
    {
      name: 'LandingPage',
      path: '/',
      component: () => import('@/views/dashboard/DefaultDashboard.vue')
    },
    {
      name: 'Dashboard',
      path: '/dashboard',
      component: () => import('@/views/dashboard/DefaultDashboard.vue')
    },

    {
      name: 'Clients',
      path: '/mqtt/clients',
      component: () => import('@/views/mqtt/ClientsPage.vue')
    },
    {
      name: 'Roles',
      path: '/mqtt/roles',
      component: () => import('@/views/mqtt/RolesPage.vue')
    },
    {
      name: 'Groups',
      path: '/mqtt/groups',
      component: () => import('@/views/mqtt/GroupsPage.vue')
    },

    {
      name: 'ImportPassword',
      path: '/mqtt/import-password',
      component: () => import('@/views/mqtt/ImportPasswordPage.vue')
    },

    {
      name: 'ClientLogs',
      path: '/mqtt/clientlogs',
      component: () => import('@/views/mqtt/ClientLogs.vue')
    },

    {
      name: 'AWS',
      path: '/cloud/awsbridgemanager',
      component: () => import('@/views/cloud/AwsBridgeManager.vue')
    },
    {
      name: 'Azure',
      path: '/cloud/azurebridgemanager',
      component: () => import('@/views/cloud/AzureBridgeManager.vue')
    },

    {
      name: 'Config',
      path: '/mqtt/config',
      component: () => import('@/views/mqtt/MosquittoConfigPage.vue')
    },
  ]


  
};

export default MainRoutes;
