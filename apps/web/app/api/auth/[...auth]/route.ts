import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3003';

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

async function proxyRequest(request: NextRequest) {
  try {
    // Extract the auth path from the URL
    const url = new URL(request.url);
    const authPath = url.pathname.replace('/api/auth', '/auth');
    const targetUrl = `${API_URL}${authPath}${url.search}`;

    console.log(`[Auth Proxy] ${request.method} ${targetUrl}`);

    // Forward all headers from the original request
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // Skip host header as it should be set to the target
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });

    // Get request body if present (for POST requests)
    const body = request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.arrayBuffer()
      : undefined;

    // Make the proxied request to the backend API
    const apiResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: body ? Buffer.from(body) : undefined,
    });

    // Get all response headers including Set-Cookie
    const responseHeaders = new Headers();
    apiResponse.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    console.log(`[Auth Proxy] Response status: ${apiResponse.status}`);
    console.log(`[Auth Proxy] Set-Cookie header:`, responseHeaders.get('set-cookie'));

    // Get response body
    const responseBody = await apiResponse.arrayBuffer();

    // Return response with all headers (including Set-Cookie!)
    return new NextResponse(responseBody, {
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Auth Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Auth proxy request failed' },
      { status: 502 }
    );
  }
}