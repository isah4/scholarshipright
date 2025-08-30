import { z } from 'zod';

// Citation schema used across structured responses
export const CitationSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).default('Untitled'),
  snippet: z.string().min(1).default(''),
  confidence: z.number().min(0).max(1).default(0.5)
});

// Canonical structured result item
export const StructuredItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1).default(''),
  eligibility: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  deadlines: z.array(z.string()).default([]),
  application_link: z.string().url().optional(),
  citations: z.array(CitationSchema).default([])
});

// Top-level structured response
export const StructuredResponseSchema = z.object({
  query: z.string().optional(),
  locale: z.string().optional(),
  depth: z.enum(['fast', 'standard', 'deep']).default('standard'),
  items: z.array(StructuredItemSchema).default([]),
  sources: z.array(CitationSchema).default([]),
  validationErrors: z.array(z.string()).optional()
});

export type Citation = z.infer<typeof CitationSchema>;
export type StructuredItem = z.infer<typeof StructuredItemSchema>;
export type StructuredResponse = z.infer<typeof StructuredResponseSchema>;


