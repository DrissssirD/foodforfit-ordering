# FoodForFit Ordering System — CLAUDE.md

## Stack
- React 19, Vite 7, TypeScript 5, Tailwind CSS v4
- React Context + useReducer (global state)
- Anthropic API direct browser calls (claude-sonnet-4-20250514)
- Deployed on Vercel

## Git rules — NON-NEGOTIABLE
- Always push directly to main — NEVER create a new branch
- Commit after every completed file with a descriptive message
- Run `npm run typecheck` after every single file change
- Fix every TypeScript error before moving to the next file
- Run `npm run build` at the end — zero errors required

## Brand
- Deep forest green: #1E3F30
- Warm cream: #FDF6F2
- Gold accent: #C8A97A
- Font: Montserrat
- Do NOT change any colors or fonts

## Do NOT touch
- src/data.ts
- src/i18n.ts (only ADD new keys, never remove or rename existing ones)
- Any existing color or font variables
- Payment flow (placeholder only, being integrated separately)

## Architecture — what this system does

FoodForFit is an AI-powered weekly meal subscription ordering system for a healthy meal delivery service in Istanbul.

### The AI Agent (FitAssistant) — CORE EXPERIENCE
The FitAssistant is NOT a sidebar chat widget. It is a fullscreen conversational ordering agent that IS the primary ordering flow. It should:
1. Greet the customer, discover their goals through conversation (weight loss, muscle gain, busy schedule, dietary restrictions)
2. Recommend the right subscription package based on the conversation
3. Show meal cards INSIDE the chat (inline meal cards, not links to another page)
4. Let the customer swap meals they don't want
5. Automatically build the cart through the conversation
6. Hand off to the checkout modal when the customer is ready
7. Support all 3 languages (TR/EN/RU) — respond in the user's selected language

The agent has access to: full meal list with macros/calories/price, all subscription plans, current cart state, business hours, delivery areas.

### Checkout — Meal Scheduling
Checkout has these steps for subscription orders:
1. Customer info (name, phone, email, address)
2. MEAL SCHEDULE — a weekly calendar where the customer assigns each meal to a specific day AND time slot (morning 08-10, lunch 12-14, evening 18-20). Each meal in the cart gets assigned individually.
3. Payment (placeholder — CreditWest LocalPay integration pending)

After checkout, customers can request to reschedule individual meals ("I have plans Thursday, move my Thursday meal to Friday evening"). This generates a reschedule request visible in admin.

### Admin Dashboard
6 tabs:
1. Siparişler — orders list with status updates + reschedule requests tab
2. Menü Yönetimi — add/edit/delete meals
3. Paket Yönetimi — add/edit/delete plans
4. Analitik — revenue, top meals, package breakdown
5. AI Asistan — toggle, system prompt, quick buttons, chat history
6. Ayarlar — business settings, delivery config, password

### Delivery Schedule (Admin)
Admin can see a daily delivery board: for each day, which meals go to which customer at what time. This is the kitchen preparation + driver dispatch view.

### Customer Order Management
After placing an order, customers can:
- View their active orders on the tracking page
- Request to reschedule individual meal deliveries
- See delivery status per meal

### State shape additions needed
- rescheduleRequests: RescheduleRequest[] — customer requests to change a delivery slot
- Each Order's deliveries array should include: mealId, customerId, day, timeSlot, status

## i18n rules
- All user-facing strings go through t() — no hardcoded strings in components
- New keys follow existing prefix conventions
- All 3 languages (TR/EN/RU) must be added at the same time

## Environment variables
- VITE_ANTHROPIC_API_KEY — Claude API (already in Vercel)
- VITE_CREDITWEST_KEY — future payment (not yet)
