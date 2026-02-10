# Obsidian Pets - Implementation Roadmap

**Version:** 2.0 (Post-Pivot)
**Last Updated:** 2026-02-09
**Estimated Timeline:** 4-6 weeks for MVP

---

## Strategic Direction

**Core Philosophy:** "Feeling the plugin, not thinking about it"

**What We're Building:**
- Vault-aware celebration companion
- Ambient emotional support (not active chat)
- Proactive joy moments (not reactive Q&A)
- Zero cognitive load (no decisions, no input required)

**What We're NOT Building:**
- ❌ Conversation/chat systems (use Obsidian Copilot for that)
- ❌ XP progression/gamification (use RPG Stat Tracker for that)
- ❌ Calendar views
- ❌ Template parsing for prompts

---

## Overview

This roadmap reflects the strategic pivot from conversation-based journaling to celebration-focused vault companion.

**Key Changes:**
- Removed: Phases 4-6 (Conversation Flow, Progression System, Calendar View)
- Added: Phase 3 (Celebration System)
- Simplified: Phase 4 (User Configuration)
- Reduced timeline: 12 weeks → 4-6 weeks

---

## Phase 1: Foundation & Setup ✅ COMPLETED

**Status:** Completed (Week 1-2, Feb 2026)

### Deliverables
- ✅ Repository setup with Git/GitHub
- ✅ TypeScript + esbuild configuration
- ✅ Svelte integration
- ✅ Basic plugin structure (main.ts, settings)
- ✅ Package.json scripts (dev, build, test)
- ✅ Vitest testing framework
- ✅ Manifest.json

**Completion Date:** 2026-02-04

---

## Phase 2: Pet View & Animation System ✅ COMPLETED

**Status:** Completed (Week 3-4, Feb 2026)

### Deliverables
- ✅ PetView.ts (ItemView implementation)
- ✅ Pet.svelte component
- ✅ PetStateMachine.ts (7 animation states)
- ✅ Sprite-based animation system
- ✅ CSS animations (idle, greeting, talking, listening, celebration, petting)
- ✅ Mobile touch support
- ✅ Welcome modal (pet name, user name)
- ✅ Settings persistence
- ✅ 120 comprehensive tests
- ✅ Walking movement system (CSS-based)
- ✅ Movement speed slider (0-100%, walking/running states)
- ✅ ResizeObserver for adaptive boundaries
- ✅ Direction flipping with synchronized animations
- ✅ Security hardening (path validation, settings validation)

**Completion Date:** 2026-02-09

**Animations:**
- Idle: Breathing loop
- Greeting: Wave on panel open
- Walking: Edge-to-edge movement with speed control
- Running: Faster movement (61-100% speed range)
- Talking: Bounce animation (reserved for future)
- Listening: Tilt animation (reserved for future)
- Small Celebration: Brief cheer
- Big Celebration: Enthusiastic spin
- Petting: Happy reaction (click/tap anytime)

**Movement System:**
- CSS-based edge-to-edge adaptive movement
- Walking state (0-60% speed) and Running state (61-100% speed)
- Automatic direction flipping at container edges
- ResizeObserver for responsive boundary updates
- Smooth transitions between movement and idle states
- Performance: <0.1% CPU usage (GPU-accelerated)

---

## Phase 3: Celebration System 🚧 IN PROGRESS

**Goal:** Implement vault-aware celebrations that trigger on user activities

**Estimated Duration:** 2-3 weeks

### 3.1 Vault Event Listeners

**Goal:** Hook into Obsidian API events to detect vault activities

**Tasks:**
- [ ] Create `celebration/VaultEventListeners.ts`
  - [ ] Listen to `vault.on('create')` for new notes
  - [ ] Listen to `workspace.on('file-open')` for daily note detection
  - [ ] Listen to `workspace.on('editor-change')` for word count tracking
  - [ ] Listen to `workspace.on('editor-change')` for checkbox detection
  - [ ] Listen to `metadataCache.on('resolved')` for link detection
