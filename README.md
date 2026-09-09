# PujaTrip 🪔

### Your Complete Durga Puja Trip Companion

PujaTrip is a mobile-first Progressive Web App designed to make Durga Puja pandal hopping across **Kolkata and Contai** easier, smarter, and more organized.

Instead of switching between multiple applications for routes, maps, group coordination, expenses, weather, transport, safety, and trip planning, PujaTrip brings the complete experience into one place.

> **Plan → Travel → Find Friends → Visit → Spend → Split → Finish**

---

## 🌐 Live Demo

**Vercel:**
https://YOUR-VERCEL-URL.vercel.app

> Replace the URL above with the actual Vercel deployment URL after deployment.

---

## ✨ Features

### 🗺️ Smart Pandal Discovery

* Explore Durga Puja pandals across Kolkata and Contai
* Search and filter pandals
* Nearby pandal discovery
* Distance and direction information
* Pandal quality and recommendation ratings
* Theme, idol, popularity, and uniqueness information
* "Worth Visiting" recommendations
* Must Visit / Highly Recommended / Good / Optional classification
* Crowd and queue information

---

### 🧭 Intelligent Trip Planning

Create complete pandal-hopping itineraries with:

* Trip name and date
* Start and end locations
* Custom anchors
* Walking preferences
* Transport preferences
* Maximum walking distance
* Multiple pandal stops
* Estimated travel time
* Estimated visit duration
* Visit tracking
* Reordering and removing stops
* Trip feasibility checks

The route planning system considers more than just geographical distance and can take factors such as:

* Travel time
* Walking distance
* Transfers
* Waiting time
* Crowd conditions
* Weather
* Pandal quality
* Backtracking

into account when recommending the next stop.

---

### 🚇 Multi-Modal Transport

Compare different ways of travelling between locations:

* Walking
* Metro
* Bus
* Auto
* E-rickshaw / Toto
* Mixed-mode journeys

The application compares:

* Estimated journey time
* Walking distance
* Transfers
* Waiting
* Comfort
* Time saved

and recommends a suitable travel mode.

---

### 👥 Squad & Live Location

Coordinate your Puja group in real time.

Features include:

* Create and join groups
* Invite members
* Live location sharing
* Location sharing controls
* Temporary location sharing
* Friend markers
* Friend distance and direction
* Find a friend
* Meeting point suggestions
* Group visit tracking
* Individual trip progress
* Group trip progress
* Last-seen / stale location indicators

Location sharing is designed with privacy and battery usage in mind.

---

### 🔋 Battery-Aware Location Tracking

PujaTrip includes battery-conscious location behaviour:

* Stationary detection
* Reduced GPS activity while stationary
* Low-power movement polling
* Eco Mode
* Adjustable location update frequency
* Manual GPS wake-up
* Temporary location sharing

This helps reduce unnecessary GPS usage during long pandal-hopping sessions.

---

### 🌦️ Weather & Crowd Intelligence

Trip decisions can adapt to current conditions.

Weather information includes:

* Current temperature
* Feels-like temperature
* Wind
* Rain probability
* Short-term forecast
* Weather advisories

Crowd intelligence includes:

* Crowd density
* Queue estimates
* Recency-weighted reports
* Dynamic visit recommendations

Recent crowd reports have higher influence than older reports.

---

### 🔄 Dynamic Route Replanning

PujaTrip can reconsider the itinerary when conditions change.

Examples:

* Queue suddenly increases
* Rain becomes likely
* A better nearby pandal becomes available
* Excessive backtracking is detected
* Trip-end timing becomes difficult

The application explains **why** a route recommendation changed instead of silently changing the user's plan.

---

### 💰 Group Expense Splitting

Track all trip expenses in one place.

Supported categories include:

* Food & Bhog
* Cab / Auto
* Metro / Bus
* VIP Passes / Tickets
* Shopping & Souvenirs
* Stay & Adda
* Tea & Snacks
* Other

Supports:

* Equal split
* Custom split
* Percentage split
* Multiple participants
* Payer tracking
* Expense notes
* Pandal association
* Expense editing and deletion
* Live balances
* Smart settlement calculation
* Settlement minimization
* Final settlement summary
* WhatsApp / clipboard sharing

---

### 🎟️ Booking Vault

Keep trip-related bookings together.

Supported booking types include:

* Train
* Bus
* Hotel
* Restaurant
* Event / Puja Pass
* Cab
* Other

Each booking can contain:

* Title
* Date and time
* Reference number
* Provider
* Pickup
* Destination
* People
* Amount
* Notes
* Attachment

---

### 🚨 Safety & Emergency Utilities

Safety features include:

* Group SOS
* Emergency status
* Emergency location information
* "I'm Lost" assistance
* Group meeting point
* Navigation to group members
* Nearby medical assistance
* Public toilets
* Police assistance points
* Metro information
* Drinking water
* Rest areas

Emergency information is designed to remain quickly accessible during a trip.

---

### 🚶 Walking & Energy Intelligence

Puja hopping often involves significant walking.

PujaTrip tracks:

* Walking distance
* Estimated steps
* Walking duration
* Daily walking targets
* Comfortable walking limits
* Continuous walking duration
* Rest recommendations
* Rest breaks
* Group walking activity

The application can recommend switching to public transport when walking becomes excessive.

---

### 📅 Durga Puja Calendar

A dedicated Durga Puja calendar provides important festival dates and daily Bengali greetings.

The calendar includes:

