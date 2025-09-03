# Content Migration Guide for Lamb Cottage Pages CMS

This guide will walk you through migrating existing Lamb Cottage content from the current Astro-based system to Pages CMS format.

## 1. Current Content Analysis

### Existing Content Structure
Based on the current Lamb Cottage website, we have:

```
content/
├── pages/
│   ├── about.json
│   ├── contact.json
│   └── facilities.json
├── site-content.json
├── site-settings.json
└── gallery/
    └── [image files]
```

### Current Pages to Migrate
1. **Home Page** - Hero section, welcome content, booking info
2. **About Page** - Cottage description, history, amenities
3. **Facilities Page** - Detailed facility descriptions
4. **Contact Page** - Contact information, directions
5. **Gallery Page** - Photo galleries
6. **Reviews Page** - Customer testimonials
7. **Tariff Page** - Pricing and booking information
8. **Attractions Page** - Local attractions and activities
9. **Directions Page** - Travel information
10. **Static Caravans Page** - Additional accommodation

## 2. Pages CMS Content Structure

### Target Structure
Pages CMS uses a different content structure:

```
content/
├── pages/
│   ├── home.md
│   ├── about.md
│   ├── facilities.md
│   ├── contact.md
│   ├── gallery.md
│   ├── reviews.md
│   ├── tariff.md
│   ├── attractions.md
│   ├── directions.md
│   └── static-caravans.md
├── media/
│   └── [uploaded images]
└── config/
    └── site.yml
```

### Content Format
Pages CMS uses Markdown with YAML frontmatter:

```markdown
---
title: "Page Title"
slug: "page-slug"
status: "published"
meta_title: "SEO Title"
meta_description: "SEO Description"
featured_image: "/media/image.jpg"
date: "2024-01-15"
author: "Admin"
---

# Page Content

Markdown content goes here...
```

## 3. Migration Scripts

### Step 1: Create Migration Directory
```bash
mkdir -p migration-scripts
cd migration-scripts
```

### Step 2: Content Extraction Script
Create `extract-content.js`:

```javascript
const fs = require('fs');
const path = require('path');

// Read existing content files
const contentDir = '../content';
const outputDir = './extracted-content';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Extract site settings
function extractSiteSettings() {
  try {
    const siteSettings = JSON.parse(
      fs.readFileSync(path.join(contentDir, 'site-settings.json'), 'utf8')
    );
    
    const siteContent = JSON.parse(
      fs.readFileSync(path.join(contentDir, 'site-content.json'), 'utf8')
    );

    const extracted = {
      site: {
        title: siteSettings.siteTitle || 'Lamb Cottage',
        description: siteSettings.siteDescription || 'Holiday cottage in beautiful countryside',
        contact: {
          email: siteSettings.contactEmail || 'info@lambcottage.com',
          phone: siteSettings.contactPhone || '',
          address: siteSettings.address || ''
        },
        social: siteSettings.social || {},
        booking: siteContent.booking || {}
      }
    };

    fs.writeFileSync(
      path.join(outputDir, 'site-config.json'),
      JSON.stringify(extracted, null, 2)
    );
    
    console.log('✅ Site settings extracted');
  } catch (error) {
    console.error('❌ Error extracting site settings:', error.message);
  }
}

// Extract page content
function extractPages() {
  const pagesDir = path.join(contentDir, 'pages');
  
  if (!fs.existsSync(pagesDir)) {
    console.log('⚠️  Pages directory not found');
    return;
  }

  const pageFiles = fs.readdirSync(pagesDir).filter(file => file.endsWith('.json'));
  
  pageFiles.forEach(file => {
    try {
      const pageData = JSON.parse(
        fs.readFileSync(path.join(pagesDir, file), 'utf8')
      );
      
      const pageName = path.basename(file, '.json');
      const extracted = {
        title: pageData.title || pageName.charAt(0).toUpperCase() + pageName.slice(1),
        slug: pageName,
        content: pageData.content || '',
        sections: pageData.sections || [],
        meta: {
          title: pageData.metaTitle || pageData.title,
          description: pageData.metaDescription || ''
        },
        images: pageData.images || [],
        lastModified: new Date().toISOString()
      };

      fs.writeFileSync(
        path.join(outputDir, `${pageName}.json`),
        JSON.stringify(extracted, null, 2)
      );
      
      console.log(`✅ Extracted: ${pageName}`);
    } catch (error) {
      console.error(`❌ Error extracting ${file}:`, error.message);
    }
  });
}

// Run extraction
console.log('🚀 Starting content extraction...');
extractSiteSettings();
extractPages();
console.log('✨ Content extraction complete!');
```

