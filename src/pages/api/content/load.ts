import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/auth';

// Check if we're in a Node.js environment (local development)
const isNodeEnvironment = typeof process !== 'undefined' && process.versions && process.versions.node;

let fs: any = null;
let path: any = null;
let CONTENT_DIR: string = '';
let CONTENT_FILE: string = '';

if (isNodeEnvironment) {
  try {
    fs = await import('fs/promises');
    path = await import('path');
    CONTENT_DIR = path.join(process.cwd(), 'content');
    CONTENT_FILE = path.join(CONTENT_DIR, 'site-content.json');
  } catch (error) {
    console.warn('File system modules not available:', error);
  }
}

// Default content structure
const DEFAULT_CONTENT = {
  hero: {
    title: "Welcome to Lamb Cottage Caravan Park",
    subtitle: "Experience the perfect blend of comfort and nature in our premium caravan park nestled in the heart of the countryside.",
    ctaButton: {
      text: "Book Your Stay"
    },
    backgroundImage: {
      src: "/images/lamb-cottage-hero.jpg",
      alt: "Lamb Cottage Caravan Park"
    }
  },
  welcome: {
    title: "Welcome to Lamb Cottage",
    content: "<p>Nestled in the picturesque countryside, Lamb Cottage Caravan Park offers the perfect escape from the hustle and bustle of everyday life. Our family-run park has been welcoming guests for over 20 years, providing a peaceful retreat where you can reconnect with nature and create lasting memories.</p><p>Whether you're looking for a weekend getaway or an extended holiday, our well-maintained facilities and friendly atmosphere ensure a comfortable and enjoyable stay for all our guests.</p>",
    image: {
      src: "/images/welcome-cottage.jpg",
      alt: "Welcome to Lamb Cottage"
    }
  },
  tagline: {
    text: "Your Home Away From Home",
    description: "Experience comfort, tranquility, and adventure in our beautiful countryside setting."
  },
  facilities: {
    title: "Our Facilities",
    subtitle: "Everything you need for a comfortable stay",
    items: [
      {
        name: "Electric Hook-ups",
        description: "Full electric hook-ups available for all pitches",
        icon: "⚡"
      },
      {
        name: "Clean Facilities",
        description: "Modern shower and toilet blocks cleaned daily",
        icon: "🚿"
      },
      {
        name: "On-site Shop",
        description: "Convenience store with essentials and local produce",
        icon: "🏪"
      },
      {
        name: "Laundry Room",
        description: "Coin-operated washing machines and dryers",
        icon: "👕"
      },
      {
        name: "Children's Play Area",
        description: "Safe and fun playground for kids of all ages",
        icon: "🎠"
      },
      {
        name: "Dog Walking Area",
        description: "Designated areas for exercising your four-legged friends",
        icon: "🐕"
      }
    ]
  },
  propertySales: {
    title: "Static Caravans for Sale",
    subtitle: "Own your own piece of paradise with our selection of quality static caravans. Perfect for holidays, weekend retreats, or permanent residence.",
    cta: "View Available Properties",
    properties: [
      {
        title: "Luxury 3-Bedroom Static Caravan",
        price: "£45,000",
        description: "Spacious and modern static caravan with stunning countryside views",
        bedrooms: 3,
        bathrooms: 2,
        features: ["Central heating", "Double glazing", "Private decking", "Garden area"]
      }
    ],
    features: [
      "Prime locations within the park",
      "Modern amenities and furnishings",
      "Access to all park facilities",
      "Flexible financing options available"
    ]
  },
  reviews: {
    title: "What Our Guests Say",
    subtitle: "Don't just take our word for it - hear from our happy guests",
    items: [
      {
        id: "1",
        name: "Sarah Johnson",
        rating: 5,
        comment: "Absolutely wonderful stay! The facilities were spotless and the staff incredibly friendly. We'll definitely be back next year.",
        text: "Absolutely wonderful stay! The facilities were spotless and the staff incredibly friendly. We'll definitely be back next year.",
        date: "2024-08-15",
        location: "Manchester"
      },
      {
        id: "2",
        name: "Mike Thompson",
        rating: 5,
        comment: "Perfect location for exploring the countryside. Our kids loved the play area and we appreciated the peaceful atmosphere.",
        text: "Perfect location for exploring the countryside. Our kids loved the play area and we appreciated the peaceful atmosphere.",
        date: "2024-07-22",
        location: "Birmingham"
      },
      {
        id: "3",
        name: "Emma Wilson",
        rating: 4,
        comment: "Great value for money. Clean facilities and beautiful surroundings. The on-site shop was very convenient.",
        text: "Great value for money. Clean facilities and beautiful surroundings. The on-site shop was very convenient.",
        date: "2024-06-10",
        location: "Leeds"
      }
    ]
  },
  contact: {
    title: "Get in Touch",
    subtitle: "Have questions or ready to book? We'd love to hear from you!",
    email: "info@lambcottage.co.uk",
    phone: "01234 567890",
    address: "Lamb Cottage Caravan Park\nCountryside Lane\nVillage Name\nCounty AB12 3CD"
  },
  bookingBanner: {
    title: "Ready to Book Your Stay?",
    description: "Don't wait - secure your perfect countryside getaway today!",
    primaryButton: {
      text: "Book Now",
      url: "/booking"
    },
    secondaryButton: {
      text: "View Availability",
      url: "/availability"
    },
    features: [
      "Instant confirmation",
      "Best price guarantee",
      "Flexible cancellation"
    ]
  },
  footer: {
    description: "Lamb Cottage Caravan Park - Your peaceful retreat in the heart of the countryside. Family-run since 2003.",
    address: "Lamb Cottage Caravan Park\nCountryside Lane\nVillage Name\nCounty AB12 3CD",
    hours: "Reception Hours:\nMonday - Friday: 9:00 AM - 5:00 PM\nSaturday - Sunday: 10:00 AM - 4:00 PM\nEmergency contact available 24/7",
    social: {
      facebook: "https://facebook.com/lambcottagepark",
      instagram: "https://instagram.com/lambcottagepark",
      tripadvisor: "https://www.tripadvisor.com/Hotel_Review-g499515-d8592952-Reviews-Lamb_Cottage_Caravan_Park-Northwich_Cheshire_England.html"
    }
  },
  _metadata: {
    lastUpdated: new Date().toISOString(),
    updatedBy: "system",
    version: Date.now()
  }
};

