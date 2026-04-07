# FoodForFit Ordering System

React + Vite + TypeScript + Tailwind CSS ordering platform for FoodForFit.

## Stack
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS v4
- **State**: React Context + useReducer
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Hosting**: Vercel
- **Fonts**: Playfair Display + DM Sans (Google Fonts)

## Features
- 🌍 3 languages: Turkish, English, Russian
- 📦 Packages page (weekly meal subscriptions)
- 🍽️ Menu page with filtering, search, cart
- 🛒 Cart drawer + 2-step checkout
- 🤖 AI assistant (FIT Asistan) powered by Claude
- ⚙️ Admin dashboard — orders, menu editor, packages editor
- ✅ Order success page

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in your API keys in .env.local
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_ANTHROPIC_API_KEY` | Yes | Claude API key for AI assistant |
| `VITE_IYZICO_API_KEY` | Optional | iyzico payment key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional | Stripe publishable key |

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Add env vars in Vercel dashboard
4. Deploy — `vercel.json` handles SPA routing

## Admin Dashboard

- Access via ⚙️ icon in header
- Demo password: `admin123`
- Change password in `src/components/AdminDashboard.tsx` → `ADMIN_PASSWORD` constant

## Payment Integration (TODO)

Payment is currently in checkout UI only (no real processing).
The owner needs to choose:
- **iyzico** — Turkish payment provider, supports local cards, BKMEXPRESS, installments
- **Stripe** — International, simpler integration

Once decided, implement in `src/components/CheckoutModal.tsx`:
- iyzico: use `iyzipay` npm package, call backend `/api/payment/init`
- Stripe: use `@stripe/stripe-js`, wrap checkout in `<Elements>`

⚠️ Payment must go through a **backend** (Next.js API routes or separate Node server) — never expose secret keys in frontend.

## Colors
```
Background:  #FAF7F2  (warm cream)
Primary:     #2C5F2E  (forest green)
Accent:      #C8A97A  (gold)
Text:        #1A1A1A
Muted:       #8A8A8A
Border:      #E5DDD0
Card:        #FFFDF9
```

## File Structure
```
src/
  components/
    Header.tsx          — Nav + language switcher + cart button
    PackagesSection.tsx — Weekly packages landing page
    MenuPage.tsx        — Menu with filter/search
    MealCard.tsx        — Individual meal card
    CartDrawer.tsx      — Right-side cart panel
    CheckoutModal.tsx   — 2-step checkout (delivery + payment)
    FitAssistant.tsx    — AI chat widget (Claude API)
    AdminDashboard.tsx  — Admin login + orders/menu/packages tabs
    Footer.tsx
    SuccessPage.tsx
  store.tsx             — Global state (Context + useReducer)
  types.ts              — TypeScript interfaces
  data.ts               — Meals + plans seed data
  i18n.ts               — All translations (TR/EN/RU)
  App.tsx               — Route renderer
  main.tsx              — Entry point
```
