# ProductiveME Dashboard Brief

## 1. Project Definition

ProductiveME is a personal productivity control plane.

It is not a generic task manager, Notion replacement, finance tracker, or project management tool. It is a hub platform that connects the user's major life systems and helps decide what deserves attention now.

The platform manages four fixed domains:

- Career
- Finance
- Personal Data
- Life

Productivity is not treated as a separate domain. In this project, productivity means coordinating these four domains so that work, growth, money, personal archives, and life outside work move in a coherent direction.

## 2. Platform Role

ProductiveME should behave like a personal control tower.

It should:

- Show the current state of each domain.
- Surface neglected or overloaded areas.
- Connect to external systems such as Notion, Google Tasks, GitHub repos, finance tools, folders, and project repositories.
- Help the user choose the next meaningful action.
- Support weekly and monthly review workflows.
- Provide a homepage-like dashboard that feels personal, calm, and useful.

It should not:

- Store every note, task, asset record, or personal file.
- Replace Notion as the primary writing and database space.
- Replace specialized project repositories.
- Become a bloated all-in-one life management app.
- Look like a generic AI-generated SaaS dashboard.

## 3. Source System Philosophy

ProductiveME is a control plane, not the source of truth for every area.

Expected source systems:

- Notion: daily notes, planning, logs, databases, second brain.
- Google Tasks or equivalent: short-term task queue and request processing.
- GitHub/local repos: career projects, coding projects, automation projects.
- Finance repo or tools: financial review, portfolio logic, monthly snapshots.
- Personal file system or future tools: photos, music, videos, documents, archives.

ProductiveME reads, summarizes, links, and recommends. It does not need to own all underlying data.

## 4. Core Domains

### Career

Career covers work, study, and long-term dream preparation.

Subdomains:

- Work: current job, work requests, practical execution, professional output.
- Study: technical learning, AI, cloud, network, CS fundamentals, architecture.
- Dream: long-term ambitions such as overseas career, portfolio, independent projects, and future identity.

The Career area should answer:

- What work-related things need attention?
- What am I studying now?
- What long-term career goal is being prepared?
- Which project proves which skill?
- What is the next concrete career action?

### Finance

Finance covers money and assets.

Current focus:

- Cash flow
- Monthly asset snapshot
- Spending review
- Investment and portfolio review

Future expansion:

- Real estate
- Vehicle
- Insurance
- Other assets

The Finance area should answer:

- Has this month's asset snapshot been recorded?
- Is spending under control?
- Does the portfolio need review?
- What financial action is due next?

### Personal Data

Personal Data covers personal digital archives.

Subdomains:

- Photos
- Music
- Videos
- Files
- Archives

Related projects may include HeartPin or future file organization tools.

The Personal Data area should answer:

- Which data area is growing unmanaged?
- What needs sorting, deleting, archiving, or tagging?
- Which folder or archive should be cleaned next?
- Which personal data project is currently active?

### Life

Life covers time and meaning outside career, finance, and personal data.

Subdomains:

- Travel
- Exercise
- Games
- Church
- Rest
- Relationships
- Other life activities

Life is broader than leisure. It includes recovery, faith, health, relationships, hobbies, and non-work experiences.

The Life area should answer:

- Is life outside work being planned intentionally?
- Is rest or exercise being neglected?
- Are there meaningful personal activities coming up?
- Is Career consuming too much space?
- What life action should be protected this week?

## 5. Dashboard Goal

The dashboard should help the user answer one main question:

> What should I pay attention to next?

The first screen should not feel like a report page full of text. It should feel like a personal command center that makes the current week understandable at a glance.

Important dashboard concepts:

- Domain health
- Current focus
- Neglected areas
- Overloaded areas
- Due reviews
- Next actions
- External links
- Weekly and monthly review entry points

## 6. MVP Dashboard Capabilities

The first React MVP should include:

