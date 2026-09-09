import { CityId, TripPlan, TripLocation } from '../types';
import { DEFAULT_ANCHORS } from './pandalRecommendationService';

const LOCAL_STORAGE_TRIPS_KEY = 'pujatrip_user_saved_trips_v1';

/**
 * Pre-seeded realistic demo trips for Kolkata and Contai
 */
export const INITIAL_DEMO_TRIPS: TripPlan[] = [
  // 1. Kolkata - North Kolkata Heritage & Bonedi Trail (5 stops, Balanced evening)
  {
    id: 'demo-kolkata-north-heritage',
    name: 'North Kolkata Heritage & Bonedi Trail',
    bengaliName: 'উত্তর কলকাতা সাবেকি ও বনেদি পরিক্রমা',
    city: 'kolkata',
    date: '2026-10-18', // Maha Saptami
    startTime: '17:00',
    endTime: '22:30', // 5.5 hours
    startLocation: {
      id: 'shyambazar-crossing',
      name: 'Shyambazar Five-Point',
      bengaliName: 'শ্যামবাজার পাঁচমাথার মোড়',
      city: 'kolkata',
      latitude: 22.6015,
      longitude: 88.3712,
      description: 'North Kolkata historic transit hub',
    },
    endLocation: {
      id: 'college-square-boipara',
      name: 'College Street Boipara',
      bengaliName: 'কলেজ স্ট্রিট বইপাড়া',
      city: 'kolkata',
      latitude: 22.5744,
      longitude: 88.3629,
      description: 'College Street cultural epicenter',
    },
    walkingPreference: 'normal',
    preferredTransport: 'metro',
    maxWalkingDistanceMeters: 5000,
    selectedPandalIds: [
      'shobhabazar-rajbari',
      'bagbazar-sarbojanin',
      'tala-park-prattyay',
      'hatibagan-sarbojanin',
      'college-square',
    ],
    isCustomTrip: false,
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
    notes: 'Classic northern Calcutta route connecting 1757 rajbari courtyard with traditional Ganga ghat pujas and illuminated College Square lake reflection.',
  },

  // 2. Kolkata - South Kolkata Mega Theme Extravaganza (6 stops, High-energy night hopping)
  {
    id: 'demo-kolkata-south-themes',
    name: 'South Kolkata Mega Theme Extravaganza',
    bengaliName: 'দক্ষিণ কলকাতা মেগা থিম ও আলোর মহা-অভিযান',
    city: 'kolkata',
    date: '2026-10-19', // Maha Ashtami
    startTime: '16:30',
    endTime: '23:45', // 7.25 hours
    startLocation: {
      id: 'maddox-square-park',
      name: 'Maddox Square (South Kolkata)',
      bengaliName: 'ম্যাডক্স স্কোয়ার (দক্ষিণ কলকাতা)',
      city: 'kolkata',
      latitude: 22.5298,
      longitude: 88.3582,
      description: 'Heart of South Kolkata adda',
    },
    endLocation: {
      id: 'gariahat-crossing',
      name: 'Gariahat Crossing',
      bengaliName: 'গড়িয়াহাট মোড়',
      city: 'kolkata',
      latitude: 22.5186,
      longitude: 88.3688,
      description: 'Gariahat illumination junction',
    },
    walkingPreference: 'normal',
    preferredTransport: 'mixed',
    maxWalkingDistanceMeters: 6000,
    selectedPandalIds: [
      'chetla-agrani',
      'suruchi-sangha',
      'tridhara-sammilani',
      'maddox-square',
      'ekdalia-evergreen',
      'ballygunge-cultural',
    ],
    isCustomTrip: false,
    createdAt: '2026-10-02T12:00:00Z',
    updatedAt: '2026-10-02T12:00:00Z',
    notes: 'South Kolkata award-winning circuit with dazzling Chandannagar illuminations, immersive conceptual art, and relaxing adda at Maddox lawns.',
  },

  // 3. Kolkata - Fast Track Express (Short 2.5h testing trip with tight time)
  {
    id: 'demo-kolkata-fast-express',
    name: 'Central Heritage Express (Short Slot)',
    bengaliName: 'সেন্ট্রাল হেরিটেজ এক্সপ্রেস (স্বল্পকালীন স্লট)',
    city: 'kolkata',
    date: '2026-10-20', // Maha Navami
    startTime: '18:00',
    endTime: '20:30', // 2.5 hours (tight test case)
    startLocation: {
      id: 'college-square-boipara',
      name: 'College Street Boipara',
      bengaliName: 'কলেজ স্ট্রিট বইপাড়া',
      city: 'kolkata',
      latitude: 22.5744,
      longitude: 88.3629,
      description: 'Central Kolkata cultural core',
    },
    endLocation: {
      id: 'college-square-boipara',
      name: 'College Street Boipara',
      bengaliName: 'কলেজ স্ট্রিট বইপাড়া',
      city: 'kolkata',
      latitude: 22.5744,
      longitude: 88.3629,
      description: 'Central Kolkata cultural core',
    },
    walkingPreference: 'high',
    preferredTransport: 'walking',
    maxWalkingDistanceMeters: 3500,
    selectedPandalIds: [
      'college-square',
      'mohammad-ali-park',
      'shobhabazar-rajbari',
    ],
    isCustomTrip: false,
    createdAt: '2026-10-03T14:00:00Z',
    updatedAt: '2026-10-03T14:00:00Z',
    notes: 'Quick central hopping route designed for evening tea and historic illuminated waters.',
  },

  // 4. Contai - Contai Town Grand Terracotta Circuit (4 stops)
  {
    id: 'demo-contai-town-terracotta',
    name: 'Contai Town Grand Terracotta Circuit',
    bengaliName: 'কাঁথি শহর গ্র্যান্ড টেরাকোটা ও আলোক পরিক্রমা',
    city: 'contai',
    date: '2026-10-18', // Maha Saptami
    startTime: '17:30',
    endTime: '22:00', // 4.5 hours
    startLocation: {
      id: 'contai-central-bus-terminus',
      name: 'Contai Central Bus Stand (Kanthi)',
      bengaliName: 'কাঁথি সেন্ট্রাল বাস স্ট্যান্ড',
      city: 'contai',
      latitude: 21.7820,
      longitude: 87.7460,
      description: 'Central gateway of Kanthi town',
    },
    endLocation: {
      id: 'contai-sabuj-sangha-ground',
      name: 'Sabuj Sangha Ground (Contai)',
      bengaliName: 'সবুজ সংঘ ময়দান (কাঁথি)',
      city: 'contai',
      latitude: 21.7782,
      longitude: 87.7517,
      description: 'Focal cultural arena of Contai town',
    },
    walkingPreference: 'normal',
    preferredTransport: 'mixed',
    maxWalkingDistanceMeters: 4000,
    selectedPandalIds: [
      'contai-central-bus-stand',
      'contai-sabuj-sangha',
      'contai-highschool-math',
      'contai-belda-road-nabamilan',
    ],
    isCustomTrip: false,
    createdAt: '2026-10-04T16:00:00Z',
    updatedAt: '2026-10-04T16:00:00Z',
    notes: 'Full exploration of Kanthi town center featuring 108 golden lotus petals, Bishnupur terracotta idol, and historic high school fair.',
  },

  // 5. Contai - Coastal & Junput Evening Route (3 stops)
  {
    id: 'demo-contai-coastal-junput',
    name: 'Kanthi Coastal & Junput Evening Route',
    bengaliName: 'কাঁথি কোস্টাল ও জুনপুট সান্ধ্য রুট',
    city: 'contai',
    date: '2026-10-19', // Maha Ashtami
    startTime: '16:00',
    endTime: '20:30', // 4.5 hours
    startLocation: {
      id: 'contai-junput-junction',
      name: 'Junput Coastal Highway Junction',
      bengaliName: 'জুনপুট কোস্টাল হাইওয়ে জংশন',
      city: 'contai',
      latitude: 21.7510,
      longitude: 87.7720,
      description: 'Southern coastal gateway',
    },
    endLocation: {
      id: 'contai-central-bus-terminus',
      name: 'Contai Central Bus Stand (Kanthi)',
      bengaliName: 'কাঁথি সেন্ট্রাল বাস স্ট্যান্ড',
      city: 'contai',
      latitude: 21.7820,
      longitude: 87.7460,
      description: 'Central gateway of Kanthi town',
    },
    walkingPreference: 'low',
    preferredTransport: 'mixed',
    maxWalkingDistanceMeters: 2500,
    selectedPandalIds: [
      'contai-junput-jubak',
      'contai-sabuj-sangha',
      'contai-central-bus-stand',
    ],
    isCustomTrip: false,
    createdAt: '2026-10-05T18:00:00Z',
    updatedAt: '2026-10-05T18:00:00Z',
    notes: 'Coastal maritime celebration along Junput highway with conch-shell craft and seaside sunset ambience.',
  },
];

