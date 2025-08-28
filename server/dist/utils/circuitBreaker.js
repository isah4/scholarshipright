"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
class CircuitBreaker {
    constructor(failureThreshold = 5, resetTimeoutMs = 10000) {
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
        this.failures = 0;
        this.state = 'closed';
        this.nextTryAt = 0;
    }
    canRequest() {
        if (this.state === 'open') {
            if (Date.now() >= this.nextTryAt) {
                this.state = 'half_open';
                return true;
            }
            return false;
        }
        return true;
    }
    success() {
        this.failures = 0;
        this.state = 'closed';
    }
    failure() {
        this.failures += 1;
        if (this.failures >= this.failureThreshold) {
            this.state = 'open';
            this.nextTryAt = Date.now() + this.resetTimeoutMs;
        }
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=circuitBreaker.js.map