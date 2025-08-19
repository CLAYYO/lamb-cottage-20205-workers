import type { APIRoute } from 'astro';

export const prerender = false;

interface ContentItem {
  id: string;
  type: string;
  title: string;
  content: any;
  lastModified: string;
}

// Mock CMS content data
const mockContent: Record<string, ContentItem> = {
  'hero': {
    id: 'hero_001',
    type: 'hero',
    title: 'Hero Section Content',
    content: {
      headline: 'We invite you to relax and unwind, have a break and leave your stress behind!',
      subtext: 'Choose from our luxury caravan holiday homes or bring your own caravan to our beautiful Cheshire location.',
      backgroundImage: '/lamb-cottage-hero.jpg',
      primaryCTA: {
        text: 'View Our Video Tour',
        href: '#video-tour',
        variant: 'accent'
      },
      secondaryCTA: {
        text: 'Book Online or Enquire',
        href: '#contact',
        variant: 'primary'
      }
    },
    lastModified: '2024-01-15T10:30:00Z'
  },
  'welcome': {
    id: 'welcome_001',
    type: 'welcome',
    title: 'Welcome Section Content',
    content: {
      heading: 'Welcome to Lamb Cottage Caravan Park',
      text: 'Nestled in the heart of Cheshire, Lamb Cottage Caravan Park offers the perfect retreat for those seeking tranquility and natural beauty. Our five-star facilities and dog-friendly environment make us the ideal destination for your next holiday.',
      images: [
        '/lamb-cottage-in-spring-2017.jpg',
        '/dog-walaking-lamb-cottage.jpg'
      ]
    },
    lastModified: '2024-01-12T14:20:00Z'
  },
  'facilities': {
    id: 'facilities_001',
    type: 'facilities',
    title: 'Facilities Section Content',
    content: {
      heading: 'We Are Very Proud of Our Five Star, Luxury Facilities',
      description: 'Our modern amenities ensure your comfort throughout your stay, with everything you need for a perfect holiday experience.',
      backgroundImage: '/dog-walk-track.jpg',
      facilities: [
        {
          icon: 'shower',
          title: 'Hot Water & Showers',
          description: 'Modern shower facilities with constant hot water'
        },
        {
          icon: 'hair-dryer',
          title: 'Hairdryers & Shower Points',
          description: 'Convenient hairdryers and electrical points'
        },
        {
          icon: 'home',
          title: 'Equipped Suite',
          description: 'Fully equipped amenity suite for your convenience'
        },
        {
          icon: 'washing-machine',
          title: 'Fitted Laundry',
          description: 'Modern laundry facilities with washing machines'
        },
        {
          icon: 'utensils',
          title: 'Dishwashing & Prep Area',
          description: 'Clean preparation and dishwashing facilities'
        },
        {
          icon: 'dog',
          title: 'Dog Walking Area',
          description: 'Extensive dog walking areas and exercise space'
        }
      ]
    },
    lastModified: '2024-01-10T09:15:00Z'
  }
};

export const GET: APIRoute = async ({ params }) => {
  try {
    const { type } = params;
    
    if (!type || typeof type !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Content type is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const content = mockContent[type];
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return new Response(
      JSON.stringify({
        content: content.content,
        lastModified: content.lastModified
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600' // Cache for 10 minutes
        }
      }
    );
    
  } catch (error) {
    console.error('CMS API error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to fetch content' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};