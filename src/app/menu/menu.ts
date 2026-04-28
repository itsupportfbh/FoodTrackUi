import { CoreMenu } from '@core/types';

export const menu: CoreMenu[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    translate: 'MENU.HOME',
    type: 'item',
    icon: 'home',
    url: '/',
    exactMatch: true
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
  id: 'price',
  title: 'Price',
  translate: 'MENU.SAMPLE',
  type: 'item',
  icon: 'dollar-sign',
  url: 'master/priceLists',
  activeUrls: ['master/price']
},
      {
        id: 'site_settings',
        title: 'Configuration',
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
    url: 'catering/request',
    activeUrls: ['catering/request-create', 'catering/request-edit']
  },
  {
    id: 'Request',
    title: 'Order Override',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'edit-3',
    url: 'requestoverride/Request-override-list',
    activeUrls: ['requestoverride/Request-override']
  },
  {
    id: 'qrgenerateList',
    title: 'Generate QR',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'grid',
    url: 'scanner/listqr',
    activeUrls: ['scanner/qrgenerate']
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
    url: 'users/users-list',
    activeUrls: ['users/users-create']
  },
    {
    id: 'menu',
    title: 'Menu',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'book-open',
    url: 'menu/menu'
  },
      {
    id: 'meal',
    title: 'Meal',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'coffee',
    url: 'meal/meal-request'
  },
        {
    id: 'showqr',
    title: 'Show-QR',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'grid',
    url: 'meal/show-qr'
  }
];
