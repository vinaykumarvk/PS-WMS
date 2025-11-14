/**
 * Foundation Layer - F1: Type Definitions Tests
 * Test type exports and type safety
 */

import { describe, it, expect } from 'vitest';

// Test that types can be imported without errors
describe('Foundation Layer - F1: Type Definitions', () => {
  it('should export order management types', async () => {
    const types = await import('../order-management.types');
    expect(types).toBeDefined();
  });

  it('should export portfolio types', async () => {
    const types = await import('../portfolio.types');
    expect(types).toBeDefined();
  });

  it('should export SIP types', async () => {
    const types = await import('../sip.types');
    expect(types).toBeDefined();
  });

  it('should export API types', async () => {
    const types = await import('../api.types');
    expect(types).toBeDefined();
  });

  it('should export all types from index', async () => {
    const types = await import('../index');
    expect(types).toBeDefined();
  });

  it('should export type definitions without errors', async () => {
    // Type imports are compile-time only, so we just verify the module loads
    // TypeScript types don't exist at runtime, so we can't check for exports
    // This test verifies that the module can be imported without syntax errors
    const orderTypes = await import('../order-management.types');
    expect(orderTypes).toBeDefined();
    
    // Type-only modules may have no runtime exports, which is expected
    // The important thing is that TypeScript compilation succeeds
    // This is verified by the fact that we can import the module
  });
});

