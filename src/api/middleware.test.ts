import { expect, test, describe, spyOn } from "bun:test";
import {
  withConfig,
  noCacheMiddleware,
  errorHandlingMiddleware,
} from "./middleware";
import type { ApiConfig } from "../config";
import {
  BadRequestError,
  UserNotAuthenticatedError,
  UserForbiddenError,
  NotFoundError,
} from "./errors";

describe("middleware", () => {
  const mockConfig: ApiConfig = {
    platform: "prod",
    dbConnectionString: "test",
    jwtSecret: "test",
    port: 3000,
    googleClientId: "test",
    googleClientSecret: "test",
    origin: "test",
  };

  describe("withConfig", () => {
    test("should call handler with config and request", async () => {
      const handler = async (cfg: ApiConfig, req: any) => {
        expect(cfg).toBe(mockConfig);
        expect(req.url).toBe("http://localhost/");
        return new Response("ok");
      };

      const wrapped = withConfig(mockConfig, handler);
      const req = new Request("http://localhost/");
      const res = await wrapped(req as any);

      expect(await res.text()).toBe("ok");
    });
  });

  describe("noCacheMiddleware", () => {
    test("should add Cache-Control: no-store header", async () => {
      const next = async (_req: Request) => {
        return new Response("ok", { headers: { "X-Test": "true" } });
      };

      const middleware = noCacheMiddleware(next);
      const req = new Request("http://localhost/");
      const res = await middleware(req);

      expect(res.headers.get("Cache-Control")).toBe("no-store");
      expect(res.headers.get("X-Test")).toBe("true");
      expect(await res.text()).toBe("ok");
    });
  });

  describe("errorHandlingMiddleware", () => {
    test("should handle BadRequestError (400)", async () => {
      const err = new BadRequestError("Invalid input");
      const res = errorHandlingMiddleware(mockConfig, err);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Invalid input");
    });

    test("should handle UserNotAuthenticatedError (401)", async () => {
      const err = new UserNotAuthenticatedError("Not logged in");
      const res = errorHandlingMiddleware(mockConfig, err);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Not logged in");
    });

    test("should handle UserForbiddenError (403)", async () => {
      const err = new UserForbiddenError("Forbidden");
      const res = errorHandlingMiddleware(mockConfig, err);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Forbidden");
    });

    test("should handle NotFoundError (404)", async () => {
      const err = new NotFoundError("Not found");
      const res = errorHandlingMiddleware(mockConfig, err);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("Not found");
    });

    test("should handle unknown errors (500) and show generic message in prod", async () => {
      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      const err = new Error("Secret db error");
      const res = errorHandlingMiddleware(mockConfig, err);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Something went wrong on our end");
      expect(consoleSpy).toHaveBeenCalledWith("Secret db error");
      consoleSpy.mockRestore();
    });

    test("should handle unknown errors (500) and show error message in dev", async () => {
      const devConfig: ApiConfig = { ...mockConfig, platform: "dev" };
      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      const err = new Error("Specific error message");
      const res = errorHandlingMiddleware(devConfig, err);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Specific error message");
      consoleSpy.mockRestore();
    });

    test("should handle string errors", async () => {
      const consoleSpy = spyOn(console, "log").mockImplementation(() => {});
      const res = errorHandlingMiddleware(mockConfig, "Just a string error");

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe("Something went wrong on our end");
      expect(consoleSpy).toHaveBeenCalledWith("Just a string error");
      consoleSpy.mockRestore();
    });
  });
});
