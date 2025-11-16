/*
  # EnergyMonitor Database Schema

  ## Overview
  This migration creates the core tables for the EnergyMonitor application, 
  which allows users to track their electrical devices and calculate energy consumption.

  ## New Tables
  
  ### `devices`
  Stores information about electrical devices that users want to monitor.
  
  - `id` (uuid, primary key) - Unique identifier for each device
  - `user_id` (uuid, foreign key) - References auth.users, owner of the device
  - `name` (text) - Device name (e.g., "Geladeira", "TV da Sala")
  - `power_watts` (integer) - Device power consumption in watts
  - `hours_per_day` (numeric) - Estimated daily usage in hours
  - `created_at` (timestamptz) - Timestamp when device was created
  - `updated_at` (timestamptz) - Timestamp when device was last updated

  ## Security
  
  ### Row Level Security (RLS)
  - RLS is enabled on the `devices` table
  - Users can only view their own devices
  - Users can only insert devices for themselves
  - Users can only update their own devices
  - Users can only delete their own devices
  
  ### Policies
  1. **SELECT Policy**: Users can read only their own devices
  2. **INSERT Policy**: Users can create devices for themselves only
  3. **UPDATE Policy**: Users can update only their own devices
  4. **DELETE Policy**: Users can delete only their own devices

  ## Important Notes
  - All timestamps use `timestamptz` for timezone awareness
  - Power consumption is stored in watts (integer)
  - Daily usage is stored as numeric to allow decimal hours (e.g., 2.5 hours)
  - Foreign key constraint ensures referential integrity with auth.users
  - Cascading delete removes devices when user is deleted
*/

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  power_watts integer NOT NULL CHECK (power_watts > 0),
  hours_per_day numeric(4, 2) NOT NULL CHECK (hours_per_day >= 0 AND hours_per_day <= 24),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- SELECT Policy: Users can read only their own devices
CREATE POLICY "Users can view own devices"
  ON devices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT Policy: Users can create devices for themselves
CREATE POLICY "Users can create own devices"
  ON devices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can update only their own devices
CREATE POLICY "Users can update own devices"
  ON devices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Users can delete only their own devices
CREATE POLICY "Users can delete own devices"
  ON devices
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);

-- Create index for name search
CREATE INDEX IF NOT EXISTS idx_devices_name ON devices(name);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();