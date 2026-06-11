# Feature Specification: World Cup Prediction Website

**Feature Branch**: `001-worldcup-predictions`  
**Created**: 2026-06-09  
**Status**: Draft  
**Input**: User description: "create a worldcup prediction website that lets u export an image for ur predictions"

## Clarifications

### Session 2026-06-09

- Q: Which tournament model should the prediction website support for v1? → A: Full 2026 World Cup format with group stage and knockout rounds.
- Q: What image export format should the prediction website support for v1? → A: Export one downloadable PNG image.
- Q: How should users predict group-stage outcomes? → A: Predict score for every match.
- Q: How should tied scorelines be handled? → A: Group draws are allowed; knockout ties require a winner selection.
- Q: What should be improved most compared with the reference score predictor? → A: More polished PNG prediction card and preview.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build My Tournament Prediction (Priority: P1)

A fan can predict scores for every match across the World Cup tournament so they can create a complete bracket or tournament forecast in one place.

**Why this priority**: The core value of the product is letting users build their predictions. Without this, the website does not fulfill its purpose.

**Independent Test**: Can be fully tested by opening the site, entering scores for every required match, and confirming a complete tournament prediction can be produced without using any sharing features.

**Acceptance Scenarios**:

1. **Given** a user starts a new prediction, **When** they enter valid scores for each required match, **Then** the website updates standings, advancing teams, and the complete tournament outcome.
2. **Given** a user has not completed all required picks, **When** they try to finalize their prediction, **Then** the website highlights the missing selections and prevents completion until the prediction is valid.
3. **Given** a user enters a tied score for a knockout match, **When** the match requires a winner, **Then** the website asks the user to choose which team advances.

---

### User Story 2 - Export Prediction as an Image (Priority: P2)

A fan can export their finished prediction as a polished PNG card so they can share it on social media, in chats, or save it for later.

**Why this priority**: Image export is the main differentiator called out in the request and is essential to making the prediction shareable.

**Independent Test**: Can be fully tested by loading a completed prediction, exporting it, and verifying that a downloadable image reflects the selected teams and tournament winner.

**Acceptance Scenarios**:

1. **Given** a user has completed a valid prediction, **When** they choose to export it, **Then** the website shows a polished preview and generates a single PNG image that includes their selected winners and final champion.
2. **Given** a user tries to export an incomplete prediction, **When** the export request is made, **Then** the website blocks export and explains what must be completed first.

---

### User Story 3 - Personalize and Revisit My Prediction (Priority: P3)

A fan can name their prediction card, add lightweight personalization, and return to keep editing before they export it.

**Why this priority**: Personalization increases delight and shareability, but it is less critical than creating and exporting predictions.

**Independent Test**: Can be fully tested by creating a prediction name, adjusting visual personalization options, leaving the editor, and confirming the same prediction can be resumed for further edits.

**Acceptance Scenarios**:

1. **Given** a user has an in-progress prediction, **When** they save or revisit it later on the same device, **Then** the previously selected outcomes and title remain available for editing.
2. **Given** a user customizes the prediction card title or theme, **When** they preview or export it, **Then** the chosen personalization appears consistently in the on-screen preview and final image.

### Edge Cases

- What happens when a user selects contradictory outcomes that would place the wrong team in a later knockout match?
- How does the system handle a prediction that is partially completed when the user tries to save, preview, or export?
- What happens when a team selection must be reset because an earlier-stage winner changes?
- How does the export flow behave on smaller mobile screens where the full bracket may not be visible at once?
- What happens when the generated image would exceed the supported output dimensions or file size?
- How does the system handle tied group-stage scores compared with tied knockout scores?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let users create a new World Cup prediction using the full 2026 World Cup tournament format, including group stage predictions and knockout rounds.
- **FR-002**: The system MUST let users predict scores for every required match in the tournament prediction flow.
- **FR-003**: The system MUST calculate winners, group standings, advancing teams, and later-stage matchups from the user's predicted scores so the tournament remains internally consistent.
- **FR-004**: The system MUST provide a clear visual summary of the user’s current prediction, including the predicted champion.
- **FR-005**: The system MUST indicate which selections are incomplete, invalid, or affected by earlier changes.
- **FR-006**: Users MUST be able to edit previously made predictions before finalizing or exporting.
- **FR-007**: The system MUST allow users to give their prediction a custom title or name.
- **FR-008**: The system MUST offer at least one share-ready visual preview of the completed prediction before export.
- **FR-009**: The system MUST allow users to export a completed prediction as one downloadable PNG image.
- **FR-010**: The exported image MUST include the prediction title, the user’s selected teams for the tournament path, and the predicted winner in a legible layout.
- **FR-011**: The system MUST prevent export when the prediction is incomplete or internally inconsistent and explain what the user needs to fix.
- **FR-012**: The system MUST preserve an in-progress prediction on the same device so a user can leave and return without losing their selections.
- **FR-013**: The system MUST work on both desktop and mobile web browsers for prediction creation, preview, and image export.
- **FR-014**: The system MUST provide a way to reset a full prediction or clear individual selections without forcing the user to restart the entire flow unless they choose to.
- **FR-015**: The system MUST allow tied scores in group-stage matches and treat them as draws for standings calculations.
- **FR-016**: The system MUST require a user-selected advancing team for any knockout match whose predicted score is tied.
- **FR-017**: The system MUST use the reference score predictor at `https://world-cup-2026-scores.vercel.app` as a baseline for score entry, standings, best-third review, and bracket route visibility, while improving the review and export experience for share-ready predictions.
- **FR-018**: The system MUST prioritize a polished PNG prediction card and preview that feels more share-ready than the reference score predictor's functional score and bracket views.

