import { expect, test, describe } from "bun:test";
import { respondWithJSON } from "./json";

describe("respondWithJSON", () => {
  test("should return a response with correct status and body", async () => {
    const status = 200;
    const payload = { message: "success" };
    const response = respondWithJSON(status, payload);

    expect(response.status).toBe(status);
    expect(response.headers.get("Content-Type")).toBe("application/json");

    const body = await response.json();
    expect(body).toEqual(payload);
  });

  test("should handle different status codes", () => {
    const status = 201;
    const payload = { id: 1 };
    const response = respondWithJSON(status, payload);

    expect(response.status).toBe(status);
  });

  test("should handle complex payloads", async () => {
    const status = 200;
    const payload = {
      users: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ],
      meta: { total: 2 },
    };
    const response = respondWithJSON(status, payload);

    const body = await response.json();
    expect(body).toEqual(payload);
  });
});
