import { expect, test, describe, mock } from "bun:test";
import { handlerLogin, handlerRefresh, handlerRevoke } from "./auth.ts";
import { BadRequestError, UserNotAuthenticatedError } from "./errors.ts";
import { type ApiConfig } from "../config.ts";

// Mock the dependencies
mock.module("../auth", () => ({
  hashPassword: async (p: string) => `hashed_${p}`,
}));

mock.module("../db/users", () => ({
  createUser: (db: any, params: any) => ({ id: "123", ...params }),
}));

// Mocking dependencies for auth api tests
mock.module("../auth", () => ({
  checkPasswordHash: async (p: string, h: string) => p === "correct_password",
  getBearerToken: (headers: Headers) => headers.get("Authorization")?.split(" ")[1],
  makeJWT: (id: string, secret: string, expires: number) => `jwt_${id}`,
  makeRefreshToken: () => "mock_refresh_token",
}));

mock.module("../db/users", () => ({
  getUserByEmail: (db: any, email: string) =>
    email === "existing@example.com" ? { id: "user_1", password: "hashed_password" } : null,
  getUserByRefreshToken: (db: any, token: string) =>
    token === "valid_refresh_token" ? { id: "user_1" } : null,
}));

mock.module("../db/refresh-tokens", () => ({
  createRefreshToken: () => {},
  revokeRefreshToken: () => {},
}));

describe("api/auth handlers", () => {
  const mockCfg = {
    db: {} as any,
    jwtSecret: "secret",
  } as ApiConfig;

  describe("handlerLogin", () => {
    test("successful login", async () => {
      const req = new Request("http://localhost/login", {
        method: "POST",
        body: JSON.stringify({ email: "existing@example.com", password: "correct_password" }),
      });

      const response = await handlerLogin(mockCfg, req);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.user.id).toBe("user_1");
      expect(body.token).toBe("jwt_user_1");
      expect(body.refreshToken).toBe("mock_refresh_token");
    });

    test("missing credentials", async () => {
      const req = new Request("http://localhost/login", {
        method: "POST",
        body: JSON.stringify({ email: "existing@example.com" }),
      });
      expect(handlerLogin(mockCfg, req)).rejects.toThrow(BadRequestError);
    });

    test("incorrect password", async () => {
      const req = new Request("http://localhost/login", {
        method: "POST",
        body: JSON.stringify({ email: "existing@example.com", password: "wrong" }),
      });
      expect(handlerLogin(mockCfg, req)).rejects.toThrow(UserNotAuthenticatedError);
    });
  });

  describe("handlerRefresh", () => {
    test("successful refresh", async () => {
      const req = new Request("http://localhost/refresh", {
        headers: { Authorization: "Bearer valid_refresh_token" },
      });
      const response = await handlerRefresh(mockCfg, req);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.token).toBe("jwt_user_1");
    });

    test("invalid refresh token", async () => {
      const req = new Request("http://localhost/refresh", {
        headers: { Authorization: "Bearer invalid" },
      });
      expect(handlerRefresh(mockCfg, req)).rejects.toThrow(UserNotAuthenticatedError);
    });
  });

  describe("handlerRevoke", () => {
    test("successful revoke", async () => {
      const req = new Request("http://localhost/revoke", {
        method: "POST",
        headers: { Authorization: "Bearer some_token" },
      });
      const response = await handlerRevoke(mockCfg, req);
      expect(response.status).toBe(204);
    });
  });
});
