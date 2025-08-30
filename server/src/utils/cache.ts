type CacheEntry<V> = { value: V; expiresAt: number };

export class TTLCache<K, V> {
  private store = new Map<K, CacheEntry<V>>();
  constructor(private ttlMs: number = 1000 * 60 * 30, private maxSize: number = 500) {}

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) {
        this.store.delete(firstKey as K);
      }
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}


