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

### Road to Offer (Conceptual)
- Clear numbered journey: "One path from resume to offer"
- Transparent value propositions
- Progress-focused messaging (550+ drills, 71+ cases)
- Verified social proof
- Detailed product explanations without marketing fluff

### Trackk (Visual/Interaction)
- Bold, confident headlines
- Clean, high-contrast design
- Animated statistics
- Clear feature cards with CTAs
- Step-by-step journey visualization
- Simple, transparent pricing
- Strong visual hierarchy
- Consistent spacing and alignment

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
- **Supporting neutrals:** Refine surface colors, borders, text hierarchy
- **Status colors:** Keep emerald (success), rose (error), amber (warning)
- **Avoid:** Making every component orange

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
- ✅ Study reference websites
- ✅ Identify visual inconsistencies and UX problems
- ⏳ Establish baseline by running application

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

## Definition of Done

The redesign is complete when:
- Landing page communicates product clearly
- Visual language is coherent and professionally executed
- Core application pages follow same design system
- Three tracks are understandable and visually distinct
- Two-review gate is clearly communicated
- Submission and review flows remain functional
- Credibility indicators use real application data
- Interface works across desktop and mobile
- Accessibility issues resolved where feasible
- Performance issues measured and addressed
- Existing routes, authentication, backend behavior intact
- Application builds successfully
- Critical user journeys tested
- Remaining limitations documented honestly

## Files Changed

(To be updated as redesign progresses)