/**
 * Loads all saved trips from local storage or returns pre-seeded demo trips.
 */
export function getSavedTrips(city?: CityId): TripPlan[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TRIPS_KEY);
    if (!raw) {
      // Seed default demo trips
      localStorage.setItem(LOCAL_STORAGE_TRIPS_KEY, JSON.stringify(INITIAL_DEMO_TRIPS));
      return city ? INITIAL_DEMO_TRIPS.filter((t) => t.city === city) : INITIAL_DEMO_TRIPS;
    }
    const parsed: TripPlan[] = JSON.parse(raw);
    return city ? parsed.filter((t) => t.city === city) : parsed;
  } catch (err) {
    console.error('Error reading saved trips:', err);
    return city ? INITIAL_DEMO_TRIPS.filter((t) => t.city === city) : INITIAL_DEMO_TRIPS;
  }
}

/**
 * Saves all trips to local storage.
 */
export function saveAllTrips(trips: TripPlan[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TRIPS_KEY, JSON.stringify(trips));
  } catch (err) {
    console.error('Error saving trips to local storage:', err);
  }
}

/**
 * Retrieves a single trip by ID.
 */
export function getTripById(tripId: string): TripPlan | undefined {
  const all = getSavedTrips();
  return all.find((t) => t.id === tripId);
}

