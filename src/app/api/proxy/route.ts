import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://oyoqkiyim.duckdns.org";

// Common payload types
type ErrorPayload = { error: string } & Record<string, unknown>;
type JsonPayload = Record<string, unknown> | string | null;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint parameter is required" },
        { status: 400 }
      );
    }

    // Build the full URL with query parameters
    const url = new URL(endpoint, API_BASE_URL);

    // Copy all search params except 'endpoint' to the API request
    searchParams.forEach((value, key) => {
      if (key !== "endpoint") {
        url.searchParams.append(key, value);
      }
    });

  // Request forwarded (log removed for performance)

    // Forward Authorization header from client request
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      // Increase timeout
      signal: AbortSignal.timeout(30000), // 30 seconds
    });

    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      return NextResponse.json(
        { error: `API Error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);

    if (error instanceof Error) {
      if (error.name === "TimeoutError") {
        return NextResponse.json(
          { error: "Request timeout - API server is not responding" },
          { status: 408 }
        );
      }
      if (error.message.includes("fetch")) {
        return NextResponse.json(
          { error: "Network error - Unable to connect to API server" },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint parameter is required" },
        { status: 400 }
      );
    }

  // Check if we should use test data or proxy to real server.
  // Previously always true due to constant API_BASE_URL comparison causing unintended 401s.
  const useTestData = process.env.USE_TEST_AUTH === "true"; // enable explicitly via env var only
    
    // For testing purposes or when backend is unavailable, return test response for login
  if (endpoint === "/auth/login" && useTestData) {
      try {
        const body = await request.json();
  // Removed login attempt log for performance
        
        // Test credentials - in a real app, this would be validated against a database
        if (body.name === "admin" && body.password === "password") {
          return NextResponse.json({
            access_token: "test_access_token",
            refresh_token: "test_refresh_token",
            user: {
              id: 1,
              name: "admin",
              surname: "Administrator",
              phone_number: "+1234567890",
              is_admin: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          });
        } else {
          return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
          );
        }
      } catch (error) {
        console.error("Error processing login request:", error);
        return NextResponse.json(
          { error: "Invalid request body" },
          { status: 400 }
        );
      }
    }

    // Continue with normal proxy logic for other endpoints
    const url = new URL(endpoint, API_BASE_URL);

    // Copy all search params except 'endpoint' to the API request
    searchParams.forEach((value, key) => {
      if (key !== "endpoint") {
        url.searchParams.append(key, value);
      }
    });

  // Forwarding POST request (log removed)

    // Forward Authorization header from client request
    const incomingContentType = request.headers.get("content-type") || "";
    const isMultipart = incomingContentType.includes("multipart/form-data");

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (!isMultipart) {
      headers["Content-Type"] = "application/json";
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    let body: BodyInit | null = null;
    if (isMultipart) {
      const form = await request.formData();
      body = form; // boundary auto-generated by fetch
    } else {
      body = await request.text();
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(30000), // 30 seconds
    });
    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      // Try to capture text body for diagnostics
  let errPayload: ErrorPayload = { error: `API Error: ${response.status} ${response.statusText}` };
      try {
        const ct = response.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          errPayload = await response.json();
        } else {
          const txt = await response.text();
          if (txt) errPayload = { error: txt };
        }
      } catch {}
      return NextResponse.json(errPayload, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
  let data: JsonPayload = {};
    if (response.status === 204) {
      data = {};
    } else if (contentType.includes("application/json")) {
      data = await response.json().catch(() => ({}));
    } else {
      const text = await response.text().catch(() => "");
      data = text ? { raw: text } : {};
    }

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint parameter is required" },
        { status: 400 }
      );
    }

  const url = new URL(endpoint, API_BASE_URL);

  // Forwarding PUT request (log removed)

    // Forward Authorization header from client request
    const incomingContentType = request.headers.get("content-type") || "";
    const isMultipart = incomingContentType.includes("multipart/form-data");

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (!isMultipart) {
      headers["Content-Type"] = "application/json";
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    let body: BodyInit | null = null;
    if (isMultipart) {
      const form = await request.formData();
      body = form;
    } else {
      body = await request.text();
    }

    const response = await fetch(url.toString(), {
      method: "PUT",
      headers,
      body,
      signal: AbortSignal.timeout(30000), // 30 seconds
    });
    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
  let errPayload: ErrorPayload = { error: `API Error: ${response.status} ${response.statusText}` };
      try {
        const ct = response.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          errPayload = await response.json();
        } else {
          const txt = await response.text();
          if (txt) errPayload = { error: txt };
        }
      } catch {}
      return NextResponse.json(errPayload, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
  let data: JsonPayload = {};
    if (response.status === 204) {
      data = {};
    } else if (contentType.includes("application/json")) {
      data = await response.json().catch(() => ({}));
    } else {
      const text = await response.text().catch(() => "");
      data = text ? { raw: text } : {};
    }

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint parameter is required" },
        { status: 400 }
      );
    }

    const url = new URL(endpoint, API_BASE_URL);

  // Forwarding DELETE request (log removed)

    // Forward Authorization header from client request
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      headers.Authorization = authHeader;
    }

    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers,
      signal: AbortSignal.timeout(30000), // 30 seconds
    });
    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
  let errPayload: ErrorPayload = { error: `API Error: ${response.status} ${response.statusText}` };
      try {
        const ct = response.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          errPayload = await response.json();
        } else {
          const txt = await response.text();
          if (txt) errPayload = { error: txt };
        }
      } catch {}
      return NextResponse.json(errPayload, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
  let data: JsonPayload = {};
    if (response.status === 204) {
      data = {};
    } else if (contentType.includes("application/json")) {
      data = await response.json().catch(() => ({}));
    } else {
      const text = await response.text().catch(() => "");
      data = text ? { raw: text } : {};
    }

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