- [ ] Implement event debouncing (prevent spam)
- [ ] Add error handling and cleanup
- [ ] Write unit tests for each listener

**Technical Approach:**
```typescript
// Example: Daily note creation listener
this.registerEvent(
  this.app.workspace.on('file-open', (file) => {
    if (this.isDailyNote(file)) {
      this.celebrationEngine.triggerCelebration('daily-note');
    }
  })
);
```

**Acceptance Criteria:**
- ✅ Detects new note creation
- ✅ Identifies daily notes vs. regular notes
- ✅ Tracks word count milestones
- ✅ Detects checkbox state changes
- ✅ Identifies new link creation
- ✅ Events don't fire more than once per cooldown period

---

### 3.2 Celebration Engine

**Goal:** Core logic for triggering and managing celebrations

**Tasks:**
- [ ] Create `celebration/CelebrationEngine.ts`
  - [ ] `triggerCelebration(type: CelebrationType)`
  - [ ] Cooldown tracking (prevent spam)
  - [ ] Check if celebration type is enabled
  - [ ] Trigger animation via PetStateMachine
  - [ ] Queue celebrations if pet is busy
- [ ] Define `CelebrationType` enum
  - `'daily-note'`, `'new-note'`, `'link'`, `'checkbox'`, `'word-milestone'`
- [ ] Implement cooldown system
- [ ] Add celebration queue (max 3 pending)
- [ ] Write comprehensive tests

**Data Structures:**
```typescript
enum CelebrationType {
  DailyNote = 'daily-note',
  NewNote = 'new-note',
  Link = 'link',
  Checkbox = 'checkbox',
  WordMilestone = 'word-milestone'
}

interface CelebrationConfig {
  type: CelebrationType;
  enabled: boolean;
  animation: 'small' | 'big';
  cooldown: number; // milliseconds
}
```

**Acceptance Criteria:**
- ✅ Triggers correct animation for celebration type
- ✅ Respects cooldown periods
- ✅ Checks user settings (enabled/disabled)
- ✅ Handles queue gracefully (no spam)
- ✅ Recovers from errors without crashing

---

### 3.3 Milestone Tracker

**Goal:** Track word count milestones and other metrics

**Tasks:**
- [ ] Create `celebration/MilestoneTracker.ts`
  - [ ] Track word counts per file
  - [ ] Detect when milestones are crossed
  - [ ] Persist milestone state (avoid duplicate celebrations)
  - [ ] Implement `checkWordCount(file: TFile, wordCount: number)`
- [ ] Define default milestones: [100, 500, 1000, 5000]
- [ ] Store last known word count per file
- [ ] Clear stale data (files older than 30 days)
- [ ] Write unit tests

**Technical Approach:**
```typescript
interface MilestoneState {
  [filePath: string]: {
    wordCount: number;
    lastMilestone: number;
    lastUpdated: Date;
  }
}
```

**Acceptance Criteria:**
- ✅ Detects word count milestones accurately
- ✅ Doesn't trigger same milestone twice
- ✅ Handles rapid typing (debounced)
- ✅ Cleans up old data
- ✅ Persists state across sessions

---

### 3.4 State Remapping

**Goal:** Remove text messages and simplify animation states

**Tasks:**
- [ ] Remove greeting text ("Hello [userName]!")
- [ ] Remove "talking" state (not needed for emoji celebrations)
- [ ] Remove "listening" state (not needed for emoji celebrations)
- [ ] Update state machine to remove deprecated states
- [ ] Update Pet.svelte to remove text rendering
- [ ] Keep: idle, greeting, walking, celebration (small/big), petting
- [ ] Update tests to match new state machine

**Rationale:**
- Emoji speech bubbles only (v0.2.0)
- Custom text messages moved to v0.3.0+
- Simpler state machine = less complexity

**Acceptance Criteria:**
- ✅ No text messages rendered
- ✅ "talking"/"listening" states removed
- ✅ State machine updated and tested
- ✅ All existing functionality preserved

---

### 3.5 Celebration Animations