/**
 * Creates a new trip plan.
 */
export function createTrip(tripData: Omit<TripPlan, 'id' | 'createdAt' | 'updatedAt'>): TripPlan {
  const now = new Date().toISOString();
  const newTrip: TripPlan = {
    ...tripData,
    id: `trip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    isCustomTrip: true,
    createdAt: now,
    updatedAt: now,
  };

  const all = getSavedTrips();
  const updated = [newTrip, ...all];
  saveAllTrips(updated);
  return newTrip;
}

/**
 * Updates an existing trip plan.
 */
export function updateTrip(tripId: string, partial: Partial<TripPlan>): TripPlan | undefined {
  const all = getSavedTrips();
  const index = all.findIndex((t) => t.id === tripId);
  if (index === -1) return undefined;

  const updatedTrip: TripPlan = {
    ...all[index],
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  all[index] = updatedTrip;
  saveAllTrips(all);
  return updatedTrip;
}

/**
 * Saves or updates a trip plan.
 */
export function saveTrip(trip: TripPlan): TripPlan {
  const all = getSavedTrips();
  const index = all.findIndex((t) => t.id === trip.id);
  const now = new Date().toISOString();
  const updatedTrip: TripPlan = {
    ...trip,
    updatedAt: now,
  };

  if (index === -1) {
    saveAllTrips([updatedTrip, ...all]);
  } else {
    all[index] = updatedTrip;
    saveAllTrips(all);
  }
  return updatedTrip;
}

/**
 * Deletes a trip plan by ID.
 */
export function deleteTrip(tripId: string): boolean {
  const all = getSavedTrips();
  const filtered = all.filter((t) => t.id !== tripId);
  if (filtered.length === all.length) return false;
  saveAllTrips(filtered);
  return true;
}

/**
 * Duplicates a trip plan by ID with a new name and ID.
 */
export function duplicateTrip(tripId: string): TripPlan | undefined {
  const trip = getTripById(tripId);
  if (!trip) return undefined;

  const now = new Date().toISOString();
  const duplicated: TripPlan = {
    ...trip,
    id: `trip-copy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: `${trip.name} (Copy)`,
    bengaliName: trip.bengaliName ? `${trip.bengaliName} (অনুলিপি)` : undefined,
    isCustomTrip: true,
    createdAt: now,
    updatedAt: now,
  };

  const all = getSavedTrips();
  saveAllTrips([duplicated, ...all]);
  return duplicated;
}

/**
 * Helper to get default start & end locations for a city.
 */
export function getDefaultLocationsForCity(city: CityId): { start: TripLocation; end: TripLocation } {
  if (city === 'contai') {
    const startAnchor = DEFAULT_ANCHORS.find((a) => a.id === 'contai-central-bus-terminus') || DEFAULT_ANCHORS[6];
    const endAnchor = DEFAULT_ANCHORS.find((a) => a.id === 'contai-sabuj-sangha-ground') || DEFAULT_ANCHORS[7];
    return {
      start: {
        id: startAnchor.id,
        name: startAnchor.name,
        bengaliName: startAnchor.bengaliName,
        city: 'contai',
        latitude: startAnchor.latitude,
        longitude: startAnchor.longitude,
        description: startAnchor.description,
      },
      end: {
        id: endAnchor.id,
        name: endAnchor.name,
        bengaliName: endAnchor.bengaliName,
        city: 'contai',
        latitude: endAnchor.latitude,
        longitude: endAnchor.longitude,
        description: endAnchor.description,
      },
    };
  }

  const startAnchor = DEFAULT_ANCHORS.find((a) => a.id === 'shyambazar-crossing') || DEFAULT_ANCHORS[1];
  const endAnchor = DEFAULT_ANCHORS.find((a) => a.id === 'college-square-boipara') || DEFAULT_ANCHORS[2];
  return {
    start: {
      id: startAnchor.id,
      name: startAnchor.name,
      bengaliName: startAnchor.bengaliName,
      city: 'kolkata',
      latitude: startAnchor.latitude,
      longitude: startAnchor.longitude,
      description: startAnchor.description,
    },
    end: {
      id: endAnchor.id,
      name: endAnchor.name,
      bengaliName: endAnchor.bengaliName,
      city: 'kolkata',
      latitude: endAnchor.latitude,
      longitude: endAnchor.longitude,
      description: endAnchor.description,
    },
  };
}
