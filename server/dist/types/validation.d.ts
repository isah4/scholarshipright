import { z } from 'zod';
export declare const ScholarshipBenefitsSchema: z.ZodEffects<z.ZodObject<{
    tuition: z.ZodDefault<z.ZodString>;
    stipend: z.ZodDefault<z.ZodString>;
    travel: z.ZodDefault<z.ZodString>;
    insurance: z.ZodDefault<z.ZodString>;
    others: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    tuition: string;
    stipend: string;
    travel: string;
    insurance: string;
    others: string[];
}, {
    tuition?: string | undefined;
    stipend?: string | undefined;
    travel?: string | undefined;
    insurance?: string | undefined;
    others?: string[] | undefined;
}>, {
    tuition: string;
    stipend: string;
    travel: string;
    insurance: string;
    others: string[];
}, {
    tuition?: string | undefined;
    stipend?: string | undefined;
    travel?: string | undefined;
    insurance?: string | undefined;
    others?: string[] | undefined;
}>;
export declare const ScholarshipRequirementsSchema: z.ZodEffects<z.ZodObject<{
    academic: z.ZodDefault<z.ZodString>;
    age_limit: z.ZodDefault<z.ZodString>;
    language: z.ZodDefault<z.ZodString>;
    others: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    others: string[];
    academic: string;
    age_limit: string;
    language: string;
}, {
    others?: string[] | undefined;
    academic?: string | undefined;
    age_limit?: string | undefined;
    language?: string | undefined;
}>, {
    academic: string;
    age_limit: string;
    language: string;
    others: string[];
}, {
    others?: string[] | undefined;
    academic?: string | undefined;
    age_limit?: string | undefined;
    language?: string | undefined;
}>;
export declare const ApplicationTimelineSchema: z.ZodEffects<z.ZodObject<{
    opening_date: z.ZodDefault<z.ZodString>;
    deadline: z.ZodDefault<z.ZodString>;
    result_announcement: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    opening_date: string;
    deadline: string;
    result_announcement: string;
}, {
    opening_date?: string | undefined;
    deadline?: string | undefined;
    result_announcement?: string | undefined;
}>, {
    opening_date: string;
    deadline: string;
    result_announcement: string;
}, {
    opening_date?: string | undefined;
    deadline?: string | undefined;
    result_announcement?: string | undefined;
}>;
export declare const ScholarshipSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodString;
    scholarship_type: z.ZodDefault<z.ZodEnum<["fully funded", "partial high", "partial low"]>>;
    degree_levels: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    host_country: z.ZodDefault<z.ZodString>;
    benefits: z.ZodEffects<z.ZodObject<{
        tuition: z.ZodDefault<z.ZodString>;
        stipend: z.ZodDefault<z.ZodString>;
        travel: z.ZodDefault<z.ZodString>;
        insurance: z.ZodDefault<z.ZodString>;
        others: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        tuition: string;
        stipend: string;
        travel: string;
        insurance: string;
        others: string[];
    }, {
        tuition?: string | undefined;
        stipend?: string | undefined;
        travel?: string | undefined;
        insurance?: string | undefined;
        others?: string[] | undefined;
    }>, {
        tuition: string;
        stipend: string;
        travel: string;
        insurance: string;
        others: string[];
    }, {
        tuition?: string | undefined;
        stipend?: string | undefined;
        travel?: string | undefined;
        insurance?: string | undefined;
        others?: string[] | undefined;
    }>;
    eligible_countries: z.ZodDefault<z.ZodString>;
    requirements: z.ZodEffects<z.ZodObject<{
        academic: z.ZodDefault<z.ZodString>;
        age_limit: z.ZodDefault<z.ZodString>;
        language: z.ZodDefault<z.ZodString>;
        others: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        others: string[];
        academic: string;
        age_limit: string;
        language: string;
    }, {
        others?: string[] | undefined;
        academic?: string | undefined;
        age_limit?: string | undefined;
        language?: string | undefined;
    }>, {
        academic: string;
        age_limit: string;
        language: string;
        others: string[];
    }, {
        others?: string[] | undefined;
        academic?: string | undefined;
        age_limit?: string | undefined;
        language?: string | undefined;
    }>;
    application_timeline: z.ZodEffects<z.ZodObject<{
        opening_date: z.ZodDefault<z.ZodString>;
        deadline: z.ZodDefault<z.ZodString>;
        result_announcement: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        opening_date: string;
        deadline: string;
        result_announcement: string;
    }, {
        opening_date?: string | undefined;
        deadline?: string | undefined;
        result_announcement?: string | undefined;
    }>, {
        opening_date: string;
        deadline: string;
        result_announcement: string;
    }, {
        opening_date?: string | undefined;
        deadline?: string | undefined;
        result_announcement?: string | undefined;
    }>;
    application_link: z.ZodDefault<z.ZodString>;
    application_procedure: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    selection_process: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    renewal: z.ZodDefault<z.ZodString>;
    source: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    scholarship_type: "fully funded" | "partial high" | "partial low";
    degree_levels: string[];
    host_country: string;
    benefits: {
        tuition: string;
        stipend: string;
        travel: string;
        insurance: string;
        others: string[];
    };
    eligible_countries: string;
    requirements: {
        academic: string;
        age_limit: string;
        language: string;
        others: string[];
    };
    application_timeline: {
        opening_date: string;
        deadline: string;
        result_announcement: string;
    };
    application_link: string;
    application_procedure: string[];
    selection_process: string[];
    renewal: string;
    source: string[];
}, {
    title: string;
    benefits: {
        tuition?: string | undefined;
        stipend?: string | undefined;
        travel?: string | undefined;
        insurance?: string | undefined;
        others?: string[] | undefined;
    };
    requirements: {
        others?: string[] | undefined;
        academic?: string | undefined;
        age_limit?: string | undefined;
        language?: string | undefined;
    };
    application_timeline: {
        opening_date?: string | undefined;
        deadline?: string | undefined;
        result_announcement?: string | undefined;
    };
    scholarship_type?: "fully funded" | "partial high" | "partial low" | undefined;
    degree_levels?: string[] | undefined;
    host_country?: string | undefined;
    eligible_countries?: string | undefined;
    application_link?: string | undefined;
    application_procedure?: string[] | undefined;
    selection_process?: string[] | undefined;
    renewal?: string | undefined;
    source?: string[] | undefined;
}>, {
    degree_levels: string[];
    application_procedure: string[];
    selection_process: string[];
    source: string[];
    title: string;
    scholarship_type: "fully funded" | "partial high" | "partial low";
    host_country: string;
    benefits: {
        tuition: string;
        stipend: string;
        travel: string;
        insurance: string;
        others: string[];
    };
    eligible_countries: string;
    requirements: {
        academic: string;
        age_limit: string;
        language: string;
        others: string[];
    };
    application_timeline: {
        opening_date: string;
        deadline: string;
        result_announcement: string;
    };
    application_link: string;
    renewal: string;
}, {
    title: string;
    benefits: {
        tuition?: string | undefined;
        stipend?: string | undefined;
        travel?: string | undefined;
        insurance?: string | undefined;
        others?: string[] | undefined;
    };
    requirements: {
        others?: string[] | undefined;
        academic?: string | undefined;
        age_limit?: string | undefined;
        language?: string | undefined;
    };
    application_timeline: {
        opening_date?: string | undefined;
        deadline?: string | undefined;
        result_announcement?: string | undefined;
    };
    scholarship_type?: "fully funded" | "partial high" | "partial low" | undefined;
    degree_levels?: string[] | undefined;
    host_country?: string | undefined;
    eligible_countries?: string | undefined;
    application_link?: string | undefined;
    application_procedure?: string[] | undefined;
    selection_process?: string[] | undefined;
    renewal?: string | undefined;
    source?: string[] | undefined;
}>;
export declare const SearchRequestSchema: z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
}, {
    query: string;
    limit?: number | undefined;
}>;
export declare const StructuredSearchRequestSchema: z.ZodObject<{
    query: z.ZodString;
    structured: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    locale: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    depth: z.ZodDefault<z.ZodOptional<z.ZodEnum<["fast", "standard", "deep"]>>>;
}, "strip", z.ZodTypeAny, {
    query: string;
    structured: boolean;
    locale: string;
    depth: "fast" | "standard" | "deep";
}, {
    query: string;
    structured?: boolean | undefined;
    locale?: string | undefined;
    depth?: "fast" | "standard" | "deep" | undefined;
}>;
export declare const SearchResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodArray<z.ZodEffects<z.ZodObject<{
        title: z.ZodString;
        scholarship_type: z.ZodDefault<z.ZodEnum<["fully funded", "partial high", "partial low"]>>;
        degree_levels: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        host_country: z.ZodDefault<z.ZodString>;
        benefits: z.ZodEffects<z.ZodObject<{
            tuition: z.ZodDefault<z.ZodString>;
            stipend: z.ZodDefault<z.ZodString>;
            travel: z.ZodDefault<z.ZodString>;
            insurance: z.ZodDefault<z.ZodString>;
            others: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            tuition: string;
            stipend: string;
            travel: string;
            insurance: string;
            others: string[];
        }, {
            tuition?: string | undefined;
            stipend?: string | undefined;
            travel?: string | undefined;
            insurance?: string | undefined;
            others?: string[] | undefined;
        }>, {
            tuition: string;
            stipend: string;
            travel: string;
            insurance: string;
            others: string[];
        }, {
            tuition?: string | undefined;
            stipend?: string | undefined;
            travel?: string | undefined;
            insurance?: string | undefined;
            others?: string[] | undefined;
        }>;
        eligible_countries: z.ZodDefault<z.ZodString>;
        requirements: z.ZodEffects<z.ZodObject<{
            academic: z.ZodDefault<z.ZodString>;
            age_limit: z.ZodDefault<z.ZodString>;
            language: z.ZodDefault<z.ZodString>;
            others: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            others: string[];
            academic: string;
            age_limit: string;
            language: string;
        }, {
            others?: string[] | undefined;
            academic?: string | undefined;
            age_limit?: string | undefined;
            language?: string | undefined;
        }>, {
            academic: string;
            age_limit: string;
            language: string;
            others: string[];
        }, {
            others?: string[] | undefined;
            academic?: string | undefined;
            age_limit?: string | undefined;
            language?: string | undefined;
        }>;
        application_timeline: z.ZodEffects<z.ZodObject<{
            opening_date: z.ZodDefault<z.ZodString>;
            deadline: z.ZodDefault<z.ZodString>;
            result_announcement: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            opening_date: string;
            deadline: string;
            result_announcement: string;
        }, {
            opening_date?: string | undefined;
            deadline?: string | undefined;
            result_announcement?: string | undefined;
        }>, {
            opening_date: string;
            deadline: string;
            result_announcement: string;
        }, {
            opening_date?: string | undefined;
            deadline?: string | undefined;
            result_announcement?: string | undefined;
        }>;
        application_link: z.ZodDefault<z.ZodString>;
        application_procedure: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        selection_process: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        renewal: z.ZodDefault<z.ZodString>;
        source: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        scholarship_type: "fully funded" | "partial high" | "partial low";
        degree_levels: string[];
        host_country: string;
        benefits: {
            tuition: string;
            stipend: string;
            travel: string;
            insurance: string;
            others: string[];
        };
        eligible_countries: string;
        requirements: {
            academic: string;
            age_limit: string;
            language: string;
            others: string[];
        };
        application_timeline: {
            opening_date: string;
            deadline: string;
            result_announcement: string;
        };
        application_link: string;
        application_procedure: string[];
        selection_process: string[];
        renewal: string;
        source: string[];
    }, {
        title: string;
        benefits: {
            tuition?: string | undefined;
            stipend?: string | undefined;
            travel?: string | undefined;
            insurance?: string | undefined;
            others?: string[] | undefined;
        };
        requirements: {
            others?: string[] | undefined;
            academic?: string | undefined;
            age_limit?: string | undefined;
            language?: string | undefined;
        };
        application_timeline: {
            opening_date?: string | undefined;
            deadline?: string | undefined;
            result_announcement?: string | undefined;
        };
        scholarship_type?: "fully funded" | "partial high" | "partial low" | undefined;
        degree_levels?: string[] | undefined;
        host_country?: string | undefined;
        eligible_countries?: string | undefined;
        application_link?: string | undefined;
        application_procedure?: string[] | undefined;
        selection_process?: string[] | undefined;
        renewal?: string | undefined;
        source?: string[] | undefined;
    }>, {
        degree_levels: string[];
        application_procedure: string[];
        selection_process: string[];
        source: string[];
        title: string;
        scholarship_type: "fully funded" | "partial high" | "partial low";
        host_country: string;
        benefits: {
            tuition: string;
            stipend: string;
            travel: string;
            insurance: string;
            others: string[];
        };
        eligible_countries: string;
        requirements: {
            academic: string;
            age_limit: string;
            language: string;
            others: string[];
        };
        application_timeline: {
            opening_date: string;
            deadline: string;
            result_announcement: string;
        };
        application_link: string;
        renewal: string;
    }, {
        title: string;
        benefits: {
            tuition?: string | undefined;
            stipend?: string | undefined;
            travel?: string | undefined;
            insurance?: string | undefined;
            others?: string[] | undefined;
        };
        requirements: {
            others?: string[] | undefined;
            academic?: string | undefined;
            age_limit?: string | undefined;
            language?: string | undefined;
        };
        application_timeline: {
            opening_date?: string | undefined;
            deadline?: string | undefined;
            result_announcement?: string | undefined;
        };
        scholarship_type?: "fully funded" | "partial high" | "partial low" | undefined;
        degree_levels?: string[] | undefined;
        host_country?: string | undefined;
        eligible_countries?: string | undefined;
        application_link?: string | undefined;
        application_procedure?: string[] | undefined;
        selection_process?: string[] | undefined;
        renewal?: string | undefined;
        source?: string[] | undefined;
    }>, "many">;
    message: z.ZodOptional<z.ZodString>;
    processing_time: z.ZodOptional<z.ZodNumber>;
    total_results: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data: {
        degree_levels: string[];
        application_procedure: string[];
        selection_process: string[];
        source: string[];
        title: string;
        scholarship_type: "fully funded" | "partial high" | "partial low";
        host_country: string;
        benefits: {
            tuition: string;
            stipend: string;
            travel: string;
            insurance: string;
            others: string[];
        };
        eligible_countries: string;
        requirements: {
            academic: string;
            age_limit: string;
            language: string;
            others: string[];
        };
        application_timeline: {
            opening_date: string;
            deadline: string;
            result_announcement: string;
        };
        application_link: string;
        renewal: string;
    }[];
    message?: string | undefined;
    processing_time?: number | undefined;
    total_results?: number | undefined;
}, {
    success: boolean;
    data: {
        title: string;
        benefits: {
            tuition?: string | undefined;
            stipend?: string | undefined;
            travel?: string | undefined;
            insurance?: string | undefined;
            others?: string[] | undefined;
        };
        requirements: {
            others?: string[] | undefined;
            academic?: string | undefined;
            age_limit?: string | undefined;
            language?: string | undefined;
        };
        application_timeline: {
            opening_date?: string | undefined;
            deadline?: string | undefined;
            result_announcement?: string | undefined;
        };
        scholarship_type?: "fully funded" | "partial high" | "partial low" | undefined;
        degree_levels?: string[] | undefined;
        host_country?: string | undefined;
        eligible_countries?: string | undefined;
        application_link?: string | undefined;
        application_procedure?: string[] | undefined;
        selection_process?: string[] | undefined;
        renewal?: string | undefined;
        source?: string[] | undefined;
    }[];
    message?: string | undefined;
    processing_time?: number | undefined;
    total_results?: number | undefined;
}>;
export declare const ErrorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodString;
    message: z.ZodString;
    statusCode: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    error: string;
    message: string;
    success: false;
    statusCode: number;
}, {
    error: string;
    message: string;
    success: false;
    statusCode: number;
}>;
export type ValidatedSearchRequest = z.infer<typeof SearchRequestSchema>;
export type ValidatedStructuredSearchRequest = z.infer<typeof StructuredSearchRequestSchema>;
export type ValidatedScholarship = z.infer<typeof ScholarshipSchema>;
export type ValidatedSearchResponse = z.infer<typeof SearchResponseSchema>;
export type ValidatedErrorResponse = z.infer<typeof ErrorResponseSchema>;
//# sourceMappingURL=validation.d.ts.map