**Goal:** Add emoji speech bubbles for celebrations

**Tasks:**
- [ ] Design celebration animation sprites
  - [ ] Fireworks (big celebration)
  - [ ] Hearts (new note)
  - [ ] Confetti (checkbox)
  - [ ] Sparkles (link)
- [ ] Implement emoji speech bubbles
  - [ ] 🎉 for daily note
  - [ ] ❤️ for new note
  - [ ] 🎊 for checkbox
  - [ ] ✨ for link
  - [ ] 🎆 for word milestone
- [ ] Update Pet.svelte with speech bubble component
- [ ] Add CSS keyframes for each animation
- [ ] Test animations on mobile
- [ ] Ensure 60 FPS performance

**Animation Specs:**
- **Fireworks**: 2-second animation, particle effects
- **Hearts**: 1.5-second float-up animation
- **Confetti**: 2-second fall animation
- **Sparkles**: 1-second shimmer effect
- **Speech bubbles**: 1.5-second fade-in/out with emoji

**Acceptance Criteria:**
- ✅ All animations play smoothly
- ✅ Emoji speech bubbles display correctly
- ✅ Animations don't block interaction
- ✅ Mobile performance acceptable
- ✅ Returns to idle after celebration

---

### 3.6 Integration with PetView

**Goal:** Connect celebration system to pet view

**Tasks:**
- [ ] Update PetView.ts
  - [ ] Initialize CelebrationEngine
  - [ ] Register VaultEventListeners
  - [ ] Handle celebration callbacks
  - [ ] Cleanup on view close
- [ ] Remove old conversation methods:
  - [ ] Remove `startConversation()`
  - [ ] Simplify `handleDailyNoteButton()` → `celebrateDailyNote()`
  - [ ] Remove template validation logic
- [ ] Update state machine integration
- [ ] Add debug logging (gated by `__DEV__`)
- [ ] Write integration tests

**Acceptance Criteria:**
- ✅ Celebrations trigger from vault events
- ✅ Pet animates correctly
- ✅ No memory leaks
- ✅ Cleanup on view close
- ✅ Works with existing pet interactions (petting)

---

### Phase 3 Deliverable

**Functional celebration system:**
- Vault events trigger celebrations
- 5 celebration types implemented
- User can see celebrations in action
- No configuration UI yet (hardcoded defaults)

**Timeline:** 2-3 weeks
**Priority:** P0 (Core feature)

---

## Phase 4: User Configuration 📅 PLANNED

**Goal:** Settings UI for celebration customization

**Estimated Duration:** 1 week

### 4.1 Celebration Settings Data Structure

**Tasks:**
- [ ] Define `CelebrationSettings` interface
- [ ] Extend plugin settings with celebration config
- [ ] Add default settings
- [ ] Migration logic (if needed)

```typescript
interface CelebrationSettings {
  celebrations: {
    [key in CelebrationType]: {
      enabled: boolean;
      cooldown: number;
    }
  };
  wordCountMilestones: number[]; // [100, 500, 1000, 5000]
}
```

---

### 4.2 Settings Modal

**Tasks:**
- [ ] Create `modals/CelebrationSettingsModal.ts`
- [ ] Toggle switches for each celebration type
- [ ] Cooldown sliders (1s - 60s)
- [ ] Word count milestone editor
  - [ ] Add milestone button
  - [ ] Remove milestone button
  - [ ] Validation (positive integers)
- [ ] Preview button (test celebrations)
- [ ] Save/Cancel buttons

**UI Design:**
```
Celebration Settings
━━━━━━━━━━━━━━━━━━━━
□ Daily Note Creation    [Cooldown: 5s]
□ New Note Creation      [Cooldown: 2s]
□ Link Creation          [Cooldown: 1s]
□ Checkbox Completion    [Cooldown: 1s]
□ Word Count Milestones  [Cooldown: 10s]

Word Count Milestones:
[100] [500] [1000] [5000] [+ Add]

[Test Celebration] [Save] [Cancel]
```

