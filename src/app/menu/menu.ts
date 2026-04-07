import { CoreMenu } from '@core/types'

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
        icon: 'file',
        url: 'master/location'
      },
       {
        id: 'session',
        title: 'Session',
        translate: 'MENU.SAMPLE',
        type: 'item',
        icon: 'file',
        url: 'master/session'
      },      
      {
        id: 'cuisine',
        title: 'Cuisine',
        translate: 'MENU.SAMPLE',
        type: 'item',
        icon: 'file',
        url: 'master/cuisine'
      },
      {
        id: 'site_settings',
        title: 'Site Settings',
        translate: 'MENU.SAMPLE',
        type: 'item',
        icon: 'file',
        url: 'master/site_settings'
      },
    
      
 
    ]
  },
   {
    id: 'CompanyMaster',
    title: 'Company',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'file',
    url: 'catering/CompanyMaster'
  },
  {
    id: 'Order',
    title: 'Order',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'file',
    url: 'catering/request'
  },
   {
    id: 'Request',
    title: 'Order Override',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'file',
    url: 'requestoverride/Request-override-list'
  },
  {
      id: 'qrgenerate',
      title: 'Generate QR',
      translate: 'MENU.SAMPLE',
      type: 'item',
      icon: 'file',
      url: 'scanner/qrgenerate'
    },
  {
    id: 'Scanner',
    title: 'Scanner',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'file',
    url: 'scanner/scanner'
  },

  {
    id: 'Reports',
    title: 'Reports',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'file',
    url: 'catering/reports'
  },
]
