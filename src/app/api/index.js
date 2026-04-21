// FILE: api/index.js - COPY PASTE KE GITHUB

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Halaman utama
app.get('/', (req, res) => {
  res.json({
    message: 'Bajaj Electric Jakarta API',
    endpoints: {
      stations: 'GET /api/stations',
      fare: 'POST /api/fare (body: { distance: 5 })',
      stations_status: 'GET /api/stations-status',
      driver_earnings: 'GET /api/earnings/:phone'
    }
  });
});

// GET semua stasiun
app.get('/api/stations', async (req, res) => {
  const { data } = await supabase.from('stations').select('*');
  res.json(data);
});

// GET status stasiun (dengan okupansi)
app.get('/api/stations-status', async (req, res) => {
  const { data } = await supabase.from('view_stations').select('*');
  res.json(data);
});

// POST hitung tarif
app.post('/api/fare', (req, res) => {
  const { distance } = req.body;
  let fare = 15000;
  if (distance > 4) fare = 25000;
  if (distance > 8) fare = 50000;
  res.json({ distance, fare });
});

// GET penghasilan driver
app.get('/api/earnings/:phone', async (req, res) => {
  const { data } = await supabase
    .from('view_earnings')
    .select('*')
    .eq('driver_phone', req.params.phone);
  res.json(data);
});

module.exports = app;
