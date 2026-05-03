// Manual API calls for endpoints not in the generated client
const API_BASE = "/api";

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem("kirana_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("kirana_token");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res: Response) {
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  return data;
}

// Auth endpoints
export async function sendOtp(email: string) {
  return handleResponse(await fetch(`${API_BASE}/auth/send-otp`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ email }) }));
}

export async function verifyOtp(email: string, otp: string) {
  return handleResponse(await fetch(`${API_BASE}/auth/verify-otp`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ email, otp }) }));
}

export async function forgotPassword(email: string) {
  return handleResponse(await fetch(`${API_BASE}/auth/forgot-password`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ email }) }));
}

export async function resetPassword(token: string, password: string) {
  return handleResponse(await fetch(`${API_BASE}/auth/reset-password`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ token, password }) }));
}

// Inventory endpoints
export async function getDefaultItems() {
  return handleResponse(await fetch(`${API_BASE}/inventory/default-items`, { headers: getHeaders() }));
}

export async function addDefaultItems(items: any[]) {
  return handleResponse(await fetch(`${API_BASE}/inventory/add-defaults`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ items }) }));
}

export async function downloadExcelTemplate() {
  const res = await fetch(`${API_BASE}/inventory/excel-template`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to download template");
  return res.blob();
}

export async function importExcel(file: File, mode: "create" | "update") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mode", mode);
  const res = await fetch(`${API_BASE}/inventory/import-excel`, { method: "POST", headers: getAuthHeaders(), body: formData });
  return handleResponse(res);
}

export async function exportExcel() {
  const res = await fetch(`${API_BASE}/inventory/export-excel`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to export");
  return res.blob();
}

// Settings endpoints
export async function getSettings() {
  return handleResponse(await fetch(`${API_BASE}/settings`, { headers: getHeaders() }));
}

export async function updateSettings(data: any) {
  return handleResponse(await fetch(`${API_BASE}/settings`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) }));
}

export async function deleteLogo() {
  return handleResponse(await fetch(`${API_BASE}/settings/delete-logo`, { method: "DELETE", headers: getHeaders() }));
}

export async function uploadLogo(file: File) {
  const formData = new FormData();
  formData.append("logo", file);
  return handleResponse(await fetch(`${API_BASE}/settings/upload-logo`, { method: "POST", headers: getAuthHeaders(), body: formData }));
}

export async function getUpiQr(amount?: number) {
  const url = amount ? `${API_BASE}/settings/upi-qr?amount=${amount}` : `${API_BASE}/settings/upi-qr`;
  return handleResponse(await fetch(url, { headers: getHeaders() }));
}

export async function uploadUpiQr(file: File) {
  const formData = new FormData();
  formData.append("qr", file);
  return handleResponse(await fetch(`${API_BASE}/settings/upload-upi-qr`, { method: "POST", headers: getAuthHeaders(), body: formData }));
}

// Reports endpoints
export async function getDailyReport(date?: string) {
  const url = date ? `${API_BASE}/reports/daily?date=${date}` : `${API_BASE}/reports/daily`;
  return handleResponse(await fetch(url, { headers: getHeaders() }));
}

// Customer stats
export async function getCustomerStats(customerId: string) {
  return handleResponse(await fetch(`${API_BASE}/customers/${customerId}/stats`, { headers: getHeaders() }));
}
