const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("fv-token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createCheckoutSession(items, customer, shipping) {
  const response = await fetch(`${BASE}/api/payments/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ items, customer, shipping }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Payment failed");
  return data;
}