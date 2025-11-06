-- Add DPT program URL field to schools table
ALTER TABLE schools ADD COLUMN IF NOT EXISTS dpt_program_url TEXT;

