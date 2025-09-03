-- Add file_url column to documents table for storing uploaded files
ALTER TABLE documents ADD COLUMN file_url TEXT;

-- Update existing documents to have null file_url (they will use template content)
UPDATE documents SET file_url = NULL WHERE file_url IS NULL;
