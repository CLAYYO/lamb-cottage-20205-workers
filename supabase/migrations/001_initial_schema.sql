-- Pages CMS Database Schema
-- This creates all necessary tables and policies for Pages CMS

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pages table
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    meta_description TEXT,
    meta_keywords TEXT[],
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured_image TEXT,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Create media table
CREATE TABLE IF NOT EXISTS public.media (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    url TEXT NOT NULL,
    alt_text TEXT,
    caption TEXT,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create page_revisions table
CREATE TABLE IF NOT EXISTS public.page_revisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    meta_description TEXT,
    meta_keywords TEXT[],
    revision_number INTEGER NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON public.pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_author ON public.pages(author_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent ON public.pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON public.media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_page_revisions_page_id ON public.page_revisions(page_id);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(key);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_revisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any user" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for pages table
CREATE POLICY "Anyone can view published pages" ON public.pages
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authenticated users can view all pages" ON public.pages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Editors and admins can create pages" ON public.pages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('editor', 'admin')
        )
    );

CREATE POLICY "Authors can update their own pages" ON public.pages
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Admins can update any page" ON public.pages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete pages" ON public.pages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for media table
CREATE POLICY "Anyone can view media" ON public.media
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload media" ON public.media
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own media" ON public.media
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can update any media" ON public.media
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can delete their own media" ON public.media
    FOR DELETE USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can delete any media" ON public.media
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for site_settings table
CREATE POLICY "Anyone can view site settings" ON public.site_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage site settings" ON public.site_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for page_revisions table
CREATE POLICY "Authenticated users can view page revisions" ON public.page_revisions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Editors and admins can create revisions" ON public.page_revisions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('editor', 'admin')
        )
    );

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.pages TO anon;
GRANT SELECT ON public.media TO anon;
GRANT SELECT ON public.site_settings TO anon;

GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.pages TO authenticated;
GRANT ALL PRIVILEGES ON public.media TO authenticated;
GRANT ALL PRIVILEGES ON public.site_settings TO authenticated;
GRANT ALL PRIVILEGES ON public.page_revisions TO authenticated;

-- Insert initial site settings
INSERT INTO public.site_settings (key, value, description) VALUES
    ('site_title', '"Lamb Cottage 2025"', 'The main title of the website'),
    ('site_description', '"A beautiful cottage website built with Pages CMS"', 'The site description for SEO'),
    ('contact_email', '"info@lambcottage2025.com"', 'Primary contact email'),
    ('social_links', '{"facebook": "", "twitter": "", "instagram": ""}', 'Social media links'),
    ('theme_settings', '{"primary_color": "#2563eb", "secondary_color": "#64748b"}', 'Theme customization settings')
ON CONFLICT (key) DO NOTHING;

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();