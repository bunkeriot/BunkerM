// icons
import {

  UserOutlined,
  FileTextOutlined
} from '@ant-design/icons-vue'; 

import { BrandAwsIcon, BrandAzureIcon,UnlinkIcon,Stack3Icon, DashboardIcon, ShieldPlusIcon, AssemblyIcon,PasswordIcon, FileAnalyticsIcon } from 'vue-tabler-icons';

export interface menu {
  header?: string;
  title?: string;
  icon?: object;
  to?: string;
  divider?: boolean;
  chip?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
  subCaption?: string;
}


const sidebarItem: menu[] = [
  { header: 'Monitoring' },
  {
    title: 'Dashboard',
    icon: DashboardIcon,
    to: '/dashboard'
  },
  {
    title: 'Broker Logs',
    icon: FileAnalyticsIcon,
    to: '/mqtt/brokerlogs'
  },
  {
    title: 'Connected Clients',
    icon: UnlinkIcon,
    to: '/mqtt/clientlogs'
  },



  { header: 'Security' },
  {
    title: 'Client Accounts',
    icon:  AssemblyIcon,
    to: '/mqtt/clients'
  },
  {
    title: 'Client Groups',
    icon: Stack3Icon,
    to: '/mqtt/groups'
  },

  {
    title: 'Client Roles',
    icon: ShieldPlusIcon,
    to: '/mqtt/roles'
  },
  {
    title: 'Import Password File',
    icon: PasswordIcon,
    to: '/mqtt/import-password'
  },


  { header: 'Cloud Bridges' },
  {
    title: 'IoT Core',
    icon: BrandAwsIcon,
    to: '/cloud/awsbridgemanager'
  },
  {
    title: 'IoT Hub',
    icon: BrandAzureIcon,
    to: '/cloud/azurebridgemanager'
  },

  { header: 'Administration' },
  {
    title: 'Account Manager',
    icon: UserOutlined,
    to: '/account-manager',
    chip: 'Local',
    chipColor: 'primary',
    chipVariant: 'flat'
  },
];

export default sidebarItem;
