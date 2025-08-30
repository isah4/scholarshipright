"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponseSchema = exports.SearchResponseSchema = exports.StructuredSearchRequestSchema = exports.SearchRequestSchema = exports.ScholarshipSchema = exports.ApplicationTimelineSchema = exports.ScholarshipRequirementsSchema = exports.ScholarshipBenefitsSchema = void 0;
const zod_1 = require("zod");
exports.ScholarshipBenefitsSchema = zod_1.z.object({
    tuition: zod_1.z.string().min(1, "Tuition coverage is required").default("Not specified"),
    stipend: zod_1.z.string().min(1, "Stipend information is required").default("Not specified"),
    travel: zod_1.z.string().min(1, "Travel coverage is required").default("Not specified"),
    insurance: zod_1.z.string().min(1, "Insurance coverage is required").default("Not specified"),
    others: zod_1.z.array(zod_1.z.string()).default([])
}).transform(data => ({
    ...data,
    tuition: data.tuition || "Not specified",
    stipend: data.stipend || "Not specified",
    travel: data.travel || "Not specified",
    insurance: data.insurance || "Not specified",
    others: Array.isArray(data.others) ? data.others : []
}));
exports.ScholarshipRequirementsSchema = zod_1.z.object({
    academic: zod_1.z.string().min(1, "Academic requirements are required").default("Not specified"),
    age_limit: zod_1.z.string().min(1, "Age limit information is required").default("Not specified"),
    language: zod_1.z.string().min(1, "Language requirements are required").default("Not specified"),
    others: zod_1.z.array(zod_1.z.string()).default([])
}).transform(data => ({
    ...data,
    academic: data.academic || "Not specified",
    age_limit: data.age_limit || "Not specified",
    language: data.language || "Not specified",
    others: Array.isArray(data.others) ? data.others : []
}));
exports.ApplicationTimelineSchema = zod_1.z.object({
    opening_date: zod_1.z.string().min(1, "Opening date is required").default("Not specified"),
    deadline: zod_1.z.string().min(1, "Deadline is required").default("Not specified"),
    result_announcement: zod_1.z.string().min(1, "Result announcement period is required").default("Not specified")
}).transform(data => ({
    ...data,
    opening_date: data.opening_date || "Not specified",
    deadline: data.deadline || "Not specified",
    result_announcement: data.result_announcement || "Not specified"
}));
exports.ScholarshipSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Scholarship title is required"),
    scholarship_type: zod_1.z.enum(["fully funded", "partial high", "partial low"], {
        errorMap: () => ({ message: "Scholarship type must be one of: fully funded, partial high, partial low" })
    }).default("fully funded"),
    degree_levels: zod_1.z.array(zod_1.z.string()).min(1, "At least one degree level is required").default(["Masters"]),
    host_country: zod_1.z.string().min(1, "Host country is required").default("Not specified"),
    benefits: exports.ScholarshipBenefitsSchema,
    eligible_countries: zod_1.z.string().min(1, "Eligible countries information is required").default("Not specified"),
    requirements: exports.ScholarshipRequirementsSchema,
    application_timeline: exports.ApplicationTimelineSchema,
    application_link: zod_1.z.string().url("Application link must be a valid URL").default("https://example.com/not-specified"),
    application_procedure: zod_1.z.array(zod_1.z.string()).min(1, "Application procedure is required").default(["Not specified"]),
    selection_process: zod_1.z.array(zod_1.z.string()).min(1, "Selection process is required").default(["Not specified"]),
    renewal: zod_1.z.string().min(1, "Renewal information is required").default("Not specified"),
    source: zod_1.z.array(zod_1.z.string()).min(1, "At least one source is required").default(["Not specified"])
}).transform(data => ({
    ...data,
    degree_levels: Array.isArray(data.degree_levels) ? data.degree_levels : ["Masters"],
    application_procedure: Array.isArray(data.application_procedure) ? data.application_procedure : ["Not specified"],
    selection_process: Array.isArray(data.selection_process) ? data.selection_process : ["Not specified"],
    source: Array.isArray(data.source) ? data.source : ["Not specified"]
}));
exports.SearchRequestSchema = zod_1.z.object({
    query: zod_1.z.string().min(1, "Search query is required").max(500, "Search query too long"),
    limit: zod_1.z.number().int().positive().max(10).optional().default(5)
});
exports.StructuredSearchRequestSchema = zod_1.z.object({
    query: zod_1.z.string().min(1, "Search query is required").max(500, "Search query too long"),
    structured: zod_1.z.boolean().optional().default(true),
    locale: zod_1.z.string().optional().default("en"),
    depth: zod_1.z.enum(["fast", "standard", "deep"]).optional().default("standard")
});
exports.SearchResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.array(exports.ScholarshipSchema),
    message: zod_1.z.string().optional(),
    processing_time: zod_1.z.number().positive().optional(),
    total_results: zod_1.z.number().int().positive().optional()
});
exports.ErrorResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(false),
    error: zod_1.z.string(),
    message: zod_1.z.string(),
    statusCode: zod_1.z.number().int().positive()
});
//# sourceMappingURL=validation.js.map