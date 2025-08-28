"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, GraduationCap, Globe, Calendar, DollarSign, FileText, Users, Clock, AlertCircle, ExternalLink, ArrowLeft } from "lucide-react"

interface ScholarshipData {
  title: string
  scholarship_type: string
  degree_levels: string[]
  host_country: string
  benefits: {
    tuition: string
    stipend: string
    travel: string
    insurance: string
    others: string[]
  }
  eligible_countries: string
  requirements: {
    academic: string
    age_limit: string
    language: string
    others: string[]
  }
  application_timeline: {
    opening_date: string
    deadline: string
    result_announcement: string
  }
  application_link: string
  application_procedure: string[]
  selection_process: string[]
  renewal: string
  source: string[]
}

interface SearchResponse {
  success: boolean
  data: ScholarshipData[]
  message: string
  processing_time: number
  total_results: number
}

export default function ScholarshipSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [selectedScholarship, setSelectedScholarship] = useState<ScholarshipData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResults(null)
    setSelectedScholarship(null)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, limit: 5 }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Search failed')
      }

      const data: SearchResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Search failed')
      }

      setResults(data)
    } catch (error) {
      console.error("Search failed:", error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getScholarshipTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "fully funded":
        return "bg-green-100 text-green-800 border-green-200"
      case "partial high":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "partial low":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  // Show scholarship details
  if (selectedScholarship) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedScholarship(null)} 
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Button>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl text-balance mb-2">{selectedScholarship.title}</CardTitle>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getScholarshipTypeColor(selectedScholarship.scholarship_type)}>
                      {selectedScholarship.scholarship_type}
                    </Badge>
                    {selectedScholarship.degree_levels.map((level, index) => (
                      <Badge key={index} variant="outline">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">{selectedScholarship.host_country}</span>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedScholarship.benefits.tuition && (
                  <div>
                    <span className="font-medium">Tuition:</span>
                    <p className="text-sm text-muted-foreground">{selectedScholarship.benefits.tuition}</p>
                  </div>
                )}
                {selectedScholarship.benefits.stipend && (
                  <div>
                    <span className="font-medium">Stipend:</span>
                    <p className="text-sm text-muted-foreground">{selectedScholarship.benefits.stipend}</p>
                  </div>
                )}
                {selectedScholarship.benefits.travel && (
                  <div>
                    <span className="font-medium">Travel:</span>
                    <p className="text-sm text-muted-foreground">{selectedScholarship.benefits.travel}</p>
                  </div>
                )}
                {selectedScholarship.benefits.insurance && (
                  <div>
                    <span className="font-medium">Insurance:</span>
                    <p className="text-sm text-muted-foreground">{selectedScholarship.benefits.insurance}</p>
                  </div>
                )}
                {selectedScholarship.benefits.others.length > 0 && (
                  <div>
                    <span className="font-medium">Other Benefits:</span>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {selectedScholarship.benefits.others.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedScholarship.requirements.academic && (
                  <div>
                    <span className="font-medium">Academic:</span>
                    <p className="text-sm text-muted-foreground">{selectedScholarship.requirements.academic}</p>
                  </div>
                )}
                {selectedScholarship.requirements.age_limit && (
                  <div>
                    <span className="font-medium">Age Limit:</span>
                    <p className="text-sm text-muted-foreground">{selectedScholarship.requirements.age_limit}</p>
                  </div>
                )}
                {selectedScholarship.requirements.language && (
                  <div>
                    <span className="font-medium">Language:</span>
                    <p className="text-sm text-muted-foreground">{selectedScholarship.requirements.language}</p>
                  </div>
                )}
                {selectedScholarship.requirements.others.length > 0 && (
                  <div>
                    <span className="font-medium">Other Requirements:</span>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {selectedScholarship.requirements.others.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Eligibility */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Eligibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <span className="font-medium">Eligible Countries:</span>
                  <p className="text-sm text-muted-foreground">{selectedScholarship.eligible_countries}</p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Application Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedScholarship.application_timeline.opening_date && (
                  <div>
                    <span className="font-medium">Opening Date:</span>
                    <p className="text-sm text-muted-foreground">{selectedScholarship.application_timeline.opening_date}</p>
                  </div>
                )}
                {selectedScholarship.application_timeline.deadline && (
                  <div>
                    <span className="font-medium">Deadline:</span>
                    <p className="text-sm text-muted-foreground">{selectedScholarship.application_timeline.deadline}</p>
                  </div>
                )}
                {selectedScholarship.application_timeline.result_announcement && (
                  <div>
                    <span className="font-medium">Result Announcement:</span>
                    <p className="text-sm text-muted-foreground">{selectedScholarship.application_timeline.result_announcement}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Application Process */}
          {selectedScholarship.application_procedure.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Application Procedure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2">
                  {selectedScholarship.application_procedure.map((step, index) => (
                    <li key={index} className="text-sm">
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Selection Process */}
          {selectedScholarship.selection_process.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Selection Process</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {selectedScholarship.selection_process.map((process, index) => (
                    <li key={index} className="text-sm">
                      {process}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Application Link */}
          {selectedScholarship.application_link && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <Button asChild className="w-full">
                  <a href={selectedScholarship.application_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Apply Now
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Additional Info */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {selectedScholarship.renewal && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Renewal Policy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selectedScholarship.renewal}</p>
                </CardContent>
              </Card>
            )}

            {selectedScholarship.source.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {selectedScholarship.source.map((src, index) => (
                      <li key={index}>
                        <a
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {src}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show search results
  if (results) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => setResults(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              New Search
            </Button>
            <div className="text-sm text-muted-foreground">
              Found {results.total_results} scholarship(s) in {formatProcessingTime(results.processing_time)}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Search Results</h2>
            <p className="text-muted-foreground">Query: "{query}"</p>
          </div>

          <div className="grid gap-6">
            {results.data.map((scholarship, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" 
                    onClick={() => setSelectedScholarship(scholarship)}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-balance mb-3">{scholarship.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className={getScholarshipTypeColor(scholarship.scholarship_type)}>
                          {scholarship.scholarship_type}
                        </Badge>
                        {scholarship.degree_levels.map((level, levelIndex) => (
                          <Badge key={levelIndex} variant="outline">
                            {level}
                          </Badge>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Country:</span>
                          <p className="text-muted-foreground">{scholarship.host_country}</p>
                        </div>
                        <div>
                          <span className="font-medium">Eligible:</span>
                          <p className="text-muted-foreground">{scholarship.eligible_countries}</p>
                        </div>
                        <div>
                          <span className="font-medium">Deadline:</span>
                          <p className="text-muted-foreground">{scholarship.application_timeline.deadline}</p>
                        </div>
                        <div>
                          <span className="font-medium">Stipend:</span>
                          <p className="text-muted-foreground">{scholarship.benefits.stipend}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm">{scholarship.host_country}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Click to view full details
                    </p>
                    <Button variant="ghost" size="sm">
                      View Details →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <GraduationCap className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-balance">ScholarshipRight</h1>
          <p className="text-xl text-muted-foreground text-pretty">
            AI-powered scholarship discovery tailored to your academic journey
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="search" className="text-sm font-medium">
                Describe your scholarship interests or requirements
              </label>
              <Textarea
                id="search"
                placeholder="e.g., I'm looking for fully funded PhD scholarships in Computer Science for international students in Japan..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSearch()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Press Ctrl+Enter to search
              </p>
            </div>
            <Button onClick={handleSearch} disabled={loading || !query.trim()} className="w-full" size="lg">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search Scholarships
                </>
              )}
            </Button>
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Enter your scholarship requirements and our AI will find the best matches for you</p>
          <p>Search queries are processed using advanced AI to provide accurate, up-to-date scholarship information</p>
        </div>
      </div>
    </div>
  )
}
