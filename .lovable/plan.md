

## Redesigned Signup and Onboarding Flow

### What we're building

A new first-time user experience that captures profile data and business context through a friendly multi-step flow, replacing the current bare-bones signup > email-confirm > company-setup process.

### New Flow

```text
Signup Page (name, email, password / Google)
  ↓ auto-confirm, redirect to /onboarding
  ↓
Onboarding (8 steps, one per screen):
  1. "I am a..." — Business / Freelancer / Personal
  2. Team size — Just me / 2-5 / 6-20 / 20+
  3. E-commerce platform — Shopify / WooCommerce / Amazon / Other / None yet
  4. Industry — FMCG / Health & Beauty / Food & Bev / Other
  5. Looking to improve — Stock accuracy / Order fulfillment / Returns / Visibility (multi-select)
  6. Profile — Display name (pre-filled), Job title
  7. Company Setup — Company name + auto-generated code
  ↓
  Dashboard
```

Each step is a clean card with a progress bar and back/next buttons. Answers stored in `profiles.onboarding_answers` as JSON.

### Database Changes (migration)

Add three columns to `profiles`:
- `job_title` text, nullable
- `onboarding_answers` jsonb, nullable
- `onboarding_completed` boolean, default false

### Auth Configuration

- Enable **auto-confirm** for email signups (removes the broken email verification wall)

### File Changes

| File | Action |
|------|--------|
| `src/pages/SignupPage.tsx` | Remove "Check your email" screen. After signup, navigate to `/onboarding` |
| `src/pages/OnboardingPage.tsx` | Full rewrite: 7-step questionnaire flow ending with company setup |
| `src/pages/ProfilePage.tsx` | New page: display name, job title, email, log out |
| `src/components/CompanyGate.tsx` | Also check `profiles.onboarding_completed` -- redirect to `/onboarding` if false |
| `src/components/AppSidebar.tsx` | Profile section: clickable name area with dropdown (View Profile, Log out) |
| `src/App.tsx` | Add `/profile` route inside protected layout |

### Onboarding Step Details

Steps 1-5 are single-screen multiple-choice cards (radio buttons, except step 5 which is multi-select checkboxes). Step 6 collects profile info. Step 7 is the existing company setup (without locations -- those move to settings later).

All questionnaire answers are saved to `profiles.onboarding_answers` as:
```json
{
  "business_type": "business",
  "team_size": "2-5",
  "ecommerce_platform": "shopify",
  "industry": "health_beauty",
  "goals": ["stock_accuracy", "visibility"]
}
```

On final step completion: create company, set `onboarding_completed = true`, update `job_title`, redirect to dashboard.

### Sidebar Profile Section

Replace the current avatar/email block with a clickable dropdown:
- Shows avatar, display name, job title
- Dropdown: "View Profile" link, divider, "Log out"

