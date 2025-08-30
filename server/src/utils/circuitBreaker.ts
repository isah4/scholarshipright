export type CircuitState = 'closed' | 'open' | 'half_open';

export class CircuitBreaker {
  private failures = 0;
  private state: CircuitState = 'closed';
  private nextTryAt = 0;

  constructor(
    private failureThreshold: number = 5,
    private resetTimeoutMs: number = 10000
  ) {}

  canRequest(): boolean {
    if (this.state === 'open') {
      if (Date.now() >= this.nextTryAt) {
        this.state = 'half_open';
        return true;
      }
      return false;
    }
    return true;
  }

  success(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  failure(): void {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.nextTryAt = Date.now() + this.resetTimeoutMs;
    }
  }
}


