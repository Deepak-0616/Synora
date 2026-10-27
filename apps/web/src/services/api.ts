const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('synora_token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // If unauthorized on a protected endpoint, clear stale session
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        localStorage.removeItem('synora_token');
        localStorage.removeItem('synora_user');
        window.dispatchEvent(new Event('synora_auth_expired'));
      }
    }

    if (!response.ok) {
      let errorMessage = 'An error occurred while processing your request.';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = `Server returned status ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // If downloading a blob (like CSV)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      return response.blob() as unknown as T;
    }

    return response.json();
  }

  public get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  public patch<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  public delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  public async upload<T = any>(endpoint: string, file: File, additionalFields?: Record<string, string>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    if (additionalFields) {
      for (const [key, val] of Object.entries(additionalFields)) {
        formData.append(key, val);
      }
    }
    return this.post<T>(endpoint, formData);
  }
}

export const api = new ApiClient();
