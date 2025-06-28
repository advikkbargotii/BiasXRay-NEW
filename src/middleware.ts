import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if the request is for an API route
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Clone the request headers and set a new header `x-version`
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-hello-from-middleware1', 'hello')

    // You can also set request headers in NextResponse.rewrite
    const response = NextResponse.next({
      request: {
        // New request headers
        headers: requestHeaders,
      },
    })

    // Add the CORS headers to the response
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    return response
  }

  return NextResponse.next()
} 