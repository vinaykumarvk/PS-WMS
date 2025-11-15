/**
 * Nested Routes Test
 * 
 * Tests for Phase 4 nested routes structure
 */

import { describe, it, expect } from "vitest";
import { isRouteMigrated } from "../index";

describe("Phase 4 Nested Routes", () => {
  describe("isRouteMigrated with nested routes", () => {
    it("should identify nested client routes", () => {
      expect(isRouteMigrated("#/clients/123")).toBe(true);
      expect(isRouteMigrated("#/clients/123/personal")).toBe(true);
      expect(isRouteMigrated("#/clients/123/portfolio")).toBe(true);
      expect(isRouteMigrated("#/clients/123/actions")).toBe(true);
      expect(isRouteMigrated("#/clients/123/interactions")).toBe(true);
      expect(isRouteMigrated("#/clients/123/transactions")).toBe(true);
      expect(isRouteMigrated("#/clients/123/communications")).toBe(true);
      expect(isRouteMigrated("#/clients/123/appointments")).toBe(true);
      expect(isRouteMigrated("#/clients/123/tasks")).toBe(true);
      expect(isRouteMigrated("#/clients/123/insights")).toBe(true);
      expect(isRouteMigrated("#/clients/123/goals")).toBe(true);
    });

    it("should handle routes with query parameters in nested routes", () => {
      expect(isRouteMigrated("#/clients/123/personal?section=family")).toBe(true);
      expect(isRouteMigrated("#/clients/123/portfolio?view=holdings")).toBe(true);
    });

    it("should still identify prospect routes", () => {
      expect(isRouteMigrated("#/prospect-detail/456")).toBe(true);
      expect(isRouteMigrated("#/prospect-edit/456")).toBe(true);
    });
  });
});

