import type { APIRoute } from 'astro';
import { getUserFromRequest } from '../../../lib/auth';

export const GET: APIRoute = async (context) => {
  try {
    const user = getUserFromRequest(context);
    
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Not authenticated'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};