
-- Clean up test duplicates, keep only the latest company
DELETE FROM stock_locations WHERE company_id = '6f9f1ac4-9bbe-453e-b237-a44119f4e98b';
DELETE FROM user_companies WHERE company_id = '6f9f1ac4-9bbe-453e-b237-a44119f4e98b';
DELETE FROM companies WHERE id = '6f9f1ac4-9bbe-453e-b237-a44119f4e98b';
