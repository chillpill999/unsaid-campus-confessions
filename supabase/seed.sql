-- Supabase Seed Data for Unsaid
-- Seed File: seed.sql

-- Insert Primary College
INSERT INTO colleges (id, name, short_name, email_domain, location) VALUES
('11111111-1111-1111-1111-111111111111', 'Loknayak Jai Prakash Institute of Technology', 'LNJPIT', 'lnjpit.ac.in', 'Chhapra, Bihar')
ON CONFLICT (email_domain) DO NOTHING;

-- Insert Categories
INSERT INTO categories (id, name, slug, icon, active) VALUES
('c1000000-0000-0000-0000-000000000001', 'Confession', 'confession', 'lock', true),
('c1000000-0000-0000-0000-000000000002', 'Crush', 'crush', 'heart', true),
('c1000000-0000-0000-0000-000000000003', 'Funny', 'funny', 'laugh', true),
('c1000000-0000-0000-0000-000000000004', 'Hostel', 'hostel', 'home', true),
('c1000000-0000-0000-0000-000000000005', 'Appreciation', 'appreciation', 'sparkles', true),
('c1000000-0000-0000-0000-000000000006', 'Question', 'question', 'help-circle', true),
('c1000000-0000-0000-0000-000000000007', 'Campus Life', 'campus-life', 'compass', true)
ON CONFLICT (slug) DO NOTHING;
