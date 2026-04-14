import { expect, test, describe, mock, beforeEach, afterEach } from "bun:test";
import {
  ensureAssetsDir,
  getAssetPath,
  mediaTypeToExt,
  getAssetDiskPath,
  getAssetURL,
} from "./assets.ts";
import { type ApiConfig } from "../config.ts";
import { existsSync, rmSync, mkdirSync } from "fs";
import path from "path";

describe("api/assets", () => {
  const testAssetsRoot = path.join(import.meta.dir, "__test_assets__");
  const mockCfg = {
    assetsRoot: testAssetsRoot,
    port: 3000,
  } as ApiConfig;

  beforeEach(() => {
    if (existsSync(testAssetsRoot)) {
      rmSync(testAssetsRoot, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (existsSync(testAssetsRoot)) {
      rmSync(testAssetsRoot, { recursive: true, force: true });
    }
  });

  describe("ensureAssetsDir", () => {
    test("creates directory if it does not exist", () => {
      expect(existsSync(testAssetsRoot)).toBe(false);
      ensureAssetsDir(mockCfg);
      expect(existsSync(testAssetsRoot)).toBe(true);
    });

    test("does nothing if directory already exists", () => {
      mkdirSync(testAssetsRoot, { recursive: true });
      expect(existsSync(testAssetsRoot)).toBe(true);
      ensureAssetsDir(mockCfg);
      expect(existsSync(testAssetsRoot)).toBe(true);
    });
  });

  describe("mediaTypeToExt", () => {
    test("returns extension for valid media type", () => {
      expect(mediaTypeToExt("image/png")).toBe(".png");
      expect(mediaTypeToExt("video/mp4")).toBe(".mp4");
      expect(mediaTypeToExt("application/pdf")).toBe(".pdf");
    });

    test("returns .bin for invalid media type", () => {
      expect(mediaTypeToExt("invalid")).toBe(".bin");
      expect(mediaTypeToExt("too/many/parts")).toBe(".bin");
    });
  });

  describe("getAssetPath", () => {
    test("generates a path with correct extension", () => {
      const assetPath = getAssetPath("image/jpeg");
      expect(assetPath).toEndWith(".jpeg");
      expect(assetPath.length).toBeGreaterThan(10); // base64url encoded 32 bytes is around 43 chars
    });
  });

  describe("getAssetDiskPath", () => {
    test("joins root and asset path", () => {
      const assetPath = "test-file.png";
      const diskPath = getAssetDiskPath(mockCfg, assetPath);
      expect(diskPath).toBe(path.join(testAssetsRoot, assetPath));
    });
  });

  describe("getAssetURL", () => {
    test("constructs URL correctly", () => {
      const assetPath = "test-file.png";
      const url = getAssetURL(mockCfg, assetPath);
      expect(url).toBe(`http://localhost:3000/assets/${assetPath}`);
    });
  });
});
