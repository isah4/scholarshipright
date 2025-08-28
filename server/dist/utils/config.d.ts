export declare const config: {
    server: {
        port: number;
        nodeEnv: string;
        corsOrigin: string;
    };
    openai: {
        apiKey: string;
        model: string;
    };
    serpapi: {
        apiKey: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    logging: {
        level: string;
    };
    structured: {
        featureFlag: boolean;
        serpTimeoutMs: number;
        serpConcurrency: number;
        serpIntervalCap: number;
        maxPages: number;
        model: string;
    };
};
export declare function validateConfig(): void;
export declare const isDevelopment: boolean;
export declare const isProduction: boolean;
//# sourceMappingURL=config.d.ts.map