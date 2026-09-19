/**
 * TravelMate Backend Server with Groq AI Integration
 * Model: openai/gpt-oss-120b
 * Key: XAI_API_KEY from .env
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// Load environment variables from .env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        const k = key.trim();
        const v = vals.join('=').trim();
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
}
loadEnv();

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

// 2. HTTP Helpers
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

// 3. Groq AI Integration (Model: openai/gpt-oss-120b)
function callGroqAPI(promptPayload, apiKey, retries = 2) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `You are TravelMate, a friendly travel assistant. You MUST return ONLY valid JSON matching this schema exactly:
{
  "title": "Short creative trip title with an emoji",
  "summary": "1-2 sentence trip summary",
  "hotel": "Recommended accommodation name",
  "days": [
    {
      "dayNumber": 1,
      "title": "Day 1 theme or headline",
      "city": "City name",
      "hotel": "Hotel name",
      "activities": {
        "morning": [{"time": "09:00 AM", "title": "Activity name", "desc": "Short description"}],
        "afternoon": [{"time": "01:30 PM", "title": "Activity name", "desc": "Short description"}],
        "evening": [{"time": "07:00 PM", "title": "Activity name", "desc": "Short description"}]
      }
    }
  ],
  "packing": [
    {"text": "Item name", "category": "clothing|toiletries|tech|essentials", "checked": false}
  ],
  "budgetBreakdown": [
    {"category": "Flight & Transit|Hotel & Stay|Food & Drinks|Activities & Fun|Shopping & Souvenirs", "desc": "Expense detail", "amount": 100}
  ]
}`
        },
        {
          role: 'user',
          content: `Generate a travel plan for:
- Destination: ${promptPayload.destination}
- Dates: ${promptPayload.departure} to ${promptPayload.returnDate} (${promptPayload.duration} days)
- Target Budget: ${promptPayload.budget} ${promptPayload.currency}
- Travellers: ${promptPayload.travellerCount} (${promptPayload.travellerType})
- Travel Style: ${promptPayload.style}
- Accommodation Preference: ${promptPayload.accommodation}
- Pace: ${promptPayload.pace}
Please include weather-appropriate packing items and realistic estimated budget items.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(responseBody);
            const contentStr = parsed.choices[0].message.content;
            const tripJson = JSON.parse(contentStr);
            resolve(tripJson);
          } catch (e) {
            reject(new Error('Failed to parse Groq response JSON: ' + e.message));
          }
        } else if ((res.statusCode === 429 || res.statusCode >= 500) && retries > 0) {
          // Exponential retry
          setTimeout(() => {
            callGroqAPI(promptPayload, apiKey, retries - 1).then(resolve).catch(reject);
          }, 1500);
        } else {
          try {
            const errObj = JSON.parse(responseBody);
            reject(new Error(errObj.error?.message || `Groq API returned HTTP ${res.statusCode}`));
          } catch {
            reject(new Error(`Groq API returned HTTP ${res.statusCode}: ${responseBody}`));
          }
        }
      });
    });

    req.on('error', (err) => {
      if (retries > 0) {
        setTimeout(() => {
          callGroqAPI(promptPayload, apiKey, retries - 1).then(resolve).catch(reject);
        }, 1500);
      } else {
        reject(err);
      }
    });

    req.write(postData);
    req.end();
  });
}

// 4. Request Handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // --- /generate-trip (Groq AI Endpoint) ---
  if ((pathname === '/generate-trip' || pathname === '/api/generate-trip') && method === 'POST') {
    try {
      const payload = await parseBody(req);
      const apiKey = process.env.XAI_API_KEY || process.env.GROQ_API_KEY;

      if (!apiKey || apiKey === '$$$$$' || apiKey.includes('$$$')) {
        return jsonResponse(res, 400, {
          error: 'XAI_API_KEY is not configured. Please set your Groq API key in the server .env file.'
        });
      }

      // Call Groq AI with model openai/gpt-oss-120b
      const aiResult = await callGroqAPI(payload, apiKey);

      const tripId = 'trip-' + Date.now();
      const symbolMap = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: 'C$', AUD: 'A$' };
      const currencySymbol = symbolMap[payload.currency] || '$';

      // 1. Save trip to database
      db.prepare(`
        INSERT INTO trips (id, title, destination, departure, returnDate, duration, budget, currency, currencySymbol, travellerType, travellerCount, style, accommodation, pace, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        tripId,
        aiResult.title || `${payload.destination} Journey ✨`,
        payload.destination,
        payload.departure,
        payload.returnDate,
        payload.duration,
        payload.budget,
        payload.currency,
        currencySymbol,
        payload.travellerType,
        payload.travellerCount,
        payload.style,
        aiResult.hotel || payload.accommodation,
        payload.pace,
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80'
      );

      // 2. Save itinerary days
      const days = aiResult.days || [];
      const insDay = db.prepare(`
        INSERT INTO itinerary (tripId, day, city, hotel, title, activities)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      days.forEach(d => {
        insDay.run(tripId, d.dayNumber || d.day, d.city || payload.destination, d.hotel || payload.accommodation, d.title, JSON.stringify(d.activities || {}));
      });

      // 3. Save packing list suggestions
      const packing = (aiResult.packing || []).map((p, idx) => ({
        id: Date.now() + idx,
        text: p.text,
        category: p.category || 'essentials',
        checked: false
      }));
      db.prepare('INSERT OR REPLACE INTO packing (tripId, items) VALUES (?, ?)').run(tripId, JSON.stringify(packing));

      // 4. Save budget breakdown
      const expenses = (aiResult.budgetBreakdown || []).map((b, idx) => ({
        id: Date.now() + idx,
        category: b.category || 'Activities & Fun',
        desc: b.desc || 'Estimated cost',
        amount: Number(b.amount) || 50
      }));
      db.prepare('INSERT OR REPLACE INTO budget (tripId, plannedBudget, expenses) VALUES (?, ?, ?)').run(tripId, payload.budget, JSON.stringify(expenses));

      // Return full saved trip
      return jsonResponse(res, 201, {
        success: true,
        id: tripId,
        title: aiResult.title,
        summary: aiResult.summary,
        destination: payload.destination,
        departure: payload.departure,
        returnDate: payload.returnDate,
        duration: payload.duration,
        budget: payload.budget,
        currency: payload.currency,
        currencySymbol: currencySymbol,
        travellerType: payload.travellerType,
        travellerCount: payload.travellerCount,
        style: payload.style,
        accommodation: aiResult.hotel || payload.accommodation,
        pace: payload.pace,
        days: days,
        packing: packing,
        expenses: expenses,
        budgetObj: { plannedBudget: payload.budget, expenses }
      });
    } catch (err) {
      console.error('Error in /generate-trip:', err.message);
      return jsonResponse(res, 500, { error: err.message });
    }
  }

  // --- TRIPS REST ENDPOINTS ---

  if (pathname === '/api/trips' && method === 'GET') {
    const trips = db.prepare('SELECT * FROM trips ORDER BY rowid DESC').all();
    return jsonResponse(res, 200, trips);
  }

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

      db.prepare('INSERT OR REPLACE INTO packing (tripId, items) VALUES (?, ?)').run(tripId, JSON.stringify(data.packing || []));
      db.prepare('INSERT OR REPLACE INTO budget (tripId, plannedBudget, expenses) VALUES (?, ?, ?)').run(tripId, data.budget || 0, JSON.stringify(data.expenses || []));

      return jsonResponse(res, 201, { success: true, id: tripId });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

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

  if (tripMatch && method === 'DELETE') {
    const tripId = tripMatch[1];
    db.prepare('DELETE FROM trips WHERE id = ?').run(tripId);
    db.prepare('DELETE FROM itinerary WHERE tripId = ?').run(tripId);
    db.prepare('DELETE FROM packing WHERE tripId = ?').run(tripId);
    db.prepare('DELETE FROM budget WHERE tripId = ?').run(tripId);
    return jsonResponse(res, 200, { success: true });
  }

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

  const packMatch = pathname.match(/^\/api\/trips\/([^/]+)\/packing$/);
  if (packMatch && method === 'PUT') {
    try {
      const tripId = packMatch[1];
      const { items } = await parseBody(req);
      db.prepare('INSERT OR REPLACE INTO packing (tripId, items) VALUES (?, ?)').run(tripId, JSON.stringify(items || []));
      return jsonResponse(res, 200, { success: true });
    } catch (err) {
      return jsonResponse(res, 500, { error: err.message });
    }
  }

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

  // Ensure filePath is within __dirname
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Server Error');
      }
      res.writeHead(200, { 'Content-Type': mimeTypes[extname] || 'application/octet-stream' });
      res.end(content, 'utf-8');
    });
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

server.listen(PORT, () => {
  console.log(`TravelMate server running on http://localhost:${PORT}`);
});

