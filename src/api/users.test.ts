import { expect, test, describe, mock } from "bun:test";
import { handlerUsersCreate } from "./users.ts";
import { BadRequestError } from "./errors.ts";
import { type ApiConfig } from "../config.ts";

// Mock the dependencies
mock.module("../auth", () => ({
  hashPassword: async (p: string) => `hashed_${p}`,
}));

mock.module("../db/users", () => ({
  createUser: (db: any, params: any) => ({ id: "123", ...params }),
}));

describe("handlerUsersCreate", () => {
  const mockCfg = {
    db: {} as any,
  } as ApiConfig;

  test("should create a user successfully with valid email and password", async () => {
    const req = new Request("http://localhost/users", {
      method: "POST",
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    const response = await handlerUsersCreate(mockCfg, req);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({
      id: "123",
      email: "test@example.com",
      password: "hashed_password123",
    });
  });

  test("should throw BadRequestError if email is missing", async () => {
    const req = new Request("http://localhost/users", {
      method: "POST",
      body: JSON.stringify({ password: "password123" }),
    });

    expect(handlerUsersCreate(mockCfg, req)).rejects.toThrow(
      new BadRequestError("Email and password are required"),
    );
  });

  test("should throw BadRequestError if password is missing", async () => {
    const req = new Request("http://localhost/users", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    });

    expect(handlerUsersCreate(mockCfg, req)).rejects.toThrow(
      new BadRequestError("Email and password are required"),
    );
  });
});