### Step 3: Markdown Conversion Script
Create `convert-to-markdown.js`:

```javascript
const fs = require('fs');
const path = require('path');

const inputDir = './extracted-content';
const outputDir = './pages-cms-content';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Convert JSON to Markdown with frontmatter
function convertToMarkdown(pageData, filename) {
  const slug = path.basename(filename, '.json');
  
  // Create frontmatter
  const frontmatter = {
    title: pageData.title,
    slug: slug,
    status: 'published',
    meta_title: pageData.meta?.title || pageData.title,
    meta_description: pageData.meta?.description || '',
    date: pageData.lastModified || new Date().toISOString(),
    author: 'Admin'
  };

  // Add featured image if available
  if (pageData.images && pageData.images.length > 0) {
    frontmatter.featured_image = pageData.images[0];
  }

  // Convert frontmatter to YAML
  const yamlFrontmatter = Object.entries(frontmatter)
    .map(([key, value]) => {
      if (typeof value === 'string' && value.includes('\n')) {
        return `${key}: |\n  ${value.replace(/\n/g, '\n  ')}`;
      }
      return `${key}: "${value}"`;
    })
    .join('\n');

  // Convert content sections to markdown
  let markdownContent = '';
  
  if (pageData.content) {
    markdownContent += pageData.content + '\n\n';
  }

  if (pageData.sections && Array.isArray(pageData.sections)) {
    pageData.sections.forEach(section => {
      if (section.title) {
        markdownContent += `## ${section.title}\n\n`;
      }
      if (section.content) {
        markdownContent += `${section.content}\n\n`;
      }
      if (section.image) {
        markdownContent += `![${section.title || 'Image'}](${section.image})\n\n`;
      }
    });
  }

  // Combine frontmatter and content
  const fullContent = `---\n${yamlFrontmatter}\n---\n\n${markdownContent.trim()}`;
  
  return fullContent;
}

// Process all extracted JSON files
function convertAllPages() {
  const files = fs.readdirSync(inputDir).filter(file => 
    file.endsWith('.json') && file !== 'site-config.json'
  );

  files.forEach(file => {
    try {
      const pageData = JSON.parse(
        fs.readFileSync(path.join(inputDir, file), 'utf8')
      );
      
      const markdown = convertToMarkdown(pageData, file);
      const outputFile = file.replace('.json', '.md');
      
      fs.writeFileSync(
        path.join(outputDir, outputFile),
        markdown
      );
      
      console.log(`✅ Converted: ${file} → ${outputFile}`);
    } catch (error) {
      console.error(`❌ Error converting ${file}:`, error.message);
    }
  });
}

// Convert site config to YAML
function convertSiteConfig() {
  try {
    const siteConfig = JSON.parse(
      fs.readFileSync(path.join(inputDir, 'site-config.json'), 'utf8')
    );
    
    const yamlConfig = `# Site Configuration\nsite:\n  title: "${siteConfig.site.title}"\n  description: "${siteConfig.site.description}"\n  \ncontact:\n  email: "${siteConfig.site.contact.email}"\n  phone: "${siteConfig.site.contact.phone}"\n  address: "${siteConfig.site.contact.address}"\n\nsocial:\n  facebook: "${siteConfig.site.social.facebook || ''}"\n  instagram: "${siteConfig.site.social.instagram || ''}"\n  twitter: "${siteConfig.site.social.twitter || ''}"\n\nbooking:\n  enabled: true\n  provider: "${siteConfig.site.booking.provider || 'custom'}"\n  url: "${siteConfig.site.booking.url || ''}"`;
    
    fs.writeFileSync(
      path.join(outputDir, 'site.yml'),
      yamlConfig
    );
    
    console.log('✅ Site config converted to YAML');
  } catch (error) {
    console.error('❌ Error converting site config:', error.message);
  }
}

// Run conversion
console.log('🚀 Starting markdown conversion...');
convertAllPages();
convertSiteConfig();
console.log('✨ Markdown conversion complete!');
```

### Step 4: Image Migration Script
Create `migrate-images.js`:

```javascript
const fs = require('fs');
const path = require('path');

