export const CateringApiUrls = {
  companyList: '/company/list',
  companySave: '/company/save',
  companyDelete: (id: number) => `/company/${id}`,

  mealPlanByCompany: (companyId: number) => `/mealplan/by-company/${companyId}`,
  mealPlanOverrides: (mealPlanId: number) => `/mealplan/overrides/${mealPlanId}`,
  mealPlanSave: '/mealplan/save',
  mealPlanSaveOverride: '/mealplan/save-override',
  mealPlanFinalQty: '/mealplan/final-qty',

  scannerValidateAndSave: '/scanner/validate-and-save',

  billingGenerateMonthly: '/billing/generate-monthly'
};