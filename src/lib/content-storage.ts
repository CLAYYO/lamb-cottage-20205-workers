import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

// Content validation schemas
const ImageSchema = z.object({
  src: z.string().url().or(z.string().startsWith('/')),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional()
});

const LinkSchema = z.object({
  text: z.string(),
  url: z.string().url().or(z.string().startsWith('/')),
  external: z.boolean().optional()
});

const FacilitySchema = z.object({
  icon: z.string(),
  title: z.string(),
  description: z.string()
});

const PropertySchema = z.object({
  title: z.string(),
  description: z.string(),
  price: z.string(),
  features: z.array(z.string()),
  image: ImageSchema
});

const ReviewSchema = z.object({
  name: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string(),
  date: z.string(),
  location: z.string().optional()
});

const SocialLinkSchema = z.object({
  platform: z.string(),
  url: z.string().url(),
  icon: z.string()
});

// Main content schema
const ContentSchema = z.object({
  topBar: z.object({
    phone: z.string(),
    email: z.string().email(),
    address: z.string(),
    socialLinks: z.array(SocialLinkSchema)
  }),
  header: z.object({
    logo: ImageSchema,
    siteName: z.string()
  }),
  navigation: z.object({
    links: z.array(LinkSchema)
  }),
  hero: z.object({
    backgroundImage: ImageSchema,
    title: z.string(),
    subtitle: z.string(),
    ctaButton: LinkSchema
  }),
  welcome: z.object({
    title: z.string(),
    content: z.string(),
    image: ImageSchema
  }),
  tagline: z.object({
    text: z.string(),
    highlight: z.string()
  }),
  facilities: z.object({
    title: z.string(),
    subtitle: z.string(),
    items: z.array(FacilitySchema)
  }),
  propertySales: z.object({
    title: z.string(),
    subtitle: z.string(),
    properties: z.array(PropertySchema)
  }),
  reviews: z.object({
    title: z.string(),
    subtitle: z.string(),
    items: z.array(ReviewSchema)
  }),
  contact: z.object({
    title: z.string(),
    subtitle: z.string(),
    phone: z.string(),
    email: z.string().email(),
    address: z.string(),
    hours: z.string()
  }),
  bookingBanner: z.object({
    title: z.string(),
    subtitle: z.string(),
    ctaButton: LinkSchema,
    backgroundImage: ImageSchema
  }),
  footer: z.object({
    siteName: z.string(),
    description: z.string(),
    contact: z.object({
      phone: z.string(),
      email: z.string().email(),
      address: z.string()
    }),
    quickLinks: z.array(LinkSchema),
    socialLinks: z.array(SocialLinkSchema),
    copyright: z.string()
  })
});

