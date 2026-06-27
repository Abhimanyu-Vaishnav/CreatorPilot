const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private getTokens() {
    if (typeof window === "undefined") return { access: null, refresh: null };
    const access = localStorage.getItem("cp_access_token");
    const refresh = localStorage.getItem("cp_refresh_token");
    return { access, refresh };
  }

  private setTokens(access: string, refresh: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("cp_access_token", access);
    localStorage.setItem("cp_refresh_token", refresh);
  }

  public clearTokens() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("cp_access_token");
    localStorage.removeItem("cp_refresh_token");
    localStorage.removeItem("cp_user");
  }

  private async refreshAccessToken(): Promise<string | null> {
    const { refresh } = this.getTokens();
    if (!refresh) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const data = await response.json();
      if (data.access) {
        // SimpleJWT refresh endpoint returns a new access token (and optionally a new refresh token)
        const newRefresh = data.refresh || refresh;
        this.setTokens(data.access, newRefresh);
        return data.access;
      }
      return null;
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.clearTokens();
      return null;
    }
  }

  public async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    let { access } = this.getTokens();
    const headers = new Headers(options.headers || {});

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (access) {
      headers.set("Authorization", `Bearer ${access}`);
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
    let response = await fetch(url, config);

    // If unauthorized, attempt to refresh token once
    if (response.status === 401) {
      const newAccess = await this.refreshAccessToken();
      if (newAccess) {
        headers.set("Authorization", `Bearer ${newAccess}`);
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    }

    return response;
  }

  public async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await this.request(endpoint, { ...options, method: "GET" });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `GET Request failed with status ${response.status}`);
    }
    return response.json();
  }

  public async post<T>(endpoint: string, body: any, options: RequestInit = {}): Promise<T> {
    const response = await this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  }

  public async put<T>(endpoint: string, body: any, options: RequestInit = {}): Promise<T> {
    const response = await this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  }
}

export const api = new ApiClient();
