-- Task: Admin Operations & Dynamic Content Updates (DML/DDL Tasks)
-- Description: Essential database administration tasks for fashion moderators and inventory managers.

-- 1. Manually Verify a Designer Business Account
UPDATE "user"
SET is_verified_business = TRUE
WHERE username = 'Glitch';

-- 2. Restock a Product Inventory Count
UPDATE "product"
SET stock_count = stock_count + 10
WHERE name = 'Void Boots';

-- 3. Edit User Profile Bio & Avatar URL
UPDATE "user"
SET 
    bio = 'Updated bio: Next-gen high-performance sportswear and techwear fabrics.',
    profile_pic = 'https://api.dicebear.com/7.x/adventurer/svg?seed=GlitchUpdated'
WHERE username = 'Glitch';

-- 4. Delete an inappropriate or flagged Design
DELETE FROM "userdesign"
WHERE id = 5;

-- 5. Count Total Users and Verified Businesses
SELECT 
    COUNT(*) AS total_registered_users,
    SUM(CASE WHEN is_verified_business THEN 1 ELSE 0 END) AS total_verified_businesses
FROM "user";
