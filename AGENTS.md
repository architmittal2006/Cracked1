# Cracked? — UI/UX Redesign Audit & Project Rules

## Project Context
Comprehensive UI/UX redesign for Cracked?, a peer-reviewed case-solving and consulting credibility platform.

## Technology Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4.3, Framer Motion, React Router v7
- **Backend:** Express.js, TypeScript, file-based storage (dbService.ts)
- **Auth:** GitHub OAuth, Google OAuth
- **Design:** Custom CSS with design tokens, glass-card aesthetic

## Build & Test Commands
```bash
# Backend
npm run dev          # Start backend with ts-node
npm run build        # Build backend (tsc)
npm start            # Start production server

# Frontend (in client/ directory)
npm run dev          # Start Vite dev server (runs on port 5174)
npm run build        # Build for production (tsc + vite build)
npm run lint         # Run oxlint
npm run preview      # Preview production build
```

## Key Design Principles from References

### Road to Offer (Conceptual + Implementation Analysis)
**Tech Stack:** Next.js with SSG, Vercel hosting, Tailwind CSS (likely), custom CSS build

**SEO & Metadata Strategy:**
- Comprehensive meta description (148 characters, keyword-rich)
- Open Graph tags for social sharing (og:type, og:title, og:description, og:image, og:url)
- Twitter Card tags (twitter:card, twitter:title, twitter:description, twitter:image, twitter:creator)
- Proper viewport settings with interactive-widget optimization
- SEO keywords targeting consulting interview niche
- og:image with optimal dimensions (1200x630)
- Favicon with proper favicon.ico
- Robots directives (index, follow)
- Googlebot directives with preview limits
- Structured data (implied by metadata format)
- Language and locale tags (en_US)
- Category and publisher metadata

**Design System & Aesthetic:**
- Clean, modern SaaS design with minimalist layout and generous whitespace
- Professional B2C SaaS aesthetic (education/consulting niche)
- Multi-step value flow narrative (numbered 1-7 with expand/collapse previews)
- Strong use of cards as primary content container pattern
- Consistent color palette: primary accent, white backgrounds, dark text
- Gradient accents for buttons and CTAs

**UI Patterns Identified:**
- Sticky navigation bar with logo on left, menu items on right
- Hero section with large headline, subheadline, primary CTAs, social proof
- Social proof with star ratings and trusted-by counts
- Feature grid with cards (icons, titles, descriptions, links)
- Stat cards showing numeric metrics ("550+ Drills", "71+ Cases")
- Multi-step process visualization with numbered steps and expandable previews
- Pricing comparison tables with plan features, prices, CTAs
- Content library with grid of category cards
- Rich footer with multiple link columns
- Modal for sign-up/login
- Toast notifications for feedback

**Key Learnings for Cracked?:**
- Apply SEO metadata strategy (Open Graph, Twitter Cards, proper descriptions)
- Clear numbered journey narrative (apply to 3-track explanation)
- Card-based content organization
- Expandable previews for complex content
- Pricing/comparison tables for credibility tiers
- Rich social proof presentation
- Multi-column footer with organized links
- Primary/secondary CTA hierarchy
- Gradient accents for interactive elements

### Road to Offer (Conceptual + Implementation Analysis)
**Tech Stack:** Next.js with SSG, Vercel hosting, Tailwind CSS (likely), custom CSS build

**Design System & Aesthetic:**
- Clean, modern SaaS design with minimalist layout and generous whitespace
- Professional B2C SaaS aesthetic (education/consulting niche)
- Multi-step value flow narrative (numbered 1-7 with expand/collapse previews)
- Strong use of cards as primary content container pattern
- Consistent color palette: primary accent, white backgrounds, dark text
- Gradient accents for buttons and CTAs

**UI Patterns Identified:**
- Sticky navigation bar with logo on left, menu items on right
- Hero section with large headline, subheadline, primary CTAs, social proof
- Social proof with star ratings and trusted-by counts
- Feature grid with cards (icons, titles, descriptions, links)
- Stat cards showing numeric metrics ("550+ Drills", "71+ Cases")
- Multi-step process visualization with numbered steps and expandable previews
- Pricing comparison tables with plan features, prices, CTAs
- Content library with grid of category cards
- Rich footer with multiple link columns
- Modal for sign-up/login
- Toast notifications for feedback

**Key Learnings for Cracked?:**
- Clear numbered journey narrative (apply to 3-track explanation)
- Card-based content organization
- Expandable previews for complex content
- Pricing/comparison tables for credibility tiers
- Rich social proof presentation
- Multi-column footer with organized links
- Primary/secondary CTA hierarchy
- Gradient accents for interactive elements

