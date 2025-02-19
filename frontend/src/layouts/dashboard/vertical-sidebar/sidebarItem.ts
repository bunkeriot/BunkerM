// icons
import {
  QuestionOutlined,
  DashboardOutlined,
  ChromeOutlined,
  LoginOutlined,
  ProfileOutlined,
  FontSizeOutlined,
  BgColorsOutlined,
  BarcodeOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  LinkOutlined,
  GroupOutlined,
  CloudSyncOutlined
} from '@ant-design/icons-vue';

import { BrandAwsIcon, BrandAzureIcon,UnlinkIcon,Stack3Icon, DashboardIcon, ShieldPlusIcon, AssemblyIcon } from 'vue-tabler-icons';

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
    title: 'Broker',
    icon: DashboardIcon,
    to: '/dashboard'
  },

  {
    title: 'Connected Clients',
    icon: UnlinkIcon,
    to: '/mqtt/clientlogs'
  },



  

/*   { header: 'Authentication' },
  {
    title: 'Login',
    icon: LoginOutlined,
    to: '/auth/login'
  },
  {
    title: 'Register',
    icon: ProfileOutlined,
    to: '/auth/register'
  }, */

/*   { header: 'Monitoring' },
  {
    title: 'Broker',
    icon: LineChartOutlined,
    to: '/mqtt/StatusPage'
  },

  {
    title: 'Topic Tree',
    icon: ApartmentOutlined,
    to: '/mqtt/MqttTopicTree',
  }, */


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


  { header: 'Utilities' },
/*   {
    title: 'Typography',
    icon: FontSizeOutlined,
    to: '/typography'
  },
  {
    title: 'Color',
    icon: BgColorsOutlined,
    to: '/colors'
  },
  {
    title: 'Shadow',
    icon: BarcodeOutlined,
    to: '/shadow'
  },
  {
    title: 'Ant Icons',
    icon: CrownOutlined,
    to: '/icon/ant'
  },
  { header: 'Support' },
  {
    title: 'Sample Page',
    icon: ChromeOutlined,
    to: '/sample-page'
  }, */
  {
    title: 'Documentation',
    icon: QuestionOutlined,
    to: 'https://docs.bunkeriot.com',
    type: 'external',
    chip: 'gitbook',
    chipColor: 'secondary',
    chipVariant: 'flat'
  }
];

export default sidebarItem;
