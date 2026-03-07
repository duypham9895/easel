-- Add language preference column to user_preferences table
-- Supports 'en' (English) and 'vi' (Vietnamese), defaults to English
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en'
CHECK (language IN ('en', 'vi'));