- A homepage dashboard.
- Four domain sections: Career, Finance, Personal Data, Life.
- A weekly focus area.
- A signal area showing warnings, overdue reviews, and neglected domains.
- An action hub linking to external systems.
- A review area for weekly and monthly review generation.
- A simple local registry using JSON or YAML before real API integrations.

Initial data can be static or file-based. API integrations can come later.

## 7. Visual Design Direction

The dashboard should not look like a generic enterprise analytics product.

Avoid:

- Generic AI dashboard aesthetics.
- Overuse of gradient cards.
- Too many pill badges.
- Long text-heavy domain cards.
- Startup SaaS hero-page styling.
- Abstract decorative blobs or vague futuristic visuals.
- A screen that looks like every other productivity template.

Prefer:

- Personal but structured.
- Calm but not boring.
- Dense enough to be useful.
- Visual hierarchy over long explanations.
- Domain-specific visual cues.
- A homepage-like control surface.
- Clear entry points into action.
- A design that feels like a private control room for one person's life.

## 8. Taste Direction From Prior Design Work

This project should borrow taste principles from the referenced "Implement design system from file" work, but not copy its exact brand, SK-specific palette, or PR-tool layout.

The useful lessons from that work are:

- The dashboard should feel more like a homepage or workspace than a generic admin dashboard.
- A left navigation rail is useful when the product has persistent destinations, but it should not dominate the first screen.
- The main page should have a strong "where am I and what matters now?" area, not just a grid of cards.
- Domain identity should come from layout, rhythm, icons, typography, and content structure, not only color.
- A design can be operational and warm at the same time.
- Tables, filters, and raw metrics should be secondary unless the user is in review mode.
- The first screen should lead with a primary story or focus, then support it with signals and domain status.

Taste constraints:

- Do not use the exact SK PR Studio visual identity.
- Do not use red/orange as the dominant brand language unless a later design direction proves it fits ProductiveME.
- Do not use a warm-cream Claude-like palette as the default without a stronger ProductiveME-specific reason.
- Do not rely on "AI dashboard" tropes: glowing cards, vague gradient panels, excessive badges, chat-first layout, or generic insight widgets.
- Do not make the dashboard look like a corporate BI tool.

ProductiveME should feel closer to:

- A personal homepage.
- A weekly command center.
- A life operating console.
- A calm editorial workspace.
- A hub that has enough technical structure to scale later.

It should not feel like:

- A Notion template pasted into React.
- A startup analytics dashboard.
- A task manager clone.
- A gamified life tracker.
- A generic AI copilot shell.

## 9. ProductiveME Visual Identity Hypotheses

Explore several visual identities before choosing one.

### Hypothesis A: Editorial Control

This direction uses a magazine/homepage feel: strong date, clear weekly headline, editorial sections, and restrained typography.

Good for:

- Making the dashboard feel personal and less SaaS-like.
- Showing the user's life as a curated weekly page.
- Balancing Career with Life instead of letting work dominate everything.

Watch out:

- It can become too passive if next actions are not visually strong.

### Hypothesis B: Personal Operations

This direction uses a compact control-plane feel: clear navigation, state indicators, quick links, and review actions.

Good for:

- Daily usage.
- Connecting many external systems.
- Making ProductiveME feel like an actual platform.

Watch out:

- It can become stiff, enterprise-like, or too close to the current AI-looking mockup.

### Hypothesis C: Mission Week

This direction makes the current week the central object. Domains feed into weekly missions, blockers, and protected time.

Good for:

- Turning scattered goals into execution.
- Making the app action-oriented.
- Connecting Work, Study, Finance, Data cleanup, and Life rhythm.

Watch out:

- It can over-prioritize productivity and make Life feel like another task list.

### Hypothesis D: Life Balance Map

This direction visualizes Career, Finance, Personal Data, and Life as a balance map or spatial system.

Good for:

- Monthly review.
- Seeing imbalance.
- Making the product feel meaningfully different from normal dashboards.

Watch out:

- It may be less useful for daily action if the interaction model is not clear.

## 10. Color System Variations

The dashboard can explore multiple color systems, but each variation must define what each accent means. Colors should not be decorative only.

