-- =============================================================================
-- Easel — Avatars Storage Bucket
-- Migration: 003_avatars_storage.sql
--
-- Creates the 'avatars' storage bucket and RLS policies so Moon and Sun can
-- upload/update their own avatar images.
--
-- Bucket is PUBLIC: avatar images are readable by anyone with the URL.
-- Policies ensure only the owning user can upload to their own folder.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. Create the avatars bucket (public so avatar URLs work without auth)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880,                        -- 5 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 2. RLS policies for storage.objects in the avatars bucket
-- ---------------------------------------------------------------------------

-- Public read: anyone can view avatar images via their URL
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'avatars_public_read'
  ) THEN
    CREATE POLICY avatars_public_read ON storage.objects
      FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Authenticated upload: users can only upload to their own folder (userId/*)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'avatars_authenticated_upload'
  ) THEN
    CREATE POLICY avatars_authenticated_upload ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Owner can update and delete their own avatars
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND policyname = 'avatars_owner_manage'
  ) THEN
    CREATE POLICY avatars_owner_manage ON storage.objects
      FOR ALL
      USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;
