import { describe, expect, it } from 'vitest';
import { analyticsConfigured, cleanPath, trackEvent } from './analytics';

describe('cleanPath', () => {
  it('replaces numeric ids', () => {
    expect(cleanPath('/edit/123')).toBe('/edit/:id');
    expect(cleanPath('/admin/blog/45/edit')).toBe('/admin/blog/:id/edit');
  });

  it('keeps other paths, including blog slugs', () => {
    expect(cleanPath('/')).toBe('/');
    expect(cleanPath('/history')).toBe('/history');
    expect(cleanPath('/blog/dual-receipts-in-2026')).toBe('/blog/dual-receipts-in-2026');
  });
});

describe('without Firebase config', () => {
  it('is disabled and tracking is a no-op', () => {
    expect(analyticsConfigured).toBe(false);
    expect(() => trackEvent('test_event', { a: 1 })).not.toThrow();
  });
});
