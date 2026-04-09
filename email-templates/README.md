# Nomara Gmail Email Templates

Pre-built, branded email templates for common partner communications. All templates use the Nomara dark-green + gold aesthetic and pull the logo from Supabase storage.

## How to use in Gmail

1. Enable Gmail templates: **Settings → See all settings → Advanced → Templates: Enable**
2. Open a new compose window
3. Copy the HTML content from the `.html` file you want
4. Paste it into the Gmail compose body (Gmail will preserve the formatting)
5. Customize the placeholders (`[TRAVELER NAME]`, `[RETREAT NAME]`, etc.)
6. Click the three-dot menu → **Templates → Save draft as template → Save as new template**
7. Next time you compose, click the three-dot menu → **Templates → [your saved template]**

**Note:** Gmail's template feature strips some inline CSS. For best results, use these templates by copy-pasting the HTML directly into compose each time, OR send them via Resend (automated) from the portal.

## Templates included

| File | When to use | Subject line |
|------|-------------|--------------|
| `01-operator-welcome.html` | When a new operator confirms partnership terms | Welcome to the Nomara Partner Network |
| `02-referral-intro-to-operator.html` | When you're sending a warm lead to an operator (WhatsApp path) | New Nomara traveler interested in [RETREAT] |
| `03-referral-intro-to-traveler.html` | When you're sharing a retreat link with a traveler | Your Nomara retreat recommendation — [RETREAT] |
| `04-booking-confirmation-request.html` | When filing a booking for an operator (they need to confirm) | Please confirm a Nomara booking — [TRAVELER] |
| `05-invoice-email.html` | When the operator has confirmed and you're invoicing | Commission invoice — [RETREAT], [MONTH] |
| `06-followup-checkin.html` | 30-60 day check-in with quiet partners | Quick check-in from Nomara |

## Placeholders to replace

All templates use these placeholders — replace before sending:
- `[FIRST NAME]` — recipient first name
- `[TRAVELER NAME]` — full name of traveler
- `[TRAVELER FIRST NAME]` — traveler's first name only
- `[RETREAT NAME]` — retreat name
- `[OPERATOR NAME]` — operator/business name
- `[TRAVEL DATES]` — e.g. "May 12–18, 2026"
- `[BOOKING AMOUNT]` — e.g. "$2,786"
- `[COMMISSION AMOUNT]` — e.g. "$417.90"
- `[COMMISSION RATE]` — e.g. "15%"
- `[REFERRAL LINK]` — full URL from admin dashboard
- `[CONFIRM LINK]` — full URL to confirmation page
- `[INVOICE LINK]` — payment link (Stripe, Wise, etc.)
