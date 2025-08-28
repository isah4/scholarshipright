"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TTLCache = void 0;
class TTLCache {
    constructor(ttlMs = 1000 * 60 * 30, maxSize = 500) {
        this.ttlMs = ttlMs;
        this.maxSize = maxSize;
        this.store = new Map();
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return entry.value;
    }
    set(key, value) {
        if (this.store.size >= this.maxSize) {
            const firstKey = this.store.keys().next().value;
            if (firstKey !== undefined) {
                this.store.delete(firstKey);
            }
        }
        this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    }
}
exports.TTLCache = TTLCache;
//# sourceMappingURL=cache.js.map