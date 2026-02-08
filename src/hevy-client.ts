export class HevyClient {
  private baseUrl = "https://api.hevyapp.com";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(
    method: string,
    path: string,
    params?: Record<string, string>,
    body?: unknown
  ): Promise<unknown> {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        "api-key": this.apiKey,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Hevy API error ${response.status}: ${text}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  async get(
    path: string,
    params?: Record<string, string>
  ): Promise<unknown> {
    return this.request("GET", path, params);
  }

  async post(path: string, body?: unknown): Promise<unknown> {
    return this.request("POST", path, undefined, body);
  }

  async put(path: string, body?: unknown): Promise<unknown> {
    return this.request("PUT", path, undefined, body);
  }

  async delete(path: string): Promise<unknown> {
    return this.request("DELETE", path);
  }

  async getAll(
    path: string,
    params?: Record<string, string>
  ): Promise<unknown[]> {
    const allResults: unknown[] = [];
    let page = 1;
    const pageSize = "10";

    while (true) {
      const response = (await this.get(path, {
        ...params,
        page: String(page),
        page_size: pageSize,
      })) as {
        page: number;
        page_count: number;
        [key: string]: unknown;
      };

      // Find the data array in the response (it's the non-metadata field)
      for (const [key, value] of Object.entries(response)) {
        if (Array.isArray(value)) {
          allResults.push(...value);
          break;
        }
      }

      if (page >= response.page_count) {
        break;
      }
      page++;
    }

    return allResults;
  }
}