---

### 4.3 Settings Integration

**Tasks:**
- [ ] Add command: "Configure Celebrations"
- [ ] Load settings on plugin load
- [ ] Pass settings to CelebrationEngine
- [ ] Persist settings changes
- [ ] Validate settings before save

**Acceptance Criteria:**
- ✅ User can enable/disable celebrations
- ✅ User can adjust cooldowns
- ✅ User can customize word milestones
- ✅ Settings persist across restarts
- ✅ Preview button works

---

### Phase 4 Deliverable

**Functional settings UI:**
- User can customize all celebration triggers
- Changes take effect immediately
- Settings are persisted

**Timeline:** 1 week
**Priority:** P1 (Important for user control)

---

## Phase 5: Polish & Testing 📅 PLANNED

**Goal:** Refine UX, optimize performance, ensure quality

**Estimated Duration:** 1 week

### 5.1 Performance Optimization

**Tasks:**
- [ ] Profile celebration system performance
- [ ] Optimize event listeners (debounce, throttle)
- [ ] Reduce animation memory footprint
- [ ] Test in large vaults (10,000+ notes)
- [ ] Mobile battery testing

**Targets:**
- [ ] < 1% CPU usage when idle
- [ ] < 50MB memory footprint
- [ ] No frame drops during celebrations

---

### 5.2 Visual Polish

**Tasks:**
- [ ] Refine celebration animations
- [ ] Add sound effects (optional, off by default)
- [ ] Improve transitions
- [ ] Ensure theme compatibility (light/dark)
- [ ] Add celebration particle effects (if performance allows)

---

### 5.3 Error Handling

**Tasks:**
- [ ] Graceful handling of missing sprites
- [ ] Recovery from celebration failures
- [ ] Clear error messages
- [ ] Logging for debugging
- [ ] Fallback animations if custom ones fail

---

### 5.4 Accessibility

**Tasks:**
- [ ] Keyboard navigation for settings
- [ ] Screen reader support (basic)
- [ ] Focus management
- [ ] Reduce motion option (respect OS preference)

---

### 5.5 Testing

**Test Matrix:**
- [ ] Windows (Desktop + Mobile)
- [ ] macOS (Desktop + Mobile)
- [ ] Linux (Desktop)
- [ ] iOS/iPadOS
- [ ] Android

**Plugin Compatibility:**
- [ ] Daily Notes core plugin
- [ ] Templater
- [ ] Dataview
- [ ] Calendar
- [ ] Hot Reload (dev only)

---

### 5.6 Documentation

**Tasks:**
- [ ] Update README with celebration features
- [ ] Create usage guide (wiki)
- [ ] Add troubleshooting section
- [ ] Document celebration customization
- [ ] Create demo GIFs/videos

---

### Phase 5 Deliverable

**Production-ready plugin:**
- Smooth performance on all platforms
- Clear documentation
- No critical bugs
- Works with popular plugins

**Timeline:** 1 week
**Priority:** P0 (Required for release)

---

## Phase 6: Release Preparation 📅 PLANNED

**Goal:** Prepare for Obsidian community plugin release

**Estimated Duration:** 3-5 days

### 6.1 Final Assets

**Tasks:**
- [ ] Finalize pet sprites
- [ ] Create celebration particle effects
- [ ] Optimize all assets (size, format)
- [ ] Create plugin icon (128x128)
- [ ] Create banner image

---

### 6.2 Plugin Submission

**Requirements:**
- [ ] Comprehensive README
- [ ] Screenshots/GIFs showing celebrations
- [ ] Clear description (< 250 chars)
- [ ] MIT License
- [ ] Release notes (CHANGELOG.md)
- [ ] Tag version 0.2.0

**Files Required:**
- manifest.json
- README.md
- main.js (built)
- styles.css

---

### 6.3 Community Plugin Submission

**Process:**
1. Fork obsidian-releases repository
2. Add plugin to community-plugins.json
3. Create PR with required files
4. Respond to reviewer feedback
5. Address any changes
6. Approval & publication