const sourceDir = '../public/images';
const targetDir = './pages-cms-content/media';

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy images and create manifest
function migrateImages() {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const manifest = [];

  function processDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Create directory in target
        const targetSubDir = path.join(targetDir, relativePath, item);
        if (!fs.existsSync(targetSubDir)) {
          fs.mkdirSync(targetSubDir, { recursive: true });
        }
        processDirectory(fullPath, path.join(relativePath, item));
      } else if (imageExtensions.includes(path.extname(item).toLowerCase())) {
        // Copy image file
        const targetPath = path.join(targetDir, relativePath, item);
        fs.copyFileSync(fullPath, targetPath);
        
        // Add to manifest
        manifest.push({
          original: path.join(dir, item).replace('../public', ''),
          new: path.join('/media', relativePath, item).replace(/\\/g, '/'),
          filename: item,
          size: stat.size,
          modified: stat.mtime.toISOString()
        });
        
        console.log(`✅ Copied: ${item}`);
      }
    });
  }

  if (fs.existsSync(sourceDir)) {
    processDirectory(sourceDir);
  }

  // Save manifest
  fs.writeFileSync(
    path.join(targetDir, 'migration-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log(`✨ Migrated ${manifest.length} images`);
  return manifest;
}

// Update image references in markdown files
function updateImageReferences(manifest) {
  const markdownDir = './pages-cms-content';
  const files = fs.readdirSync(markdownDir).filter(file => file.endsWith('.md'));
  
  files.forEach(file => {
    try {
      let content = fs.readFileSync(path.join(markdownDir, file), 'utf8');
      let updated = false;
      
      manifest.forEach(image => {
        const oldRef = image.original;
        const newRef = image.new;
        
        if (content.includes(oldRef)) {
          content = content.replace(new RegExp(oldRef, 'g'), newRef);
          updated = true;
        }
      });
      
      if (updated) {
        fs.writeFileSync(path.join(markdownDir, file), content);
        console.log(`✅ Updated image references in: ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error updating ${file}:`, error.message);
    }
  });
}

// Run migration
console.log('🚀 Starting image migration...');
const manifest = migrateImages();
updateImageReferences(manifest);
console.log('✨ Image migration complete!');
```

## 4. Manual Content Migration

### Step 1: Run Migration Scripts
```bash
# Navigate to migration directory
cd migration-scripts

# Install dependencies if needed
npm init -y
npm install

# Run extraction
node extract-content.js

# Convert to markdown
node convert-to-markdown.js

# Migrate images
node migrate-images.js
```

### Step 2: Review Generated Content
Check the `pages-cms-content` directory:

```
pages-cms-content/
├── about.md
├── contact.md
├── facilities.md
├── home.md
├── site.yml
└── media/
    ├── migration-manifest.json
    └── [migrated images]
```

### Step 3: Manual Content Refinement

#### Home Page Example
```markdown
---
title: "Welcome to Lamb Cottage"
slug: "home"
status: "published"
meta_title: "Lamb Cottage - Holiday Cottage in Beautiful Countryside"
meta_description: "Escape to Lamb Cottage, a charming holiday retreat in the heart of the countryside. Perfect for families, couples, and pet-friendly stays."
featured_image: "/media/lamb-cottage-hero.jpg"
date: "2024-01-15T10:00:00Z"
author: "Admin"
---

# Welcome to Lamb Cottage

Escape to the tranquil beauty of the countryside at Lamb Cottage, where comfort meets charm in the perfect holiday retreat.

## Your Perfect Getaway

Nestled in the heart of beautiful countryside, Lamb Cottage offers a peaceful sanctuary away from the hustle and bustle of everyday life. Our carefully restored cottage combines traditional character with modern amenities to ensure your stay is both comfortable and memorable.

### What Makes Us Special

- **Pet-Friendly**: Bring your furry friends along
- **Family-Friendly**: Perfect for families with children
- **Peaceful Location**: Surrounded by stunning countryside
- **Modern Amenities**: All the comforts of home
- **Local Attractions**: Easy access to nearby attractions

## Book Your Stay

Ready to experience the magic of Lamb Cottage? Check availability and book your perfect countryside getaway today.

[Check Availability](#booking)
```

#### Facilities Page Example
```markdown
---
title: "Facilities & Amenities"
slug: "facilities"
status: "published"
meta_title: "Facilities - Lamb Cottage Holiday Accommodation"
meta_description: "Discover all the facilities and amenities available at Lamb Cottage, from modern kitchen facilities to outdoor spaces and pet-friendly features."
date: "2024-01-15T10:00:00Z"
author: "Admin"
---

# Facilities & Amenities

Lamb Cottage is fully equipped with everything you need for a comfortable and enjoyable stay.

## Kitchen & Dining

- Fully equipped modern kitchen
- Dishwasher and washing machine
- Microwave and conventional oven
- Fridge/freezer
- Dining table for 6 people
- All crockery, cutlery, and cooking utensils provided

## Living Areas

- Comfortable lounge with TV and DVD player
- Free Wi-Fi throughout
- Central heating
- Open fireplace (logs provided)
- Selection of books and games

## Bedrooms & Bathrooms

- 3 bedrooms sleeping up to 6 guests
- Master bedroom with double bed
- Twin bedroom with single beds
- Single bedroom
- Family bathroom with bath and shower
- All bed linen and towels provided

## Outdoor Facilities

- Private garden with outdoor furniture
- BBQ area
- Parking for 2 cars
- Secure area for pets
- Beautiful countryside views

## Additional Services

- Welcome pack available on request
- Pet-friendly accommodation
- Cot and high chair available
- Local information and maps provided
```

## 5. Upload to Pages CMS

### Step 1: Access Pages CMS Admin
1. Go to your deployed Pages CMS: `https://lamb-cottage-cms.vercel.app/admin`
2. Log in with your admin account

### Step 2: Create Pages
For each markdown file:

1. Click "New Page" in Pages CMS
2. Copy the frontmatter data to the page fields:
   - Title
   - Slug
   - Meta title
   - Meta description
   - Status
3. Copy the markdown content to the content editor
4. Upload and assign featured image
5. Save and publish

### Step 3: Upload Media Files
1. Go to "Media" section in Pages CMS
2. Upload images from the `media` directory
3. Organize into folders as needed
4. Update image references in pages if needed

### Step 4: Configure Site Settings
1. Go to "Settings" in Pages CMS
2. Update site configuration based on `site.yml`:
   - Site title and description
   - Contact information
   - Social media links
   - Booking settings

## 6. Content Validation

### Step 1: Check All Pages
- [ ] Home page displays correctly
- [ ] About page content is complete
- [ ] Facilities page lists all amenities
- [ ] Contact page has correct information
- [ ] Gallery images display properly
- [ ] Reviews are imported
- [ ] Tariff information is accurate
- [ ] Attractions page is complete
- [ ] Directions are clear
- [ ] Static caravans page (if applicable)

### Step 2: Test Functionality
- [ ] All internal links work
- [ ] Images load correctly
- [ ] Contact forms function
- [ ] SEO meta tags are present
- [ ] Mobile responsiveness
- [ ] Page loading speed

### Step 3: SEO Verification
- [ ] All pages have meta titles
- [ ] Meta descriptions are compelling
- [ ] Images have alt text
- [ ] URLs are SEO-friendly
- [ ] Structured data is present

## 7. Go-Live Checklist

### Pre-Launch
- [ ] All content migrated and verified
- [ ] Images optimized and uploaded
- [ ] Contact forms tested
- [ ] SEO elements in place
- [ ] Mobile responsiveness confirmed
- [ ] Performance optimized

### Launch Day
- [ ] DNS updated to point to Pages CMS
- [ ] SSL certificate active
- [ ] Redirects from old URLs set up
- [ ] Google Analytics updated
- [ ] Search Console updated
- [ ] Social media links updated

### Post-Launch
- [ ] Monitor for broken links
- [ ] Check search engine indexing
- [ ] Verify contact forms working
- [ ] Monitor site performance
- [ ] Train content editors

## 8. Training Materials

### Content Editor Guide
Create a simple guide for content editors:

1. **Logging In**: How to access the admin panel
2. **Creating Pages**: Step-by-step page creation
3. **Editing Content**: Using the markdown editor
4. **Managing Images**: Uploading and organizing media
5. **Publishing**: Draft vs published status
6. **SEO**: Setting meta titles and descriptions

### Best Practices
- Always preview before publishing
- Use descriptive filenames for images
- Keep content concise and scannable
- Update meta descriptions for SEO
- Regular content backups

## 9. Maintenance Schedule

### Daily
- Monitor site performance
- Check for broken links
- Review contact form submissions

### Weekly
- Content updates as needed
- Image optimization
- SEO performance review

### Monthly
- Full site backup
- Security updates
- Performance audit
- Content strategy review

## 10. Next Steps

✅ **Completed**: Content migration to Pages CMS

**Next**: Test all Pages CMS functionality and train content editors

---

**Note**: This migration process preserves all existing content while adapting it to Pages CMS's structure. The automated scripts handle the bulk conversion, but manual refinement ensures optimal presentation and SEO.