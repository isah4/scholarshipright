export declare enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug"
}
declare class Logger {
    private level;
    constructor(level?: LogLevel);
    private shouldLog;
    private formatMessage;
    error(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
    setLevel(level: LogLevel): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map