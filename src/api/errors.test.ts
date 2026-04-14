import { describe, expect, test } from "bun:test";
import {
  BadRequestError,
  UserNotAuthenticatedError,
  UserForbiddenError,
  NotFoundError,
} from "./errors";

describe("Api Errors", () => {
  test("BadRequestError should have correct message and name", () => {
    const msg = "Invalid input";
    const err = new BadRequestError(msg);
    expect(err.message).toBe(msg);
    expect(err.name).toBe("BadRequestError");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(BadRequestError);
  });

  test("UserNotAuthenticatedError should have correct message and name", () => {
    const msg = "Not logged in";
    const err = new UserNotAuthenticatedError(msg);
    expect(err.message).toBe(msg);
    expect(err.name).toBe("UserNotAuthenticatedError");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(UserNotAuthenticatedError);
  });

  test("UserForbiddenError should have correct message and name", () => {
    const msg = "Access denied";
    const err = new UserForbiddenError(msg);
    expect(err.message).toBe(msg);
    expect(err.name).toBe("UserForbiddenError");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(UserForbiddenError);
  });

  test("NotFoundError should have correct message and name", () => {
    const msg = "Resource not found";
    const err = new NotFoundError(msg);
    expect(err.message).toBe(msg);
    expect(err.name).toBe("NotFoundError");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(NotFoundError);
  });
});