### Trackk (Visual/Interaction)
- Bold, confident headlines
- Clean, high-contrast design
- Animated statistics
- Clear feature cards with CTAs
- Step-by-step journey visualization
- Simple, transparent pricing
- Strong visual hierarchy
- Consistent spacing and alignment

## Critical Layout Bugs to Fix First

1. **Sticky header overlap:** Header overlaps page titles/subtitles on /cases and Arena page
   - Fix: Add proper top offset, make header solid or blurred with bottom border
   - Ensure Sign Up and Login are vertically centered inside header

2. **Card padding inconsistency:** Cards lack consistent inner padding
   - Fix: Add consistent inner padding (p-5 to p-6) to every card
   - No text, tag, or button may touch card border

3. **Nav tab pills clipping:** Labels clip and lack clear active state
   - Fix: Ensure pills don't clip labels, show clear active state

4. **Filter chips:** Lack visible selected state, container styling, consistent spacing
   - Fix: Add visible selected state, proper container styling, consistent spacing

5. **Font inconsistency:** Multiple font families used
   - Fix: Use one font family for whole UI (plus mono for timers/numbers only)
   - Sign Up and Login must use same font as other buttons

6. **Accent color overuse:** Too many accent colors used
   - Fix: Limit accents to orange (brand) plus three track colors
   - Use neutral grays for everything else

7. **Empty states:** Black void instead of helpful message + CTA
   - Fix: Add short message and CTA to all empty states

8. **Timer bug:** Shows 00:00:00 instead of "Ended" or real countdown
   - Fix: Show "Ended" or actual countdown when applicable

9. **Visual QA requirement:** Need to screenshot at multiple breakpoints
   - Add step: Screenshot every main page at 375px, 768px, 1440px before opening PR

## Current Problems Identified

### 1. Landing Page Issues
- **Hero is overly theatrical:** Polygons, scanlines, glow orbs distract from product
- **"Poster" treatment feels like movie marketing, not SaaS**
- **Unverified stats:** Hardcoded in mockData without real data source
- **Testimonials may be fabricated:** No verification system
- **Three-track explanation buried:** Small chips at bottom of hero
- **No product preview:** Doesn't show actual interface
- **"Trusted by" claims:** Lists firm names without verification