// Default content structure
export const DEFAULT_CONTENT = {
  topBar: {
    phone: "+44 1234 567890",
    email: "info@lambcottage.co.uk",
    address: "Lamb Cottage Caravan Park, Devon, UK",
    socialLinks: [
      {
        platform: "Facebook",
        url: "https://facebook.com/lambcottage",
        icon: "facebook"
      },
      {
        platform: "Instagram",
        url: "https://instagram.com/lambcottage",
        icon: "instagram"
      },
      {
        platform: "TripAdvisor",
        url: "https://www.tripadvisor.com/Hotel_Review-g499515-d8592952-Reviews-Lamb_Cottage_Caravan_Park-Northwich_Cheshire_England.html",
        icon: "tripadvisor"
      }
    ]
  },
  header: {
    logo: {
      src: "/images/logo.png",
      alt: "Lamb Cottage Caravan Park Logo",
      width: 120,
      height: 60
    },
    siteName: "Lamb Cottage Caravan Park"
  },
  navigation: {
    links: [
      { text: "Home", url: "/", external: false },
      { text: "Facilities", url: "/#facilities", external: false },
      { text: "Property Sales", url: "/#property-sales", external: false },
      { text: "Reviews", url: "/#reviews", external: false },
      { text: "Contact", url: "/#contact", external: false },
      { text: "Book Now", url: "/#booking", external: false }
    ]
  },
  hero: {
    backgroundImage: {
      src: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Beautiful%20caravan%20park%20in%20Devon%20countryside%20with%20rolling%20green%20hills%20and%20peaceful%20atmosphere&image_size=landscape_16_9",
      alt: "Beautiful Devon countryside caravan park"
    },
    title: "Welcome to Lamb Cottage Caravan Park",
    subtitle: "Experience the tranquil beauty of Devon in our peaceful caravan park",
    ctaButton: {
      text: "Book Your Stay",
      url: "/#booking",
      external: false
    }
  },
  welcome: {
    title: "A Peaceful Retreat in Devon",
    content: "Nestled in the heart of Devon's stunning countryside, Lamb Cottage Caravan Park offers the perfect escape from the hustle and bustle of everyday life. Our family-run park provides a warm welcome to all visitors, whether you're looking for a weekend getaway or a longer holiday.",
    image: {
      src: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Cozy%20caravan%20park%20reception%20building%20with%20traditional%20Devon%20architecture&image_size=landscape_4_3",
      alt: "Lamb Cottage reception building"
    }
  },
  tagline: {
    text: "Where memories are made and",
    highlight: "adventures begin"
  },
  facilities: {
    title: "Park Facilities",
    subtitle: "Everything you need for a comfortable stay",
    items: [
      {
        icon: "wifi",
        title: "Free WiFi",
        description: "Stay connected with complimentary high-speed internet throughout the park"
      },
      {
        icon: "car",
        title: "Parking",
        description: "Ample parking spaces available for all guests and visitors"
      },
      {
        icon: "shower",
        title: "Modern Facilities",
        description: "Clean, modern shower and toilet blocks with hot water"
      },
      {
        icon: "playground",
        title: "Children's Play Area",
        description: "Safe and fun playground equipment for children of all ages"
      },
      {
        icon: "laundry",
        title: "Laundry Room",
        description: "Coin-operated washing machines and dryers available"
      },
      {
        icon: "shop",
        title: "On-site Shop",
        description: "Convenience store stocking essentials and local produce"
      }
    ]
  },
  propertySales: {
    title: "Static Caravans for Sale",
    subtitle: "Own your perfect holiday home in Devon",
    properties: [
      {
        title: "Luxury 2-Bedroom Caravan",
        description: "Spacious and modern caravan with stunning countryside views",
        price: "£45,000",
        features: ["2 Bedrooms", "Open Plan Living", "Private Decking", "Garden Views"],
        image: {
          src: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Modern%20luxury%20static%20caravan%20with%20decking%20in%20countryside%20setting&image_size=landscape_4_3",
          alt: "Luxury 2-bedroom static caravan"
        }
      },
      {
        title: "Family 3-Bedroom Home",
        description: "Perfect family retreat with all modern amenities",
        price: "£65,000",
        features: ["3 Bedrooms", "2 Bathrooms", "Large Lounge", "Private Garden"],
        image: {
          src: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Large%20family%20static%20caravan%20home%20with%20garden%20in%20Devon%20countryside&image_size=landscape_4_3",
          alt: "Family 3-bedroom static caravan"
        }
      }
    ]
  },
  reviews: {
    title: "What Our Guests Say",
    subtitle: "Read reviews from our happy visitors",
    items: [
      {
        name: "Sarah Johnson",
        rating: 5,
        comment: "Absolutely wonderful stay! The park is beautifully maintained and the staff are so friendly. We'll definitely be back.",
        date: "2024-08-15",
        location: "London"
      },
      {
        name: "Mike Thompson",
        rating: 5,
        comment: "Perfect location for exploring Devon. Clean facilities and peaceful atmosphere. Highly recommended!",
        date: "2024-07-22",
        location: "Birmingham"
      },
      {
        name: "Emma Wilson",
        rating: 4,
        comment: "Great family-friendly park. The children loved the play area and we enjoyed the beautiful countryside walks.",
        date: "2024-06-10",
        location: "Bristol"
      }
    ]
  },
  contact: {
    title: "Get in Touch",
    subtitle: "We'd love to hear from you",
    phone: "+44 1234 567890",
    email: "info@lambcottage.co.uk",
    address: "Lamb Cottage Caravan Park, Devon, UK",
    hours: "Open daily 8:00 AM - 6:00 PM"
  },
  bookingBanner: {
    title: "Ready to Book Your Stay?",
    subtitle: "Contact us today to reserve your perfect Devon getaway",
    ctaButton: {
      text: "Book Now",
      url: "tel:+441234567890",
      external: true
    },
    backgroundImage: {
      src: "https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=Sunset%20over%20Devon%20countryside%20caravan%20park%20with%20caravans%20and%20rolling%20hills&image_size=landscape_16_9",
      alt: "Sunset over Lamb Cottage Caravan Park"
    }
  },
  footer: {
    siteName: "Lamb Cottage Caravan Park",
    description: "Your perfect Devon countryside retreat. Family-run caravan park offering peaceful holidays and static caravan sales.",
    contact: {
      phone: "+44 1234 567890",
      email: "info@lambcottage.co.uk",
      address: "Lamb Cottage Caravan Park, Devon, UK"
    },
    quickLinks: [
      { text: "Facilities", url: "/#facilities", external: false },
      { text: "Property Sales", url: "/#property-sales", external: false },
      { text: "Reviews", url: "/#reviews", external: false },
      { text: "Contact", url: "/#contact", external: false }
    ],
    socialLinks: [
      {
        platform: "Facebook",
        url: "https://facebook.com/lambcottage",
        icon: "facebook"
      },
      {
        platform: "Instagram",
        url: "https://instagram.com/lambcottage",
        icon: "instagram"
      },
      {
        platform: "TripAdvisor",
        url: "https://www.tripadvisor.com/Hotel_Review-g499515-d8592952-Reviews-Lamb_Cottage_Caravan_Park-Northwich_Cheshire_England.html",
        icon: "tripadvisor"
      }
    ],
    copyright: "© 2024 Lamb Cottage Caravan Park. All rights reserved."
  }
};

