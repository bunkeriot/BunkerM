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
      name: 'Typography',
      path: '/typography',
      component: () => import('@/views/typography/TypographyPage.vue')
    },
    {
      name: 'Colors',
      path: '/colors',
      component: () => import('@/views/colors/ColorPage.vue')
    },
    {
      name: 'Shadow',
      path: '/shadow',
      component: () => import('@/views/shadows/ShadowPage.vue')
    },
    {
      name: 'Color',
      path: '/icon/ant',
      component: () => import('@/views/icons/AntDesignIcons.vue')
    },
    {
      name: 'other',
      path: '/sample-page',
      component: () => import('@/views/StarterPage.vue')
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
  ]


  
};

export default MainRoutes;
