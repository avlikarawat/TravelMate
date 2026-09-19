/**
 * TravelMate Minimal Persistent Database (IndexedDB)
 * Stores: trips, itinerary, packing, budget
 */

const DB_NAME = 'TravelMateDB';
const DB_VERSION = 1;

let dbInstance = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      // 1. Trips: destination, dates, budget, travellers and preferences
      if (!db.objectStoreNames.contains('trips')) {
        db.createObjectStore('trips', { keyPath: 'id' });
      }

      // 2. Itinerary: trip ID, day, city, hotel and activities
      if (!db.objectStoreNames.contains('itinerary')) {
        const store = db.createObjectStore('itinerary', { keyPath: 'id', autoIncrement: true });
        store.createIndex('tripId', 'tripId', { unique: false });
      }

      // 3. Packing: trip ID and items
      if (!db.objectStoreNames.contains('packing')) {
        const store = db.createObjectStore('packing', { keyPath: 'tripId' });
      }

      // 4. Budget: trip ID, categories and amounts
      if (!db.objectStoreNames.contains('budget')) {
        const store = db.createObjectStore('budget', { keyPath: 'tripId' });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

const DB = {
  // Trips
  async getAllTrips() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('trips', 'readonly');
      const store = tx.objectStore('trips');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async putTrip(trip) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('trips', 'readwrite');
      const store = tx.objectStore('trips');
      const req = store.put(trip);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async deleteTrip(tripId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['trips', 'itinerary', 'packing', 'budget'], 'readwrite');
      tx.objectStore('trips').delete(tripId);
      tx.objectStore('packing').delete(tripId);
      tx.objectStore('budget').delete(tripId);

      const itinStore = tx.objectStore('itinerary');
      const index = itinStore.index('tripId');
      const req = index.openCursor(IDBKeyRange.only(tripId));
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  // Itinerary
  async getItineraryForTrip(tripId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('itinerary', 'readonly');
      const store = tx.objectStore('itinerary');
      const index = store.index('tripId');
      const req = index.getAll(IDBKeyRange.only(tripId));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async saveItineraryDays(tripId, days) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('itinerary', 'readwrite');
      const store = tx.objectStore('itinerary');
      const index = store.index('tripId');
      const req = index.openCursor(IDBKeyRange.only(tripId));

      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          // Insert new days
          days.forEach(day => {
            store.add({
              tripId: tripId,
              day: day.dayNumber,
              city: day.city,
              hotel: day.hotel,
              title: day.title,
              activities: day.activities
            });
          });
        }
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  // Packing
  async getPackingForTrip(tripId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('packing', 'readonly');
      const store = tx.objectStore('packing');
      const req = store.get(tripId);
      req.onsuccess = () => resolve(req.result ? req.result.items : null);
      req.onerror = () => reject(req.error);
    });
  },

  async savePackingForTrip(tripId, items) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('packing', 'readwrite');
      const store = tx.objectStore('packing');
      const req = store.put({ tripId: tripId, items: items });
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  },

  // Budget
  async getBudgetForTrip(tripId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('budget', 'readonly');
      const store = tx.objectStore('budget');
      const req = store.get(tripId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async saveBudgetForTrip(tripId, plannedBudget, expenses) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('budget', 'readwrite');
      const store = tx.objectStore('budget');
      const req = store.put({
        tripId: tripId,
        plannedBudget: plannedBudget,
        expenses: expenses
      });
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }
};

window.TravelMateDB = DB;
