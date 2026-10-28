const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";
class ApiClient {
  getToken() {
    return localStorage.getItem("synora_token");
  }
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();
    const headers = {
      "Accept": "application/json",
      ...options.headers || {}
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const response = await fetch(url, {
      ...options,
      headers
    });
    if (response.status === 401) {
      if (!endpoint.includes("/auth/login") && !endpoint.includes("/auth/register")) {
        localStorage.removeItem("synora_token");
        localStorage.removeItem("synora_user");
        window.dispatchEvent(new Event("synora_auth_expired"));
      }
    }
    if (!response.ok) {
      let errorMessage = "An error occurred while processing your request.";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = `Server returned status ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    const contentType = response.headers.get("content-type");
    if (
      contentType &&
      (contentType.includes("text/csv") ||
        contentType.includes("application/pdf") ||
        contentType.includes("application/octet-stream"))
    ) {
      return response.blob();
    }
    return response.json();
  }
  get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }
  post(endpoint, body) {
    return this.request(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }
  patch(endpoint, body) {
    return this.request(endpoint, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }
  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }
  async upload(endpoint, file, additionalFields) {
    const formData = new FormData();
    formData.append("file", file);
    if (additionalFields) {
      for (const [key, val] of Object.entries(additionalFields)) {
        formData.append(key, val);
      }
    }
    return this.post(endpoint, formData);
  }
}
export const api = new ApiClient();
