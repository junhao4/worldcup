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

### Session 2026-06-11

- Q: When should a prediction stop being editable? → A: Lock each match exactly 1 hour before kickoff.
- Q: Should users see the official score after a match finishes? → A: Yes, show the official result alongside their prediction.
- Q: How should scoring work? → A: 1 point for the correct outcome plus 1 point for each exact team score.
- Q: Should there be a public competition layer? → A: Yes, add a public leaderboard of player scores.
- Q: How should users appear publicly? → A: Let each user set a display name for leaderboard use.
- Q: How should official scores be maintained operationally? → A: Store them in a simple Supabase table that can be updated daily.
- Q: Should internal platform details appear in user-facing copy? → A: No, do not mention Supabase or sync internals in core user messaging.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build My Tournament Prediction (Priority: P1)

A fan can predict scores for every match across the World Cup tournament so they can create a complete bracket or tournament forecast in one place.

**Why this priority**: The core value of the product is letting users build their predictions. Without this, the website does not fulfill its purpose.

**Independent Test**: Can be fully tested by opening the site, entering scores for every required match, and confirming a complete tournament prediction can be produced without using any sharing features.

**Acceptance Scenarios**:

1. **Given** a user starts a new prediction, **When** they enter valid scores for each required match, **Then** the website updates standings, advancing teams, and the complete tournament outcome.
2. **Given** a user has not completed all required picks, **When** they try to finalize their prediction, **Then** the website highlights the missing selections and prevents completion until the prediction is valid.
3. **Given** a user enters a tied score for a knockout match, **When** the match requires a winner, **Then** the website asks the user to choose which team advances.
4. **Given** a match is within 1 hour of kickoff, **When** a user views that fixture, **Then** the prediction is locked and can no longer be edited.
5. **Given** a match has already started, **When** a user views that fixture, **Then** the prediction remains read-only and clearly indicates that it is locked.

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

---

### User Story 4 - Compare Predictions With Official Results (Priority: P2)

A fan can see official match results beside their locked predictions and understand the points they earned once matches finish.

**Why this priority**: The app becomes much more compelling during the tournament if users can track how accurate they are, not just what they predicted.

**Independent Test**: Mark one or more matches as complete with official scores, open a user prediction, and verify the UI shows the official result, earned points, and locked state without allowing edits.

**Acceptance Scenarios**:

1. **Given** a match has an official final score, **When** a user opens that match, **Then** the website shows the official score alongside the user’s predicted score.
2. **Given** a completed match has both an official result and a user prediction, **When** points are calculated, **Then** the website awards 1 point for the correct outcome and 1 point for each exact team score.
3. **Given** a completed knockout match needs an advancing side to resolve the outcome, **When** the official advancing team is present, **Then** the outcome point uses that advancing side.

---

### User Story 5 - Join a Public Leaderboard (Priority: P2)

A fan can set a display name and compare their cumulative score against other players on a public leaderboard.

**Why this priority**: Public ranking makes the product social and sticky across the full tournament window.

**Independent Test**: Create multiple users with display names and completed-match scoring, then verify the leaderboard ranks them correctly using only public-facing profile data.

**Acceptance Scenarios**:

1. **Given** a user wants to appear publicly, **When** they set a display name, **Then** that name is used in the leaderboard.
2. **Given** multiple users have scored predictions, **When** the leaderboard is opened, **Then** it ranks them by cumulative points in descending order.
3. **Given** a user has not chosen a display name yet, **When** they try to participate publicly, **Then** the website prompts them to set one first.

---

### User Story 6 - Record Official Match Results Daily (Priority: P1)

An organizer can enter official match results in a simple database table so prediction locking, comparison, and leaderboard scoring all stay current.

**Why this priority**: The results layer is the backbone for daily tournament operation. Without it, post-match comparison and leaderboard features cannot function reliably.

**Independent Test**: Update official match results for a given day in the database, refresh the app, and verify the results, points, and leaderboard reflect the change.

**Acceptance Scenarios**:

1. **Given** the organizer enters an official match result, **When** users refresh or revisit the app, **Then** that result becomes the source of truth shown in comparison views.
2. **Given** an official score is corrected after entry, **When** the organizer updates the result record, **Then** affected user scores and leaderboard totals are recalculated.
3. **Given** a match has kicked off but no official final score is available yet, **When** users view that match, **Then** the match is still locked and the UI indicates that the official result is pending.

### Edge Cases

