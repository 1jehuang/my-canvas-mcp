import axios, { AxiosInstance, AxiosError } from "axios";

export class CanvasAPI {
  private client: AxiosInstance;

  constructor() {
    const token = process.env.CANVAS_API_TOKEN;
    const baseURL = process.env.CANVAS_BASE_URL;

    if (!token || !baseURL) {
      throw new Error(
        "CANVAS_API_TOKEN and CANVAS_BASE_URL environment variables are required"
      );
    }

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private parseNextLink(linkHeader: string | undefined): string | null {
    if (!linkHeader) return null;
    const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    return match ? match[1] : null;
  }

  async get<T = unknown>(path: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const resp = await this.client.get(path, { params });
      return resp.data as T;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async getPaginated<T = unknown>(path: string, params?: Record<string, unknown>): Promise<T[]> {
    const allResults: T[] = [];
    try {
      let resp = await this.client.get(path, {
        params: { per_page: 100, ...params },
      });
      allResults.push(...(resp.data as T[]));

      let nextUrl = this.parseNextLink(resp.headers["link"]);
      while (nextUrl) {
        resp = await this.client.get(nextUrl);
        allResults.push(...(resp.data as T[]));
        nextUrl = this.parseNextLink(resp.headers["link"]);
      }
    } catch (err) {
      throw this.handleError(err);
    }
    return allResults;
  }

  private handleError(err: unknown): Error {
    if (err instanceof AxiosError) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 401) return new Error("Canvas API: Unauthorized — check your API token");
      if (status === 403) return new Error("Canvas API: Forbidden — you don't have access to this resource");
      if (status === 404) return new Error("Canvas API: Not found — check the course/assignment ID");
      if (status === 429) return new Error("Canvas API: Rate limited — try again in a moment");
      return new Error(`Canvas API error ${status}: ${JSON.stringify(data)}`);
    }
    return err instanceof Error ? err : new Error(String(err));
  }
}
