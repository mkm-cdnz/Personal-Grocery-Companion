# User Usage Patterns and Friction Points

## Current flow recap
Users typically: open the app at the start of a trip, pick a store, log items as they add them to their cart (scanning when possible), and watch a running total of expected spend.

## Observed behaviors
- **Covers more than groceries:** People also track coffee, ice cream, restaurants, liquor stores, and other non-supermarket purchases.
- **Loose items confusion:** Shoppers are unsure whether to enter per-unit or total price when logging items like produce.
- **Cumbersome data entry:** Users feel the app works but can be tedious, especially when repeating similar orders.

## Opportunity areas
### 1) Streamline non-grocery items (coffee, restaurants, treats)
- Provide **category-aware presets** (e.g., "Coffee" with size + milk modifiers, "Ice cream" with scoops/flavors) instead of freeform text for every order.
- Add **quick combos/favorites**: one-tap recall of past orders ("Large flat white", "Double-scoop chocolate chip").
- Offer **price memory by venue** so returning to the same café pre-fills likely prices.

### 2) Clarify loose items workflow
- Make the price field explicitly labeled as **per-unit** when the loose toggle is on, with a secondary readout of the **computed total** (qty × unit price).
- If entering a total price, provide a **"switch to total" control** that back-calculates unit price to keep consistency.
- Show **inline examples** (e.g., "5 apples at $1.00 each → $5.00 total") and validation that flags mismatches between quantity and price.

### 3) Reduce overall friction and increase confidence
- **Smart defaults:** prioritize nearby stores (already sorted by proximity), common categories, and default quantities to minimize taps.
- **Batch entry modes:** let users capture multiple items quickly (e.g., keyboard-focused form, barcode rapid-scan) before reviewing totals.
- **Feedback and reassurance:** clearer success states after adding items, and lightweight undo for corrections.
- **Tutorials/tooltips:** contextual hints for tricky steps (loose items, first barcode scan) with the option to dismiss forever.

## Research and validation to pursue
- Run self-observation logs during real trips (groceries, cafés, restaurants) to see where friction occurs.
- Document per-unit vs. total-price-first experiences qualitatively instead of A/B testing, so flows stay predictable while prototyping.
- Interview café/restaurant scenarios by journaling the minimal fields needed to trust totals (size, modifiers).
- Collect metrics on edit/undo frequency to identify where confusion is highest.

## Metrics to capture
- **Improve the app:** track error states, retries, save failures, sync latency, and time spent per screen to spot where flows stall.
- **Understand shopping and spending:** log per-visit spend, category totals, price drift by item, and impulse buys vs. planned list items.
- **Track personal usage patterns:** measure session length, cadence of trips, undo/edit rates, and how often presets/favorites are reused.
- **Future shared purchases:** if expanded to flatmates, capture shared-item frequency, split attribution, and conflicts/overrides to guide any future multi-user or login feature.

## Wish-list features (low priority)
- **Shopping list mode:** allow pre-trip planning at home, syncing items to the in-store view so you can check them off while shopping.
- **Multi-stop support:** plan items across several stores (e.g., eggs at the supermarket, specialty bread at a bakery) and keep progress visible per stop.
- **Collaborative list sharing:** optional sharing with trusted flatmates for household items like cleaning supplies or toilet paper, with a clear split from personal groceries.
