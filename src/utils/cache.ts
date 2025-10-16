/**
 * 簡易的なメモリキャッシュ実装
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * キャッシュにデータを保存
   */
  set<T>(key: string, data: T, ttl: number = 300000): void {
    // デフォルトTTL: 5分
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * キャッシュからデータを取得
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // TTLチェック
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * キャッシュをクリア
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 期限切れのキャッシュを削除
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * キャッシュサイズを取得
   */
  size(): number {
    return this.cache.size;
  }
}

export const cacheManager = new CacheManager();

// 定期的にクリーンアップ（5分ごと）
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanup();
  }, 300000);
}
