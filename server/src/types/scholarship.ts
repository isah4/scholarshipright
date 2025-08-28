export interface ScholarshipBenefits {
  tuition: string;
  stipend: string;
  travel: string;
  insurance: string;
  others: string[];
}

export interface ScholarshipRequirements {
  academic: string;
  age_limit: string;
  language: string;
  others: string[];
}

export interface ApplicationTimeline {
  opening_date: string;
  deadline: string;
  result_announcement: string;
}

export interface Scholarship {
  title: string;
  scholarship_type: "fully funded" | "partial high" | "partial low";
  degree_levels: string[];
  host_country: string;
  benefits: ScholarshipBenefits;
  eligible_countries: string;
  requirements: ScholarshipRequirements;
  application_timeline: ApplicationTimeline;
  application_link: string;
  application_procedure: string[];
  selection_process: string[];
  renewal: string;
  source: string[];
}

export interface SearchRequest {
  query: string;
  limit?: number;
}

export interface SearchResponse {
  success: boolean;
  data: Scholarship[];
  message?: string;
  processing_time?: number;
  total_results?: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}
