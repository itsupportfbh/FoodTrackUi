import { CoreMenu } from '@core/types';

export const menu: CoreMenu[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    translate: 'MENU.HOME',
    type: 'item',
    icon: 'home',
    url: 'dashboard'
  },
  {
    id: 'master',
    title: 'Master',
    translate: 'MENU.SAMPLE',
    type: 'collapsible',
    icon: 'settings',
    children: [
      {
        id: 'location',
        title: 'Location',
        translate: 'MENU.SAMPLE',
        type: 'item',
        icon: 'map-pin',
        url: 'master/location'
      },
      {
        id: 'session',
        title: 'Session',
        translate: 'MENU.SAMPLE',
        type: 'item',
        icon: 'clock',
        url: 'master/session'
      },
      {
        id: 'cuisine',
        title: 'Cuisine',
        translate: 'MENU.SAMPLE',
        type: 'item',
        icon: 'coffee',
        url: 'master/cuisine'
      },
      {
        id: 'site_settings',
        title: 'Site Settings',
        translate: 'MENU.SAMPLE',
        type: 'item',
        icon: 'tool',
        url: 'master/site_settings'
      }
    ]
  },
  {
    id: 'CompanyMaster',
    title: 'Company',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'globe',
    url: 'catering/CompanyMaster'
  },
  {
    id: 'Order',
    title: 'Order',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'shopping-cart',
    url: 'catering/request'
  },
  {
    id: 'Request',
    title: 'Order Override',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'edit-3',
    url: 'requestoverride/Request-override-list'
  },
  {
    id: 'qrgenerateList',
    title: 'Generate QR',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'grid',
    url: 'scanner/listqr'
  },
  {
    id: 'Scanner',
    title: 'Scanner',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'camera',
    url: 'scanner/scanner'
  },
  {
    id: 'Reports',
    title: 'Reports',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'bar-chart-2',
    url: 'catering/reports'
  },
    {
    id: 'users',
    title: 'Users',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'user-plus',
    url: 'users/users-list'
  }
];