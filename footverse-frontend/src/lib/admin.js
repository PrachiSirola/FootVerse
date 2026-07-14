import api from "./api";

/* ---- Dashboard ---- */
export const getDashboard = (days = 30) =>
  api.get("/admin/dashboard", { params: { days } }).then((r) => r.data);

/* ---- Users ---- */
export const getUsers = (params) => api.get("/admin/users", { params }).then((r) => r.data);
export const getUser = (id) => api.get(`/admin/users/${id}`).then((r) => r.data);
export const adjustWallet = (id, payload) =>
  api.post(`/admin/users/${id}/wallet`, payload).then((r) => r.data);

/* ---- Orders ---- */
export const getAdminOrders = (params) => api.get("/admin/orders", { params }).then((r) => r.data);
export const getOrderAnalytics = () => api.get("/admin/orders/analytics").then((r) => r.data);

/* ---- Issues ---- */
export const getIssues = (params) => api.get("/admin/issues", { params }).then((r) => r.data);
export const getIssue = (id) => api.get(`/admin/issues/${id}`).then((r) => r.data);
export const replyIssue = (id, message) =>
  api.post(`/admin/issues/${id}/reply`, { message }).then((r) => r.data);
export const updateIssue = (id, patch) =>
  api.patch(`/admin/issues/${id}`, patch).then((r) => r.data);

/* ---- Finance ---- */
export const getFinance = (days = 30) =>
  api.get("/admin/finance/summary", { params: { days } }).then((r) => r.data);
export const getFinanceSettings = () => api.get("/admin/finance/settings").then((r) => r.data);
export const updateFinanceSettings = (patch) =>
  api.patch("/admin/finance/settings", patch).then((r) => r.data);

/* ---- Hero CMS ---- */
export const getHero = () => api.get("/admin/cms/hero").then((r) => r.data);
export const updateHero = (patch) => api.patch("/admin/cms/hero", patch).then((r) => r.data);

/* ---- Customer-facing issues (for the storefront) ---- */
export const submitIssue = (payload) => api.post("/issues", payload).then((r) => r.data);
export const myIssues = () => api.get("/issues/my").then((r) => r.data);

/* ---- Returns (dedicated section) ---- */
export const getReturns = (params) => api.get("/admin/returns", { params }).then((r) => r.data);
export const resolveReturn = (id, decision, adminNote) =>
  api.post(`/admin/returns/${id}/resolve`, { decision, adminNote }).then((r) => r.data);

/* ---- Admin order detail ---- */
export const getAdminOrder = (id) => api.get(`/admin/orders/${id}`).then((r) => r.data);
export const updateOrderStatus = (id, status, note) =>
  api.post(`/admin/orders/${id}/status`, { status, note }).then((r) => r.data);