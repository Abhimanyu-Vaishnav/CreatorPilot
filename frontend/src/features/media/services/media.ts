import { api } from "../../../lib/api";
import { MediaAsset, MediaFolder, CreateMediaFolderInput, UpdateMediaAssetInput, MediaAssetFilterParams } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const mediaService = {
  getMediaAssets: async (params?: MediaAssetFilterParams): Promise<{ results: MediaAsset[]; count: number; next: string | null; previous: string | null }> => {
    let endpoint = "/api/media/";
    const queryParts: string[] = [];
    if (params) {
      if (params.project) queryParts.push(`project=${encodeURIComponent(params.project)}`);
      if (params.folder !== undefined) {
        if (params.folder === null) {
          queryParts.push("folder=root");
        } else {
          queryParts.push(`folder=${encodeURIComponent(params.folder)}`);
        }
      }
      if (params.favorite !== undefined) queryParts.push(`favorite=${params.favorite}`);
      if (params.archived !== undefined) queryParts.push(`archived=${params.archived}`);
      if (params.asset_type) queryParts.push(`asset_type=${encodeURIComponent(params.asset_type)}`);
      if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.ordering) queryParts.push(`ordering=${params.ordering}`);
      if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
      if (params.offset !== undefined) queryParts.push(`offset=${params.offset}`);
    }
    if (queryParts.length > 0) {
      endpoint += `?${queryParts.join("&")}`;
    }
    const response = await api.get<any>(endpoint);
    if (response && response.results) {
      return response;
    }
    return {
      results: response || [],
      count: (response || []).length,
      next: null,
      previous: null
    };
  },

  getProjectMediaAssets: async (projectSlug: string, params?: MediaAssetFilterParams): Promise<MediaAsset[]> => {
    let endpoint = `/api/projects/${projectSlug}/media/`;
    const queryParts: string[] = [];
    if (params) {
      if (params.favorite !== undefined) queryParts.push(`favorite=${params.favorite}`);
      if (params.archived !== undefined) queryParts.push(`archived=${params.archived}`);
      if (params.asset_type) queryParts.push(`asset_type=${encodeURIComponent(params.asset_type)}`);
      if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.ordering) queryParts.push(`ordering=${params.ordering}`);
    }
    if (queryParts.length > 0) {
      endpoint += `?${queryParts.join("&")}`;
    }
    return api.get<MediaAsset[]>(endpoint);
  },

  getMediaAsset: async (slug: string): Promise<MediaAsset> => {
    return api.get<MediaAsset>(`/api/media/${slug}/`);
  },

  getMediaFolders: async (params?: { project?: string | number; parent?: string | number | null }): Promise<MediaFolder[]> => {
    let endpoint = "/api/folders/";
    const queryParts: string[] = [];
    if (params) {
      if (params.project) queryParts.push(`project=${encodeURIComponent(params.project)}`);
      if (params.parent !== undefined) {
        if (params.parent === null) {
          queryParts.push("parent=root");
        } else {
          queryParts.push(`parent=${encodeURIComponent(params.parent)}`);
        }
      }
    }
    if (queryParts.length > 0) {
      endpoint += `?${queryParts.join("&")}`;
    }
    const response = await api.get<any>(endpoint);
    if (response && response.results) {
      return response.results;
    }
    return response || [];
  },

  createMediaFolder: async (data: CreateMediaFolderInput): Promise<MediaFolder> => {
    const response = await api.request("/api/folders/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },

  deleteMediaFolder: async (slug: string): Promise<void> => {
    await api.request(`/api/folders/${slug}/`, { method: "DELETE" });
  },

  createMediaAsset: async (formData: FormData): Promise<MediaAsset> => {
    const response = await api.request("/api/media/", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },

  uploadMediaAssetWithProgress: (
    formData: FormData,
    onProgress: (percent: number) => void,
    cancelToken: { abort?: () => void }
  ): Promise<MediaAsset> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE_URL}/api/media/`);
      
      // Authorization Header
      const access = typeof window !== "undefined" ? localStorage.getItem("cp_access_token") : null;
      if (access) {
        xhr.setRequestHeader("Authorization", `Bearer ${access}`);
      }

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            resolve(xhr.responseText as any);
          }
        } else {
          try {
            reject(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error("Server error occurred during upload. Please try again."));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network upload error"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload aborted"));
      });

      cancelToken.abort = () => {
        xhr.abort();
      };

      xhr.send(formData);
    });
  },

  updateMediaAsset: async (slug: string, data: UpdateMediaAssetInput): Promise<MediaAsset> => {
    const response = await api.request(`/api/media/${slug}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },

  duplicateMediaAsset: async (slug: string): Promise<MediaAsset> => {
    const response = await api.request(`/api/media/${slug}/duplicate/`, {
      method: "POST",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },

  deleteMediaAsset: async (slug: string): Promise<void> => {
    await api.request(`/api/media/${slug}/`, { method: "DELETE" });
  },

  bulkFavorite: async (slugs: string[], favorite: boolean): Promise<any> => {
    const response = await api.request("/api/media/bulk-favorite/", {
      method: "POST",
      body: JSON.stringify({ slugs, favorite }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },

  bulkArchive: async (slugs: string[]): Promise<any> => {
    const response = await api.request("/api/media/bulk-archive/", {
      method: "POST",
      body: JSON.stringify({ slugs }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },

  bulkRestore: async (slugs: string[]): Promise<any> => {
    const response = await api.request("/api/media/bulk-restore/", {
      method: "POST",
      body: JSON.stringify({ slugs }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },

  bulkDelete: async (slugs: string[]): Promise<any> => {
    const response = await api.request("/api/media/bulk-delete/", {
      method: "POST",
      body: JSON.stringify({ slugs }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw errorData;
    }
    return response.json();
  },
};
export type { MediaAsset, UpdateMediaAssetInput, MediaAssetFilterParams };
