import { NextResponse } from "next/server";

const API_BASE_URL = "https://oyoqkiyim.duckdns.org";

export async function GET() {
  try {
    // Simple health check - try to reach the main API
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // Short timeout for health check
      signal: AbortSignal.timeout(5000), // 5 seconds
    });

    if (response.ok) {
      return NextResponse.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        api_status: response.status,
      });
    } else {
      return NextResponse.json(
        {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          api_status: response.status,
          error: `API returned ${response.status}`,
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
