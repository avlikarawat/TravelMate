/**
 * TravelMate - Cute Pastel Scrapbook Travel Planner
 * Vanilla JavaScript connected to TravelMateDB (IndexedDB)
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ==========================================
  // 1. STATE & REALISTIC MOCK DATA
  // ==========================================

  let currentTrip = null;
  let savedTrips = [];
  let packingItems = [];
  let expenses = [];
  let plannedTotalBudget = 2000;
  let activeItineraryDay = 1;

  // Initial Seed Data for first-time DB initialization
  const initialTripSeed = {
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
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop&q=80',
    days: [
      {
        dayNumber: 1,
        title: 'Arrival & Lantern Light',
        city: 'Kyoto, Japan',
        hotel: 'Kyoto Machiya Heritage Inn',
        activities: {
          morning: [
            { time: '09:30 AM', title: 'Check into Traditional Machiya', desc: 'Sip warm roasted hojicha tea while checking into wooden garden townhome.' }
          ],
          afternoon: [
            { time: '01:00 PM', title: 'Gion Floral Alley Stroll', desc: 'Walk past Shirakawa canal, cobblestone lanes and weeping cherry trees.' },
            { time: '03:30 PM', title: 'Matcha Parfait at Tsujiri', desc: 'Indulge in sweet layered Uji matcha soft-serve with dango mochi.' }
          ],
          evening: [
            { time: '06:45 PM', title: 'Pontocho Alley Izakaya Dinner', desc: 'Dine on riverside wooden decks (Kawayuka) watching lantern glows.' }
          ]
        }
      },
      {
        dayNumber: 2,
        title: 'Bamboo Whispers & Temple Gardens',
        city: 'Arashiyama, Kyoto',
        hotel: 'Kyoto Machiya Heritage Inn',
        activities: {
          morning: [
            { time: '07:30 AM', title: 'Early Arashiyama Bamboo Grove Walk', desc: 'Beat the crowd to hear peaceful green bamboo rustling in the morning breeze.' }
          ],
          afternoon: [
            { time: '12:15 PM', title: 'Tenryu-ji Temple Zen Pond', desc: 'Admire 14th century landscaped pond and seasonal moss reflections.' },
            { time: '02:45 PM', title: 'Sagawa River Romantic Boat Ride', desc: 'Glide down serene turquoise river bordered by lush mountain crags.' }
          ],
          evening: [
            { time: '07:00 PM', title: 'Tofu Kaiseki Feast', desc: 'Multi-course yudofu hot-pot dinner in a tranquil cedar dining pavilion.' }
          ]
        }
      },
      {
        dayNumber: 3,
        title: 'Torii Gates & Ceramic Souvenirs',
        city: 'Fushimi & Higashiyama',
        hotel: 'Kyoto Machiya Heritage Inn',
        activities: {
          morning: [
            { time: '08:15 AM', title: 'Fushimi Inari Vermilion Paths', desc: 'Hike through thousands of bright orange gates up Mount Inari.' }
          ],
          afternoon: [
            { time: '01:30 PM', title: 'Ninenzaka Pottery Workshop', desc: 'Try hand-crafting a cute ceramic tea cup at a traditional kiln.' },
            { time: '04:00 PM', title: 'Kiyomizu-dera Veranda Sunset', desc: 'Marvel at panoramic skyline views from the wooden cliff terrace.' }
          ],
          evening: [
            { time: '07:30 PM', title: 'Ramen Sen-no-Kaze', desc: 'Comforting bowls of pork & veggie broth ramen with melt-in-mouth chashu.' }
          ]
        }
      },
      {
        dayNumber: 4,
        title: 'Uji Green Tea Pilgrimage',
        city: 'Uji, Kyoto Suburb',
        hotel: 'Kyoto Machiya Heritage Inn',
        activities: {
          morning: [
            { time: '09:00 AM', title: 'Scenic Keihan Train to Uji', desc: 'Brief 25-min countryside train journey surrounded by tea plantations.' }
          ],
          afternoon: [
            { time: '11:30 AM', title: 'Byodoin Phoenix Hall (10 Yen coin temple)', desc: 'Explore pristine reflection pond and Pure Land Buddhist architecture.' },
            { time: '02:30 PM', title: 'Ceremonial Tea Grinding Experience', desc: 'Grind roasted tencha leaves on a granite mill and whisk fresh froth.' }
          ],
          evening: [
            { time: '06:30 PM', title: 'Evening Riverside Wagyu BBQ', desc: 'Savory grilled skewers under gentle garden lights.' }
          ]
        }
      },
      {
        dayNumber: 5,
        title: 'Sweet Souvenirs & Sayonara',
        city: 'Kyoto Station',
        hotel: 'Kyoto Machiya Heritage Inn',
        activities: {
          morning: [
            { time: '09:00 AM', title: 'Nishiki Market Morning Bites', desc: 'Sample dashi tamagoyaki, strawberry daifuku, and pickled radishes.' }
          ],
          afternoon: [
            { time: '12:30 PM', title: 'Station Souvenir Stamp Collecting', desc: 'Collect keepsake ink stamps for the travel scrapbook journal!' }
          ],
          evening: [
            { time: '04:00 PM', title: 'Shinkansen Bullet Train Departure', desc: 'Sayonara sweet Kyoto, boarding train with cute bento boxes.' }
          ]
        }
      }
    ]
  };

  const initialPackingSeed = [
    { id: 1, text: 'Passport & Photocopies', category: 'tech', checked: true },
    { id: 2, text: 'Universal Power Adapter', category: 'tech', checked: true },
    { id: 3, text: 'Compact Polaroid Camera', category: 'tech', checked: true },
    { id: 4, text: 'Portable Power Bank (10,000mAh)', category: 'tech', checked: false },
    { id: 5, text: 'Linen Shirts & Pastels', category: 'clothing', checked: true },
    { id: 6, text: 'Comfy Walking Sneakers', category: 'clothing', checked: true },
    { id: 7, text: 'Cozy Oversized Cardigan', category: 'clothing', checked: false },
    { id: 8, text: 'Sun Hat & Sunglasses', category: 'clothing', checked: true },
    { id: 9, text: 'Hydrating Facial Mist', category: 'toiletries', checked: true },
    { id: 10, text: 'SPF 50 Sunscreen Cream', category: 'toiletries', checked: true },
    { id: 11, text: 'Travel Toothbrush & Paste', category: 'toiletries', checked: false },
    { id: 12, text: 'Cute Pocket First-Aid Kit', category: 'toiletries', checked: false },
    { id: 13, text: 'Travel Journal & Gel Pens', category: 'essentials', checked: true },
    { id: 14, text: 'Washi Tape & Stickers', category: 'essentials', checked: false },
    { id: 15, text: 'Lavender Pillow Spray', category: 'essentials', checked: false },
    { id: 16, text: 'Reusable Canvas Tote Bag', category: 'essentials', checked: false }
  ];

  const initialBudgetExpensesSeed = [
    { id: 1, category: 'Flight & Transit', desc: 'Roundtrip Flights (2 tickets)', amount: 780.00 },
    { id: 2, category: 'Hotel & Stay', desc: 'Machiya Townhouse Deposit', amount: 320.00 },
    { id: 3, category: 'Food & Drinks', desc: 'Matcha Sweets & Ramen Lunch', amount: 42.50 },
    { id: 4, category: 'Activities & Fun', desc: 'Byodoin & Temple Passes', amount: 32.50 },
    { id: 5, category: 'Shopping & Souvenirs', desc: 'Handcrafted Ceramic Cups', amount: 90.00 }
  ];

  // Destinations Postcards Mock Data
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


  // ==========================================
  // 2. DATABASE PERSISTENCE INITIALIZATION
  // ==========================================
  async function initDatabaseAndState() {
    try {
      const dbTrips = await window.TravelMateDB.getAllTrips();

      if (!dbTrips || dbTrips.length === 0) {
        // Seed initial data into IndexedDB
        await window.TravelMateDB.putTrip(initialTripSeed);
        await window.TravelMateDB.saveItineraryDays(initialTripSeed.id, initialTripSeed.days);
        await window.TravelMateDB.savePackingForTrip(initialTripSeed.id, initialPackingSeed);
        await window.TravelMateDB.saveBudgetForTrip(initialTripSeed.id, initialTripSeed.budget, initialBudgetExpensesSeed);

        // Seed 2 additional sample trips
        const trip2 = {
          id: 'trip-2',
          title: 'Amalfi Lemon Sunshine 🍋',
          destination: 'Positano & Capri, Italy',
          departure: '2026-06-12',
          returnDate: '2026-06-18',
          duration: 7,
          budget: 3200,
          currency: 'EUR',
          currencySymbol: '€',
          travellerType: 'Couple / Pair',
          travellerCount: 2,
          style: 'Beach & Island Chill',
          accommodation: 'Cliffside Pastel Villa',
          pace: 'Chill & Relaxed',
          image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&auto=format&fit=crop&q=80',
          days: generateItineraryDays('Positano & Capri, Italy', 7, 'Cliffside Pastel Villa', 'Beach & Island Chill')
        };
        await window.TravelMateDB.putTrip(trip2);
        await window.TravelMateDB.saveItineraryDays(trip2.id, trip2.days);
        await window.TravelMateDB.savePackingForTrip(trip2.id, initialPackingSeed.slice(0, 8));
        await window.TravelMateDB.saveBudgetForTrip(trip2.id, trip2.budget, []);

        const trip3 = {
          id: 'trip-3',
          title: 'Swiss Alpine Meadow Escape 🏔️',
          destination: 'Lauterbrunnen & Zermatt',
          departure: '2026-08-04',
          returnDate: '2026-08-09',
          duration: 6,
          budget: 2500,
          currency: 'USD',
          currencySymbol: '$',
          travellerType: 'Bestie Squad',
          travellerCount: 3,
          style: 'Adventure & Outdoors',
          accommodation: 'Pine Log Chalet',
          pace: 'Balanced Flow',
          image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
          days: generateItineraryDays('Lauterbrunnen & Zermatt', 6, 'Pine Log Chalet', 'Adventure & Outdoors')
        };
        await window.TravelMateDB.putTrip(trip3);
        await window.TravelMateDB.saveItineraryDays(trip3.id, trip3.days);
        await window.TravelMateDB.savePackingForTrip(trip3.id, initialPackingSeed.slice(0, 6));
        await window.TravelMateDB.saveBudgetForTrip(trip3.id, trip3.budget, []);

        savedTrips = [initialTripSeed, trip2, trip3];
        currentTrip = initialTripSeed;
        packingItems = [...initialPackingSeed];
        expenses = [...initialBudgetExpensesSeed];
        plannedTotalBudget = initialTripSeed.budget;
      } else {
        // Load trips from IndexedDB
        savedTrips = dbTrips;
        currentTrip = savedTrips[0];

        // Load itinerary for active trip
        const storedDays = await window.TravelMateDB.getItineraryForTrip(currentTrip.id);
        if (storedDays && storedDays.length > 0) {
          currentTrip.days = storedDays.map(d => ({
            dayNumber: d.day,
            title: d.title || `Day ${d.day}`,
            city: d.city,
            hotel: d.hotel,
            activities: d.activities || { morning: [], afternoon: [], evening: [] }
          }));
        } else if (!currentTrip.days || currentTrip.days.length === 0) {
          currentTrip.days = generateItineraryDays(currentTrip.destination, currentTrip.duration, currentTrip.accommodation, currentTrip.style);
          await window.TravelMateDB.saveItineraryDays(currentTrip.id, currentTrip.days);
        }

        // Load packing items for active trip
        const storedPacking = await window.TravelMateDB.getPackingForTrip(currentTrip.id);
        packingItems = storedPacking ? storedPacking : [...initialPackingSeed];

        // Load budget for active trip
        const storedBudget = await window.TravelMateDB.getBudgetForTrip(currentTrip.id);
        if (storedBudget) {
          plannedTotalBudget = storedBudget.plannedBudget || currentTrip.budget;
          expenses = storedBudget.expenses || [];
        } else {
          plannedTotalBudget = currentTrip.budget;
          expenses = [...initialBudgetExpensesSeed];
        }
      }
    } catch (err) {
      console.warn('DB initialization fallback to memory state:', err);
      savedTrips = [initialTripSeed];
      currentTrip = initialTripSeed;
      packingItems = [...initialPackingSeed];
      expenses = [...initialBudgetExpensesSeed];
    }

    // Render components
    renderItineraryView();
    renderPackingList();
    renderBudget();
    renderMyTrips();
    renderDestinations();
    updateDurationDisplay();
  }


  // ==========================================
  // 3. NAVIGATION & TAB SWITCHING
  // ==========================================
  const navLinks = document.querySelectorAll('.nav-link');
  const pageSections = document.querySelectorAll('.page-section');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  window.navigateTo = function(targetSectionId) {
    navLinks.forEach(link => {
      if (link.dataset.target === targetSectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    pageSections.forEach(sec => {
      if (sec.id === targetSectionId) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    if (navMenu && navMenu.classList.contains('mobile-open')) {
      navMenu.classList.remove('mobile-open');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.target;
      navigateTo(target);
    });
  });

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });
  }


  // ==========================================
  // 4. TOAST NOTIFICATION HELPER
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
  // 5. PLAN TRIP FORM LOGIC & PERSISTENCE
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
    document.getElementById('tripDestination').value = destObj.name;
    document.getElementById('tripBudgetAmount').value = destObj.defaultBudget;
    document.getElementById('tripCurrency').value = destObj.currency;
    document.getElementById('tripStyle').value = destObj.style;
    document.getElementById('tripAccommodation').value = 'Cozy Boutique Hotel';
    navigateTo('plan');
    showToast(`Loaded ${destObj.name} into planner!`, '📍');
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
        title: `Day ${i}: ${theme.morning.split('&')[0]}`,
        city: destName,
        hotel: hotelName,
        activities: {
          morning: [
            { time: '09:00 AM', title: theme.morning, desc: `Start Day ${i} at ${destName} surrounded by fresh air and morning flavors.` }
          ],
          afternoon: [
            { time: '01:30 PM', title: theme.afternoon, desc: `Immerse in the ${travelStyle.toLowerCase()} vibe of the neighborhood.` },
            { time: '04:00 PM', title: 'Scrapbook Photo Stop & Treats', desc: 'Pause to snap polaroids and write notes in your journal.' }
          ],
          evening: [
            { time: '07:00 PM', title: theme.evening, desc: 'Unwind with memorable dishes and relaxing ambient tunes.' }
          ]
        }
      });
    }
    return daysArr;
  }

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

      const tripId = 'trip-' + Date.now();
      const itineraryDays = generateItineraryDays(destination, duration, accommodation, style);

      const newTrip = {
        id: tripId,
        title: `${destination} Adventure ✨`,
        destination: destination,
        departure: departure,
        returnDate: returnDate,
        duration: duration,
        budget: budget,
        currency: currency,
        currencySymbol: currencySymbol,
        travellerType: travellerType,
        travellerCount: travellerCount,
        style: style,
        accommodation: accommodation,
        pace: pace,
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80',
        days: itineraryDays
      };

      // Save to IndexedDB
      await window.TravelMateDB.putTrip(newTrip);
      await window.TravelMateDB.saveItineraryDays(tripId, itineraryDays);
      await window.TravelMateDB.savePackingForTrip(tripId, initialPackingSeed);
      await window.TravelMateDB.saveBudgetForTrip(tripId, budget, []);

      // Update state
      currentTrip = newTrip;
      savedTrips.unshift(newTrip);
      packingItems = [...initialPackingSeed];
      plannedTotalBudget = budget;
      expenses = [];
      activeItineraryDay = 1;

      renderItineraryView();
      renderPackingList();
      renderBudget();
      renderMyTrips();

      navigateTo('itinerary');
      showToast(`Saved to database: ${destination}!`, '💾');
    });
  }


  // ==========================================
  // 6. ITINERARY RENDERING & TABS
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
      const tabBtn = document.createElement('button');
      tabBtn.className = `day-tab-btn ${d.dayNumber === activeItineraryDay ? 'active' : ''}`;
      tabBtn.textContent = `Day ${d.dayNumber}`;
      tabBtn.addEventListener('click', () => {
        activeItineraryDay = d.dayNumber;
        renderItineraryView();
      });
      itineraryDayTabs.appendChild(tabBtn);
    });

    const currentDayData = currentTrip.days.find(d => d.dayNumber === activeItineraryDay) || currentTrip.days[0];
    itineraryCurrentDayLabel.textContent = currentDayData.title || `Day ${currentDayData.dayNumber}`;
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
      if (p.items.length === 0) {
        eventsHtml = `<p style="font-size:0.9rem; color:var(--ink-muted); font-style:italic;">No events added yet for this time slot. Add one below!</p>`;
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
        <div class="period-events-list">
          ${eventsHtml}
        </div>
      `;
      itineraryTimeline.appendChild(block);
    });
  }

  // Add custom activity to active day and save to DB
  const addActivityForm = document.getElementById('addActivityForm');
  if (addActivityForm) {
    addActivityForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const period = document.getElementById('newActivityTimePeriod').value.toLowerCase();
      const time = document.getElementById('newActivityTime').value.trim();
      const title = document.getElementById('newActivityTitle').value.trim();
      const desc = document.getElementById('newActivityDesc').value.trim();

      const dayObj = currentTrip.days.find(d => d.dayNumber === activeItineraryDay);
      if (dayObj) {
        if (!dayObj.activities[period]) dayObj.activities[period] = [];
        dayObj.activities[period].push({ time, title, desc });

        // Persist to DB
        await window.TravelMateDB.saveItineraryDays(currentTrip.id, currentTrip.days);

        renderItineraryView();
        addActivityForm.reset();
        showToast('Saved moment to Day ' + activeItineraryDay, '✨');
      }
    });
  }


  // ==========================================
  // 7. PACKING LIST LOGIC & PERSISTENCE
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

        // Checkbox change
        const chk = li.querySelector('input[type="checkbox"]');
        chk.addEventListener('change', async (e) => {
          item.checked = e.target.checked;
          li.classList.toggle('checked', item.checked);
          updatePackingProgress();
          if (currentTrip) {
            await window.TravelMateDB.savePackingForTrip(currentTrip.id, packingItems);
          }
        });

        // Delete button
        const delBtn = li.querySelector('.item-delete-btn');
        delBtn.addEventListener('click', async () => {
          packingItems = packingItems.filter(i => i.id !== item.id);
          if (currentTrip) {
            await window.TravelMateDB.savePackingForTrip(currentTrip.id, packingItems);
          }
          renderPackingList();
          updatePackingProgress();
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

      if (currentTrip) {
        await window.TravelMateDB.savePackingForTrip(currentTrip.id, packingItems);
      }

      renderPackingList();
      showToast(`Saved "${text}" to checklist`, '🎒');
    });
  }


  // ==========================================
  // 8. BUDGET TRACKER LOGIC & PERSISTENCE
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
      expenseTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:18px; color:var(--ink-muted);">No expenses recorded yet. Sip a coffee and log your receipts!</td></tr>`;
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
        if (currentTrip) {
          await window.TravelMateDB.saveBudgetForTrip(currentTrip.id, plannedTotalBudget, expenses);
        }
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

      if (currentTrip) {
        await window.TravelMateDB.saveBudgetForTrip(currentTrip.id, plannedTotalBudget, expenses);
      }

      addExpenseForm.reset();
      renderBudget();
      showToast(`Recorded: ${desc}`, '💸');
    });
  }


  // ==========================================
  // 9. MY TRIPS SECTION & PERSISTENCE
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
          <li>💰 <strong>Budget:</strong> ${trip.currencySymbol}${trip.budget.toLocaleString()} (${trip.currency})</li>
          <li>🎨 <strong>Vibe:</strong> ${trip.style}</li>
        </ul>
        <div class="trip-card-actions">
          <button class="btn btn-primary btn-sm flex-1 view-trip-btn">🗓️ View Itinerary</button>
          <button class="btn btn-neutral btn-sm delete-trip-btn" title="Delete Trip">🗑️</button>
        </div>
      `;

      // View Itinerary click & load trip state from DB
      card.querySelector('.view-trip-btn').addEventListener('click', async () => {
        currentTrip = trip;
        activeItineraryDay = 1;

        // Load trip itinerary from DB
        const storedDays = await window.TravelMateDB.getItineraryForTrip(trip.id);
        if (storedDays && storedDays.length > 0) {
          currentTrip.days = storedDays.map(d => ({
            dayNumber: d.day,
            title: d.title || `Day ${d.day}`,
            city: d.city,
            hotel: d.hotel,
            activities: d.activities || { morning: [], afternoon: [], evening: [] }
          }));
        } else if (!currentTrip.days || currentTrip.days.length === 0) {
          currentTrip.days = generateItineraryDays(currentTrip.destination, currentTrip.duration, currentTrip.accommodation, currentTrip.style);
        }

        // Load packing from DB
        const storedPacking = await window.TravelMateDB.getPackingForTrip(trip.id);
        packingItems = storedPacking ? storedPacking : [...initialPackingSeed];

        // Load budget from DB
        const storedBudget = await window.TravelMateDB.getBudgetForTrip(trip.id);
        if (storedBudget) {
          plannedTotalBudget = storedBudget.plannedBudget || trip.budget;
          expenses = storedBudget.expenses || [];
        } else {
          plannedTotalBudget = trip.budget;
          expenses = [];
        }

        renderItineraryView();
        renderPackingList();
        renderBudget();
        navigateTo('itinerary');
        showToast(`Loaded ${trip.destination}!`, '🗺️');
      });

      // Delete trip click
      card.querySelector('.delete-trip-btn').addEventListener('click', async () => {
        if (savedTrips.length <= 1) {
          showToast('Keep at least one trip in your scrapbook!', '🌸');
          return;
        }

        await window.TravelMateDB.deleteTrip(trip.id);
        savedTrips = savedTrips.filter(t => t.id !== trip.id);

        if (currentTrip.id === trip.id) {
          currentTrip = savedTrips[0];
          renderItineraryView();
        }
        renderMyTrips();
        showToast('Trip removed from database', '🗑️');
      });

      myTripsContainer.appendChild(card);
    });
  }


  // ==========================================
  // 10. DESTINATIONS INSPIRATION
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
  // 11. START APPLICATION
  // ==========================================
  initDatabaseAndState();

});
