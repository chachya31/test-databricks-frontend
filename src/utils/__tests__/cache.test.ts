import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheManager } from '../cache';

describe('CacheManager', () => {
  beforeEach(() => {
    cacheManager.clear();
  });

  it('should set and get cache data', () => {
    const testData = { name: 'test', value: 123 };
    cacheManager.set('test-key', testData);

    const retrieved = cacheManager.get('test-key');
    expect(retrieved).toEqual(testData);
  });

  it('should return null for non-existent key', () => {
    const result = cacheManager.get('non-existent');
    expect(result).toBeNull();
  });

  it('should expire cache after TTL', () => {
    vi.useFakeTimers();

    cacheManager.set('test-key', 'test-data', 1000); // 1秒TTL

    // 500ms後: まだ有効
    vi.advanceTimersByTime(500);
    expect(cacheManager.get('test-key')).toBe('test-data');

    // 1500ms後: 期限切れ
    vi.advanceTimersByTime(1000);
    expect(cacheManager.get('test-key')).toBeNull();

    vi.useRealTimers();
  });

  it('should clear specific cache entry', () => {
    cacheManager.set('key1', 'data1');
    cacheManager.set('key2', 'data2');

    cacheManager.clear('key1');

    expect(cacheManager.get('key1')).toBeNull();
    expect(cacheManager.get('key2')).toBe('data2');
  });

  it('should clear all cache entries', () => {
    cacheManager.set('key1', 'data1');
    cacheManager.set('key2', 'data2');

    cacheManager.clear();

    expect(cacheManager.get('key1')).toBeNull();
    expect(cacheManager.get('key2')).toBeNull();
  });

  it('should return correct cache size', () => {
    expect(cacheManager.size()).toBe(0);

    cacheManager.set('key1', 'data1');
    expect(cacheManager.size()).toBe(1);

    cacheManager.set('key2', 'data2');
    expect(cacheManager.size()).toBe(2);

    cacheManager.clear('key1');
    expect(cacheManager.size()).toBe(1);
  });

  it('should cleanup expired entries', () => {
    vi.useFakeTimers();

    cacheManager.set('key1', 'data1', 1000);
    cacheManager.set('key2', 'data2', 5000);

    vi.advanceTimersByTime(2000);
    cacheManager.cleanup();

    expect(cacheManager.get('key1')).toBeNull();
    expect(cacheManager.get('key2')).toBe('data2');

    vi.useRealTimers();
  });
});
