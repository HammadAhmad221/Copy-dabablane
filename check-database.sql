-- Run these queries on your backend database to check payment data

-- 1. Check if vendor_payments table exists
SHOW TABLES LIKE 'vendor_payments';

-- 2. Check table structure
DESCRIBE vendor_payments;

-- 3. Count total payment records
SELECT COUNT(*) as total_payments FROM vendor_payments;

-- 4. Check if ANY data exists in the table
SELECT * FROM vendor_payments LIMIT 10;

-- 5. Check payments by vendor
SELECT vendor_id, COUNT(*) as payment_count 
FROM vendor_payments 
GROUP BY vendor_id;

-- 6. Check payments by status
SELECT transfer_status, COUNT(*) as count 
FROM vendor_payments 
GROUP BY transfer_status;

-- 7. Check date range of payments
SELECT 
  MIN(week_start) as earliest_date,
  MAX(week_end) as latest_date,
  COUNT(*) as total
FROM vendor_payments;

-- If the table is empty, you need to:
-- Option A: Insert test data manually
-- Option B: Run your payment calculation/generation script
-- Option C: Trigger the backend process that creates vendor payments