// Content file paths
const CONTENT_FILE = path.join(process.cwd(), 'site-content.json');
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Validate content structure
export function validateContent(content: any): { valid: boolean; errors?: string[] } {
  try {
    ContentSchema.parse(content);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      valid: false,
      errors: ['Unknown validation error']
    };
  }
}

// Load content from file
export async function loadContent(): Promise<any> {
  try {
    const contentData = await fs.readFile(CONTENT_FILE, 'utf-8');
    const content = JSON.parse(contentData);
    
    // Validate loaded content
    const validation = validateContent(content);
    if (!validation.valid) {
      console.warn('Content validation failed, using default content:', validation.errors);
      return DEFAULT_CONTENT;
    }
    
    return content;
  } catch (error) {
    console.log('Content file not found or invalid, using default content');
    return DEFAULT_CONTENT;
  }
}

// Save content to file
export async function saveContent(content: any): Promise<{ success: boolean; errors?: string[] }> {
  // Validate content before saving
  const validation = validateContent(content);
  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors
    };
  }
  
  try {
    // Create backup of existing content
    await createBackup('auto');
    
    // Add metadata
    const contentWithMetadata = {
      ...content,
      _metadata: {
        lastUpdated: new Date().toISOString(),
        version: Date.now()
      }
    };
    
    // Save content
    await fs.writeFile(CONTENT_FILE, JSON.stringify(contentWithMetadata, null, 2));
    
    return { success: true };
  } catch (error) {
    console.error('Failed to save content:', error);
    return {
      success: false,
      errors: ['Failed to save content file']
    };
  }
}

// Create content backup
export async function createBackup(type: 'manual' | 'auto' = 'manual'): Promise<boolean> {
  try {
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    // Check if content file exists
    try {
      await fs.access(CONTENT_FILE);
    } catch {
      return false; // No content to backup
    }
    
    // Read current content
    const contentData = await fs.readFile(CONTENT_FILE, 'utf-8');
    const content = JSON.parse(contentData);
    
    // Create backup with metadata
    const backupData = {
      content,
      metadata: {
        createdAt: new Date().toISOString(),
        type,
        version: Date.now()
      }
    };
    
    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `site-content-${type}-${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);
    
    // Save backup
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
    
    return true;
  } catch (error) {
    console.error('Failed to create backup:', error);
    return false;
  }
}

// Initialize content file if it doesn't exist
export async function initializeContent(): Promise<void> {
  try {
    await fs.access(CONTENT_FILE);
  } catch {
    // Content file doesn't exist, create it with default content
    await saveContent(DEFAULT_CONTENT);
    console.log('Initialized content file with default content');
  }
}

// Content storage object
export const contentStorage = {
  load: loadContent,
  save: saveContent,
  createBackup,
  initialize: initializeContent,
  validate: validateContent
};

// Export types
export type ContentType = z.infer<typeof ContentSchema>;
export type ImageType = z.infer<typeof ImageSchema>;
export type LinkType = z.infer<typeof LinkSchema>;
export type FacilityType = z.infer<typeof FacilitySchema>;
export type PropertyType = z.infer<typeof PropertySchema>;
export type ReviewType = z.infer<typeof ReviewSchema>;
export type SocialLinkType = z.infer<typeof SocialLinkSchema>;