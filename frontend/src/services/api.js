const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function api(path, options = {}) {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      ...(!isFormData && options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : {};

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
}
