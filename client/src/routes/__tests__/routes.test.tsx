/**
 * Phase 1 Routes Test
 * 
 * Basic tests for migrated routes
 */

import { describe, it, expect } from "vitest";
import { isRouteMigrated } from "../index";

describe("Router Migration", () => {
  describe("isRouteMigrated", () => {
    it("should identify Phase 1 migrated routes", () => {
      expect(isRouteMigrated("#/login")).toBe(true);
      expect(isRouteMigrated("#/")).toBe(true);
      expect(isRouteMigrated("#/help")).toBe(true);
      expect(isRouteMigrated("#/help-center")).toBe(true);
      expect(isRouteMigrated("#/settings")).toBe(true);
      expect(isRouteMigrated("#/profile")).toBe(true);
    });

    it("should identify Phase 2 migrated routes", () => {
      expect(isRouteMigrated("#/clients")).toBe(true);
      expect(isRouteMigrated("#/clients/add")).toBe(true);
      expect(isRouteMigrated("#/prospects")).toBe(true);
      expect(isRouteMigrated("#/prospects/new")).toBe(true);
    });

    it("should identify Phase 3 migrated dynamic routes", () => {
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
      expect(isRouteMigrated("#/prospect-detail/456")).toBe(true);
      expect(isRouteMigrated("#/prospect-edit/456")).toBe(true);
    });

    it("should identify Phase 5 migrated routes", () => {
      expect(isRouteMigrated("#/calendar")).toBe(true);
      expect(isRouteMigrated("#/appointments")).toBe(true);
      expect(isRouteMigrated("#/tasks")).toBe(true);
      expect(isRouteMigrated("#/communications")).toBe(true);
      expect(isRouteMigrated("#/talking-points")).toBe(true);
      expect(isRouteMigrated("#/announcements")).toBe(true);
      expect(isRouteMigrated("#/analytics")).toBe(true);
      expect(isRouteMigrated("#/analytics-legacy")).toBe(true);
      expect(isRouteMigrated("#/products")).toBe(true);
      expect(isRouteMigrated("#/order-management")).toBe(true);
      expect(isRouteMigrated("#/orders")).toBe(true);
      expect(isRouteMigrated("#/automation")).toBe(true);
      expect(isRouteMigrated("#/sip-builder")).toBe(true);
      expect(isRouteMigrated("#/sip-manager")).toBe(true);
      expect(isRouteMigrated("#/sip")).toBe(true);
      expect(isRouteMigrated("#/qm-portal")).toBe(true);
      expect(isRouteMigrated("#/knowledge-profiling")).toBe(true);
      expect(isRouteMigrated("#/risk-profiling")).toBe(true);
      expect(isRouteMigrated("#/clients/123/financial-profile")).toBe(true);
      expect(isRouteMigrated("#/order-management/orders/456/confirmation")).toBe(true);
    });

    it("should identify unmigrated routes", () => {
      // All routes should now be migrated
      // If new routes are added, they should be tested here
      expect(isRouteMigrated("#/unknown-route")).toBe(false);
    });

    it("should handle routes with query parameters", () => {
      expect(isRouteMigrated("#/help?section=faq")).toBe(true);
      expect(isRouteMigrated("#/settings?tab=profile")).toBe(true);
    });

    it("should handle routes without hash prefix", () => {
      expect(isRouteMigrated("/login")).toBe(true);
      expect(isRouteMigrated("/")).toBe(true);
      expect(isRouteMigrated("/clients")).toBe(true); // Phase 2 migrated
      expect(isRouteMigrated("/prospects")).toBe(true); // Phase 2 migrated
      expect(isRouteMigrated("/calendar")).toBe(true); // Phase 5 migrated
      expect(isRouteMigrated("/tasks")).toBe(true); // Phase 5 migrated
      expect(isRouteMigrated("/order-management")).toBe(true); // Phase 5 migrated
    });
  });
});

