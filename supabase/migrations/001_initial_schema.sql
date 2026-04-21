-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('passenger', 'driver', 'station_owner')) DEFAULT 'passenger',
  full_name TEXT,
  phone TEXT UNIQUE,
  avatar_url TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plate_number TEXT UNIQUE NOT NULL,
  battery_level INT DEFAULT 100 CHECK (battery_level BETWEEN 0 AND 100),
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'on_trip', 'charging')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fare rules table
CREATE TABLE fare_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  range_name TEXT NOT NULL CHECK (range_name IN ('dekat', 'menengah', 'jauh')),
  min_km FLOAT NOT NULL,
  max_km FLOAT NOT NULL,
  fare_amount INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert fare rules
INSERT INTO fare_rules (range_name, min_km, max_km, fare_amount) VALUES
('dekat', 0, 4, 15000),
('menengah', 4, 8, 25000),
('jauh', 8, 15, 50000);

-- Rides table
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id UUID REFERENCES profiles(id) NOT NULL,
  driver_id UUID REFERENCES profiles(id),
  pickup_lat FLOAT NOT NULL,
  pickup_lng FLOAT NOT NULL,
  dropoff_lat FLOAT NOT NULL,
  dropoff_lng FLOAT NOT NULL,
  distance_km FLOAT,
  fare_amount INT,
  tip_amount INT DEFAULT 0,
  total_amount INT,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'accepted', 'started', 'completed', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'qris', 'bank_transfer')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed')),
  midtrans_order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Stations table
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  slots_total INT NOT NULL,
  slots_available INT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample stations
INSERT INTO stations (name, lat, lng, slots_total, slots_available, address) VALUES
('Stasiun Charging Blok M', -6.2445, 106.7998, 10, 8, 'Jl. Blok M Square, Jakarta Selatan'),
('Stasiun Charging Grogol', -6.1689, 106.7938, 8, 6, 'Jl. Grogol Raya, Jakarta Barat'),
('Stasiun Charging Pasar Senen', -6.1748, 106.8451, 12, 10, 'Jl. Pasar Senen, Jakarta Pusat'),
('Stasiun Charging Kuningan', -6.2363, 106.8306, 6, 5, 'Jl. HR Rasuna Said, Jakarta Selatan'),
('Stasiun Charging Kelapa Gading', -6.1557, 106.9061, 8, 8, 'Jl. Boulevard Raya, Jakarta Utara');

-- Charging bookings
CREATE TABLE charging_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments log
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  gateway_transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_rides_passenger_id ON rides(passenger_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_created_at ON rides(created_at);
CREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX idx_charging_bookings_driver_id ON charging_bookings(driver_id);
CREATE INDEX idx_charging_bookings_station_id ON charging_bookings(station_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE charging_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Drivers can view available rides"
  ON rides FOR SELECT USING (status = 'waiting');

CREATE POLICY "Passengers can view their own rides"
  ON rides FOR SELECT USING (auth.uid() = passenger_id);

CREATE POLICY "Drivers can view their assigned rides"
  ON rides FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Anyone can view stations"
  ON stations FOR SELECT USING (true);

CREATE POLICY "Drivers can view their own charging bookings"
  ON charging_bookings FOR SELECT USING (auth.uid() = driver_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
