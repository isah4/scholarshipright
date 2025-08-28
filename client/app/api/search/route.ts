import { NextRequest, NextResponse } from 'next/server';

// Backend server configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    console.log(`Forwarding search request to backend: ${BACKEND_URL}/api/scholarships/search`);

    // Forward request to backend server
    const response = await fetch(`${BACKEND_URL}/api/scholarships/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: body.query,
        limit: body.limit || 5
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { 
          error: 'Backend request failed',
          details: errorData.message || errorData.error || `HTTP ${response.status}`,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend response received:', { success: data.success, results: data.data?.length });
    
    // Return the data from backend
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to search scholarships.' },
    { status: 405 }
  );
}
