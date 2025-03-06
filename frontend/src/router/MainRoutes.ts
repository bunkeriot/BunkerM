// icons
import {
  DashboardOutlined,
  UserOutlined
} from '@ant-design/icons-vue';

const MainRoutes = {
  path: '/',
  meta: {
    requiresAuth: true
  },
  redirect: '/dashboard',
  component: () => import('@/layouts/dashboard/DashboardLayout.vue'),
  children: [
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/dashboard/DefaultDashboard.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/account-manager',
      name: 'Account Manager',
      component: () => import('@/views/dashboard/AccountManager.vue'),
      meta: {
        requiresAuth: true,
        title: 'Account Manager',
        icon: UserOutlined
      }
    },
    {
      path: '/mqtt/brokerlogs',
      name: 'Broker Logs',
      component: () => import('@/views/mqtt/BrokerLogs.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/mqtt/clientlogs',
      name: 'Client Logs',
      component: () => import('@/views/mqtt/ClientLogs.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/mqtt/clients',
      name: 'Client Accounts',
      component: () => import('@/views/mqtt/ClientsPage.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/mqtt/groups',
      name: 'Client Groups',
      component: () => import('@/views/mqtt/GroupsPage.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/mqtt/roles',
      name: 'Client Roles',
      component: () => import('@/views/mqtt/RolesPage.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/mqtt/import-password',
      name: 'Import Password File',
      component: () => import('@/views/mqtt/ImportPasswordPage.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/cloud/awsbridgemanager',
      name: 'AWS Bridge Manager',
      component: () => import('@/views/cloud/AwsBridgeManager.vue'),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/cloud/azurebridgemanager',
      name: 'Azure Bridge Manager',
      component: () => import('@/views/cloud/AzureBridgeManager.vue'),
      meta: {
        requiresAuth: true
      }
    },

    {
      name: 'Config',
      path: '/mqtt/config',
      component: () => import('@/views/mqtt/MosquittoConfigPage.vue')
    },
    {
      name: 'Dynsec-Config',
      path: '/mqtt/dynsec-config',
      component: () => import('@/views/mqtt/DynSecJsonPage.vue')
    },
 /*    {
      path: '/sample-page',
      name: 'Sample Page',
      component: () => import('@/views/StarterPage.vue'),
      meta: {
        requiresAuth: true
      }
    } */
  ]
};

export default MainRoutes;