export const GET: APIRoute = async (context) => {
  try {
    // Check authentication - requireAuth returns Response on failure, null on success
    const authResult = await requireAuth(context);
    if (authResult) {
      // Authentication failed, return the error response
      return authResult;
    }
    
    let content;
    
    // Try to load content from file system (Node.js environment only)
    if (isNodeEnvironment && fs && CONTENT_FILE) {
      try {
        const contentData = await fs.readFile(CONTENT_FILE, 'utf-8');
        content = JSON.parse(contentData);
      } catch (error) {
        console.log('Using default content (file not found):', error);
        content = DEFAULT_CONTENT;
        
        // Try to create the content directory and file
        try {
          await fs.mkdir(CONTENT_DIR, { recursive: true });
          await fs.writeFile(CONTENT_FILE, JSON.stringify(DEFAULT_CONTENT, null, 2));
        } catch (writeError) {
          console.warn('Could not create default content file:', writeError);
        }
      }
    } else {
      // In serverless environment (Cloudflare), always use default content
      console.log('Using default content (serverless environment)');
      content = DEFAULT_CONTENT;
    }
    
    return new Response(JSON.stringify({
      success: true,
      content,
      metadata: content._metadata || {
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system',
        version: Date.now()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error loading content:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'Failed to load content'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Also export a function to get content for SSR
export async function getContent() {
  // In serverless environments, always return default content
  if (!isNodeEnvironment || !fs || !CONTENT_FILE) {
    return DEFAULT_CONTENT;
  }
  
  try {
    const contentData = await fs.readFile(CONTENT_FILE, 'utf-8');
    return JSON.parse(contentData);
  } catch {
    return DEFAULT_CONTENT;
  }
}