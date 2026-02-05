# Vault Pal - Implementation Roadmap

**Version:** 1.0
**Last Updated:** 2026-02-04
**Estimated Timeline:** 8-12 weeks for MVP

---

## Overview

This roadmap breaks down Vault Pal development into manageable phases, with clear priorities and dependencies. Each phase includes specific deliverables, acceptance criteria, and technical tasks.

---

## Phase 1: Foundation & Setup (Week 1-2)

**Goal:** Establish project infrastructure and development environment

### 1.1 Repository Setup
- [x] Initialize git repository
- [x] Connect to GitHub remote (https://github.com/terriyeh/vault-pal)
- [ ] Create project structure (folders, files)
- [ ] Set up .gitignore
- [ ] Create initial README.md

### 1.2 Development Environment
- [ ] Configure TypeScript
  - [ ] Create tsconfig.json
  - [ ] Set up Svelte TypeScript support
  - [ ] Configure path aliases
- [ ] Configure esbuild
  - [ ] Install esbuild and esbuild-svelte
  - [ ] Create esbuild.config.mjs
  - [ ] Test build pipeline
- [ ] Set up package.json
  - [ ] Add all dependencies
  - [ ] Configure scripts (dev, build, lint)
- [ ] Create manifest.json
  - [ ] Define plugin metadata
  - [ ] Set minimum Obsidian version

### 1.3 Basic Plugin Structure
- [ ] Create main.ts plugin class
  - [ ] Implement onload/onunload
  - [ ] Add basic logging
  - [ ] Test plugin loads in Obsidian
- [ ] Create settings.ts
  - [ ] Implement PluginSettingTab
  - [ ] Add basic settings structure
- [ ] Create types/index.ts
  - [ ] Define core interfaces
  - [ ] Document type structure

**Deliverable:** Minimal working plugin that loads in Obsidian with basic settings tab

**Acceptance Criteria:**
- ✅ Plugin appears in Obsidian community plugins list
- ✅ Plugin can be enabled/disabled
- ✅ Settings tab is accessible and functional
- ✅ `npm run dev` watches for changes
- ✅ `npm run build` produces main.js

---

## Phase 2: Pet View & Animation System (Week 3-4)

**Goal:** Create the core pet panel with animation states

### 2.1 Pet View ItemView
- [ ] Create views/PetView.ts
  - [ ] Extend ItemView class
  - [ ] Implement getViewType/getDisplayText
  - [ ] Add basic HTML structure
  - [ ] Register view in main.ts
- [ ] Add ribbon icon for opening pet view
- [ ] Add command for opening pet view
- [ ] Test view opens in right sidebar
- [ ] Verify view can be moved/docked

### 2.2 Placeholder SVG Assets
- [ ] Create assets/pet/states/ folder structure
- [ ] Create 7 placeholder SVG files:
  - [ ] idle.svg
  - [ ] greeting.svg
  - [ ] talking.svg
  - [ ] listening.svg
  - [ ] small-celebration.svg
  - [ ] big-celebration.svg
  - [ ] petting.svg
- [ ] Ensure consistent viewBox (200x200)
- [ ] Test SVGs display correctly
- [ ] Optimize file sizes with SVGO

### 2.3 Animation State Machine
- [ ] Create animations/PetStateMachine.ts
  - [ ] Define PetState type
  - [ ] Define StateTransition interface
  - [ ] Implement transition validation
  - [ ] Add lifecycle hooks (onEnter, onExit)
  - [ ] Add transition queue handling
- [ ] Test state transitions
- [ ] Add logging for debugging

### 2.4 SVG Layer System
- [ ] Create animations/LayerManager.ts
  - [ ] Implement background layer switching
  - [ ] Implement pet layer switching
  - [ ] Implement accessory layer switching
  - [ ] Add CSS variable management
- [ ] Create sprite sheet structure
- [ ] Build SVG symbol definitions
- [ ] Test layer compositing

### 2.5 CSS Animations
- [ ] Create styles.css
- [ ] Implement keyframe animations for each state:
  - [ ] idle-breathe
  - [ ] greeting-wave
  - [ ] talking-bounce
  - [ ] listening-tilt
  - [ ] small-celebration-jump
  - [ ] big-celebration-spin
  - [ ] petting-happy
- [ ] Add transition effects
- [ ] Test performance (60 FPS target)

### 2.6 Svelte Pet Component
- [ ] Create components/Pet.svelte
  - [ ] Accept state prop
  - [ ] Render SVG layers
  - [ ] Bind to state machine
  - [ ] Handle click events
- [ ] Mount Pet component in PetView
- [ ] Test reactivity (state changes trigger animations)

**Deliverable:** Working pet panel with all 7 animation states

**Acceptance Criteria:**
- ✅ Pet displays in sidebar panel
- ✅ All 7 animations play correctly
- ✅ Smooth transitions between states
- ✅ Click triggers petting animation
- ✅ Idle animation loops continuously
- ✅ No performance issues (60 FPS)

---

## Phase 3: Template Parsing & Daily Note Integration (Week 5-6)

**Goal:** Enable reading templates and creating daily notes

### 3.1 Template Parser
- [ ] Create core/TemplateParser.ts
  - [ ] Implement parseTemplate method
  - [ ] Regex for `vaultpal` code blocks
  - [ ] Extract prompt text
  - [ ] Track question positions
  - [ ] Handle edge cases (malformed blocks)
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Test with sample templates

### 3.2 Daily Notes Integration
- [ ] Install obsidian-daily-notes-interface
- [ ] Create core/NoteCreator.ts
  - [ ] Implement createOrOpenDailyNote
  - [ ] Check if note exists
  - [ ] Handle existing content
  - [ ] Implement insertResponse
  - [ ] Preserve non-VaultPal content
- [ ] Test with Daily Notes plugin
- [ ] Test with Periodic Notes plugin
- [ ] Verify Templater compatibility

### 3.3 Settings for Template Configuration
- [ ] Add template path setting
  - [ ] File picker or text input
  - [ ] Validation
  - [ ] Default value
- [ ] Add notes folder setting
- [ ] Add date format setting
- [ ] Add "strip VP blocks" toggle
- [ ] Test settings save/load

### 3.4 Template Validation
- [ ] Validate template file exists
- [ ] Validate template has vaultpal blocks
- [ ] Show helpful error messages
- [ ] Add template preview (optional)

**Deliverable:** Plugin can parse templates and create daily notes

**Acceptance Criteria:**
- ✅ Parses vaultpal code blocks from template
- ✅ Creates daily note using user's settings
- ✅ Respects Daily Notes plugin configuration
- ✅ Handles existing notes correctly
- ✅ Does not break Templater/DataView
- ✅ Clear error messages for invalid templates

---

## Phase 4: Conversation Flow (Week 7-8)

**Goal:** Implement the Q&A chat interface

### 4.1 Chat UI Component
- [ ] Create components/Chat.svelte
  - [ ] Message display area (scrollable)
  - [ ] Text input field
  - [ ] Send button
  - [ ] Message bubbles (pet vs user)
  - [ ] Typing indicator
- [ ] Style chat interface
- [ ] Test responsiveness
- [ ] Add keyboard shortcuts (Enter to send)

### 4.2 Conversation Manager
- [ ] Create core/ConversationManager.ts
  - [ ] Implement startConversation
  - [ ] Implement askNextQuestion
  - [ ] Implement submitResponse
  - [ ] Implement completeConversation
  - [ ] Add error recovery
- [ ] Coordinate with state machine
- [ ] Handle empty responses
- [ ] Add response validation (optional)

### 4.3 "Share my day" Button
- [ ] Add button to pet view
- [ ] Style button
- [ ] Disable during conversation
- [ ] Re-enable after completion
- [ ] Add loading state

### 4.4 Response Insertion Logic
- [ ] Implement precise response insertion
  - [ ] Find vaultpal block in note
  - [ ] Insert response after block
  - [ ] Maintain markdown formatting
  - [ ] Handle line breaks correctly
- [ ] Test with various template structures
- [ ] Verify no data loss

### 4.5 Conversation State Management
- [ ] Track conversation progress
- [ ] Allow pausing/resuming (optional)
- [ ] Handle view closure mid-conversation
- [ ] Persist conversation state (optional)

**Deliverable:** Fully functional conversation flow

**Acceptance Criteria:**
- ✅ User can click "Share my day" to start
- ✅ Pet presents questions one by one
- ✅ User can type and submit responses
- ✅ Responses saved to daily note correctly
- ✅ Pet shows appropriate animations during flow
- ✅ Completion message displayed
- ✅ Can handle conversation interruption

---

## Phase 5: Progression System (Week 9)

**Goal:** Implement XP, streaks, and milestones

### 5.1 Progression Data Structure
- [ ] Add progression settings to plugin
- [ ] Implement data initialization
- [ ] Add migration for existing users (future)

### 5.2 Progression System Logic
- [ ] Create core/ProgressionSystem.ts
  - [ ] Implement completeNote
  - [ ] Calculate XP awards
  - [ ] Update streak logic
  - [ ] Check milestones
  - [ ] Unlock rewards
- [ ] Test streak calculations
- [ ] Test milestone detection
- [ ] Handle edge cases (date changes, timezones)

### 5.3 Progress Display
- [ ] Create components/ProgressBar.svelte
  - [ ] XP bar with fill animation
  - [ ] Streak counter
  - [ ] Level display (optional)
- [ ] Add progress display to pet view
- [ ] Update reactively after note completion

### 5.4 Milestone Celebrations
- [ ] Define milestone rewards
- [ ] Implement unlock notifications
- [ ] Trigger big-celebration animation
- [ ] Show milestone achievement message

### 5.5 Settings Display
- [ ] Add progress summary to settings tab
  - [ ] Total XP
  - [ ] Current streak
  - [ ] Longest streak
  - [ ] Completed notes count
  - [ ] Unlocked milestones
- [ ] Add reset progress button
- [ ] Add confirmation dialog

**Deliverable:** Complete gamification system

**Acceptance Criteria:**
- ✅ XP awarded on note completion
- ✅ Streak tracked correctly (consecutive days)
- ✅ Milestones detected and celebrated
- ✅ Progress displays update in real-time
- ✅ Progression data persists correctly
- ✅ Reset button works safely

---

## Phase 6: Calendar View (Week 10)

**Goal:** Add calendar navigation for daily notes

### 6.1 Calendar View ItemView
- [ ] Create views/CalendarView.ts
  - [ ] Extend ItemView
  - [ ] Register view type
  - [ ] Add command to open
- [ ] Create components/Calendar.svelte
  - [ ] Month view grid
  - [ ] Day cells with click handlers
  - [ ] Navigation (prev/next month)
  - [ ] Today indicator

### 6.2 Calendar Data Integration
- [ ] Load all daily notes
- [ ] Mark completed days
- [ ] Show streak visualization
- [ ] Highlight today
- [ ] Indicate VaultPal completion status

### 6.3 Calendar Interactions
- [ ] Click day to open/create note
- [ ] Click day to start conversation
- [ ] Show tooltip on hover (XP, notes)
- [ ] Navigate months/weeks

### 6.4 View Switching
- [ ] Add toggle between Pet View and Calendar View
- [ ] Persist last viewed mode
- [ ] Smooth transitions

**Deliverable:** Functional calendar view

**Acceptance Criteria:**
- ✅ Calendar displays current month
- ✅ Completed days visually indicated
- ✅ Clicking day opens/creates note
- ✅ Streak visualization clear
- ✅ Can navigate months
- ✅ Can switch between Pet and Calendar views

---

## Phase 7: Polish & Testing (Week 11)

**Goal:** Refine UX, fix bugs, optimize performance

### 7.1 Visual Polish
- [ ] Refine pet animations
- [ ] Polish chat interface
- [ ] Improve transitions
- [ ] Add micro-interactions
- [ ] Ensure consistent theming (light/dark)

### 7.2 Error Handling
- [ ] Graceful handling of missing files
- [ ] Clear error messages
- [ ] Recovery from failures
- [ ] Validation feedback

### 7.3 Performance Optimization
- [ ] Profile animation performance
- [ ] Optimize SVG file sizes
- [ ] Lazy load assets
- [ ] Reduce memory footprint
- [ ] Test in large vaults

### 7.4 Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader support (basic)
- [ ] Focus management
- [ ] High contrast mode

### 7.5 Testing
- [ ] Test on Windows
- [ ] Test on macOS
- [ ] Test on Linux
- [ ] Test mobile compatibility
- [ ] Test with various themes
- [ ] Test with other plugins enabled

### 7.6 Documentation
- [ ] Write user-facing README
- [ ] Create installation instructions
- [ ] Document template syntax
- [ ] Add troubleshooting guide
- [ ] Create demo vault

**Deliverable:** Production-ready plugin

**Acceptance Criteria:**
- ✅ No critical bugs
- ✅ Smooth performance on all platforms
- ✅ Clear user documentation
- ✅ Handles edge cases gracefully
- ✅ Works with popular plugins
- ✅ Passes Obsidian plugin guidelines

---

## Phase 8: Release Preparation (Week 12)

**Goal:** Prepare for Obsidian community plugin release

### 8.1 Final Art Assets
- [ ] Replace placeholder SVGs with final art
- [ ] Ensure Korean kawaii style
- [ ] Optimize all assets
- [ ] Create asset variants (optional)

### 8.2 Plugin Submission Requirements
- [ ] Create comprehensive README
- [ ] Add screenshots/GIFs
- [ ] Write clear description
- [ ] Add license (MIT recommended)
- [ ] Create release notes
- [ ] Tag version 1.0.0

### 8.3 Submit to Obsidian
- [ ] Fork obsidian-releases repository
- [ ] Add plugin to community-plugins.json
- [ ] Create PR with required files:
  - [ ] manifest.json
  - [ ] README.md
  - [ ] main.js
  - [ ] styles.css
- [ ] Respond to reviewer feedback
- [ ] Address any required changes

### 8.4 Marketing & Community
- [ ] Post in Obsidian forums
- [ ] Share on Reddit r/ObsidianMD
- [ ] Tweet announcement
- [ ] Create demo video (optional)
- [ ] Set up GitHub Discussions

**Deliverable:** Published plugin

**Acceptance Criteria:**
- ✅ Plugin approved by Obsidian team
- ✅ Listed in community plugins
- ✅ Users can install via Obsidian
- ✅ GitHub repository well-documented
- ✅ Clear contribution guidelines

---

## Post-MVP: Phase 9+ (Future)

### Planned Enhancements
- [ ] Voice input (local Whisper)
- [ ] Multiple pet types
- [ ] Journey progression system
- [ ] Paid asset packs
- [ ] Advanced customization
- [ ] Habit tracking integration
- [ ] AI conversation mode (BYOK)
- [ ] Custom greeting lists
- [ ] Pet emotes system

---

## Development Principles

### Code Quality
- Write clean, maintainable TypeScript
- Use consistent naming conventions
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Prefer composition over inheritance

### Testing Strategy
- Manual testing in Obsidian
- Test with real daily note templates
- Test with various plugin combinations
- Test across operating systems
- Use console logging for debugging

### Performance Guidelines
- Target 60 FPS for animations
- Lazy load assets when possible
- Minimize DOM manipulations
- Use CSS transforms for animations
- Profile with Chrome DevTools

### User Experience
- Keep UI simple and intuitive
- Provide helpful error messages
- Never lose user data
- Make setup easy
- Respect Obsidian conventions

---

## Risk Management

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Animation performance issues | High | Medium | Profile early, optimize SVGs, use GPU transforms |
| Daily Notes conflicts | High | Medium | Use official API, extensive testing |
| Templater compatibility | Medium | Medium | Clear documentation, escape mechanisms |
| Template parsing edge cases | Medium | High | Comprehensive testing, validation |
| Mobile compatibility issues | Medium | Low | Responsive design, mobile testing |
| Art asset delays | Low | Medium | Use placeholders, iterate on art |

---

## Success Metrics (3 months post-launch)

- **Downloads:** 1,000+ installations
- **Rating:** 4+ stars
- **GitHub Stars:** 50+
- **Active Users:** 500+ weekly
- **Bug Reports:** < 10 critical bugs
- **Community Engagement:** Regular forum discussions

---

## Team & Responsibilities

**Developer (You):**
- Core plugin development
- TypeScript/Svelte implementation
- Testing and debugging
- Documentation
- GitHub management

**AI Coding Agents:**
- Code generation
- Bug fixing
- Refactoring
- Research
- Code review

**Artist (TBD):**
- Fox character design
- Animation states (7 variations)
- Background assets
- Accessory designs

---

## Timeline Summary

```
Week 1-2:   Foundation & Setup
Week 3-4:   Pet View & Animations
Week 5-6:   Template & Daily Notes
Week 7-8:   Conversation Flow
Week 9:     Progression System
Week 10:    Calendar View
Week 11:    Polish & Testing
Week 12:    Release Preparation

Total: 12 weeks for MVP
```

**Critical Path:**
Foundation → Pet View → Template Parsing → Conversation Flow → Progression → Release

**Parallel Tracks:**
- Art asset creation (ongoing)
- Documentation (ongoing)
- Testing (ongoing)

---

## Next Immediate Steps

1. **Set up project structure** (Phase 1.1)
   - Create all folders
   - Initialize package.json
   - Configure TypeScript and esbuild

2. **Create basic plugin** (Phase 1.3)
   - Implement main.ts
   - Test in Obsidian
   - Verify hot reload works

3. **Start pet view** (Phase 2.1)
   - Create PetView.ts
   - Register view
   - Display "Hello World"

4. **Commission placeholder art** (Phase 2.2)
   - Brief artist on requirements
   - Get 7 SVG placeholders
   - Set up asset pipeline

---

## Questions to Resolve

- [ ] Who will create the final SVG assets?
- [ ] What's the process for art asset iteration?
- [ ] Should we support custom greetings in MVP?
- [ ] Do we need a "skip question" feature?
- [ ] Should streak reset be harsh or gentle?
- [ ] What XP amounts for different actions?

---

**Document Status:** Living document, update as project progresses
**Last Review:** 2026-02-04
**Next Review:** When Phase 1 completes
