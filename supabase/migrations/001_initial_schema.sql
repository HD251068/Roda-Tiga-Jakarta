-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('passenger', 'driver', 'station_owner')),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Create vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES profiles(id),
  plate_number TEXT UNIQUE,
  battery_level INT DEFAULT 100,
  status TEXT DEFAULT 'idle',
  created_at TIMESTAMP DEFAULT now()
);

-- Create rides table
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID REFERENCES profiles(id),
  driver_id UUID REFERENCES profiles(id),
  pickup_lat FLOAT,
  pickup_lng FLOAT,
  dropoff_lat FLOAT,
  dropoff_lng FLOAT,
  distance_km FLOAT,
  fare_amount INT,
  tip_amount INT DEFAULT 0,
  total_amount INT,
  status TEXT DEFAULT 'waiting',
  payment_method TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMP DEFAULT now()
);

-- Create fare_rules table
CREATE TABLE fare_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  range_name TEXT,
  min_km FLOAT,
  max_km FLOAT,
  fare_amount INT
);

-- Insert fare rules
INSERT INTO fare_rules (range_name, min_km, max_km, fare_amount) VALUES
('dekat', 0, 4, 15000),
('menengah', 4, 8, 25000),
('jauh', 8, 15, 50000);

-- Create stations table
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  lat FLOAT,
  lng FLOAT,
  slots_total INT,
  slots_available INT,
  address TEXT
);

-- Insert sample stations in Jakarta
INSERT INTO stations (name, lat, lng, slots_total, slots_available, address) VALUES
('Stasiun Charging Blok M', -6.2445, 106.7998, 10, 8, 'Jl. Blok M Square, Jakarta Selatan'),
('Stasiun Charging Grogol', -6.1689, 106.7938, 8, 6, 'Jl. Grogol Raya, Jakarta Barat'),
('Stasiun Charging Pasar Senen', -6.1748, 106.8451, 12, 10, 'Jl. Pasar Senen, Jakarta Pusat');

-- Create charging_bookings table
CREATE TABLE charging_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID REFERENCES stations(id),
  driver_id UUID REFERENCES profiles(id),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status TEXT DEFAULT 'booked'
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Drivers can view available rides" ON rides
  FOR SELECT USING (status = 'waiting');

CREATE POLICY "Anyone can view stations" ON stations
  FOR SELECT USING (true);