---

### 6.4 Marketing & Community

**Tasks:**
- [ ] Post in Obsidian forum
- [ ] Share on Reddit r/ObsidianMD
- [ ] Tweet announcement
- [ ] Create demo video (optional)
- [ ] Set up GitHub Discussions

**Messaging:**
- "Your vault celebrates you"
- Focus on ambient emotional support
- Show celebration animations in action
- Emphasize zero cognitive load

---

### Phase 6 Deliverable

**Published plugin:**
- Live in Obsidian community plugins
- Users can install via Obsidian
- Clear documentation
- Active community presence

**Timeline:** 3-5 days
**Priority:** P0 (Release milestone)

---

## Post-MVP: Future Enhancements

### Architecture Strategy: CSS for Rendering, JavaScript for Logic

**Agreed Phased Approach:**

**Phase 2 (Current):** Custom CSS single-pet with celebration system
- ✅ CSS handles sprite rendering and movement
- ✅ JavaScript handles state machine logic
- Performance: GPU-accelerated, <0.1% CPU, 60 FPS guaranteed

**Phase 2.5:** Multi-pet (CSS-only, no awareness of each other)
- Each pet moves independently using CSS animations
- No coordination or interaction between pets
- Minimal JavaScript overhead (state management only)
- Estimated Effort: 5-10 hours

**Phase 3:** Multi-pet with position tracking + simple behaviors
- CSS continues to handle rendering
- JavaScript tracks positions periodically (not every frame)
- Simple coordination: pets celebrate together when nearby
- Hybrid approach: CSS performance + JavaScript coordination
- Estimated Effort: 10-15 hours

**Phase 4:** Following/chasing with basic AI
- Leader uses CSS animation (battery-efficient)
- Follower uses JavaScript position updates when needed
- Simple follow behavior with smooth interpolation
- Estimated Effort: 20-30 hours

**Phase 5:** Neural network for emergent behavior (experimental)
- Research phase: explore ML-based pet behaviors
- CSS rendering maintained throughout
- JavaScript adds AI decision-making layer
- Estimated Effort: 40-60 hours (research + implementation)

**Key Decision:** CSS handles sprite rendering throughout ALL phases. JavaScript only adds position tracking and behavior logic on top when needed.

---

### v0.3.0 - Enhanced Experience
- [ ] Custom celebration messages (user-entered text)
- [ ] Celebration banner UI (toast notifications with custom messages)
- [ ] Additional movement patterns (zigzag, bounce, figure-8)
- [ ] Background themes
- [ ] Celebration sound effects (optional)
- [ ] Speed variation (±10% randomization for organic feel)
- [ ] State-based speed multipliers (excited pet moves faster)

### v0.4.0+ - Immersion & Relationships
- [ ] Multi-pet support (Phase 2.5: CSS-only, no awareness)
- [ ] Immersion behaviors (Phase 3: simple coordination when nearby)
- [ ] Relationships (Phase 4: basic following/chasing)
- [ ] Adventures (background changes, no narrative)
- [ ] Multiple pet types (cat, dog, bunny, etc.)
- [ ] Seasonal celebration packs ($1.99)
- [ ] Premium backgrounds ($1.99)
- [ ] Community-contributed pets

### v0.5.0+ - Advanced Features
- [ ] Custom celebration triggers (advanced users)
- [ ] Integration with other plugins (Calendar, Tasks)
- [ ] Research RPG Stats Tracker milestones (future work)
- [ ] Celebration history log (optional)
- [ ] Celebration statistics (optional, local only)
- [ ] Neural network behaviors (Phase 5: experimental emergent behavior)

---

## Development Principles

### Code Quality
- Write clean, maintainable TypeScript
- Use consistent naming conventions
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Prefer composition over inheritance

### Testing Strategy
- Unit tests for all celebration logic
- Integration tests for vault event listeners
- Manual testing in real vaults
- Test with various vault sizes
- Test mobile thoroughly

