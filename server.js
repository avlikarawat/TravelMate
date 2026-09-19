/**
 * TravelMate Minimal Backend Server
 * Uses Node.js native http and built-in node:sqlite (zero external dependencies)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'travelmate.db');
const db = new DatabaseSync(DB_FILE);

// 1. Initialize SQLite Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    title TEXT,
    destination TEXT,
    departure TEXT,
    returnDate TEXT,
    duration INTEGER,
    budget REAL,
    currency TEXT,
    currencySymbol TEXT,
    travellerType TEXT,
    travellerCount INTEGER,
    style TEXT,
    accommodation TEXT,
    pace TEXT,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS itinerary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tripId TEXT,
    day INTEGER,
    city TEXT,
    hotel TEXT,
    title TEXT,
    activities TEXT
  );

  CREATE TABLE IF NOT EXISTS packing (
    tripId TEXT PRIMARY KEY,
    items TEXT
  );

  CREATE TABLE IF NOT EXISTS budget (
    tripId TEXT PRIMARY KEY,
    plannedBudget REAL,
    expenses TEXT
  );
`);

// Seed default data if database is empty
const tripCount = db.prepare('SELECT COUNT(*) as count FROM trips').get().count;
if (tripCount === 0) {
  const seedTrip = {
    id: 'trip-1',
    title: 'Kyoto & Uji Blossom Trail 🌸',
    destination: 'Kyoto, Japan',
    departure: '2026-04-10',
    returnDate: '2026-04-14',
    duration: 5,
    budget: 2000,
    currency: 'USD',
    currencySymbol: '$',
    travellerType: 'Couple / Pair',
    travellerCount: 2,
    style: 'Romantic & Cultural',
    accommodation: 'Kyoto Machiya Heritage Inn',
    pace: 'Balanced Flow',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80'
  };

  db.prepare(`
    INSERT INTO trips (id, title, destination, departure, returnDate, duration, budget, currency, currencySymbol, travellerType, travellerCount, style, accommodation, pace, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    seedTrip.id, seedTrip.title, seedTrip.destination, seedTrip.departure, seedTrip.returnDate,
    seedTrip.duration, seedTrip.budget, seedTrip.currency, seedTrip.currencySymbol,
    seedTrip.travellerType, seedTrip.travellerCount, seedTrip.style, seedTrip.accommodation,
    seedTrip.pace, seedTrip.image
  );

  const seedDays = [
    {
      day: 1,
      title: 'Arrival & Lantern Light',
      city: 'Kyoto, Japan',
      hotel: 'Kyoto Machiya Heritage Inn',
      activities: JSON.stringify({
        morning: [{ time: '09:30 AM', title: 'Check into Traditional Machiya', desc: 'Sip warm roasted hojicha tea.' }],
        afternoon: [{ time: '01:00 PM', title: 'Gion Floral Alley Stroll', desc: 'Walk past weeping cherry trees.' }],
        evening: [{ time: '06:45 PM', title: 'Pontocho Alley Izakaya Dinner', desc: 'Dine on riverside wooden decks.' }]
      })
    },
    {
      day: 2,
      title: 'Bamboo Whispers & Temple Gardens',
      city: 'Arashiyama, Kyoto',
      hotel: 'Kyoto Machiya Heritage Inn',
      activities: JSON.stringify({
        morning: [{ time: '07:30 AM', title: 'Early Arashiyama Bamboo Grove Walk', desc: 'Peaceful morning walk.' }],
        afternoon: [{ time: '12:15 PM', title: 'Tenryu-ji Temple Zen Pond', desc: 'Admire landscaped pond.' }],
        evening: [{ time: '07:00 PM', title: 'Tofu Kaiseki Feast', desc: 'Multi-course dinner.' }]
      })
    },
    {
      day: 3,
      title: 'Torii Gates & Ceramic Souvenirs',
      city: 'Fushimi & Higashiyama',
      hotel: 'Kyoto Machiya Heritage Inn',
      activities: JSON.stringify({
        morning: [{ time: '08:15 AM', title: 'Fushimi Inari Vermilion Paths', desc: 'Hike through thousand gates.' }],
        afternoon: [{ time: '01:30 PM', title: 'Ninenzaka Pottery Workshop', desc: 'Craft ceramic cup.' }],
        evening: [{ time: '07:30 PM', title: 'Ramen Sen-no-Kaze', desc: 'Savory ramen dinner.' }]
      })
    },
    {
      day: 4,
      title: 'Uji Green Tea Pilgrimage',
      city: 'Uji, Kyoto Suburb',
      hotel: 'Kyoto Machiya Heritage Inn',
      activities: JSON.stringify({
        morning: [{ time: '09:00 AM', title: 'Scenic Train to Uji', desc: 'Tea fields views.' }],
        afternoon: [{ time: '11:30 AM', title: 'Byodoin Phoenix Hall', desc: 'Explore historic temple.' }],
        evening: [{ time: '06:30 PM', title: 'Riverside Wagyu BBQ', desc: 'Grilled dinner by the river.' }]
      })
    },
    {
      day: 5,
      title: 'Sweet Souvenirs & Sayonara',
      city: 'Kyoto Station',
      hotel: 'Kyoto Machiya Heritage Inn',
      activities: JSON.stringify({
        morning: [{ time: '09:00 AM', title: 'Nishiki Market Morning Bites', desc: 'Sample street treats.' }],
        afternoon: [{ time: '12:30 PM', title: 'Station Stamp Collecting', desc: 'Keepsake scrapbook stamps.' }],
        evening: [{ time: '04:00 PM', title: 'Shinkansen Departure', desc: 'Board train with bento.' }]
      })
    }
  ];

  const insertItinerary = db.prepare(`
    INSERT INTO itinerary (tripId, day, city, hotel, title, activities)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  seedDays.forEach(d => insertItinerary.run(seedTrip.id, d.day, d.city, d.hotel, d.title, d.activities));

  const seedPacking = [
    { id: 1, text: 'Passport & Photocopies', category: 'tech', checked: true },
    { id: 2, text: 'Universal Power Adapter', category: 'tech', checked: true },
    { id: 3, text: 'Compact Polaroid Camera', category: 'tech', checked: true },
    { id: 4, text: 'Portable Power Bank (10,000mAh)', category: 'tech', checked: false },
    { id: 5, text: 'Linen Shirts & Pastels', category: 'clothing', checked: true },
    { id: 6, text: 'Comfy Walking Sneakers', category: 'clothing', checked: true },
    { id: 7, text: 'Sun Hat & Sunglasses', category: 'clothing', checked: true },
    { id: 8, text: 'Travel Journal & Gel Pens', category: 'essentials', checked: true }
  ];
  db.prepare('INSERT INTO packing (tripId, items) VALUES (?, ?)').run(seedTrip.id, JSON.stringify(seedPacking));

  const seedExpenses = [
    { id: 1, category: 'Flight & Transit', desc: 'Roundtrip Flights', amount: 780.00 },
    { id: 2, category: 'Hotel & Stay', desc: 'Machiya Townhouse Deposit', amount: 320.00 },
    { id: 3, category: 'Food & Drinks', desc: 'Matcha Sweets & Ramen Lunch', amount: 42.50 }
  ];
  db.prepare('INSERT INTO budget (tripId, plannedBudget, expenses) VALUES (?, ?, ?)').run(seedTrip.id, 2000, JSON.stringify(seedExpenses));
}

// 2. Helpers for HTTP Request Parsing & Responses
function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

// 3. Request Handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // --- API ROUTES ---

  // GET /api/trips: list all trips
  if (pathname === '/api/trips' && method === 'GET') {
    const trips = db.prepare('SELECT * FROM trips ORDER BY rowid DESC').all();
    return jsonResponse(res, 200, trips);
  }

  // POST /api/trips: create new trip
  if (pathname === '/api/trips' && method === 'POST') {
    try {
      const data = await parseBody(req);
      const tripId = data.id || ('trip-' + Date.now());

      db.prepare(`
        INSERT INTO trips (id, title, destination, departure, returnDate, duration, budget, currency, currencySymbol, travellerType, travellerCount, style, accommodation, pace, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        tripId, data.title, data.destination, data.departure, data.returnDate,
        data.duration, data.budget, data.currency, data.currencySymbol,
        data.travellerType, data.travellerCount, data.style, data.accommodation,
        data.pace, data.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80'
      );

      if (data.days && Array.isArray(data.days)) {
        const insDay = db.prepare(`
          INSERT INTO itinerary (tripId, day, city, hotel, title, activities)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        data.days.forEach(d => {
          insDay.run(tripId, d.dayNumber || d.day, d.city, d.hotel, d.title, JSON.stringify(d.activities || {}));
        });
      }

      db.prepare('INSERT OR REPLACE INTO packing (tripId, items) VALUES (?, ?)').run(
        tripId, JSON.stringify(data.packing || [])
      );

      db.prepare('INSERT OR REPLACE INTO budget (tripId, plannedBudget, expenses) VALUES (?, ?, ?)').run(
        tripId, data.budget || 0, JSON.stringify(data.expenses || [])
      );

      return jsonResponse(res, 201, { success: true, id: tripId });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // GET /api/trips/:id: full trip details (itinerary, packing, budget)
  const tripMatch = pathname.match(/^\/api\/trips\/([^/]+)$/);
  if (tripMatch && method === 'GET') {
    const tripId = tripMatch[1];
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    if (!trip) return jsonResponse(res, 404, { error: 'Trip not found' });

    const rawDays = db.prepare('SELECT * FROM itinerary WHERE tripId = ? ORDER BY day ASC').all(tripId);
    const days = rawDays.map(d => ({
      dayNumber: d.day,
      day: d.day,
      title: d.title,
      city: d.city,
      hotel: d.hotel,
      activities: typeof d.activities === 'string' ? JSON.parse(d.activities) : d.activities
    }));

    const packingRow = db.prepare('SELECT items FROM packing WHERE tripId = ?').get(tripId);
    const packing = packingRow ? JSON.parse(packingRow.items) : [];

    const budgetRow = db.prepare('SELECT plannedBudget, expenses FROM budget WHERE tripId = ?').get(tripId);
    const budget = budgetRow ? {
      plannedBudget: budgetRow.plannedBudget,
      expenses: JSON.parse(budgetRow.expenses)
    } : { plannedBudget: trip.budget, expenses: [] };

    return jsonResponse(res, 200, { ...trip, days, packing, budget });
  }

  // PUT /api/trips/:id: edit trip details
  if (tripMatch && method === 'PUT') {
    try {
      const tripId = tripMatch[1];
      const data = await parseBody(req);
      db.prepare(`
        UPDATE trips SET
          title = COALESCE(?, title),
          destination = COALESCE(?, destination),
          departure = COALESCE(?, departure),
          returnDate = COALESCE(?, returnDate),
          duration = COALESCE(?, duration),
          budget = COALESCE(?, budget),
          currency = COALESCE(?, currency),
          currencySymbol = COALESCE(?, currencySymbol),
          travellerType = COALESCE(?, travellerType),
          travellerCount = COALESCE(?, travellerCount),
          style = COALESCE(?, style),
          accommodation = COALESCE(?, accommodation),
          pace = COALESCE(?, pace)
        WHERE id = ?
      `).run(
        data.title, data.destination, data.departure, data.returnDate,
        data.duration, data.budget, data.currency, data.currencySymbol,
        data.travellerType, data.travellerCount, data.style, data.accommodation,
        data.pace, tripId
      );
      return jsonResponse(res, 200, { success: true });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // DELETE /api/trips/:id: delete trip and related data
  if (tripMatch && method === 'DELETE') {
    const tripId = tripMatch[1];
    db.prepare('DELETE FROM trips WHERE id = ?').run(tripId);
    db.prepare('DELETE FROM itinerary WHERE tripId = ?').run(tripId);
    db.prepare('DELETE FROM packing WHERE tripId = ?').run(tripId);
    db.prepare('DELETE FROM budget WHERE tripId = ?').run(tripId);
    return jsonResponse(res, 200, { success: true });
  }

  // PUT /api/trips/:id/itinerary: save itinerary days
  const itinMatch = pathname.match(/^\/api\/trips\/([^/]+)\/itinerary$/);
  if (itinMatch && method === 'PUT') {
    try {
      const tripId = itinMatch[1];
      const { days } = await parseBody(req);
      db.prepare('DELETE FROM itinerary WHERE tripId = ?').run(tripId);
      const ins = db.prepare(`
        INSERT INTO itinerary (tripId, day, city, hotel, title, activities)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      days.forEach(d => {
        ins.run(tripId, d.dayNumber || d.day, d.city, d.hotel, d.title, JSON.stringify(d.activities || {}));
      });
      return jsonResponse(res, 200, { success: true });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // PUT /api/trips/:id/packing: save packing items
  const packMatch = pathname.match(/^\/api\/trips\/([^/]+)\/packing$/);
  if (packMatch && method === 'PUT') {
    try {
      const tripId = packMatch[1];
      const { items } = await parseBody(req);
      db.prepare('INSERT OR REPLACE INTO packing (tripId, items) VALUES (?, ?)').run(
        tripId, JSON.stringify(items || [])
      );
      return jsonResponse(res, 200, { success: true });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // PUT /api/trips/:id/budget: save budget
  const budgetMatch = pathname.match(/^\/api\/trips\/([^/]+)\/budget$/);
  if (budgetMatch && method === 'PUT') {
    try {
      const tripId = budgetMatch[1];
      const { plannedBudget, expenses } = await parseBody(req);
      db.prepare('INSERT OR REPLACE INTO budget (tripId, plannedBudget, expenses) VALUES (?, ?, ?)').run(
        tripId, plannedBudget || 0, JSON.stringify(expenses || [])
      );
      return jsonResponse(res, 200, { success: true });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // --- STATIC FILE SERVING ---
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const extname = path.extname(filePath).toLowerCase();

  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': mimeTypes[extname] || 'application/octet-stream' });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`TravelMate server running on http://localhost:${PORT}`);
});