- What happens when a user selects contradictory outcomes that would place the wrong team in a later knockout match?
- How does the system handle a prediction that is partially completed when the user tries to save, preview, or export?
- What happens when a team selection must be reset because an earlier-stage winner changes?
- How does the export flow behave on smaller mobile screens where the full bracket may not be visible at once?
- What happens when the generated image would exceed the supported output dimensions or file size?
- How does the system handle tied group-stage scores compared with tied knockout scores?
- What happens if a user is editing a match while the 1-hour lock threshold is crossed?
- How should the leaderboard handle ties between players on the same total score?
- What happens when a user never predicted a match that later receives an official result?
- How does the system behave if an organizer enters a knockout result without an advancing team where one is required?
- What happens when a user changes their display name after already appearing on the leaderboard?

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
- **FR-019**: The system MUST lock each match prediction exactly 1 hour before the scheduled kickoff time and prevent further edits after that point.
- **FR-020**: The system MUST keep locked predictions visible after kickoff so users can compare them with official results.
- **FR-021**: The system MUST calculate user points as 1 point for the correct outcome plus 1 point for each exact team score.
- **FR-022**: The system MUST show the official final score for completed matches alongside each user’s prediction.
- **FR-023**: The system MUST show per-match earned points and cumulative total points for each user once official results exist.
- **FR-024**: The system MUST support a public leaderboard ranked by cumulative points.
- **FR-025**: The system MUST allow a user to set and update a public display name for leaderboard participation.
- **FR-026**: The system MUST allow a user to opt out of public leaderboard participation while still using the prediction product.
- **FR-027**: The system MUST avoid exposing private identifiers such as email addresses in public leaderboard views.
- **FR-028**: The system MUST store official match results in a Supabase-backed table that can be maintained daily through Supabase tools without code changes.
- **FR-029**: The system MUST support an official advancing team field for knockout matches whose final score is level in the score-entry model.
- **FR-030**: The system MUST recalculate user points and leaderboard rankings when official results are added or corrected.
- **FR-031**: The system MUST present user-facing account and save copy without mentioning internal implementation terms such as “Supabase” or “sync”.
- **FR-032**: The system MUST clearly mark each match state as open, locked, in progress, completed, or awaiting official result.
- **FR-033**: The system MUST show the official score comparison in a layout that makes the user’s prediction and the correct result easy to scan side by side.
- **FR-034**: The system MUST support cross-device restore for signed-in users whose predictions are stored remotely.

### Key Entities *(include if feature involves data)*

- **Tournament**: Represents the 2026 World Cup competition structure, including groups, group-stage matches, knockout matches, and the order in which teams advance.
- **Match Prediction**: Represents a user’s predicted score for a specific match and the resulting outcome derived from that score.
- **Knockout Tiebreak Selection**: Represents the team chosen to advance when a knockout match score is tied.
- **Prediction Card**: Represents the full user-created prediction set, including title, all selected outcomes, champion, and visual personalization choices.
- **Export Image**: Represents the downloadable PNG share artifact generated from a completed prediction card.
- **User Profile**: Represents a participant account, including private identity, public display name, and leaderboard participation preference.
- **Official Match Result**: Represents the verified final score and, when needed, advancing team for a completed match.
- **Leaderboard Entry**: Represents the public score summary for one participant, including display name, total points, and rank.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of users can complete a full tournament prediction and reach a valid final champion without assistance on their first attempt.
- **SC-002**: At least 95% of successful export attempts produce a downloadable PNG image that matches the on-screen prediction preview.
- **SC-003**: Users can complete a full prediction and export it in under 5 minutes during moderated usability testing.
- **SC-004**: At least 90% of users on supported mobile screen sizes can create, review, and export a prediction without needing to switch to desktop.
- **SC-005**: In side-by-side usability comparison with the reference score predictor, at least 80% of evaluators prefer this product's prediction review and export flow.
- **SC-006**: At least 85% of evaluators describe the exported PNG card as share-ready without needing additional editing.
- **SC-007**: At least 95% of matches become non-editable for all users by the configured 1-hour pre-kickoff lock threshold.
- **SC-008**: Official result updates made in Supabase are reflected in match comparison views and leaderboard totals within 1 minute.
- **SC-009**: At least 90% of users can correctly explain why they gained or missed points for a completed match after viewing the comparison state.
- **SC-010**: No public leaderboard screen exposes email addresses or internal account identifiers.

## Assumptions

- The initial release focuses on the full 2026 World Cup format rather than supporting custom tournament creation.
- Users who want cross-device restore or leaderboard participation will use an account-backed flow.
- The first version prioritizes score prediction and tournament progression over advanced analytics or live data integration.
- The PNG image export is intended for sharing and saving, not for post-export editing within the product.
- The reference score predictor is treated as competitive inspiration, not as a strict visual design requirement.
- Official match results are entered manually by the organizer in Supabase rather than pulled from an automated sports feed.
- Leaderboard ordering is based on cumulative points unless a later clarification adds explicit tie-break rules.

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
