# FoodForFit Ordering System — Claude Code Instructions

## What this project is
A React + Vite + TypeScript food ordering system for FoodForFit (foodforfitofficial.com).
It runs as a standalone SPA hosted on Vercel, embedded via subdomain into the owner's website.

## Tech stack
- React 19, Vite 7, TypeScript 5, Tailwind CSS v4
- State: React Context + useReducer (no Redux, no Zustand)
- AI: Anthropic Claude API (direct browser call, key via env var)
- Fonts: Playfair Display + DM Sans via Google Fonts (loaded in index.css)
- Icons: lucide-react

## Brand colors — never change these
- Background: #FAF7F2
- Primary green: #2C5F2E
- Gold accent: #C8A97A
- Text dark: #1A1A1A
- Muted: #8A8A8A
- Border: #E5DDD0
- Card bg: #FFFDF9

## Key files
- `src/store.tsx` — all global state, actions, reducers
- `src/types.ts` — TypeScript interfaces (Meal, Order, SubscriptionPlan, etc.)
- `src/data.ts` — seed data for meals and plans
- `src/i18n.ts` — ALL translations for TR/EN/RU — add new strings here
- `src/vite-env.d.ts` — env variable types

## Components
- `Header.tsx` — nav + language switcher (TR/EN/RU) + cart icon
- `PackagesSection.tsx` — homepage, weekly subscription plans
- `MenuPage.tsx` — menu with search + category + tag filters
- `MealCard.tsx` — individual meal card with add to cart
- `CartDrawer.tsx` — slide-in cart panel from right
- `CheckoutModal.tsx` — 2-step checkout (delivery info + payment method)
- `FitAssistant.tsx` — floating AI chat widget, calls Anthropic API
- `AdminDashboard.tsx` — password-protected admin panel
- `Footer.tsx` + `SuccessPage.tsx`

## Admin dashboard
- Access: click ⚙️ icon in header
- Password: defined as `ADMIN_PASSWORD` constant in `AdminDashboard.tsx` (currently `admin123`)
- Tabs: Orders (view + update status) | Menu (add/edit/delete meals) | Packages (add/edit/delete plans)

## Environment variables needed
Create `.env.local` in project root:
```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```
This powers the AI assistant (FIT Asistan). Without it, the chat widget will show a connection error.

## How to run locally
```bash
npm install
cp .env.example .env.local
# add your VITE_ANTHROPIC_API_KEY to .env.local
npm run dev
```

## How to deploy to Vercel
1. Push this repo to GitHub (its own separate repo — do NOT mix with other projects)
2. Import into Vercel dashboard
3. Add env var: `VITE_ANTHROPIC_API_KEY` = your key
4. Deploy — vercel.json handles SPA routing automatically
5. Owner adds DNS: CNAME `order` → `your-app.vercel.app`

## Payment integration (TODO — not yet built)
The checkout UI is complete. Real payment processing is NOT implemented yet.
The owner needs to choose:
- **iyzico** — Turkish provider, supports installments, local cards, BKM Express
- **Stripe** — International, cleaner API

Once decided, implement like this:
- Add a Vercel serverless function at `api/payment.ts` (never put secret keys in frontend)
- iyzico: `npm install iyzipay` — call from serverless function
- Stripe: `npm install stripe @stripe/stripe-js` — use Elements on frontend, process on backend
- Wire up in `CheckoutModal.tsx` step 2, replace the current static card form

## What NOT to do
- Do NOT install unnecessary packages — keep bundle small
- Do NOT change brand colors
- Do NOT add new pages beyond: packages, menu, admin, success
- Do NOT commit .env.local
- Do NOT mix this repo with any other project
