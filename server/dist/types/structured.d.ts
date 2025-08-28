import { z } from 'zod';
export declare const CitationSchema: z.ZodObject<{
    url: z.ZodString;
    title: z.ZodDefault<z.ZodString>;
    snippet: z.ZodDefault<z.ZodString>;
    confidence: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    url: string;
    title: string;
    snippet: string;
    confidence: number;
}, {
    url: string;
    title?: string | undefined;
    snippet?: string | undefined;
    confidence?: number | undefined;
}>;
export declare const StructuredItemSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    summary: z.ZodDefault<z.ZodString>;
    eligibility: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    benefits: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    deadlines: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    application_link: z.ZodOptional<z.ZodString>;
    citations: z.ZodDefault<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        title: z.ZodDefault<z.ZodString>;
        snippet: z.ZodDefault<z.ZodString>;
        confidence: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        title: string;
        snippet: string;
        confidence: number;
    }, {
        url: string;
        title?: string | undefined;
        snippet?: string | undefined;
        confidence?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    benefits: string[];
    summary: string;
    eligibility: string[];
    deadlines: string[];
    citations: {
        url: string;
        title: string;
        snippet: string;
        confidence: number;
    }[];
    application_link?: string | undefined;
}, {
    id: string;
    title: string;
    benefits?: string[] | undefined;
    application_link?: string | undefined;
    summary?: string | undefined;
    eligibility?: string[] | undefined;
    deadlines?: string[] | undefined;
    citations?: {
        url: string;
        title?: string | undefined;
        snippet?: string | undefined;
        confidence?: number | undefined;
    }[] | undefined;
}>;
export declare const StructuredResponseSchema: z.ZodObject<{
    query: z.ZodString;
    locale: z.ZodOptional<z.ZodString>;
    depth: z.ZodDefault<z.ZodEnum<["fast", "standard", "deep"]>>;
    items: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        summary: z.ZodDefault<z.ZodString>;
        eligibility: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        benefits: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        deadlines: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        application_link: z.ZodOptional<z.ZodString>;
        citations: z.ZodDefault<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            title: z.ZodDefault<z.ZodString>;
            snippet: z.ZodDefault<z.ZodString>;
            confidence: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            title: string;
            snippet: string;
            confidence: number;
        }, {
            url: string;
            title?: string | undefined;
            snippet?: string | undefined;
            confidence?: number | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        title: string;
        benefits: string[];
        summary: string;
        eligibility: string[];
        deadlines: string[];
        citations: {
            url: string;
            title: string;
            snippet: string;
            confidence: number;
        }[];
        application_link?: string | undefined;
    }, {
        id: string;
        title: string;
        benefits?: string[] | undefined;
        application_link?: string | undefined;
        summary?: string | undefined;
        eligibility?: string[] | undefined;
        deadlines?: string[] | undefined;
        citations?: {
            url: string;
            title?: string | undefined;
            snippet?: string | undefined;
            confidence?: number | undefined;
        }[] | undefined;
    }>, "many">>;
    sources: z.ZodDefault<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        title: z.ZodDefault<z.ZodString>;
        snippet: z.ZodDefault<z.ZodString>;
        confidence: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        title: string;
        snippet: string;
        confidence: number;
    }, {
        url: string;
        title?: string | undefined;
        snippet?: string | undefined;
        confidence?: number | undefined;
    }>, "many">>;
    validationErrors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    query: string;
    depth: "fast" | "standard" | "deep";
    items: {
        id: string;
        title: string;
        benefits: string[];
        summary: string;
        eligibility: string[];
        deadlines: string[];
        citations: {
            url: string;
            title: string;
            snippet: string;
            confidence: number;
        }[];
        application_link?: string | undefined;
    }[];
    sources: {
        url: string;
        title: string;
        snippet: string;
        confidence: number;
    }[];
    locale?: string | undefined;
    validationErrors?: string[] | undefined;
}, {
    query: string;
    locale?: string | undefined;
    depth?: "fast" | "standard" | "deep" | undefined;
    items?: {
        id: string;
        title: string;
        benefits?: string[] | undefined;
        application_link?: string | undefined;
        summary?: string | undefined;
        eligibility?: string[] | undefined;
        deadlines?: string[] | undefined;
        citations?: {
            url: string;
            title?: string | undefined;
            snippet?: string | undefined;
            confidence?: number | undefined;
        }[] | undefined;
    }[] | undefined;
    sources?: {
        url: string;
        title?: string | undefined;
        snippet?: string | undefined;
        confidence?: number | undefined;
    }[] | undefined;
    validationErrors?: string[] | undefined;
}>;
export type Citation = z.infer<typeof CitationSchema>;
export type StructuredItem = z.infer<typeof StructuredItemSchema>;
export type StructuredResponse = z.infer<typeof StructuredResponseSchema>;
//# sourceMappingURL=structured.d.ts.map