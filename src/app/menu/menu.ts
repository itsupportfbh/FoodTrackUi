import { CoreMenu } from '@core/types'

export const menu: CoreMenu[] = [
  {
    id: 'home',
    title: 'Home',
    translate: 'MENU.HOME',
    type: 'item',
    icon: 'home',
    url: 'home'
  },
  // {
  //   id: 'sample',
  //   title: 'Sample',
  //   translate: 'MENU.SAMPLE',
  //   type: 'item',
  //   icon: 'file',
  //   url: 'sample'
  // },
   {
    id: 'CompanyMaster',
    title: 'CompanyMaster',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'file',
    url: 'catering/CompanyMaster'
  },
   {
    id: 'DailyOrder',
    title: 'Order',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'file',
    url: 'catering/daily-order'
  },
   {
    id: 'MealPlan',
    title: 'MealPlan',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'file',
    url: 'catering/meal-plan'
  },
   {
    id: 'Reports',
    title: 'Reports',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'file',
    url: 'catering/reports'
  },
   {
    id: 'Scanner',
    title: 'Scanner',
    translate: 'MENU.SAMPLE',
    type: 'item',
    icon: 'file',
    url: 'catering/scanner'
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
      }
    ]
  }
]
