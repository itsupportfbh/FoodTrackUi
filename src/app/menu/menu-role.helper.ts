import { CoreMenu } from '@core/types';
import { menu } from './menu';

export class MenuRoleHelper {
  static getMenuByRole(roleId: number): CoreMenu[] {
    switch (Number(roleId)) {
      case 1:
        return this.filterMenus([
          'dashboard',
          'master',
          'CompanyMaster',
          'qrgenerateList',
          'Reports'
        ]);

      case 2:
        return this.filterMenus([
         
          'Request',
          'Order',
          'Reports'
        ]);

      case 3:
        return this.filterMenus([
           
          'Scanner'
        ]);

      default:
        return [];
    }
  }

  private static filterMenus(allowedIds: string[]): CoreMenu[] {
    return menu
      .filter(item => allowedIds.includes(item.id))
      .map(item => ({
        ...item,
        children: item.children ? [...item.children] : undefined
      }));
  }
}