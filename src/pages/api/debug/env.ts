import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    const envCheck = {
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      hasAdminPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
      adminPasswordHashLength: process.env.ADMIN_PASSWORD_HASH?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      cryptoAvailable: typeof crypto !== 'undefined',
      cryptoSubtleAvailable: typeof crypto?.subtle !== 'undefined',
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(envCheck, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to check environment',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};