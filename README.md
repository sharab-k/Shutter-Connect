# Shutter Connect: Frontend (Phase 1)

Responsive web front end for the Shutter Connect marketplace ("Uber for freelance photographers"). Built with React 19, TypeScript, Vite, Tailwind CSS 3 and React Router.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm test         # unit tests for booking, payment, refund and distance logic
```

## Demo accounts
The login page has one-click demo accounts: **Client** (Alex Morgan), **Photographer** (Maya Reyes), **Admin** (Devin Ford). Data is stored in `localStorage` (shared across tabs; the logged-in user is per tab, so open two tabs to act as client and photographer side by side) (Settings > Reset demo data to restore).

## What is implemented
- **Social feed (Instagram-style):** stories with auto-advance viewer, For you / Following feed with infinite scroll, double-tap like, comments, saves, follow, share link, create post (photographers), explore grid with #tags, Instagram-style profiles.
- **Direct messages (Instagram-style):** inbox with unread dots, gradient sent bubbles, photo messages, emoji and quick heart, message reactions (double-click or smiley), Seen receipts, booking context card, new-message search, story replies.
- **Public:** landing page, search with filters (niche, city, date availability, price, rating, vetted), photographer profile (portfolio lightbox, services, reviews, availability), 3-step booking request.
- **Client:** dashboard, bookings, payment (demo Stripe sheet), deposit / pay-after / pay-up-front flows, messaging, file download (unlocked when completed and paid), reviews, dispute reporting, ID verification (Didit-style demo), .ics calendar export.
- **Photographer:** dashboard with onboarding checklist, confirm / decline requests, calendar with weekly hours and blocked dates, services and payment-mode editor, profile and portfolio editor, earnings (2.25% fee), Dropbox delivery, reviews (including reviewing clients), Stripe / Dropbox connect (simulated).
- **Admin:** metrics, application vetting (Stamp of Approval), photographer management, transactions, disputes with refund.

## Backend integration points (next phase)
All state lives in `src/store/AppStore.tsx`; each action maps to an API call: Supabase (auth, Postgres, realtime chat), Stripe Connect and Billing, Dropbox OAuth shared links, Didit hosted verification + webhook, email reminders via a scheduled job.

Brand tokens (blue-to-purple gradient, yellow highlight, teal CTA, Nunito) are in `tailwind.config.js`. Colours were estimated from the pitch deck. Replace with exact hex values if the client supplies them.
