/**
 * Helper to check whether a staff permission key is active for the current branch
 * based on its operational module feature toggles.
 * If an operational module is disabled at the branch level (e.g. Delivery, Kitchen, Attendance),
 * staff cannot be assigned that permission, and it is hidden from permission forms and tables.
 */
export function isPermAllowedForBranch(
  permKey: string,
  toggles?: Record<string, boolean> | null
): boolean {
  if (!toggles || Object.keys(toggles).length === 0) return true;

  // Kitchen Display System (KOT)
  if (permKey === "kitchen") {
    const isKds = toggles.kds !== undefined ? toggles.kds : toggles.kotKitchen;
    if (isKds === false) return false;
  }

  // Reception / Queue Screen
  if (permKey === "reception_view") {
    const isRec = toggles.reception ?? toggles.receptionView ?? false;
    if (!isRec) return false;
  }

  // Delivery Fleet & Logistics
  if (["delivery", "driver_drop", "vehicles"].includes(permKey)) {
    const isDel = toggles.delivery ?? toggles.deliveryFleet ?? false;
    if (!isDel) return false;
  }

  // Customer CRM
  if (permKey === "customers" && toggles.customers === false) {
    return false;
  }

  // Staff Attendance & Scheduling HR
  if (["attendance_report", "employee_schedule"].includes(permKey)) {
    const isAtt = toggles.attendance ?? toggles.employeeAttendance ?? true;
    if (isAtt === false) return false;
  }

  // Day-End EOD Account Closing & Cash Out
  if (["account_closing", "cash_out_summary"].includes(permKey) && toggles.accountClosing === false) {
    return false;
  }

  // Petty Cash & Expenses
  if (permKey === "expense_payout" && toggles.expenses === false) {
    return false;
  }

  // Sales Reports & Analytics
  if (
    ["dashboard", "sales_summary", "reports", "item_sales", "hourly_sales", "monthly_sales_summary"].includes(permKey) &&
    toggles.reports === false
  ) {
    return false;
  }

  // POS Billing Terminal
  if (permKey === "pos" && toggles.pos === false) {
    return false;
  }

  return true;
}

