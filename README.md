# Shadow Tournament Arena

A responsive booking platform for reserving PS5 gaming sessions at Shadow Tournament Arena. Customers can check availability, submit payment details for manual verification, and track their booking. Arena staff manage bookings in a password-protected dashboard.

## Features

- Book PS5 One, PS5 Two, or both consoles, up to 90 days ahead.
- Select a session duration and choose from start times that fit arena hours and availability.
- Refresh availability every 20 seconds.
- Prevent overlapping reservations with database-backed console-hour locks.
- Submit a 50% deposit or full payment with a JPG, PNG, or WebP payment screenshot (up to 4 MB).
- Review, approve, or reject bookings in the owner dashboard. Rejection releases the reserved slots.
- Track a booking at `/track` using its reference and the phone number used to book.
- Run the booking and pricing tests with `npm test`.

## Technology

- Next.js 15 and React 19
- Supabase Storage and PostgreSQL
- JavaScript and CSS
- Vercel deployment

## Pricing

| Session duration | Price per console-hour |
|---|---:|
| 1–2 hours | PKR 700 |
| 3 or more hours | PKR 600 |

Rates and arena settings are defined in `sta-gta6/lib/config.js`.

## Repository layout

The application is inside `sta-gta6/`. Run npm commands from that directory.

```text
.
├── README.md
└── sta-gta6/
    ├── app/                 # Pages and API routes
    ├── lib/                 # Booking logic, configuration, and database client
    ├── public/images/       # Optional arena and game artwork
    ├── supabase/schema.sql  # Database and private storage-bucket setup
    ├── tests/               # Booking tests
    ├── .env.example
    └── package.json
```

## Requirements

- Node.js and npm
- A Supabase project

## Local setup

From the repository root:

1. Install dependencies:

   ```bash
   cd sta-gta6
   npm install
   ```

2. Create the Supabase tables and private `payments` storage bucket by running `supabase/schema.sql` in the Supabase SQL Editor.

   **Warning:** The SQL script drops and recreates the `bookings` and `slot_locks` tables. Use it only for a new/test project or after deliberately backing up any data that must be kept.

3. Create the local environment file:

   ```bash
   cp .env.example .env.local
   ```

   Set each value in `.env.local`:

   | Variable | Purpose |
   |---|---|
   | `SUPABASE_URL` | Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase service-role key |
   | `ADMIN_PASSWORD` | Password for the owner dashboard |
   | `NEXT_PUBLIC_PAY_NUMBER` | Payment account number shown to customers |
   | `NEXT_PUBLIC_PAY_TITLE` | Payment account title shown to customers |
   | `NEXT_PUBLIC_WHATSAPP` | Arena WhatsApp number, including country code |

   Keep `.env.local` private. Never expose or commit `SUPABASE_SERVICE_ROLE_KEY`; it must only be used by server-side code. Use a strong, unique `ADMIN_PASSWORD`.

4. Run the tests and start the development server:

   ```bash
   npm test
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000). The customer booking page is `/`, the owner dashboard is `/admin`, and booking lookup is `/track`.

## Artwork

Optional artwork can be added under `sta-gta6/public/images/`:

```text
bg.jpeg
```

`bg.jpeg` is the only requested artwork and is displayed as the hero image without cropping. If it is unavailable, the hero shows a CSS gradient instead of requesting additional missing image files. Only use artwork you have permission to publish.

## Deployment on Vercel

1. Import the repository into Vercel.
2. Set the project **Root Directory** to `sta-gta6`.
3. Add all variables listed above in the Vercel project settings for the appropriate deployment environments.
4. Deploy. Vercel serves the production build over HTTPS.

Run a local production build from `sta-gta6/` before deployment with:

```bash
npm run build
```

Development and production builds use separate output directories (`.next-dev` and `.next`), so the dev server can remain open while building production.

## Booking integrity and operational notes

Each reserved console-hour is stored as a row in `slot_locks`. The database primary key `(date, hour, console)` prevents two bookings from locking the same console-hour, including concurrent booking attempts.

Payment verification is manual: a booking remains pending until staff review it in `/admin`. The dashboard uses a single shared `ADMIN_PASSWORD`; the API compares the password using Node.js `timingSafeEqual`. Use HTTPS in production, keep the password private, and consider Supabase Auth before giving dashboard access to multiple staff members.

Application-level rate limiting is not configured. Consider adding platform-level protections if the public booking endpoint receives abusive traffic.