### Variation A: Lumina Odyssey

Base:

- Surface: `#051424`
- Surface container: `#122131`
- Highest surface: `#273647`
- Text: `#d4e4fa`
- Muted text: `#c6c6cd`

Accents:

- Cyan `#5de6ff`: active state, connected systems, current domain health, primary focus.
- Amber `#ffb95f`: due state, Finance, monthly checkpoint, high-priority action, value/money signal.
- Soft red `#ffb4ab`: error, blocked connector, failed sync.
- Muted blue-gray `#798098`: parked, inactive, historical context.

Use case:

- Best for a gamified life-map HUD.
- Works well when the dashboard shows Past Signals, Current State, and Future Actions in one board.

Amber usage rule:

- Amber should appear when something is valuable, due, or requires attention but is not broken.
- Examples: Finance snapshot due, monthly review due, priority task, portfolio checkpoint.
- Do not use amber as a generic highlight. If everything is amber, nothing is urgent.

### Variation B: Solar Quest

Base:

- Surface: `#171307`
- Surface container: `#241d0c`
- Highest surface: `#362a10`
- Text: `#fff1c9`
- Muted text: `#d6c59a`

Accents:

- Yellow `#ffd166`: focus, reward, completed milestones, current selected action.
- Deep amber `#f59e0b`: Finance, due reviews, deadlines.
- Ink brown `#3b2a08`: button text on bright yellow.
- Soft red `#ff9b8a`: error or blocked action.

Use case:

- Best for a warmer game-dashboard direction.
- Feels more like a quest board or adventure dashboard than a technical HUD.

Yellow usage rule:

- Yellow is the "current playable action" color.
- Use it for the primary button, selected quest, completion/reward signal, and active weekly focus.
- Keep Finance in deeper amber so money/due states do not compete with generic focus.

### Variation C: Verdant Balance

Base:

- Surface: `#071812`
- Surface container: `#10251c`
- Highest surface: `#1c382c`
- Text: `#daf7e8`
- Muted text: `#a8c7b7`

Accents:

- Green `#61d29a`: Life, recovery, healthy balance, sustainable rhythm.
- Mint `#7df7c1`: active safe state, restored capacity, completed habit.
- Cyan `#5de6ff`: connected systems and technical status.
- Amber `#ffb95f`: due Finance/review checkpoint.

Use case:

- Best when the product wants to feel calmer, more restorative, and less "mission control."
- Useful if Life and sustainability should visually counterbalance Career pressure.

Green usage rule:

- Green should mean recovery, health, restored capacity, and sustainable routine.
- Use it for Life, exercise, rest, and "safe to continue" states.
- Do not use green for money by default; Finance should remain amber/gold to avoid semantic confusion.

## 11. Possible Layout Directions To Explore

### Direction A: Control Tower

This version feels like an operations dashboard.

Characteristics:

- Left navigation.
- Central weekly focus.
- Domain status grid.
- Alerts and review timeline.
- Compact, utilitarian, fast to scan.

Best for:

- Frequent daily or weekly use.
- Action selection.
- Technical control plane feeling.

Risk:

- Can become too SaaS-like or stiff.

### Direction B: Personal Home

This version feels more like a private homepage.

Characteristics:

- Large date/current mode area.
- Domain sections arranged like rooms or zones.
- More warmth and breathing room.
- Less metric-heavy.
- Stronger sense of personal life rhythm.

Best for:

- Making the app feel personal.
- Reducing dashboard fatigue.
- Showing life balance.

Risk:

- Can become too soft or vague if actions are not clear.

### Direction C: Mission Board

This version feels like a weekly mission planning board.

Characteristics:

- This week is the center.
- Domains provide missions, blockers, and next moves.
- Strong prioritization.
- Project and task oriented.

Best for:

- Turning scattered areas into execution.
- Career and project momentum.

Risk:

- May underrepresent Life and Personal Data unless designed carefully.

### Direction D: Life Map

This version treats the four domains as a map of life balance.

