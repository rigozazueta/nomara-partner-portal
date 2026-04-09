# Nomara Partner Management SOP

**Internal document — Operations playbook**
**Last updated:** 2026-04-09

This document covers the full partner lifecycle: from initial outreach through ongoing relationship management. Every stage includes the trigger, required actions, email template to use, dashboard actions, and escalation rules.

---

## Table of Contents

1. [Philosophy & Success Metrics](#1-philosophy--success-metrics)
2. [Tools & Access](#2-tools--access)
3. [Stage 1: Partner Discovery & Outreach](#stage-1-partner-discovery--outreach)
4. [Stage 2: Application Review](#stage-2-application-review)
5. [Stage 3: Onboarding & Terms Confirmation](#stage-3-onboarding--terms-confirmation)
6. [Stage 4: Active Referral Routing](#stage-4-active-referral-routing)
7. [Stage 5: Booking Management (Hybrid Flow)](#stage-5-booking-management-hybrid-flow)
8. [Stage 6: Invoicing & Payment](#stage-6-invoicing--payment)
9. [Stage 7: Ongoing Relationship Management](#stage-7-ongoing-relationship-management)
10. [Stage 8: Offboarding](#stage-8-offboarding)
11. [Email Templates Reference](#email-templates-reference)
12. [Edge Cases & Escalation](#edge-cases--escalation)

---

## 1. Philosophy & Success Metrics

### Our approach
Nomara operates on three non-negotiable principles:

1. **Zero friction for operators** — They are busy running retreats. We handle all paperwork, reporting, and admin work. They should only have to click "Confirm."
2. **Quality over quantity** — We only partner with retreats we'd personally recommend. One great partnership beats ten mediocre ones.
3. **Transparency** — Operators see real-time data on clicks, bookings, and commissions. No black-box attribution.

### What we track
- **Clicks per referral link** — Am I sending traffic?
- **Click-to-booking conversion** — Am I sending *the right* traffic?
- **Commission collected vs. owed** — Is money flowing?
- **Time from referral to booking** — How long is the buying cycle?
- **Partner NPS (implicit)** — Are partners responsive? Do they renew?

### Response time standards
| Situation | Target response time |
|-----------|---------------------|
| New partner application | 48 hours |
| Operator question via email | 24 hours (business days) |
| Booking confirmation request | Operator gets email within 24h of booking |
| Commission invoice | Within 48 hours of operator confirmation |
| Payment processing | Within 30 days of invoice |
| Dispute resolution | Initial reply within 24 hours |

---

## 2. Tools & Access

Before starting any work, make sure you have access to:

| Tool | Purpose | URL |
|------|---------|-----|
| Partner Portal Admin | Booking management, referral tracking | https://partners.nomaratravel.com/admin |
| Gmail (rigo@nomaratravel.com) | Operator communication | gmail.com |
| Close CRM | Outbound outreach, lead pipeline | app.close.com |
| Supabase | Database, operator records | supabase.com/dashboard |
| Email templates folder | Branded HTML emails | `email-templates/` in repo |
| Resend | Transactional email delivery | resend.com (monitoring only) |

**Admin login:** Log into the portal with your email and password. Your email must be listed in the `admin_users` table in Supabase for access.

---

## Stage 1: Partner Discovery & Outreach

**Purpose:** Identify and initiate contact with retreat operators who match Nomara's quality standards.

### Trigger
- New operator spotted on BookRetreats, WeTravel, Instagram, or via traveler recommendation
- Traveler requests a retreat in an underserved location/category
- Existing partner refers another operator

### Required info before outreach
1. Operator business name and location
2. Contact name (owner/manager preferred)
3. Email address (not generic info@ if possible)
4. Type of retreats offered
5. Internal quality notes (what makes them a good fit?)
6. Price range
7. Website / booking page link

### Actions
1. **Log in Close CRM** — Create a new Lead with outreach_status `Identified`
2. **Initial research** — Check website, Instagram, reviews. Fill out internal quality notes. Do NOT put any "quality score" in anything the operator can see.
3. **Cold outreach** — Send a personalized first email. Do NOT use a template for this — outreach needs to feel human and specific.
4. **Close CRM status** — Update to `Reached Out` with date

### Key rules
- **Never mass-email.** Every outreach is 1:1 and specific.
- **Lead with the why.** Always reference something specific about their retreat in the first line.
- **Short emails convert better.** Keep it under 150 words.

### Escalation
- If operator asks for details we haven't decided yet (exclusivity, minimum volume, etc.) — pause and ask Rigo before responding.

---

## Stage 2: Application Review

**Purpose:** Evaluate inbound partner applications submitted via the public form at `partners.nomaratravel.com`.

### Trigger
- New application submitted → email alert lands in `rigo@nomaratravel.com` from `notifications@retreats.nomaratravel.com` with subject "New Partner Application: [business]"
- Application appears in admin dashboard → Partner Applications section with "Pending" badge

### Required info to review
The application form captures: Contact Name, Business Name, Email, Location, Message.

Before deciding, look up:
1. Their website (Google their business name)
2. Their social presence (Instagram, Facebook)
3. Reviews on BookRetreats, TripAdvisor, Google
4. Whether they're already in our `retreat_operators` table (might be a warm outbound lead)

### Decision criteria
**Approve if:**
- Legitimate business with online presence
- Real retreats operating in the last 12 months
- Location/category fits our current traveler demand
- No red flags in reviews (safety concerns, refund disputes, communication issues)
- Can realistically charge ≥$1,500 USD per booking (enough room for commission)

**Decline if:**
- No verifiable business
- Negative reputation or unresolved disputes
- Location already oversaturated in our network
- Pricing too low for commission economics
- Vibe mismatch with Nomara brand (party retreats, extreme sports without safety protocols, etc.)

**Request more info if:**
- Business exists but details are thin
- Promising but need to understand pricing/availability

### Actions
1. Open admin dashboard → Partner Applications section
2. Click the application to expand details
3. Research per criteria above
4. Decide: Approve / Decline / Request Info

**If approved:**
1. Click "Approve & Invite" button in the admin dashboard
2. System will automatically:
   - Create a `retreat_operators` record
   - Send Supabase Auth invite to set password
   - Send branded approval email
3. Proceed to Stage 3 (Onboarding)

**If declined:**
1. Change status to "Declined" in admin dashboard
2. Send a courteous decline email via Gmail (no template — write personally). Keep tone respectful; leave door open for the future.

**If more info needed:**
1. Leave status as "Pending"
2. Reply via Gmail asking specific questions (pricing, typical group size, sample itinerary, etc.)

### Escalation
- If unsure about a borderline application → bring to Rigo with your recommendation

---

## Stage 3: Onboarding & Terms Confirmation

**Purpose:** Lock in commission terms and get the operator set up in the portal.

### Trigger
- Approved application (automated flow will have already sent invite + approval email)
- OR: Inbound reply from outreach saying "I'm interested"

### Required before onboarding
1. Commission rate agreed in writing (email reply is fine)
2. Any exclusions (peak season, specific packages, etc.)
3. Payment method preference (bank transfer, Wise, Stripe link, etc.)
4. Primary contact name and best email

### Actions

**Step 1: Confirm terms in writing.**
If terms aren't yet agreed, reply to their email with a simple proposal:

> "Standard Nomara terms: 15% commission on all bookings (rooming, extras, and packages), invoiced within 48 hours of confirmation, paid within 30 days. Any specific exclusions or adjustments you'd like?"

Negotiate if needed. Once they confirm, move to Step 2.

**Step 2: Send welcome email.**
Use **Template `01-operator-welcome.html`**.

Customize:
- `[FIRST NAME]` — operator contact name
- `[OPERATOR NAME]` — business name
- `[COMMISSION RATE]` — agreed %
- If there are exclusions, add them to the "Terms on file" box

Send via Gmail from `rigo@nomaratravel.com`.

**Step 3: Update the database.**
In admin dashboard → Partner Portal Access section:
1. Find the operator in the list
2. Click "Send Invite" (if they weren't approved via the form flow)
3. System sends Supabase Auth invite with set-password link

**Step 4: Update CRM.**
- Close CRM status → `Active Partner`
- Add agreed commission rate to custom field
- Log terms confirmation in Activity notes

### Success check
- Operator receives welcome email ✅
- Operator clicks invite link and sets password ✅
- Operator logs into dashboard at least once ✅

### Escalation
- If operator wants non-standard terms (higher commission, upfront fees, exclusivity) → Rigo only

---

## Stage 4: Active Referral Routing

**Purpose:** Send qualified travelers to partner retreats and track engagement.

### Trigger
- A traveler in our pipeline (concierge lead, quiz result, Meta ad conversion) matches a partner retreat's profile

### Two routing paths — choose one per traveler

#### Path A: Direct Link (low-touch)
**When:** Traveler is high-intent, knows what they want, just needs to book.

**Actions:**
1. Admin dashboard → Referral Links → "+ New Link"
2. Select operator + retreat
3. Enter traveler name and email (so we can track who clicked)
4. System generates a unique link: `partners.nomaratravel.com/go/[slug]`
5. Send the link to the traveler via Gmail using **Template `03-referral-intro-to-traveler.html`**
6. Customize with:
   - `[TRAVELER FIRST NAME]`
   - `[RETREAT NAME]`
   - `[LOCATION]`
   - `[DURATION]`
   - `[REFERRAL LINK]` — the generated URL
   - 2-3 sentence personal explanation of why this retreat fits them (reference their goals/concerns)

**Tracking:** The portal logs every click with IP, user agent, timestamp. Check the Referral Links section to see who's clicked.

#### Path B: WhatsApp Intro (high-touch)
**When:** Traveler is still deciding, has questions, or wants to build trust with the operator first.

**Actions:**
1. Send a heads-up to the operator first via Gmail using **Template `02-referral-intro-to-operator.html`**
2. Customize with traveler name, dates, party size, experience level, context
3. Wait for operator acknowledgment (usually same day)
4. Create a WhatsApp group with: you + operator + traveler
5. Warm introduction: "Hi everyone, meet [traveler]. Meet [operator]. You're both fantastic, I'll let you take it from here — I'll check in if needed."
6. Let the conversation flow. Only step in if there's friction or the operator goes quiet.

**Tracking:** Log the WhatsApp intro as an Activity in Close CRM with the traveler and operator linked.

### Decision rules
- **Default to Path A** unless there's a specific reason for personal touch
- **Use Path B** for travelers with:
  - Complex trip requirements (multi-retreat, extended stay)
  - Budget sensitivity (might need price negotiation)
  - First-time retreat goers (need more hand-holding)
  - Specific health/dietary considerations that need operator confirmation

### Escalation
- If operator becomes unresponsive after Path B intro → Rigo steps in

---

## Stage 5: Booking Management (Hybrid Flow)

**Purpose:** File bookings on behalf of the operator, get their one-click confirmation, trigger invoicing.

### Philosophy
**The operator files NOTHING.** We do all the paperwork. Their only job is to click "Confirm" in an email.

### Trigger
- You find out a Nomara-referred traveler has completed a booking
- Sources of this info:
  1. Operator tells you ("Hey, Sarah just booked for June 12-18")
  2. Traveler tells you ("I booked!")
  3. WhatsApp confirmation in a group chat
  4. Referral link click followed by an email from the operator's booking system
  5. You ask the operator at a scheduled check-in

### Required info to file
1. **Operator** — which partner
2. **Retreat** — which specific retreat (if they have multiple)
3. **Traveler name** — full name
4. **Traveler email** — optional but helpful for attribution
5. **Travel dates** — specific dates or "May 12–18, 2026" format
6. **Duration (days)**
7. **Total booking amount (USD)** — rooming + extras that commission applies to
8. **Commission rate** — auto-filled from operator record but confirm

### Actions

**Step 1: File the booking.**
1. Admin dashboard → scroll to "All Bookings" → click "+ File Booking"
2. Fill out all fields
3. Commission auto-calculates based on operator's rate
4. Click "File Booking" — system inserts with `confirmation_status = 'pending_confirmation'` and `created_by = 'admin'`
5. Automated email fires to operator with one-click Confirm button (template matches `04-booking-confirmation-request.html`)

**Step 2: Wait for confirmation.**
The operator lands on `/operator/confirm/[id]` and clicks Confirm. Status changes to `confirmed`.

**Step 3: If operator doesn't confirm within 48 hours:**
1. Send a personal follow-up via Gmail: "Hi [name], wanted to make sure you saw the booking confirmation email for [traveler]. It's just one click — any issues?"
2. If still no response in 72 hours total, call/WhatsApp them
3. If they're unreachable for 7+ days, escalate to Rigo

**Step 4: If operator disputes the booking:**
1. They click "Flag it here" instead of "Confirm"
2. You'll get a notification email with their dispute reason
3. Reply via Gmail within 24 hours to resolve
4. Once resolved, edit the booking in admin dashboard and re-file if needed

### Edge cases
- **Booking amount uncertain** — Ask operator directly before filing: "What was the final total for Sarah's stay?"
- **Partial refund or cancellation** — Do NOT file. Only file confirmed, completed stays.
- **Traveler extended stay** — File at final total, not original booking
- **Multiple bookings from same traveler** — File each separately

### Escalation
- Disputes over $500 → Rigo
- Any operator refusing to confirm → Rigo

---

## Stage 6: Invoicing & Payment

**Purpose:** Collect commission from the operator within 30 days of booking confirmation.

### Trigger
- Booking status becomes `confirmed` in admin dashboard
- You'll see it in the "Pending Invoices" section

### Actions

**Step 1: Send the invoice.**
1. Admin dashboard → Pending Invoices → find the booking
2. Click "Send Invoice" button
3. System sets `invoice_sent = true` and logs the date

**Step 2: Send the invoice email.**
Use **Template `05-invoice-email.html`** via Gmail.

Customize:
- `[FIRST NAME]` — operator contact
- `[TRAVELER NAME]` — the traveler
- `[RETREAT NAME]`
- `[INVOICE NUMBER]` — use format `NOMARA-YYYY-MM-XXX` (e.g. `NOMARA-2026-04-001`)
- `[INVOICE DATE]` — today
- `[DUE DATE]` — today + 30 days
- `[TRAVEL DATES]`
- `[BOOKING AMOUNT]`
- `[COMMISSION RATE]`
- `[COMMISSION AMOUNT]`
- `[INVOICE LINK]` — Stripe payment link, Wise invoice link, or bank details (copy from ops spreadsheet)

**Step 3: Attach a formal PDF invoice (optional but professional).**
Generate via Xero, Wave, or our invoicing tool. Attach to the email.

**Step 4: Update dashboard.**
No action needed — "Send Invoice" button already marked it sent.

### Payment follow-up schedule

| Days since invoice | Action |
|--------------------|--------|
| Day 0 | Invoice sent |
| Day 14 | Friendly reminder via Gmail: "Hi [name], just a gentle reminder about commission invoice #[num]. Let me know if you need anything to process it." |
| Day 21 | Second reminder, more direct: "Hi [name], our invoice #[num] is due in 9 days. Please confirm you've received it and when we can expect payment." |
| Day 30 | Invoice is due — call/WhatsApp directly |
| Day 35 | Escalate to Rigo |
| Day 45 | Pause all new referrals to this operator until resolved |

### When payment arrives
1. Verify in bank account / Wise / Stripe
2. Admin dashboard → find the booking → click "Mark Paid"
3. System sets `commission_paid = true` and `commission_paid_date = today`
4. Operator sees it reflected in their dashboard automatically

### Escalation
- Any payment dispute → Rigo immediately
- Operator requesting payment plan → Rigo must approve

---

## Stage 7: Ongoing Relationship Management

**Purpose:** Keep partners engaged, gather feedback, and optimize traveler matching.

### Monthly check-ins
For every partner, perform a monthly review:

1. **Pull stats** — admin dashboard → Operator Summary
   - How many bookings this month?
   - How many clicks?
   - What's the click-to-booking conversion?
2. **Compare to previous month**
3. **Identify low performers** — if a partner got 0 bookings and <5 clicks for 2+ months, they need attention

### Re-engagement flow (for quiet partners)
**Trigger:** 30+ days since last booking AND <10 clicks in last 30 days.

**Actions:**
1. Send check-in email using **Template `06-followup-checkin.html`**
2. Customize with `[FIRST NAME]`, `[OPERATOR NAME]`
3. Wait 7 days for reply
4. If no reply: Send a second follow-up via WhatsApp or direct email — more casual
5. If still no reply after 14 days: Mark as "At Risk" in Close CRM and notify Rigo

### What to do with their feedback
- **New dates** → Update their record in admin dashboard, flag for priority matching
- **New traveler type preference** → Adjust matching criteria in internal notes
- **New offerings** → Update their retreat listing (or ask them to log in and update)
- **Concerns about traveler quality** → Feed back into our funnel — if they don't like a type of lead, stop sending them

### Quarterly partner review (Rigo leads, you support)
Every 3 months, review:
- Top 5 performing partners — any issues? What's working?
- Bottom 5 — salvage or offboard?
- New partner pipeline — how full?
- Commission changes or incentive programs?

### Escalation
- Partner asks to change commission rate → Rigo
- Partner wants exclusivity in a region → Rigo

---

## Stage 8: Offboarding

**Purpose:** Cleanly end a partnership when it's not working.

### Triggers to offboard
- 6+ months of zero bookings despite referrals sent
- Repeated payment disputes or non-payment
- Traveler complaints that can't be resolved
- Operator stops responding to communication
- Partner requests to leave
- Red flags in their operation (safety, ethics, quality)

### Actions
1. **Pause referrals immediately** — mark them as `inactive` in admin dashboard. No new links, no new intros.
2. **Collect any outstanding commissions** — do not let balances linger.
3. **Send a professional offboarding email via Gmail** — no template, write personally. Thank them, be respectful, leave door open.
4. **Update records:**
   - Close CRM → Lead status `Offboarded`
   - Admin dashboard → operator marked inactive
   - Retreat listings → unpublish any live public pages
5. **Internal note** — document why in Close CRM activity notes, so we don't accidentally re-engage later.

### Escalation
- Always discuss with Rigo before offboarding a partner who has paid in the past.

---

## Email Templates Reference

All templates live in `email-templates/` folder. To use in Gmail:

1. Open the `.html` file you want
2. Copy the HTML code (everything inside and including `<div>...</div>`)
3. Paste into Gmail compose body
4. Replace all `[PLACEHOLDERS]` with actual content
5. Send

| # | Template | Use when |
|---|----------|----------|
| 01 | `01-operator-welcome.html` | Stage 3 — Welcoming a new partner after terms confirmed |
| 02 | `02-referral-intro-to-operator.html` | Stage 4 — Warm lead heads-up (WhatsApp path) |
| 03 | `03-referral-intro-to-traveler.html` | Stage 4 — Sharing a retreat recommendation with a traveler |
| 04 | `04-booking-confirmation-request.html` | Stage 5 — Manual version (usually auto-sent by system) |
| 05 | `05-invoice-email.html` | Stage 6 — Sending commission invoice |
| 06 | `06-followup-checkin.html` | Stage 7 — Re-engaging quiet partners |

### Placeholder cheat sheet
Replace these in every template:
- `[FIRST NAME]` — operator or traveler first name only
- `[OPERATOR NAME]` — business name
- `[RETREAT NAME]` — specific retreat name
- `[TRAVELER NAME]` — full name
- `[TRAVELER FIRST NAME]` — traveler first name only
- `[TRAVEL DATES]` — e.g. "May 12–18, 2026"
- `[BOOKING AMOUNT]` — e.g. "$2,786"
- `[COMMISSION RATE]` — e.g. "15%"
- `[COMMISSION AMOUNT]` — e.g. "$417.90"
- `[REFERRAL LINK]` — generated in admin dashboard
- `[CONFIRM LINK]` — generated automatically by system
- `[INVOICE LINK]` — Stripe/Wise/bank details
- `[INVOICE NUMBER]` — `NOMARA-YYYY-MM-XXX` format
- `[INVOICE DATE]` / `[DUE DATE]` — ISO format preferred

---

## Edge Cases & Escalation

### When to escalate to Rigo

**Immediate escalation (same day):**
- Any payment dispute over $500
- Legal or contractual concerns
- Safety complaints about an operator
- Operator threatening to leave
- Unauthorized use of the Nomara brand

**Within 48 hours:**
- Commission rate negotiation requests
- Exclusivity requests
- Partnership terms outside standard playbook
- Traveler complaints that can't be resolved with the template flow

**Weekly review:**
- Partners 30+ days without bookings
- Partners with low click-to-booking conversion
- New outreach pipeline health
- Application approval backlog

### Common edge cases

| Situation | Action |
|-----------|--------|
| Operator marks email as spam | Don't resend. Write personally from Gmail, shorter. |
| Traveler requests refund | Not our business — between them and operator. Stay out. |
| Partner uses a different payment currency | Note in their record, adjust invoices accordingly, use xe.com for conversion |
| Multiple operators in same location compete | Fair matching — rotate leads, don't play favorites |
| Partner wants to send their traveler TO us | Outside scope. Politely decline. |
| Partner asks for Nomara marketing assets | Send logo files, brand guide. Never grant login credentials. |
| A traveler books directly without our link | If operator flags it as a Nomara-referred booking, trust them and file it |
| Commission calculation looks wrong | Always double-check the operator's rate in the database before disputing |

### What you should NEVER do
- Never promise a specific number of bookings or leads to a partner
- Never share another partner's commission rate or data
- Never take payment directly from travelers
- Never make changes to the operator's website or booking page
- Never commit to operators over phone without a written follow-up
- Never share our outbound funnel data (traveler sources, quiz results, etc.)
- Never skip the confirmation step — every booking must be operator-confirmed

---

## Quick Daily Routine

**Morning (30 min):**
1. Check Gmail for operator replies
2. Check admin dashboard → Partner Applications for new submissions
3. Check admin dashboard → Pending Invoices (any awaiting send?)
4. Check admin dashboard → Booking Reports (any pending confirmations stale?)

**Midday (60 min):**
1. Process any new partner applications (Stage 2)
2. Reply to operator emails
3. Route new travelers (Stage 4)
4. File confirmed bookings (Stage 5)

**End of day (15 min):**
1. Update Close CRM with the day's activities
2. Flag any escalations for Rigo
3. Check if any invoices are due for reminder (Stage 6 follow-up schedule)

**Weekly:**
- Monday: Review payment status of all outstanding invoices
- Wednesday: Check for quiet partners (Stage 7 re-engagement)
- Friday: Full pipeline review — update Rigo on wins, blockers, escalations

---

## Appendix: Portal Quick Reference

### Admin Dashboard Sections (`/admin`)
- **KPI Cards** — headline metrics across all partners
- **Pending Invoices** — bookings awaiting invoice action
- **All Bookings** — complete history with filters
- **Referral Links** — create and track
- **Partner Applications** — incoming via public form
- **Retreat Listings** — public retreat pages management
- **Waitlist Signups** — inbound interest from public pages
- **Operator Summary** — per-partner totals
- **Partner Portal Access** — manage operator accounts

### Common Actions
- **+ File Booking** — file a new booking on behalf of an operator (hybrid flow)
- **+ New Link** — create a tracked referral link for a traveler
- **Review & Edit** — edit a retreat listing
- **Approve & Invite** — approve a partner application and send portal invite
- **Send Invoice** — mark a booking as invoice sent
- **Mark Paid** — mark a commission as paid

---

**End of SOP**

*For questions or updates to this document, contact Rigo directly.*
