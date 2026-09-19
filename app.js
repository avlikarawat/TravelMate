/**
 * TravelMate - Cute Pastel Scrapbook Travel Planner
 * Frontend connected to Backend API -> SQLite Database -> Frontend
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ==========================================
  // 1. BACKEND API CLIENT (frontend -> backend -> database)
  // ==========================================
  const API_BASE = window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:3000';

  const API = {
    async isBackendAvailable() {
      try {
        const res = await fetch(`${API_BASE}/api/trips`, { method: 'GET' });
        return res.ok;
      } catch (e) {
        return false;
      }
    },

    async getTrips() {
      const res = await fetch(`${API_BASE}/api/trips`);
      if (!res.ok) throw new Error('Failed to fetch trips');
      return await res.json();
    },

    async getTrip(id) {
      const res = await fetch(`${API_BASE}/api/trips/${id}`);
      if (!res.ok) throw new Error('Failed to fetch trip details');
      return await res.json();
    },

    async createTrip(tripData) {
      const res = await fetch(`${API_BASE}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
      });
      if (!res.ok) throw new Error('Failed to create trip');
      return await res.json();
    },

    async updateTrip(id, tripData) {
      const res = await fetch(`${API_BASE}/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
      });
      if (!res.ok) throw new Error('Failed to update trip');
      return await res.json();
    },

    async deleteTrip(id) {
      const res = await fetch(`${API_BASE}/api/trips/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete trip');
      return await res.json();
    },

    async saveItinerary(id, days) {
      const res = await fetch(`${API_BASE}/api/trips/${id}/itinerary`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });
      if (!res.ok) throw new Error('Failed to save itinerary');
      return await res.json();
    },

    async savePacking(id, items) {
      const res = await fetch(`${API_BASE}/api/trips/${id}/packing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (!res.ok) throw new Error('Failed to save packing');
      return await res.json();
    },

    async saveBudget(id, plannedBudget, expenses) {
      const res = await fetch(`${API_BASE}/api/trips/${id}/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plannedBudget, expenses })
      });
      if (!res.ok) throw new Error('Failed to save budget');
      return await res.json();
    }
  };


  // ==========================================
  // 2. STATE MANAGEMENT
  // ==========================================
  let currentTrip = null;
  let savedTrips = [];
  let packingItems = [];
  let expenses = [];
  let plannedTotalBudget = 2000;
  let activeItineraryDay = 1;
  let editingTripId = null;

  // Destinations Postcards Mock Data for Inspiration
  const destinationsData = [
    {
      name: 'Kyoto & Nara',
      country: 'Japan ⛩️',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80',
      stamp: '🌸 Spring / Autumn',
      desc: 'Wander through weeping cherry blossoms, moss gardens, scarlet torii corridors, and friendly bowing deer.',
      tags: ['Temples', 'Matcha', 'Ryokan', 'Peaceful'],
      defaultBudget: 2100,
      currency: 'USD',
      style: 'Cultural & Historic',
      hotel: 'Kyoto Machiya Heritage Inn'
    },
    {
      name: 'Amalfi Coast & Capri',
      country: 'Italy 🍋',
      image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&auto=format&fit=crop&q=80',
      stamp: '☀️ May - Sept',
      desc: 'Pastel cliffside villas cascading into sapphire waters. Sip chilled limoncello, explore sea caves & seaside dining.',
      tags: ['Cliffs', 'Gelato', 'Coastal', 'Romantic'],
      defaultBudget: 2800,
      currency: 'EUR',
      style: 'Beach & Island Chill',
      hotel: 'Positano Sun Villa'
    },
    {
      name: 'Lauterbrunnen Valley',
      country: 'Switzerland 🏔️',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
      stamp: '❄️ Year Round',
      desc: '72 roaring waterfalls dropping from sheer alpine cliffs. Ride yellow mountain trains through wildflower meadows.',
      tags: ['Mountains', 'Hiking', 'Chalet', 'Scenic'],
      defaultBudget: 2600,
      currency: 'USD',
      style: 'Adventure & Outdoors',
      hotel: 'Alpine Pine Chalet'
    },
    {
      name: 'Bali & Nusa Islands',
      country: 'Indonesia 🌴',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&auto=format&fit=crop&q=80',
      stamp: '🌺 April - Oct',
      desc: 'Emerald rice terraces in Ubud, sacred temple water blessings, smoothie bowls and dreamy beach sunsets.',
      tags: ['Wellness', 'Surfing', 'Villas', 'Tropical'],
      defaultBudget: 1500,
      currency: 'USD',
      style: 'Beach & Island Chill',
      hotel: 'Ubud Bamboo Sanctuary'
    },
    {
      name: 'Paris & Montmartre',
      country: 'France 🥐',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop&q=80',
      stamp: '💌 Autumn / Spring',
      desc: 'Bistro sidewalk chairs, warm croissants, second-hand book stalls along the Seine and twilight Eiffel sparkles.',
      tags: ['Museums', 'Pastries', 'Romance', 'Art'],
      defaultBudget: 2400,
      currency: 'EUR',
      style: 'Romantic Getaway',
      hotel: 'Le Marais Boutique Hotel'
    },
    {
      name: 'Reykjavik & Golden Circle',
      country: 'Iceland 🌌',
      image: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=600&auto=format&fit=crop&q=80',
      stamp: '✨ Sept - March',
      desc: 'Hunt the dancing Aurora Borealis, soak in milky geothermal lagoons, and discover obsidian black sand beaches.',
      tags: ['Aurora', 'Geothermal', 'Roadtrip', 'Cozy'],
      defaultBudget: 2700,
      currency: 'USD',
      style: 'Adventure & Outdoors',
      hotel: 'Lava Glass Igloo Cabin'
    }
  ];

  // Initialize App: Load data from Backend -> Database -> Frontend
  async function loadInitialData() {
    try {
      const trips = await API.getTrips();
      if (trips && trips.length > 0) {
        savedTrips = trips;
        // Load first trip in full detail
        const fullTrip = await API.getTrip(savedTrips[0].id);
        currentTrip = fullTrip;
        packingItems = fullTrip.packing || [];
        expenses = fullTrip.budget?.expenses || [];
        plannedTotalBudget = fullTrip.budget?.plannedBudget || fullTrip.budget || 2000;
      }
    } catch (err) {
      console.warn('Backend API connection warning, falling back to local storage:', err);
      // Fallback to IndexedDB if backend is temporarily unreachable
      if (window.TravelMateDB) {
        savedTrips = await window.TravelMateDB.getAllTrips();
        if (savedTrips.length > 0) currentTrip = savedTrips[0];
      }
    }

    renderItineraryView();
    renderPackingList();
    renderBudget();
    renderMyTrips();
    renderDestinations();
    updateDurationDisplay();
  }


  // ==========================================
  // 3. NAVIGATION & TABS
  // ==========================================
  const navLinks = document.querySelectorAll('.nav-link');
  const pageSections = document.querySelectorAll('.page-section');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  window.navigateTo = function(targetSectionId) {
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.target === targetSectionId);
    });

    pageSections.forEach(sec => {
      sec.classList.toggle('active', sec.id === targetSectionId);
    });

    if (navMenu && navMenu.classList.contains('mobile-open')) {
      navMenu.classList.remove('mobile-open');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      navigateTo(e.currentTarget.dataset.target);
    });
  });

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });
  }


  // ==========================================
  // 4. TOAST NOTIFICATION
  // ==========================================
  const toastEl = document.getElementById('toastNotification');
  let toastTimer = null;

  function showToast(message, emoji = '✨') {
    if (!toastEl) return;
    toastEl.innerHTML = `<span>${emoji}</span> ${message}`;
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2800);
  }


  // ==========================================
  // 5. TRIP FORM OPERATIONS (Create & Edit)
  // ==========================================
  const planTripForm = document.getElementById('planTripForm');
  const tripDepInput = document.getElementById('tripDeparture');
  const tripRetInput = document.getElementById('tripReturn');
  const durationPreview = document.getElementById('tripDurationPreview');

  const today = new Date();
  const depDate = new Date(today);
  depDate.setDate(today.getDate() + 14);
  const retDate = new Date(depDate);
  retDate.setDate(depDate.getDate() + 5);

  const formatDateVal = (d) => d.toISOString().split('T')[0];
  if (tripDepInput && tripRetInput) {
    tripDepInput.value = formatDateVal(depDate);
    tripRetInput.value = formatDateVal(retDate);
    tripDepInput.min = formatDateVal(today);
    tripRetInput.min = formatDateVal(today);
  }

  function updateDurationDisplay() {
    if (!tripDepInput.value || !tripRetInput.value) return;
    const start = new Date(tripDepInput.value);
    const end = new Date(tripRetInput.value);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const finalDays = diffDays > 0 ? diffDays : 1;
    if (durationPreview) {
      durationPreview.innerHTML = `⏳ Estimated Trip Length: <strong>${finalDays} Day${finalDays > 1 ? 's' : ''}</strong>`;
    }
    return finalDays;
  }

  if (tripDepInput && tripRetInput) {
    tripDepInput.addEventListener('change', () => {
      if (tripRetInput.value < tripDepInput.value) {
        tripRetInput.value = tripDepInput.value;
      }
      updateDurationDisplay();
    });
    tripRetInput.addEventListener('change', updateDurationDisplay);
  }

  window.prefillTripForm = function(destObj) {
    editingTripId = null;
    document.getElementById('tripDestination').value = destObj.name;
    document.getElementById('tripBudgetAmount').value = destObj.defaultBudget;
    document.getElementById('tripCurrency').value = destObj.currency;
    document.getElementById('tripStyle').value = destObj.style;
    document.getElementById('tripAccommodation').value = 'Cozy Boutique Hotel';
    navigateTo('plan');
    showToast(`Loaded ${destObj.name} into planner!`, '📍');
  };

  // Prefill form for editing an existing trip
  window.editExistingTrip = function(trip) {
    editingTripId = trip.id;
    document.getElementById('tripDestination').value = trip.destination;
    tripDepInput.value = trip.departure;
    tripRetInput.value = trip.returnDate;
    document.getElementById('tripBudgetAmount').value = trip.budget;
    document.getElementById('tripCurrency').value = trip.currency;
    document.getElementById('tripTravellerType').value = trip.travellerType;
    document.getElementById('tripTravellerCount').value = trip.travellerCount;
    document.getElementById('tripStyle').value = trip.style;
    document.getElementById('tripAccommodation').value = trip.accommodation;

    const paceRadios = document.querySelectorAll('input[name="tripPace"]');
    paceRadios.forEach(r => { r.checked = (r.value === trip.pace); });

    updateDurationDisplay();
    navigateTo('plan');
    showToast(`Editing: ${trip.title}`, '✏️');
  };

  function generateItineraryDays(destName, numDays, hotelName, travelStyle) {
    const daysArr = [];
    const themes = [
      { morning: 'Arrival & Welcome Cafe', afternoon: 'Historical Old Town Stroll & Local Bites', evening: 'Sunset Views & Cozy Welcome Dinner' },
      { morning: 'Scenic Landmark Exploration', afternoon: 'Artisan Workshop & Traditional Lunch', evening: 'Street Food Night Walk & Lanterns' },
      { morning: 'Nature Hike or Coastal Breeze', afternoon: 'Hidden Courtyard & Coffee Break', evening: 'Starlight Dining & Live Music' },
      { morning: 'Local Markets & Flavor Tasting', afternoon: 'Museum or Botanical Garden', evening: 'Romantic Rooftop Drinks' },
      { morning: 'Photography & Souvenir Hunting', afternoon: 'Leisurely Tea/Gelato Break', evening: 'Farewell Celebration Dinner' },
      { morning: 'Sunrise Lookout & Fresh Pastries', afternoon: 'Off-the-beaten-path Hidden Gem', evening: 'Cozy Tavern & Travel Journaling' },
      { morning: 'Final Keepsakes & Postcards', afternoon: 'Scenic Departure Views', evening: 'Journey Home with Sweet Memories' }
    ];

    for (let i = 1; i <= numDays; i++) {
      const theme = themes[(i - 1) % themes.length];
      daysArr.push({
        dayNumber: i,
        day: i,
        title: `Day ${i}: ${theme.morning.split('&')[0]}`,
        city: destName,
        hotel: hotelName,
        activities: {
          morning: [{ time: '09:00 AM', title: theme.morning, desc: `Start Day ${i} at ${destName} surrounded by fresh air.` }],
          afternoon: [{ time: '01:30 PM', title: theme.afternoon, desc: `Immerse in the ${travelStyle.toLowerCase()} vibe of the neighborhood.` }],
          evening: [{ time: '07:00 PM', title: theme.evening, desc: 'Unwind with memorable dishes and relaxing tunes.' }]
        }
      });
    }
    return daysArr;
  }

  // Handle Form Submit: Create or Edit Trip -> Backend
  if (planTripForm) {
    planTripForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const destination = document.getElementById('tripDestination').value.trim();
      const departure = tripDepInput.value;
      const returnDate = tripRetInput.value;
      const duration = updateDurationDisplay() || 4;
      const budget = parseFloat(document.getElementById('tripBudgetAmount').value) || 1500;
      const currency = document.getElementById('tripCurrency').value;
      const travellerType = document.getElementById('tripTravellerType').value;
      const travellerCount = parseInt(document.getElementById('tripTravellerCount').value) || 2;
      const style = document.getElementById('tripStyle').value;
      const accommodation = document.getElementById('tripAccommodation').value;
      const pace = document.querySelector('input[name="tripPace"]:checked')?.value || 'Balanced Flow';

      const symbolMap = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', CAD: 'C$', AUD: 'A$' };
      const currencySymbol = symbolMap[currency] || '$';

      if (editingTripId) {
        // --- EDIT EXISTING TRIP ---
        const updatePayload = {
          title: `${destination} Adventure ✨`,
          destination, departure, returnDate, duration, budget,
          currency, currencySymbol, travellerType, travellerCount,
          style, accommodation, pace
        };
        await API.updateTrip(editingTripId, updatePayload);

        // Update local object
        const target = savedTrips.find(t => t.id === editingTripId);
        if (target) Object.assign(target, updatePayload);
        if (currentTrip && currentTrip.id === editingTripId) {
          Object.assign(currentTrip, updatePayload);
          plannedTotalBudget = budget;
        }
        editingTripId = null;
        showToast(`Trip updated successfully!`, '✅');
      } else {
        // --- CREATE NEW TRIP ---
        const tripId = 'trip-' + Date.now();
        const itineraryDays = generateItineraryDays(destination, duration, accommodation, style);
        const defaultPacking = [
          { id: 1, text: 'Passport & Travel Documents', category: 'tech', checked: true },
          { id: 2, text: 'Universal Power Adapter', category: 'tech', checked: true },
          { id: 3, text: 'Comfy Walking Shoes', category: 'clothing', checked: false },
          { id: 4, text: 'Sunscreen & Lip Balm', category: 'toiletries', checked: false },
          { id: 5, text: 'Scrapbook Journal & Camera', category: 'essentials', checked: true }
        ];

        const newTripPayload = {
          id: tripId,
          title: `${destination} Adventure ✨`,
          destination, departure, returnDate, duration, budget,
          currency, currencySymbol, travellerType, travellerCount,
          style, accommodation, pace,
          image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80',
          days: itineraryDays,
          packing: defaultPacking,
          expenses: []
        };

        // Backend POST
        await API.createTrip(newTripPayload);

        currentTrip = newTripPayload;
        savedTrips.unshift(newTripPayload);
        packingItems = defaultPacking;
        expenses = [];
        plannedTotalBudget = budget;
        activeItineraryDay = 1;

        showToast(`Trip created and saved to database!`, '🎉');
      }

      renderItineraryView();
      renderPackingList();
      renderBudget();
      renderMyTrips();
      navigateTo('itinerary');
    });
  }


  // ==========================================
  // 6. ITINERARY (View & Add Moment -> Backend)
  // ==========================================
  const itineraryTripTitle = document.getElementById('itineraryTripTitle');
  const itineraryTripSubtitle = document.getElementById('itineraryTripSubtitle');
  const itineraryDayTabs = document.getElementById('itineraryDayTabs');
  const itineraryCurrentDayLabel = document.getElementById('itineraryCurrentDayLabel');
  const itineraryCurrentHotel = document.getElementById('itineraryCurrentHotel');
  const itineraryCurrentCity = document.getElementById('itineraryCurrentCity');
  const itineraryTimeline = document.getElementById('itineraryTimeline');

  function renderItineraryView() {
    if (!currentTrip) return;

    itineraryTripTitle.textContent = currentTrip.title;
    itineraryTripSubtitle.textContent = `${currentTrip.duration} Days • ${currentTrip.travellerCount} Travellers (${currentTrip.travellerType}) • ${currentTrip.style}`;

    if (!currentTrip.days || currentTrip.days.length === 0) {
      currentTrip.days = generateItineraryDays(currentTrip.destination, currentTrip.duration, currentTrip.accommodation, currentTrip.style);
    }

    if (activeItineraryDay > currentTrip.days.length) {
      activeItineraryDay = 1;
    }

    itineraryDayTabs.innerHTML = '';
    currentTrip.days.forEach((d) => {
      const dayNum = d.dayNumber || d.day;
      const tabBtn = document.createElement('button');
      tabBtn.className = `day-tab-btn ${dayNum === activeItineraryDay ? 'active' : ''}`;
      tabBtn.textContent = `Day ${dayNum}`;
      tabBtn.addEventListener('click', () => {
        activeItineraryDay = dayNum;
        renderItineraryView();
      });
      itineraryDayTabs.appendChild(tabBtn);
    });

    const currentDayData = currentTrip.days.find(d => (d.dayNumber || d.day) === activeItineraryDay) || currentTrip.days[0];
    itineraryCurrentDayLabel.textContent = currentDayData.title || `Day ${currentDayData.dayNumber || currentDayData.day}`;
    itineraryCurrentHotel.innerHTML = `<span>🏨 Stay:</span> <strong>${currentDayData.hotel || currentTrip.accommodation}</strong>`;
    itineraryCurrentCity.textContent = `📍 ${currentDayData.city || currentTrip.destination}`;

    itineraryTimeline.innerHTML = '';
    const periods = [
      { key: 'morning', label: '🌅 Morning', tagClass: 'tag-morning', items: currentDayData.activities?.morning || [] },
      { key: 'afternoon', label: '☀️ Afternoon', tagClass: 'tag-afternoon', items: currentDayData.activities?.afternoon || [] },
      { key: 'evening', label: '🌙 Evening', tagClass: 'tag-evening', items: currentDayData.activities?.evening || [] }
    ];

    periods.forEach(p => {
      const block = document.createElement('div');
      block.className = 'period-block';

      let eventsHtml = '';
      if (!p.items || p.items.length === 0) {
        eventsHtml = `<p style="font-size:0.9rem; color:var(--ink-muted); font-style:italic;">No events added yet for this time slot.</p>`;
      } else {
        eventsHtml = p.items.map(ev => `
          <div class="event-card">
            <span class="event-time">${ev.time}</span>
            <div class="event-details">
              <h5>${ev.title}</h5>
              <p>${ev.desc || ''}</p>
            </div>
          </div>
        `).join('');
      }

      block.innerHTML = `
        <span class="period-tag ${p.tagClass}">${p.label}</span>
        <div class="period-events-list">${eventsHtml}</div>
      `;
      itineraryTimeline.appendChild(block);
    });
  }

  // Add custom moment & persist to backend database
  const addActivityForm = document.getElementById('addActivityForm');
  if (addActivityForm) {
    addActivityForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const period = document.getElementById('newActivityTimePeriod').value.toLowerCase();
      const time = document.getElementById('newActivityTime').value.trim();
      const title = document.getElementById('newActivityTitle').value.trim();
      const desc = document.getElementById('newActivityDesc').value.trim();

      const dayObj = currentTrip.days.find(d => (d.dayNumber || d.day) === activeItineraryDay);
      if (dayObj) {
        if (!dayObj.activities) dayObj.activities = {};
        if (!dayObj.activities[period]) dayObj.activities[period] = [];
        dayObj.activities[period].push({ time, title, desc });

        // Save to backend database
        await API.saveItinerary(currentTrip.id, currentTrip.days);

        renderItineraryView();
        addActivityForm.reset();
        showToast(`Saved to Day ${activeItineraryDay}!`, '✨');
      }
    });
  }


  // ==========================================
  // 7. PACKING LIST (Check, Add, Delete -> Backend)
  // ==========================================
  const packingStatsEl = document.getElementById('packingStats');
  const packingPercentEl = document.getElementById('packingPercent');
  const packingProgressFill = document.getElementById('packingProgressFill');
  const addPackingItemForm = document.getElementById('addPackingItemForm');

  function updatePackingProgress() {
    const total = packingItems.length;
    const packed = packingItems.filter(i => i.checked).length;
    const percentage = total === 0 ? 0 : Math.round((packed / total) * 100);

    packingStatsEl.textContent = `${packed} of ${total} packed`;
    packingPercentEl.textContent = `${percentage}%`;
    packingProgressFill.style.width = `${percentage}%`;
  }

  function renderPackingList() {
    const categories = ['clothing', 'toiletries', 'tech', 'essentials'];

    categories.forEach(cat => {
      const container = document.getElementById(`packingList-${cat}`);
      if (!container) return;

      const filtered = packingItems.filter(item => item.category === cat);
      container.innerHTML = '';

      if (filtered.length === 0) {
        container.innerHTML = `<li style="font-size:0.85rem; color:var(--ink-muted); font-style:italic;">No items here yet.</li>`;
        return;
      }

      filtered.forEach(item => {
        const li = document.createElement('li');
        li.className = `checklist-item ${item.checked ? 'checked' : ''}`;
        li.innerHTML = `
          <label class="checklist-label">
            <input type="checkbox" ${item.checked ? 'checked' : ''} data-id="${item.id}" />
            <span class="checklist-text">${item.text}</span>
          </label>
          <button class="item-delete-btn" data-id="${item.id}" title="Remove item">&times;</button>
        `;

        // Checkbox click -> persist
        const chk = li.querySelector('input[type="checkbox"]');
        chk.addEventListener('change', async (e) => {
          item.checked = e.target.checked;
          li.classList.toggle('checked', item.checked);
          updatePackingProgress();
          if (currentTrip) await API.savePacking(currentTrip.id, packingItems);
        });

        // Delete button -> persist
        const delBtn = li.querySelector('.item-delete-btn');
        delBtn.addEventListener('click', async () => {
          packingItems = packingItems.filter(i => i.id !== item.id);
          if (currentTrip) await API.savePacking(currentTrip.id, packingItems);
          renderPackingList();
          showToast('Item removed', '🗑️');
        });

        container.appendChild(li);
      });
    });

    updatePackingProgress();
  }

  if (addPackingItemForm) {
    addPackingItemForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('packingItemInput');
      const catSelect = document.getElementById('packingCategorySelect');
      const text = input.value.trim();
      const category = catSelect.value;

      if (!text) return;

      const newItem = {
        id: Date.now(),
        text: text,
        category: category,
        checked: false
      };

      packingItems.push(newItem);
      input.value = '';

      if (currentTrip) await API.savePacking(currentTrip.id, packingItems);

      renderPackingList();
      showToast(`Added to ${category}`, '🎒');
    });
  }


  // ==========================================
  // 8. BUDGET TRACKER (Record & Delete -> Backend)
  // ==========================================
  const budgetTotalDisplay = document.getElementById('budgetTotalDisplay');
  const budgetSpentDisplay = document.getElementById('budgetSpentDisplay');
  const budgetRemainingDisplay = document.getElementById('budgetRemainingDisplay');
  const budgetProgressBar = document.getElementById('budgetProgressBar');
  const budgetSpentPercentage = document.getElementById('budgetSpentPercentage');
  const expenseTableBody = document.getElementById('expenseTableBody');
  const expenseCountLabel = document.getElementById('expenseCountLabel');
  const addExpenseForm = document.getElementById('addExpenseForm');

  function renderBudget() {
    const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
    const remaining = Math.max(0, plannedTotalBudget - totalSpent);
    const percentSpent = Math.min(100, Math.round((totalSpent / plannedTotalBudget) * 100)) || 0;

    const sym = currentTrip?.currencySymbol || '$';

    budgetTotalDisplay.textContent = `${sym}${plannedTotalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    budgetSpentDisplay.textContent = `${sym}${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    budgetRemainingDisplay.textContent = `${sym}${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    budgetProgressBar.style.width = `${percentSpent}%`;
    budgetSpentPercentage.textContent = `${percentSpent}% of your total budget used`;

    expenseTableBody.innerHTML = '';
    expenseCountLabel.textContent = `${expenses.length} record${expenses.length === 1 ? '' : 's'}`;

    if (expenses.length === 0) {
      expenseTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:18px; color:var(--ink-muted);">No expenses recorded yet.</td></tr>`;
      return;
    }

    expenses.forEach(exp => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="category-tag">${exp.category}</span></td>
        <td>${exp.desc}</td>
        <td class="ledger-amount">${sym}${exp.amount.toFixed(2)}</td>
        <td>
          <button class="item-delete-btn" data-id="${exp.id}" title="Remove record" style="font-size:1.1rem;">&times;</button>
        </td>
      `;

      tr.querySelector('.item-delete-btn').addEventListener('click', async () => {
        expenses = expenses.filter(e => e.id !== exp.id);
        if (currentTrip) await API.saveBudget(currentTrip.id, plannedTotalBudget, expenses);
        renderBudget();
        showToast('Expense removed', '🗑️');
      });

      expenseTableBody.appendChild(tr);
    });
  }

  if (addExpenseForm) {
    addExpenseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cat = document.getElementById('expenseCategory').value;
      const desc = document.getElementById('expenseDesc').value.trim();
      const amt = parseFloat(document.getElementById('expenseAmount').value);

      if (!desc || isNaN(amt) || amt <= 0) return;

      expenses.unshift({
        id: Date.now(),
        category: cat,
        desc: desc,
        amount: amt
      });

      if (currentTrip) await API.saveBudget(currentTrip.id, plannedTotalBudget, expenses);

      addExpenseForm.reset();
      renderBudget();
      showToast(`Recorded: ${desc}`, '💸');
    });
  }


  // ==========================================
  // 9. MY TRIPS (View, Edit, Delete -> Backend)
  // ==========================================
  const myTripsContainer = document.getElementById('myTripsContainer');

  function renderMyTrips() {
    if (!myTripsContainer) return;
    myTripsContainer.innerHTML = '';

    savedTrips.forEach(trip => {
      const card = document.createElement('div');
      card.className = 'trip-card';
      card.innerHTML = `
        <img src="${trip.image}" alt="${trip.destination}" class="trip-card-image" />
        <div class="trip-card-header">
          <h3>${trip.title}</h3>
          <span class="trip-badge-tag">${trip.duration} Days</span>
        </div>
        <ul class="trip-meta-list">
          <li>📍 <strong>Destination:</strong> ${trip.destination}</li>
          <li>📅 <strong>Dates:</strong> ${trip.departure} &rarr; ${trip.returnDate}</li>
          <li>👥 <strong>Party:</strong> ${trip.travellerCount} travellers (${trip.travellerType})</li>
          <li>💰 <strong>Budget:</strong> ${trip.currencySymbol}${Number(trip.budget).toLocaleString()} (${trip.currency})</li>
          <li>🎨 <strong>Vibe:</strong> ${trip.style}</li>
        </ul>
        <div class="trip-card-actions">
          <button class="btn btn-primary btn-sm flex-1 view-trip-btn">🗓️ View</button>
          <button class="btn btn-secondary btn-sm edit-trip-btn" title="Edit Trip Details">✏️ Edit</button>
          <button class="btn btn-neutral btn-sm delete-trip-btn" title="Delete Trip">🗑️</button>
        </div>
      `;

      // View Trip: Fetch full trip from Backend
      card.querySelector('.view-trip-btn').addEventListener('click', async () => {
        try {
          const fullTrip = await API.getTrip(trip.id);
          currentTrip = fullTrip;
          packingItems = fullTrip.packing || [];
          expenses = fullTrip.budget?.expenses || [];
          plannedTotalBudget = fullTrip.budget?.plannedBudget || fullTrip.budget || 2000;
        } catch (e) {
          currentTrip = trip;
        }

        activeItineraryDay = 1;
        renderItineraryView();
        renderPackingList();
        renderBudget();
        navigateTo('itinerary');
        showToast(`Loaded ${trip.destination}!`, '🗺️');
      });

      // Edit Trip: Load form to edit
      card.querySelector('.edit-trip-btn').addEventListener('click', () => {
        editExistingTrip(trip);
      });

      // Delete Trip: DELETE -> Backend
      card.querySelector('.delete-trip-btn').addEventListener('click', async () => {
        if (savedTrips.length <= 1) {
          showToast('Keep at least one trip in your scrapbook!', '🌸');
          return;
        }

        await API.deleteTrip(trip.id);
        savedTrips = savedTrips.filter(t => t.id !== trip.id);

        if (currentTrip && currentTrip.id === trip.id) {
          const nextTrip = await API.getTrip(savedTrips[0].id);
          currentTrip = nextTrip;
          packingItems = nextTrip.packing || [];
          expenses = nextTrip.budget?.expenses || [];
          plannedTotalBudget = nextTrip.budget?.plannedBudget || nextTrip.budget || 2000;
          renderItineraryView();
          renderPackingList();
          renderBudget();
        }

        renderMyTrips();
        showToast('Trip removed from database', '🗑️');
      });

      myTripsContainer.appendChild(card);
    });
  }


  // ==========================================
  // 10. DESTINATIONS
  // ==========================================
  const destinationsContainer = document.getElementById('destinationsContainer');

  function renderDestinations() {
    if (!destinationsContainer) return;
    destinationsContainer.innerHTML = '';

    destinationsData.forEach(dest => {
      const card = document.createElement('div');
      card.className = 'destination-postcard';
      card.innerHTML = `
        <div class="postcard-img-wrap">
          <img src="${dest.image}" alt="${dest.name}" />
          <span class="postcard-stamp">${dest.stamp}</span>
        </div>
        <div class="postcard-body">
          <h3>${dest.name}</h3>
          <span class="postcard-country">${dest.country}</span>
          <p class="postcard-desc">${dest.desc}</p>
          <div class="postcard-tags">
            ${dest.tags.map(t => `<span class="post-tag">#${t}</span>`).join('')}
          </div>
          <button class="btn btn-secondary btn-sm plan-dest-btn">
            ✈️ Plan This Trip
          </button>
        </div>
      `;

      card.querySelector('.plan-dest-btn').addEventListener('click', () => {
        prefillTripForm(dest);
      });

      destinationsContainer.appendChild(card);
    });
  }


  // ==========================================
  // 11. BOOTSTRAP APP
  // ==========================================
  loadInitialData();

});
