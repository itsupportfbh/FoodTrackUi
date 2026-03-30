export const CateringApiUrls = {
  companyList: '/api/company/list',
  companySave: '/api/company/save',
  companyDelete:(id:number) =>`/api/company/${id}`,

  mealPlanByCompany: (companyId: number) => `/api/mealplan/by-company/${companyId}`,
  mealPlanOverrides: (mealPlanId: number) => `/api/mealplan/overrides/${mealPlanId}`,
  mealPlanSave: '/api/mealplan/save',
  mealPlanSaveOverride: '/api/mealplan/save-override',
  mealPlanFinalQty: '/api/mealplan/final-qty',

  scannerValidateAndSave: '/api/scanner/validate-and-save',

  billingGenerateMonthly: '/api/billing/generate-monthly'
};
