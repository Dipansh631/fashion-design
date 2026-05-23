-- Task: Seeding Initial Luxury Datasets (DML)
-- Description: Inserts verified premier designers, high-fashion collections, and trending products.

-- 1. Seed Verified Designers
INSERT INTO "user" (username, bio, profile_pic, is_verified_business)
VALUES 
('NeoTokyo', 'Pioneering cyberpunk streetwear and neo-traditional fusion from Tokyo. Verified partner.', 'https://api.dicebear.com/7.x/adventurer/svg?seed=NeoTokyo', TRUE),
('Aurora', 'Ethereal garments, high-fashion runway gowns, and organic flowy textures.', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aurora', TRUE),
('Glitch', 'Deconstructed sportswear, technical fabrics, and agentic algorithmic silhouettes.', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Glitch', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 2. Seed Designer Collections (Linked to dynamically selected seeded IDs)
INSERT INTO "userdesign" (title, description, image_url, is_ai_generated, likes, creator_id)
SELECT 
    'Cyberpunk Kimono', 
    'Fusion of traditional kimono cuts with waterproof, neon-laced high-performance techwear fabrics.', 
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop', 
    TRUE, 
    1240, 
    id
FROM "user" WHERE username = 'NeoTokyo'
UNION ALL
SELECT 
    'Ethereal Gown', 
    'Bespoke silk chiffon gown with delicate gradient hues, mirroring the northern lights in movement.', 
    'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=600&auto=format&fit=crop', 
    FALSE, 
    890, 
    id
FROM "user" WHERE username = 'Aurora'
UNION ALL
SELECT 
    'Techwear Pulse Jacket', 
    'An urban exploration coat equipped with active heating elements and reflective asymmetric paneling.', 
    'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600&auto=format&fit=crop', 
    TRUE, 
    2100, 
    id
FROM "user" WHERE username = 'Glitch'
UNION ALL
SELECT 
    'Obsidian Duster', 
    'A sweeping, matte black duster made from durable ripstop nylon, optimized for modular attachments.', 
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop', 
    FALSE, 
    450, 
    id
FROM "user" WHERE username = 'Glitch';

-- 3. Seed Marketplace Products
INSERT INTO "product" (name, price, image_url, is_trending, stock_count, category)
VALUES
('Obsidian Jacket', 299.00, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop', TRUE, 5, 'Outerwear'),
('Neon Sash', 85.00, 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop', TRUE, 12, 'Accessories'),
('Void Boots', 150.00, 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=600&auto=format&fit=crop', TRUE, 3, 'Footwear')
ON CONFLICT DO NOTHING;
