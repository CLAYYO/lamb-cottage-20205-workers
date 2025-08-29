import { z } from 'zod';

// Cloudflare KV types
interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<any>;
  put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: Array<{ name: string; expiration?: number; metadata?: any }>; list_complete: boolean; cursor?: string }>;
}

// Content validation schemas (reused from content-storage.ts)
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
  }).optional(),
  header: z.object({
    logo: ImageSchema,
    siteName: z.string()
  }).optional(),
  navigation: z.object({
    links: z.array(LinkSchema)
  }).optional(),
  hero: z.object({
    backgroundImage: ImageSchema,
    title: z.string(),
    subtitle: z.string(),
    ctaButton: LinkSchema
  }).optional(),
  welcome: z.object({
    title: z.string(),
    content: z.string(),
    image: ImageSchema
  }).optional(),
  tagline: z.object({
    text: z.string(),
    highlight: z.string()
  }).optional(),
  facilities: z.object({
    title: z.string(),
    subtitle: z.string(),
    items: z.array(FacilitySchema)
  }).optional(),
  propertySales: z.object({
    title: z.string(),
    subtitle: z.string(),
    properties: z.array(PropertySchema)
  }).optional(),
  reviews: z.object({
    title: z.string(),
    subtitle: z.string(),
    items: z.array(ReviewSchema)
  }).optional(),
  contact: z.object({
    title: z.string(),
    subtitle: z.string(),
    phone: z.string(),
    email: z.string().email(),
    address: z.string(),
    hours: z.string()
  }).optional(),
  bookingBanner: z.object({
    title: z.string(),
    subtitle: z.string(),
    ctaButton: LinkSchema,
    backgroundImage: ImageSchema
  }).optional(),
  footer: z.object({
    companyName: z.string(),
    description: z.string(),
    copyright: z.string()
  }).optional()
});

// Cloudflare KV Storage Adapter
export class CloudflareStorage {
  private kv: KVNamespace | null = null;

  constructor(kvNamespace?: KVNamespace) {
    this.kv = kvNamespace || null;
  }

  // Initialize KV from runtime context
  initialize(runtime: any) {
    if (runtime?.env?.CONTENT_KV) {
      this.kv = runtime.env.CONTENT_KV;
    }
  }

  // Load content from KV or return default
  async loadContent(): Promise<any> {
    if (!this.kv) {
      console.warn('KV not available, using default content');
      return this.getDefaultContent();
    }

    try {
      const contentData = await this.kv.get('site-content', 'json');
      return contentData || this.getDefaultContent();
    } catch (error) {
      console.error('Failed to load content from KV:', error);
      return this.getDefaultContent();
    }
  }

  // Save content to KV
  async saveContent(content: any): Promise<{ success: boolean; errors?: string[] }> {
    // Validate content
    const validation = this.validateContent(content);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    if (!this.kv) {
      return {
        success: false,
        errors: ['KV storage not available']
      };
    }

    try {
      // Create backup first
      await this.createBackup('auto');

      // Add metadata
      const contentWithMetadata = {
        ...content,
        _metadata: {
          lastUpdated: new Date().toISOString(),
          version: Date.now()
        }
      };

      // Save to KV
      await this.kv.put('site-content', JSON.stringify(contentWithMetadata));

      return { success: true };
    } catch (error) {
      console.error('Failed to save content to KV:', error);
      return {
        success: false,
        errors: ['Failed to save content']
      };
    }
  }

