
# 🎮 Shadow Tournament Arena

### Real-Time Gaming Arena Reservation & Management Platform

A full-stack gaming arena booking platform designed for seamless PC and console gaming reservations, real-time slot availability, conflict-free booking, payment verification, and centralized arena management.

Built for **Shadow Tournament Arena** using Next.js, React, Supabase, PostgreSQL, and Vercel.

---

## 🚀 Features

### 🎮 Gaming Session Reservations
- Book gaming sessions up to 90 days in advance.
- Reserve PS5 One, PS5 Two, or both consoles.
- Select flexible session start times and durations.
- Automatically display only available time slots where the entire session fits.
- Refresh live availability every 20 seconds.

### ⚡ Real-Time Availability & Booking Integrity
- Console-specific availability tracking.
- PostgreSQL-backed reservation management.
- Database-level double-booking prevention.
- Composite primary key `(date, hour, console)` ensures unique console-hour reservations.
- Protects against conflicting concurrent reservations.

### 💳 Payment Verification
- 50% advance or full-payment options.
- Payment screenshot uploads (JPG, PNG, WebP).
- Maximum upload size of 4 MB.
- Sender name collection for payment verification.
- Manual payment approval workflow.

### 🛠️ Admin Dashboard
- Centralized booking management.
- Approve or reject reservation requests.
- Automatically release slots when bookings are rejected.
- Filter reservations by date.
- Access payment screenshots through signed URLs.

### 📱 Booking Status Tracking
- Dedicated customer booking-status page (`/track`).
- Track reservations using booking reference and phone number.
- Check reservation verification status.

### 🧪 Testing & Validation
- Pricing calculation tests.
- Arena clock and after-midnight session tests.
- Availability validation tests.
- Booking input validation tests.
- Automated test suite using `npm test`.

---

## 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 15 | Full-stack React framework |
| React 19 | User interface |
| Supabase | Backend services |
| PostgreSQL | Database and booking integrity |
| Supabase Storage | Private payment screenshot storage |
| Vercel | Deployment and hosting |
| JavaScript | Application logic |
| CSS | Styling and responsive design |

---

## 💰 Pricing System

| Session Type | Price per Console / Hour |
|---|---:|
| Standard booking | 700 PKR |
| Sessions of 3+ hours | 600 PKR |

- Flexible 50% advance or full payment.
- Pricing configuration managed centrally in `lib/config.js`.

---

## 🏗️ Booking Architecture

The platform uses database-level constraints to prevent double bookings.

Each reserved console-hour is uniquely identified by:

```text
(date, hour, console)
```

A PostgreSQL composite primary key ensures that the same console-hour cannot be reserved twice.

This provides database-level protection against conflicting reservations, even when multiple booking requests arrive concurrently.

---

## 📂 Project Structure

```
shadow-arena-booking-system/
│
├── .gitignore
├── README.md
│
└── sta-gta6/                        # GTA VI booking application (Next.js)
    │
    ├── app/                         # Next.js App Router
    │   ├── api/                     # Server-side API routes
    │   │   ├── admin/route.js       # Admin: list bookings, approve/reject
    │   │   ├── book/route.js        # Create booking, upload screenshot, lock slots
    │   │   ├── slots/route.js       # Live availability per date
    │   │   └── track/route.js       # Customer booking-status lookup
    │   ├── admin/page.jsx           # Owner dashboard
    │   ├── track/page.jsx           # Customer booking-status page
    │   ├── globals.css              # Global styles
    │   ├── layout.jsx               # Root layout and fonts
    │   └── page.jsx                 # Public booking page
    │
    ├── lib/                         # Business logic and configuration
    │   ├── booking.js               # Pricing, availability, validation, arena clock
    │   ├── config.js                # Hours, rates, consoles, launch date
    │   └── db.js                    # Supabase server client
    │
    ├── public/
    │   └── images/                  # Hero and gallery artwork
    │
    ├── supabase/
    │   └── schema.sql               # Database schema (tables, constraints, storage bucket)
    │
    ├── tests/
    │   └── booking.test.mjs         # Unit and property-based tests (npm test)
    │
    ├── .env.example                 # Environment variable template
    └── package.json
```

## ⚙️ Getting Started

### Prerequisites

- Node.js
- npm
- Supabase account
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/shadow-arena-booking-system.git

cd shadow-arena-booking-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Supabase

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Execute the SQL script from `supabase/schema.sql`.

**Important:** The schema script resets booking tables. Run it only on a fresh or test project unless existing data has been backed up.

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local`.

```bash
cp .env.example .env.local
```

Add all required Supabase and application environment variables.

Never commit `.env.local` or expose private service-role credentials in client-side code.

### 5. Run Tests

```bash
npm test
```

### 6. Start Development Server

```bash
npm run dev
```

Open your browser:

```text
http://localhost:3000
```

---

## 🖼️ Project Assets

Place the required gaming images inside:

```text
public/
└── images/
    ├── bg.jpeg
```

Use artwork and screenshots you have permission to use. The hero scales `bg.jpeg` to fit without cropping and falls back to a CSS gradient if it is unavailable.

---

## 🌐 Deployment

The application is configured for deployment on Vercel.

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables.
4. Deploy the application.
5. Set the Vercel project name to `shadow-tournament-arena`.

---

## ⚠️ Current Limitations

- Admin authentication currently uses a single shared password with constant-time comparison and HTTPS.
- Supabase Auth is recommended when adding multiple staff members.
- Application-level rate limiting is not currently implemented.
- Vercel Firewall rules can help mitigate booking spam.
- Payment verification is currently handled manually through the admin dashboard.

---

## 🔮 Future Enhancements

- Multiple gaming platforms and console types.
- PC gaming station reservations.
- Automated payment gateway integration.
- Advanced revenue analytics and reporting.
- Multiple staff accounts with role-based access.
- Automated booking confirmations and notifications.
- Tournament registration and management.
- Enhanced reservation management.

---

## 👨‍💻 About the Project

**Shadow Tournament Arena** is a gaming arena reservation and management platform designed to simplify gaming session bookings, prevent scheduling conflicts, streamline payment verification, and improve daily arena operations.

**Project:** Shadow Tournament Arena  
**Repository:** `shadow-arena-booking-system`  
**Architecture:** Full-Stack Web Application  
**Stack:** Next.js · React · Supabase · PostgreSQL · Vercel

---

⭐ If you find this project interesting, consider giving the repository a star!

*Built for modern gaming arena operations.*