### 2. Visual Inconsistencies
- **Orange accent (#FF4C25) overused:** Applied everywhere without purpose
- **Excessive glassmorphism:** Every card uses glass effect
- **Overly decorative elements:** Polygons, scanlines, glow orbs add noise
- **Typography inconsistency:** Mix of Montserrat and Inter
- **Inconsistent card designs:** Some pages use glass-card, others don't
- **Too many gradients:** Reduces readability

### 3. UX Problems
- **Dashboard lacks clear next actions:** Shows decorative metrics
- **Case discovery unclear:** Difficulty indicators not prominent
- **Two-review gate not visually prominent:** Critical rule buried
- **Submission form monotonous:** Long form without visual breaks
- **Review rubric complex:** No guidance for reviewers
- **No empty states:** New users don't know what to do
- **Navigation crowded:** Too many links in navbar

### 4. Information Architecture
- **Public/authenticated content mixing:** Confusing user flows
- **Track switching not intuitive:** Three tracks lack clear distinction
- **Company features not separated:** Blended with learner experience
- **Routes inconsistent:** Some public, some protected without clear pattern

### 5. Brand Issues
- **"Poster" aesthetic undermines credibility:** Feels like marketing, not professional platform
- **Accent color lacks purpose:** Orange used indiscriminately
- **Identity unclear:** Struggles between professional consulting and flashy design

## Design Direction

### Visual Personality
- **Sophisticated but not flashy**
- **Minimal but not empty**
- **Data-informed decisions**
- **High contrast for readability**
- **Clear and structured layouts**
- **Confident without being loud**
- **Interactive but not distracting**
- **Professional without being corporate**

### Color Strategy
- **Primary accent (#FF4C25):** Use purposefully for primary actions, selected states, meaningful progress, important highlights only
- **Track-specific accents:** Give each track (Open Arena, Community Questions, Curated Cases) its own accent color
- **Supporting neutrals:** Use neutral grays for everything else
- **Status colors:** Keep emerald (success), rose (error), amber (warning)
- **Avoid:** Making every component orange

### Brand and Icon System
- **Logo cleanup:** Keep "Cracked?" wordmark but ensure crack lines stay inside/touch letterforms, remove ® symbol
- **Logo versions:** Create 3 versions - full wordmark, compact "C?" mark with single crack, favicon/app icon
- **Logo usage:** Use compact version in nav/footer at readable size (at least 28px tall)
- **Icon system:** Use Lucide only, 1.75 stroke width, three sizes (16, 20, 24px)
- **Icon alignment:** Icons align with label baseline with fixed gap
- **Icon selection:** Choose meaningful icons, give each track its own icon and accent color
- **Starburst widget:** Remove or restyle floating yellow starburst unless required feature

### Typography Scale
- **Display headings:** Hero and section titles
- **Page headings:** Clear page identification
- **Section headings:** Content organization
- **Body text:** Primary content
- **Metadata:** Secondary information
- **Numbers/metrics:** Data visualization
- **Labels/buttons:** Interactive elements

### Layout Rules
- **Max content width:** 1280px (existing page-container)
- **Page gutters:** 24px (existing)
- **Grid system:** Consistent 12-column grid
- **Vertical rhythm:** 8px base unit
- **Card padding:** Consistent across all cards
- **Section spacing:** 96px between major sections
- **Border radius:** 8px-12px consistent
- **Border treatments:** Subtle, purposeful
- **Responsive breakpoints:** Mobile-first approach

## Non-Negotiable Constraints

1. **Work in existing repository** - No new frontend framework
2. **Preserve technology stack** - React, TypeScript, Tailwind, Express
3. **Preserve backend logic** - API contracts, authentication, submissions, reviews, scoring
4. **Do not remove functional features** - Even if they complicate redesign
5. **Do not replace real data with mock data** - In production flows
6. **Do not fabricate social proof** - No fake testimonials, companies, user counts
7. **Do not create nonfunctional buttons** - All controls must work
8. **Do not break authentication/authorization** - OAuth, session management
9. **Do not break submission/review flows** - Two-review gate, rubric scoring
10. **Do not make all pages identical** - Each page should serve its purpose
11. **Do not stop at landing page** - Redesign entire application
12. **Do not stop at recommendations** - Must implement changes
13. **Do not claim completion without verification** - Test actual functionality
14. **Do not deploy without authorization** - User must approve production deployment
15. **Do not perform destructive data migrations** - Without explicit approval

## Redesign Phases

### Phase 1: Audit (COMPLETE)
- ✅ Inspect repository, routes, components, data models, API contracts
- ✅ Study reference websites (including detailed Road to Offer analysis)
- ✅ Identify visual inconsistencies and UX problems
- ✅ Establish baseline by running application
- ✅ Fix critical layout bugs (header, padding, filters, fonts, accents, empty states, timer)

### Phase 2: Design Foundation
- Establish visual direction, typography, design tokens
- Define layout rules and spacing system
- Create reusable components with consistent patterns
- Standardize interaction states (hover, focus, active, disabled, loading, success, error)

### Phase 3: Landing Page
- Clear value proposition without theatrical elements
- Product preview showing actual interface
- Three-track explanation with distinct identities
- User journey visualization
- Credibility tier explanation
- Primary CTA with specific action

### Phase 4: Core Application
- Dashboard with clear next actions
- Case discovery with better filtering and difficulty indicators
- Case details with structured problem brief
- Submission flow with focused workspace
- Peer-review flow with clear guidance
- Review results with interpretable feedback
- User profiles with shareable certificates
- Company dashboards with professional experience

### Phase 5: Polish & Validation
- Test desktop and mobile layouts
- Verify loading, empty, error, success, disabled states
- Run build, lint, typecheck commands
- Address Stackra audit findings (performance, accessibility, security, SEO)
  - ✅ SEO metadata added (Open Graph, Twitter Cards, proper descriptions, keywords)
  - ⏳ Create sitemap.xml
  - ⏳ Create robots.txt
  - ⏳ Add structured data (JSON-LD) for organization, product, breadcrumbs
  - ⏳ Add canonical URLs
  - Performance: Investigate bottlenecks, optimize largest visible content, font loading
  - Accessibility: Fix button names, text contrast, heading hierarchy
  - Security: Configure X-Content-Type-Options header
  - Prerendering/SSR: Evaluate if needed after architecture review

## Definition of Done

The redesign is complete when:
- Landing page communicates product clearly with Road to Offer-inspired patterns
- Visual language is coherent and professionally executed
- Core application pages follow same design system
- Three tracks are understandable and visually distinct with assigned icons/colors
- Two-review gate is clearly communicated
- Submission and review flows remain functional
- Credibility indicators use real application data
- Interface works across desktop and mobile
- Accessibility issues resolved where feasible
- Performance issues measured and addressed
- Existing routes, authentication, backend behavior intact
- Application builds successfully
- Critical user journeys tested
- Visual QA completed (screenshots at 375px, 768px, 1440px)
- Remaining limitations documented honestly

## Files Changed

(To be updated as redesign progresses)
