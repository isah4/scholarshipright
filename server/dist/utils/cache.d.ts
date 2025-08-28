export declare class TTLCache<K, V> {
    private ttlMs;
    private maxSize;
    private store;
    constructor(ttlMs?: number, maxSize?: number);
    get(key: K): V | undefined;
    set(key: K, value: V): void;
}
//# sourceMappingURL=cache.d.ts.map