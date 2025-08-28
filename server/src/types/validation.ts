import { z } from 'zod';

// Scholarship Benefits Schema - More flexible validation
export const ScholarshipBenefitsSchema = z.object({
  tuition: z.string().min(1, "Tuition coverage is required").default("Not specified"),
  stipend: z.string().min(1, "Stipend information is required").default("Not specified"),
  travel: z.string().min(1, "Travel coverage is required").default("Not specified"),
  insurance: z.string().min(1, "Insurance coverage is required").default("Not specified"),
  others: z.array(z.string()).default([])
}).transform(data => ({
  ...data,
  tuition: data.tuition || "Not specified",
  stipend: data.stipend || "Not specified",
  travel: data.travel || "Not specified",
  insurance: data.insurance || "Not specified",
  others: Array.isArray(data.others) ? data.others : []
}));

// Scholarship Requirements Schema - More flexible validation
export const ScholarshipRequirementsSchema = z.object({
  academic: z.string().min(1, "Academic requirements are required").default("Not specified"),
  age_limit: z.string().min(1, "Age limit information is required").default("Not specified"),
  language: z.string().min(1, "Language requirements are required").default("Not specified"),
  others: z.array(z.string()).default([])
}).transform(data => ({
  ...data,
  academic: data.academic || "Not specified",
  age_limit: data.age_limit || "Not specified",
  language: data.language || "Not specified",
  others: Array.isArray(data.others) ? data.others : []
}));

// Application Timeline Schema - More flexible validation
export const ApplicationTimelineSchema = z.object({
  opening_date: z.string().min(1, "Opening date is required").default("Not specified"),
  deadline: z.string().min(1, "Deadline is required").default("Not specified"),
  result_announcement: z.string().min(1, "Result announcement period is required").default("Not specified")
}).transform(data => ({
  ...data,
  opening_date: data.opening_date || "Not specified",
  deadline: data.deadline || "Not specified",
  result_announcement: data.result_announcement || "Not specified"
}));

// Main Scholarship Schema - More flexible validation with defaults
export const ScholarshipSchema = z.object({
  title: z.string().min(1, "Scholarship title is required"),
  scholarship_type: z.enum(["fully funded", "partial high", "partial low"], {
    errorMap: () => ({ message: "Scholarship type must be one of: fully funded, partial high, partial low" })
  }).default("fully funded"),
  degree_levels: z.array(z.string()).min(1, "At least one degree level is required").default(["Masters"]),
  host_country: z.string().min(1, "Host country is required").default("Not specified"),
  benefits: ScholarshipBenefitsSchema,
  eligible_countries: z.string().min(1, "Eligible countries information is required").default("Not specified"),
  requirements: ScholarshipRequirementsSchema,
  application_timeline: ApplicationTimelineSchema,
  application_link: z.string().url("Application link must be a valid URL").default("https://example.com/not-specified"),
  application_procedure: z.array(z.string()).min(1, "Application procedure is required").default(["Not specified"]),
  selection_process: z.array(z.string()).min(1, "Selection process is required").default(["Not specified"]),
  renewal: z.string().min(1, "Renewal information is required").default("Not specified"),
  source: z.array(z.string()).min(1, "At least one source is required").default(["Not specified"])
}).transform(data => ({
  ...data,
  // Ensure arrays are always arrays
  degree_levels: Array.isArray(data.degree_levels) ? data.degree_levels : ["Masters"],
  application_procedure: Array.isArray(data.application_procedure) ? data.application_procedure : ["Not specified"],
  selection_process: Array.isArray(data.selection_process) ? data.selection_process : ["Not specified"],
  source: Array.isArray(data.source) ? data.source : ["Not specified"]
}));

// Search Request Schema
export const SearchRequestSchema = z.object({
  query: z.string().min(1, "Search query is required").max(500, "Search query too long"),
  limit: z.number().int().positive().max(10).optional().default(5)
});

// Search Response Schema
export const SearchResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(ScholarshipSchema),
  message: z.string().optional(),
  processing_time: z.number().positive().optional(),
  total_results: z.number().int().positive().optional()
});

// Error Response Schema
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int().positive()
});

// Type exports
export type ValidatedSearchRequest = z.infer<typeof SearchRequestSchema>;
export type ValidatedScholarship = z.infer<typeof ScholarshipSchema>;
export type ValidatedSearchResponse = z.infer<typeof SearchResponseSchema>;
export type ValidatedErrorResponse = z.infer<typeof ErrorResponseSchema>;
