"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructuredResponseSchema = exports.StructuredItemSchema = exports.CitationSchema = void 0;
const zod_1 = require("zod");
exports.CitationSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    title: zod_1.z.string().min(1).default('Untitled'),
    snippet: zod_1.z.string().min(1).default(''),
    confidence: zod_1.z.number().min(0).max(1).default(0.5)
});
exports.StructuredItemSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    summary: zod_1.z.string().min(1).default(''),
    eligibility: zod_1.z.array(zod_1.z.string()).default([]),
    benefits: zod_1.z.array(zod_1.z.string()).default([]),
    deadlines: zod_1.z.array(zod_1.z.string()).default([]),
    application_link: zod_1.z.string().url().optional(),
    citations: zod_1.z.array(exports.CitationSchema).default([])
});
exports.StructuredResponseSchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    locale: zod_1.z.string().optional(),
    depth: zod_1.z.enum(['fast', 'standard', 'deep']).default('standard'),
    items: zod_1.z.array(exports.StructuredItemSchema).default([]),
    sources: zod_1.z.array(exports.CitationSchema).default([]),
    validationErrors: zod_1.z.array(zod_1.z.string()).optional()
});
//# sourceMappingURL=structured.js.map