### Key Entities *(include if feature involves data)*

- **Tournament**: Represents the 2026 World Cup competition structure, including groups, group-stage matches, knockout matches, and the order in which teams advance.
- **Match Prediction**: Represents a user’s predicted score for a specific match and the resulting outcome derived from that score.
- **Knockout Tiebreak Selection**: Represents the team chosen to advance when a knockout match score is tied.
- **Prediction Card**: Represents the full user-created prediction set, including title, all selected outcomes, champion, and visual personalization choices.
- **Export Image**: Represents the downloadable PNG share artifact generated from a completed prediction card.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of users can complete a full tournament prediction and reach a valid final champion without assistance on their first attempt.
- **SC-002**: At least 95% of successful export attempts produce a downloadable PNG image that matches the on-screen prediction preview.
- **SC-003**: Users can complete a full prediction and export it in under 5 minutes during moderated usability testing.
- **SC-004**: At least 90% of users on supported mobile screen sizes can create, review, and export a prediction without needing to switch to desktop.
- **SC-005**: In side-by-side usability comparison with the reference score predictor, at least 80% of evaluators prefer this product's prediction review and export flow.
- **SC-006**: At least 85% of evaluators describe the exported PNG card as share-ready without needing additional editing.

## Assumptions

- The initial release focuses on the full 2026 World Cup format rather than supporting custom tournament creation.
- Users do not need to create an account for v1; prediction persistence is limited to the same device or browser context.
- The first version prioritizes score prediction and tournament progression over advanced analytics or live data integration.
- The PNG image export is intended for sharing and saving, not for post-export editing within the product.
- The reference score predictor is treated as competitive inspiration, not as a strict visual design requirement.

## UI Design

**Mode**: code-generation

**Stitch Source**: Newest four-screen design cluster from Stitch project `14988967190173135424`. Older downloaded Stitch experiments remain on disk but are excluded from this mapping.

**Downloaded CDN Assets**: Google-hosted image assets, Google Fonts CSS, `fonts.gstatic.com` font binaries, and the Tailwind CDN script are cached locally under `frontend/.stitch/designs/google-cdn-assets/`. Localized HTML copies that point at the cached assets live under `frontend/.stitch/designs/localized/`. The asset manifest records 43 cached assets across the four selected screens.

### Stitch Screen Inventory

| Screen | Stitch Screen ID | Primary user story mapping |
|---|---|---|
| Group Stage Predictions - Modern Light | `5cb0d6a74ae646518b6f94bf79710b01` | User Story 1 - Build My Tournament Prediction |
| 2026 World Cup - Knockout Bracket | `0b46ed5744304035b483114678e1703a` | User Story 1 - Build My Tournament Prediction |
| Prediction Export Studio - Final Preview | `70ac152daa8643b39d694179ff2e9972` | User Story 2 - Export Prediction as an Image |
| Prediction Card Personalization | `dedfcf73370f4ba1aa537361f5e46a23` | User Story 3 - Personalize and Revisit My Prediction |

### Shared Component Inventory

| Atomic level | Components | Design purpose |
|---|---|---|
| UI primitives | `Button`, `Badge`, `Card`, `Input`, `Progress` | Reusable shadcn-style primitives for actions, form controls, cards, labels, and completion meters |
| Atoms | `FlagBadge`, `ScoreBox`, `ThemeSwatch` | Repeated compact visual elements used in score prediction, bracket, and card personalization flows |
| Molecules | `TopNav`, `SidebarNav`, `ProgressSummary`, `MatchScoreCard`, `BracketMatchCard`, `InfoTile` | Repeated navigation, progress, match prediction, bracket, and export-summary patterns |
| Organisms | `AppShell`, `StandingsTable`, `ExportPreviewCard`, `SettingsPanel` | Shared page regions for tournament editing, standings review, export preview, and card personalization |

### User Story Coverage

- **User Story 1** uses `AppShell`, `SidebarNav`, `StandingsTable`, `MatchScoreCard`, `BracketMatchCard`, `ScoreBox`, and `FlagBadge` to support score entry, standings review, and knockout advancement visibility.
- **User Story 2** uses `ExportPreviewCard`, `InfoTile`, `Button`, and `Badge` to make the PNG preview feel polished, complete, and download-ready.
- **User Story 3** uses `SettingsPanel`, `ThemeSwatch`, `Input`, and `ExportPreviewCard` to support title, creator, and visual theme personalization before export.
