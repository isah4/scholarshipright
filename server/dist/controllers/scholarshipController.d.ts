import { Request, Response } from 'express';
export declare class ScholarshipController {
    private scholarshipService;
    constructor();
    searchScholarships: (req: Request, res: Response, next: import("express").NextFunction) => void;
    structuredSearch: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMockScholarships: (req: Request, res: Response, next: import("express").NextFunction) => void;
    validateQuery: (req: Request, res: Response, next: import("express").NextFunction) => void;
    healthCheck: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=scholarshipController.d.ts.map