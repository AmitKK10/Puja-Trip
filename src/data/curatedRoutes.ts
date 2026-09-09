import { CuratedRoute } from '../types';

export const CURATED_ROUTES: CuratedRoute[] = [
  {
    id: 'north-kolkata-heritage-walk',
    title: 'North Kolkata Heritage & Bonedi Trail',
    bengaliTitle: 'উত্তর কলকাতা সাবেকি ও বনেদি ট্রেইল',
    city: 'kolkata',
    subtitle: '107+ Years of Sacred Tradition, Natmandir & Ekchala Royalty',
    description: 'Immerse yourself in old Calcutta charm. Starting from the 1757 Sovabazar Rajbari courtyard to Bagbazar Ghat and historic College Square, ending with hot tea at Indian Coffee House.',
    pandalIds: ['shobhabazar-rajbari', 'bagbazar-sarbojanin', 'college-square'],
    totalDistanceKm: 4.8,
    estimatedHours: 3.5,
    bestTime: '08:00 AM - 12:30 PM (Morning Pushpanjali Slot)',
    transportMode: 'metro_walk',
    crowdStrategy: 'Morning slots have 70% lower queue time and allow peaceful photography of the clay protima.',
    coverImage: 'https://images.unsplash.com/photo-1634712282287-14ed57b9cc89?auto=format&fit=crop&w=1000&q=80',
    badge: 'Heritage & Bonedi'
  },
  {
    id: 'south-kolkata-art-light-safari',
    title: 'South Kolkata VIP Art & Light Safari',
    bengaliTitle: 'দক্ষিণ কলকাতা আর্ট ও আলোকের মহা-সফারি',
    city: 'kolkata',
    subtitle: 'Chandannagar Lights, Eco-Art Sanctum & Iconic Maddox Adda',
    description: 'The definitive South Kolkata Pujo circuit. Experience the 1.2km animated lights of Ekdalia, the serene acoustic bells of Chetla Agrani, and relax on the grass lawns of Maddox Square with mutton rolls.',
    pandalIds: ['maddox-square', 'ekdalia-evergreen', 'chetla-agrani'],
    totalDistanceKm: 6.2,
    estimatedHours: 4.5,
    bestTime: '04:30 PM - 10:30 PM (Sunset to Midnight)',
    transportMode: 'metro_walk',
    crowdStrategy: 'Visit Chetla Agrani by 5 PM, catch Ekdalia lights turning on at 6:30 PM, and finish with night adda at Maddox.',
    coverImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1000&q=80',
    badge: 'Popular Choice'
  },
  {
    id: 'contai-coastal-terracotta-circuit',
    title: 'Contai Coastal & Terracotta Heritage Circuit',
    bengaliTitle: 'কাঁথি কোস্টাল ও পোড়ামাটি শিল্প পরিক্রমা',
    city: 'contai',
    subtitle: 'Purba Medinipur Folk Art, Sea-Shell Sanctum & Town Center Spectacle',
    description: 'Explore the distinct coastal Durga Puja spirit of East Midnapore. Marvel at the Bishnupur terracotta marvel at Sabuj Sangha, the marine sea-shell idol at Junput Road, and the golden lotus at Central Bus Stand.',
    pandalIds: ['contai-sabuj-sangha', 'contai-central-bus-stand', 'contai-junput-jubak'],
    totalDistanceKm: 8.5,
    estimatedHours: 3.0,
    bestTime: '03:30 PM - 09:00 PM (Afternoon into Seaside Dusk)',
    transportMode: 'auto_circuit',
    crowdStrategy: 'Start at Sabuj Sangha for daylight terracotta viewing, then cruise along Junput coastal road at sunset.',
    coverImage: 'https://images.unsplash.com/photo-1571597438372-540dd352bf41?auto=format&fit=crop&w=1000&q=80',
    badge: 'Purba Medinipur Special'
  },
  {
    id: 'sree-bhumi-royal-express',
    title: 'VIP Road & Sree Bhumi Royal Express',
    bengaliTitle: 'ভিআইপি রোড ও শ্রীভূমি রাজকীয় এক্সপ্রেস',
    city: 'kolkata',
    subtitle: '24K Pure Gold Idol, 90-ft Global Monument Replica',
    description: 'For those who want to experience the mega grandeur of Sree Bhumi Sporting Club paired with North-East Kolkata mega crowd pullers.',
    pandalIds: ['sree-bhumi-lake-town'],
    totalDistanceKm: 2.1,
    estimatedHours: 2.0,
    bestTime: '05:00 AM - 08:30 AM (Dawn Slot) or VIP Pass',
    transportMode: 'car_hired',
    crowdStrategy: 'Arrive at dawn around 5:30 AM for breathtaking sunrise views with zero waiting line.',
    coverImage: 'https://images.unsplash.com/photo-1602848597941-0501d52d9a9f?auto=format&fit=crop&w=1000&q=80',
    badge: 'Mega Grandeur'
  }
];
