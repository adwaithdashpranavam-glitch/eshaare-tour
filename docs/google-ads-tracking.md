# Google Ads & Enhanced Conversions Walkthrough

We have successfully completed all three phases of the tracking and privacy implementation. The architecture is now robust, privacy-compliant, and perfectly optimized for Vercel/Lighthouse.

## Phase 1: Core Conversion Tracking

### What was done:
- Created a centralized tracking singleton (`src/utils/tracking.js`).
- Implemented `trackConversion()` to dispatch standard `conversion` events directly to Google Ads.
- Added deduplication protection by passing the Firestore-generated `leadNo` directly as the `transaction_id`.
- Integrated `trackConversion` into all 6 lead submission forms.
- Ensured legacy tags were removed and placeholders protected by strict runtime string validations.

> [!TIP]
> The forms dynamically import `tracking.js` via `import().then()`, preserving our deferred GTM/GA architecture and maintaining peak Lighthouse scores.

## Phase 2: Privacy Policy Compliance

### What was done:
- Created `src/pages/public/PrivacyPolicyPage.jsx` with strict SEO tags (`Helmet`).
- Registered the `/privacy-policy` route in `App.jsx`.
- Injected the footer link across all public views within `PublicLayout.jsx`.
- Updated `prerender.mjs` to force Puppeteer/Chromium to emit a static `dist/privacy-policy/index.html` file during the Vercel build, satisfying Googlebot's crawlability requirements.

## Phase 3: Enhanced Conversions

### What was done:
- Upgraded `trackConversion` to an asynchronous function.
- Injected the `crypto.subtle.digest('SHA-256')` logic entirely within `tracking.js` to ensure zero code duplication.
- Formatted `userData` locally via `normalizeEmail` (lowercase/trim) and `normalizePhone` (E.164 compliance with fallback default to UAE `+971`).
- Fired `window.gtag('set', 'user_data', { ...hashes })` immediately prior to the core conversion hit.

> [!IMPORTANT]
> If the Web Crypto API fails (e.g. restrictive browser privacy plugins), the system gracefully catches the error and drops back to standard conversions, guaranteeing you never lose a lead event. Raw unhashed emails and phone numbers are never logged or exposed.

## Final Steps for the Marketing Team
Code changes are officially 100% complete! Your next steps are:
1. Verify the `ON` status of "Enhanced conversions" within the Google Ads dashboard settings.
2. Deploy the `main` branch to Vercel.
3. Submit a test lead via Google Tag Assistant to verify the payloads.
4. Check Google Ads Diagnostics in 24-48 hours for the "Receiving data" status.
