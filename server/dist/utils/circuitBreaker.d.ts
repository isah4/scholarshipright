export type CircuitState = 'closed' | 'open' | 'half_open';
export declare class CircuitBreaker {
    private failureThreshold;
    private resetTimeoutMs;
    private failures;
    private state;
    private nextTryAt;
    constructor(failureThreshold?: number, resetTimeoutMs?: number);
    canRequest(): boolean;
    success(): void;
    failure(): void;
}
//# sourceMappingURL=circuitBreaker.d.ts.map