### Performance Guidelines
- Target 60 FPS for animations
- Debounce/throttle event listeners
- Minimize DOM manipulations
- Use CSS transforms for animations
- Profile with Chrome DevTools

### User Experience
- Zero cognitive load (no decisions)
- Ambient presence (not intrusive)
- Respect user preferences (configurable)
- Never lose or corrupt data
- Graceful error recovery

---

## Risk Management

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Event listener performance | High | Medium | Debounce, throttle, profile early |
| Mobile battery drain | Medium | Medium | Optimize animations, test battery impact |
| Plugin conflicts | Medium | Low | Test with popular plugins, use Obsidian API correctly |
| Celebration spam | Low | High | Implement cooldown system, user configuration |
| Animation jank | Medium | Low | CSS GPU acceleration, 60 FPS testing |

---

## Success Metrics (3 months post-launch)

- **Downloads:** 1,000+ installations
- **Rating:** 4+ stars
- **GitHub Stars:** 100+ (2x Pixel Pets)
- **Active Users:** 500+ weekly
- **Bug Reports:** < 5 critical bugs
- **Community Engagement:** Regular forum discussions
- **Differentiation:** Clear positioning vs. Pixel Pets/Vault Pets

---

## Timeline Summary

```
Week 1-2:   Foundation & Setup               ✅ COMPLETE
Week 3-4:   Pet View & Animations            ✅ COMPLETE
Week 5-7:   Celebration System               🚧 IN PROGRESS
Week 8:     User Configuration               📅 PLANNED
Week 9:     Polish & Testing                 📅 PLANNED
Week 10:    Release Preparation              📅 PLANNED

Total: 10 weeks from start
Remaining: 6 weeks from now (Feb 9, 2026)
Target Release: Late March 2026
```

**Critical Path:**
Foundation → Pet View → Celebration System → Polish → Release

**Parallel Tracks:**
- Documentation (ongoing)
- Testing (ongoing)
- Community building (post-release)

---

## Next Immediate Steps (Feb 9, 2026)

1. **Archive deprecated code** (Phase 2 Cleanup)
   - Create `archive/` folder structure
   - Move conversation system files
   - Remove template parsing
   - Clean up PetView.ts

2. **Start Phase 3.1: Vault Event Listeners**
   - Create `src/celebration/` folder
   - Implement `VaultEventListeners.ts`
   - Hook into Obsidian API events
   - Add debouncing logic

3. **Close outdated issues**
   - #10, #12, #14, #55, #46 (conversation features)
   - Document strategic pivot

4. **Update issue #47**
   - Simplify scope (daily note → celebration trigger)
   - Note icon update needed

---

## Questions to Resolve

- [ ] What word count milestones should be default? (100, 500, 1000, 5000?)
- [ ] Should celebrations have sound? (opt-in, off by default) - **Delayed to v0.3.0**
- [ ] How long should cooldowns be? (1s? 5s? user-configurable?)
- [ ] What emoji for what trigger? (consistent mapping):
  - Daily note: 🎉
  - New note: ❤️
  - Checkbox: 🎊
  - Link: ✨
  - Word milestone: 🎆

## Decisions Made

- ✅ v0.2.0: Emoji-only celebrations (no custom text)
- ✅ v0.3.0+: Custom messages, banner UI
- ✅ State remapping: Remove "talking"/"listening" states
- ✅ Companion music: **REMOVED** - Recommend Soundscapes plugin instead
- ✅ RPG Stats Tracker research: Future work (not urgent)
- ✅ Movement system: **CSS-based** for performance and battery life
- ✅ Architecture strategy: **CSS for rendering, JavaScript for logic** (all phases)
- ✅ Multi-pet approach: **Phased** (2.5: CSS-only → 3: Simple coordination → 4: Following → 5: Neural networks)
- ✅ Don't fork vscode-pets: Architecture mismatch, 4-10x more work, performance regression

---

**Document Status:** Living document, updated post-pivot and post-movement system
**Last Review:** 2026-02-09
**Next Review:** When Phase 3 completes