* Mahalaya
* Pratipada
* Dwitiya
* Tritiya
* Chaturthi
* Panchami
* Maha Shashthi
* Maha Saptami
* Maha Ashtami
* Maha Navami
* Vijayadashami

Date-dependent information is maintained through centralized festival data and Kolkata timezone-aware logic.

---

## 🏗️ Architecture

PujaTrip follows a modular frontend architecture designed for maintainability and future expansion.

```text
                    ┌─────────────────────┐
                    │      PujaTrip       │
                    │      PWA Client     │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
        Trip Engine       Location Engine    UI / PWA
             │                 │
             ▼                 ▼
       Route Engine        Realtime Sync
             │                 │
             └────────┬────────┘
                      ▼
                 Supabase
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       Database    Realtime     Storage
```

---

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Progressive Web App architecture

### Backend / Cloud

* Supabase
* PostgreSQL
* Supabase Realtime
* Supabase Storage
* Supabase Authentication

### Deployment

* Vercel

### External Services

The application is structured around provider-independent service layers so external providers can be changed without rewriting the application's core business logic.

---

## 📱 Main Application Sections

The application is organized around the core activities of a Puja trip:

```text
Home
Explore
Routes
Squad
Map
Saved
Settings
```

The primary trip workflow is:

```text
Plan
  ↓
Discover
  ↓
Route
  ↓
Travel
  ↓
Meet
  ↓
Visit
  ↓
Track
  ↓
Spend
  ↓
Split
  ↓
Finish
```

---

## 🔐 Security

PujaTrip uses Supabase Row Level Security for protected application data.

Security considerations include:

* Authenticated access
* Group-based data access
* Row Level Security
* Protected trip information
* Private group locations
* Controlled location sharing
* Temporary location visibility
* Private booking attachments

Frontend applications should only use the Supabase publishable client key.

Sensitive server-side keys must never be exposed in frontend code.

Environment variables are kept outside the source repository.

---

## ⚙️ Environment Variables

Create a local environment file for development.

Example:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

Do not commit `.env`, `.env.local`, or other files containing secrets.

For production, configure environment variables through the deployment platform.

---

## 🚀 Running Locally

### Prerequisites

* Node.js
* npm
* Git

### 1. Clone the repository

```bash
git clone https://github.com/AmitKK10/Puja-Trip.git
cd Puja-Trip
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create:

```text
.env.local
```

and add the required Supabase configuration.

### 4. Start the development server

```bash
npm run dev
```

The application will be available through the local development URL shown by Vite.

---

## 🏭 Production Build

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## ☁️ Deployment

The project is designed for deployment through Vercel.

Typical deployment workflow:

```text
Local Development
       ↓
      Git
       ↓
    GitHub
       ↓
    Vercel
       ↓
 Production PWA
       ↓
   Supabase
```

Configure the required environment variables in the Vercel project before deployment.

---

## 📂 Project Structure

A simplified structure:

```text
Puja-Trip/
│
├── public/
│
├── src/
│   ├── components/
│   ├── screens/
│   ├── services/
│   ├── utils/
│   ├── constants/
│   ├── types/
│   └── ...
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

The application separates UI components, domain logic, services, utilities, and data models to keep the codebase maintainable.

---

## 🎨 Design Philosophy

PujaTrip combines modern mobile application patterns with Bengali festive visual identity.

The design emphasizes:

* Mobile-first interaction
* Clear information hierarchy
* Fast access to important trip actions
* Bengali cultural elements
* White and Puja-red visual identity
* Warm festive accents
* Accessible typography
* Clear status indicators
* Minimal interaction friction

The goal is to make the application feel like a **practical trip companion**, not simply a pandal directory.

---

## 🧠 Core Product Philosophy

PujaTrip is built around one simple principle:

> **Don't just tell users what's nearby. Help them decide what to do next.**

For example, instead of simply showing nearby pandals, the application can combine:

```text
Pandal Quality
      +
Current Crowd
      +
Queue Time
      +
Weather
      +
Travel Time
      +
Walking Fatigue
      +
Trip Schedule
      ↓
"What should we do now?"
```

This turns the application from a static map into a **trip decision system**.

---

## 📍 Supported Locations

Currently focused on:

### Kolkata

Including major Puja zones such as:

* North Kolkata
* Central Kolkata
* South Kolkata
* Salt Lake

### Contai / Kanthi

Including:

* Contai Town
* Kanthi
* Junput
* Coastal areas

The architecture is designed so additional locations can be added later.

---

## 🗺️ Future Improvements

Potential future improvements include:

* More detailed public transport integration
* Advanced route optimization
* Better crowd prediction
* More comprehensive pandal datasets
* Enhanced offline capabilities
* Push notifications
* More detailed trip analytics
* Photo and memory timeline
* Improved booking integrations
* Additional cities and Puja regions

---

## 🤝 Contributing

This project is currently maintained as a personal project.

Suggestions, improvements, and issue reports are welcome.

If you find a bug or have an idea for improving the Puja trip experience, feel free to open an issue.

---

## 📄 License

This project is currently intended for personal use.

Add an appropriate open-source license here if the project is later released under one.

---

## 👨‍💻 Project

**PujaTrip**

A smarter way to plan, navigate, coordinate, and enjoy Durga Puja pandal hopping.

**Kolkata • Contai • Durga Puja**

---

### 🔗 Links

* **GitHub:** https://github.com/AmitKK10/Puja-Trip
* **Live Demo:** https://YOUR-VERCEL-URL.vercel.app