Characteristics:

- Four quadrants or spatial zones.
- Visual balance indicators.
- Current attention distribution.
- Stronger emotional and reflective quality.

Best for:

- Monthly review.
- Seeing imbalance.
- Strategic planning.

Risk:

- Less direct for daily action.

## 12. Layout Experiments To Produce

Create multiple design explorations before committing to a final dashboard.

Minimum explorations:

- Version 1: Editorial weekly homepage.
- Version 2: Compact control plane.
- Version 3: Mission-board style weekly planner.
- Version 4: Life balance map.

Each exploration should show:

- First viewport desktop layout.
- Mobile layout concept.
- How the four domains appear.
- How the user sees the next action.
- How external systems are reached.
- How weekly review starts.

Each exploration should avoid:

- Reusing the same card grid with only different colors.
- Treating all domains as identical boxes.
- Making Career visually more important by default.
- Filling the screen with explanatory copy.

## 13. Navigation Taste

Left navigation is acceptable, but only if it earns its space.

Use LNB when:

- There are persistent destinations such as Overview, Career, Finance, Personal Data, Life, Reviews, Registry, and Settings.
- The product is expected to stay open while the user moves across domains.
- The dashboard needs a platform feel.

Avoid heavy LNB when:

- The first screen should feel more like a personal homepage.
- The navigation competes with the weekly focus.
- The screen starts to resemble a generic SaaS admin tool.

Possible compromise:

- Use a slim rail or collapsible navigation.
- Make domain navigation part of the page body on the homepage.
- Reserve full LNB for detail and registry screens.

## 14. Screen Objects To Design

The dashboard design should define these objects clearly:

- Domain card
- Domain detail view
- Weekly focus list
- Signal or alert
- Next action
- External system link
- Review generator entry
- Project link
- Status indicator
- Current mode switch

Each object should have a clear purpose and should not exist only for decoration.

## 15. Suggested MVP Screens

### Home Dashboard

Purpose:

- Show current state across all domains.
- Recommend what to focus on next.
- Provide quick access to connected systems.

### Domain Detail

Purpose:

- Show one domain in more detail.
- List subdomains, linked systems, active projects, and next actions.

### Review

Purpose:

- Generate or prepare weekly/monthly review.
- Summarize domain status and decisions.

### Registry

Purpose:

- Manage connected projects, repos, Notion pages, folders, and tools.
- This can start as read-only in the MVP.

## 16. Initial Technical Shape

Recommended frontend:

- React
- Vite or Next.js
- Component-based dashboard UI

Recommended data layer for MVP:

- Local JSON or YAML registry.
- Static mock data first.
- Later connector interfaces for Notion, GitHub, local repos, finance systems, and task tools.

Possible structure:

```text
src/
  app/
  components/
    dashboard/
    domain/
    review/
    registry/
  data/
    domains.ts
    projects.ts
    links.ts
  types/
    domain.ts
    project.ts
    review.ts
```

## 17. Success Criteria For Design Exploration

A dashboard design is successful if:

- The user can understand the state of Career, Finance, Personal Data, and Life within 10 seconds.
- The screen suggests what to do next without requiring a long read.
- It feels personal rather than generic.
- It has a recognizable ProductiveME identity, not just "clean dashboard" polish.
- It can later connect to external systems without redesigning the entire UI.
- It supports both weekly execution and monthly review.
- It does not make Life feel like an afterthought.
- It makes ProductiveME feel like a platform, not just a Notion clone.

## 18. Open Design Questions

- Should the first screen feel more like a control tower, a personal homepage, a mission board, or a life map?
- Should domain health use numbers, labels, colors, or visual balance indicators?
- Should the dashboard emphasize today's actions or this week's direction?
- Should Life be equal in weight to Career, or should the layout intentionally counterbalance Career overload?
- Should the visual tone be calm and editorial, operational and compact, or somewhere between the two?
- Should the homepage use full LNB, slim rail, or no persistent left navigation?
- What should be ProductiveME's own visual signature beyond color?
