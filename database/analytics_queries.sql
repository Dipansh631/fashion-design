-- Task: Fashion Hub Analytics & Dynamic Data Selection
-- Description: Queries to retrieve metrics, active collections, and trending products.

-- 1. Fetch Trending Designs with Creator details (Used for Home and Gallery Streams)
SELECT 
    d.id AS design_id,
    d.title,
    d.description,
    d.image_url,
    d.is_ai_generated,
    d.likes,
    d.created_at AS design_uploaded_at,
    u.username AS creator_username,
    u.is_verified_business
FROM "userdesign" d
INNER JOIN "user" u ON d.creator_id = u.id
ORDER BY d.likes DESC
LIMIT 10;

-- 2. Fetch specific Designer Portfolio by Username
SELECT 
    d.id AS design_id,
    d.title,
    d.description,
    d.image_url,
    d.is_ai_generated,
    d.likes
FROM "userdesign" d
INNER JOIN "user" u ON d.creator_id = u.id
WHERE u.username = 'Glitch'
ORDER BY d.created_at DESC;

-- 3. Calculate Designer Rankings (Who has the most total likes?)
SELECT 
    u.username,
    COUNT(d.id) AS total_designs_uploaded,
    SUM(d.likes) AS cumulative_portfolio_likes,
    AVG(d.likes) AS average_likes_per_design
FROM "user" u
LEFT JOIN "userdesign" d ON u.id = d.creator_id
GROUP BY u.id, u.username
ORDER BY cumulative_portfolio_likes DESC;

-- 4. Get active Marketplace products sorted by stock count
SELECT 
    name, 
    price, 
    stock_count, 
    category, 
    is_trending
FROM "product"
WHERE stock_count > 0
ORDER BY price DESC;
