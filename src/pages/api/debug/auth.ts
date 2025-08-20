import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  // Debug endpoint to check environment variables and request info
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET (length: ' + process.env.JWT_SECRET.length + ')' : 'NOT SET',
      ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH ? 'SET (starts with: ' + process.env.ADMIN_PASSWORD_HASH.substring(0, 10) + '...)' : 'NOT SET'
    },
    astroLocals: {
      JWT_SECRET: (locals as any)?.JWT_SECRET ? 'SET (length: ' + (locals as any).JWT_SECRET.length + ')' : 'NOT SET',
      ADMIN_PASSWORD_HASH: (locals as any)?.ADMIN_PASSWORD_HASH ? 'SET (starts with: ' + (locals as any).ADMIN_PASSWORD_HASH.substring(0, 10) + '...)' : 'NOT SET'
    },
    runtimeEnv: {
      JWT_SECRET: (globalThis as any)?.JWT_SECRET ? 'SET' : 'NOT SET',
      ADMIN_PASSWORD_HASH: (globalThis as any)?.ADMIN_PASSWORD_HASH ? 'SET' : 'NOT SET'
    },
    headers: {
      'user-agent': request.headers.get('user-agent'),
      'host': request.headers.get('host'),
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'cf-ray': request.headers.get('cf-ray')
    },
    url: request.url
  };

  return new Response(JSON.stringify(debugInfo, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    const testResult = {
      timestamp: new Date().toISOString(),
      receivedData: {
        username: body.username,
        passwordLength: body.password?.length || 0
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'undefined',
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH ? 'SET' : 'NOT SET'
      },
      testAuth: {
        usernameMatch: body.username === 'admin',
        passwordMatch: body.password === 'password' || body.password === 'admin123'
      }
    };

    return new Response(JSON.stringify(testResult, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to parse request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};