  // Create backup in KV
  async createBackup(type: 'manual' | 'auto' = 'manual'): Promise<boolean> {
    if (!this.kv) {
      return false;
    }

    try {
      // Get current content
      const currentContent = await this.kv.get('site-content', 'json');
      if (!currentContent) {
        return false;
      }

      // Create backup with metadata
      const backupData = {
        content: currentContent,
        metadata: {
          createdAt: new Date().toISOString(),
          type,
          version: Date.now()
        }
      };

      // Generate backup key
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupKey = `backup:site-content:${type}:${timestamp}`;

      // Save backup
      await this.kv.put(backupKey, JSON.stringify(backupData));

      // Clean up old backups (keep last 10)
      await this.cleanupOldBackups();

      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }

  // Clean up old backups
  private async cleanupOldBackups(): Promise<void> {
    if (!this.kv) return;

    try {
      const backupList = await this.kv.list({ prefix: 'backup:site-content:' });
      const backupKeys = backupList.keys.map((k: { name: string }) => k.name).sort().reverse();

      // Keep only the 10 most recent backups
      if (backupKeys.length > 10) {
        const keysToDelete = backupKeys.slice(10);
        for (const key of keysToDelete) {
          await this.kv.delete(key);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  // List all backups
  async listBackups(): Promise<Array<{ key: string; metadata: any }>> {
    if (!this.kv) return [];

    try {
      const backupList = await this.kv.list({ prefix: 'backup:site-content:' });
      const backups = [];
      
      for (const key of backupList.keys) {
        try {
          const backupData = await this.kv.get(key.name, 'json');
          if (backupData && backupData.metadata) {
            backups.push({
              key: key.name,
              metadata: backupData.metadata
            });
          }
        } catch (error) {
          console.error(`Failed to load backup ${key.name}:`, error);
        }
      }
      
      return backups;
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  // Delete a specific backup
  async deleteBackup(key: string): Promise<boolean> {
    if (!this.kv) return false;

    try {
      await this.kv.delete(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete backup ${key}:`, error);
      return false;
    }
  }

  // Restore from backup
  async restoreBackup(key: string): Promise<{ success: boolean; errors?: string[] }> {
    if (!this.kv) {
      return {
        success: false,
        errors: ['KV storage not available']
      };
    }

    try {
      const backupData = await this.kv.get(key, 'json');
      if (!backupData || !backupData.content) {
        return {
          success: false,
          errors: ['Backup not found or invalid']
        };
      }

      // Validate the backup content
      const validation = this.validateContent(backupData.content);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Create a backup of current content before restoring
      await this.createBackup('auto');

      // Restore the content
      const contentWithMetadata = {
        ...backupData.content,
        _metadata: {
          lastUpdated: new Date().toISOString(),
          version: Date.now(),
          restoredFrom: key
        }
      };

      await this.kv.put('site-content', JSON.stringify(contentWithMetadata));

      return { success: true };
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return {
        success: false,
        errors: ['Failed to restore backup']
      };
    }
  }

  // Validate content structure
  validateContent(content: any): { valid: boolean; errors?: string[] } {
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

  // Get default content
  private getDefaultContent() {
    return {
      topBar: {
        phone: "+44 1234 567890",
        email: "info@lambcottage.co.uk",
        address: "Lamb Cottage, Rural Cheshire, England",
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
          src: "/lamb-cottage-hero.jpg",
          alt: "Beautiful Cheshire countryside cottage"
        },
        title: "Welcome to Lamb Cottage, Cheshire",
        subtitle: "Discover Your Perfect Cheshire Retreat",
        ctaButton: {
          text: "Book Your Stay",
          url: "/#booking",
          external: false
        }
      },
      welcome: {
        title: "Welcome to Lamb Cottage, Cheshire",
        content: "Our guests consistently praise the peaceful atmosphere and stunning Cheshire countryside views. From romantic getaways to family adventures, Lamb Cottage provides the perfect setting for creating lasting memories in one of England's most beautiful regions.",
        image: {
          src: "/lamb-cottage-in-spring-2017.jpg",
          alt: "Lamb Cottage reception building"
        }
      },
      facilities: {
        title: "Our Facilities",
        subtitle: "Everything you need for a comfortable stay",
        items: []
      },
      propertySales: {
        title: "Property Sales",
        subtitle: "Find your perfect holiday home",
        items: []
      },
      reviews: {
        title: "What Our Guests Say",
        subtitle: "Read reviews from our satisfied customers",
        items: []
      },
      contact: {
        title: "Contact Us",
        subtitle: "Get in touch for bookings and enquiries",
        phone: "+44 1234 567890",
        email: "info@lambcottage.co.uk",
        address: "Lamb Cottage, Rural Cheshire, England",
        hours: "9:00 AM - 6:00 PM, Monday to Sunday"
      },
      booking: {
        title: "Book Your Stay",
        subtitle: "Reserve your perfect getaway",
        backgroundImage: {
          src: "/images/booking-banner-bg.jpg",
          alt: "Booking background"
        },
        ctaButton: {
          text: "Check Availability",
          url: "#",
          external: false
        }
      },
      footer: {
        companyName: "Lamb Cottage Caravan Park",
        description: "Your perfect Cheshire countryside retreat",
        contact: {
          phone: "+44 1234 567890",
          email: "info@lambcottage.co.uk",
          address: "Lamb Cottage, Rural Cheshire, England"
        },
        quickLinks: [
          { text: "Home", url: "/", external: false },
          { text: "Facilities", url: "/#facilities", external: false },
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
          }
        ],
        copyright: "© 2025 Lamb Cottage Caravan Park. All rights reserved."
      }
    };
  }
}

// Global storage instance
export const cloudflareStorage = new CloudflareStorage();

// Export types
export type ContentType = z.infer<typeof ContentSchema>;
export type ImageType = z.infer<typeof ImageSchema>;
export type LinkType = z.infer<typeof LinkSchema>;
export type FacilityType = z.infer<typeof FacilitySchema>;
export type PropertyType = z.infer<typeof PropertySchema>;
export type ReviewType = z.infer<typeof ReviewSchema>;
export type SocialLinkType = z.infer<typeof SocialLinkSchema>;