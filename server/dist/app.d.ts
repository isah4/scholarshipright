import express from 'express';
declare class App {
    app: express.Application;
    port: number;
    constructor();
    private initializeMiddlewares;
    private initializeRoutes;
    private initializeErrorHandling;
    listen(): void;
}
declare const app: App;
export default app;
//# sourceMappingURL=app.d.ts.map