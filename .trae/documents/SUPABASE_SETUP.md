# Supabase Setup Guide for Pages CMS

This guide will walk you through setting up Supabase as the database backend for Pages CMS.

## 1. Create Supabase Project

### Step 1: Sign up for Supabase
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign up"
3. Sign up with GitHub (recommended) or email
4. Verify your email if using email signup

### Step 2: Create New Project
1. Click "New Project" in your Supabase dashboard
2. Fill in project details:
   - **Organization**: Select or create an organization
   - **Name**: `lamb-cottage-pages-cms`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `us-east-1` or `eu-west-1`)
   - **Pricing Plan**: Free (sufficient for development and small sites)
3. Click "Create new project"
4. Wait 2-3 minutes for project initialization

## 2. Database Schema Setup

### Step 1: Access SQL Editor
1. In your Supabase project dashboard, click "SQL Editor" in the left sidebar
2. Click "New query" to create a new SQL script

### Step 2: Create Database Schema
Copy and paste the following SQL script to set up the required tables:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and user management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content pages table
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    meta_title VARCHAR(255),
    meta_description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    author_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Media/assets table
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    url TEXT NOT NULL,
    alt_text TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site settings table
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content revisions for version control
CREATE TABLE page_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    author_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_author ON pages(author_id);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX idx_page_revisions_page_id ON page_revisions(page_id);
CREATE INDEX idx_site_settings_key ON site_settings(key);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Set Row Level Security (RLS)
Add the following RLS policies for security:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_revisions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Pages policies
CREATE POLICY "Anyone can view published pages" ON pages
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authenticated users can view all pages" ON pages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Editors can create pages" ON pages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authors can update their pages" ON pages
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Admins can update any page" ON pages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Media policies
CREATE POLICY "Authenticated users can view media" ON media
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload media" ON media
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Site settings policies
CREATE POLICY "Authenticated users can view settings" ON site_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can modify settings" ON site_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Page revisions policies
CREATE POLICY "Authenticated users can view revisions" ON page_revisions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create revisions" ON page_revisions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### Step 4: Insert Initial Data
Add some initial site settings and create an admin user:

```sql
-- Insert default site settings
INSERT INTO site_settings (key, value) VALUES
    ('site_title', '"Lamb Cottage"'),
    ('site_description', '"Holiday cottage in beautiful countryside"'),
    ('contact_email', '"info@lambcottage.com"'),
    ('theme_settings', '{
        "primaryColor": "#2563eb",
        "secondaryColor": "#64748b",
        "fontFamily": "Inter"
    }');

-- Note: Admin user will be created through Supabase Auth
-- The first user to sign up should be manually promoted to admin role
```

### Step 5: Run the SQL Script
1. Click "Run" to execute the SQL script
2. Verify all tables were created successfully
3. Check the "Table Editor" in the left sidebar to see your new tables

## 3. Configure Authentication

### Step 1: Enable Email Authentication
1. Go to "Authentication" > "Settings" in your Supabase dashboard
2. Under "Auth Providers", ensure "Email" is enabled
3. Configure email templates if desired (optional)

### Step 2: Set Up Email Confirmation (Optional)
1. In "Authentication" > "Settings"
2. Toggle "Enable email confirmations" if you want users to verify their email
3. For development, you can disable this for easier testing

## 4. Get Environment Variables

### Step 1: Find Your Project Credentials
1. Go to "Settings" > "API" in your Supabase dashboard
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon (public) key**: `eyJ...` (long string starting with eyJ)
   - **Service role key**: `eyJ...` (keep this secret!)

### Step 2: Database Connection String
1. Go to "Settings" > "Database"
2. Copy the **Connection string** under "Connection parameters"
3. Replace `[YOUR-PASSWORD]` with your database password

## 5. Environment Variables for Pages CMS

Add these environment variables to your Pages CMS project:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres

# Pages CMS Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

## 6. Test Database Connection

### Step 1: Test in Supabase Dashboard
1. Go to "Table Editor"
2. Try inserting a test record in the `site_settings` table
3. Verify the record appears correctly

### Step 2: Test from Pages CMS
1. Start your Pages CMS development server
2. Try to access the admin panel
3. Check if database queries work correctly

## 7. Create First Admin User

### Method 1: Through Pages CMS (Recommended)
1. Start Pages CMS and go to the signup page
2. Create your admin account
3. In Supabase dashboard, go to "Table Editor" > "users"
4. Find your user record and change `role` from `editor` to `admin`

### Method 2: Direct SQL Insert
```sql
-- Insert admin user directly (replace with your details)
INSERT INTO users (id, email, name, role) VALUES
    ('your-auth-uid-here', 'admin@lambcottage.com', 'Admin User', 'admin');
```

## 8. Storage Setup (Optional)

If you plan to use Supabase Storage for media files:

### Step 1: Create Storage Bucket
1. Go to "Storage" in Supabase dashboard
2. Click "Create bucket"
3. Name: `pages-cms-media`
4. Set as public bucket for easier access

### Step 2: Configure Storage Policies
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public access to files
CREATE POLICY "Public can view files" ON storage.objects
    FOR SELECT USING (bucket_id = 'pages-cms-media');
```

## 9. Backup and Monitoring

### Automatic Backups
- Supabase automatically backs up your database daily
- Backups are retained for 7 days on the free plan
- Upgrade to Pro for longer retention and point-in-time recovery

### Monitoring
1. Check "Reports" in Supabase dashboard for usage metrics
2. Set up alerts for high usage or errors
3. Monitor API usage to stay within free tier limits

## 10. Next Steps

✅ **Completed**: Supabase database setup

**Next**: Configure Resend email service for Pages CMS notifications

## Troubleshooting

### Common Issues

**Connection Errors**:
- Verify your environment variables are correct
- Check if your IP is whitelisted (Supabase allows all IPs by default)
- Ensure your database password is correct

**Permission Errors**:
- Check RLS policies are correctly configured
- Verify user roles are set properly
- Test with service role key for debugging

**Performance Issues**:
- Add indexes for frequently queried columns
- Monitor query performance in Supabase dashboard
- Consider upgrading to Pro plan for better performance

### Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- [Pages CMS Documentation](https://pagescms.org/docs)

---

**Security Note**: Never commit your `SUPABASE_SERVICE_ROLE_KEY` to version control. This key has full database access and should be kept secret.