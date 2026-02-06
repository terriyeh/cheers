# Visual Testing Checklist

This checklist should be performed whenever CSS changes are made to the plugin, especially changes affecting:
- Background colors and theming
- Button positioning and styling
- View layout and responsive design
- State-specific styling

## Prerequisites
- Obsidian must be running
- Vault Pal plugin must be installed and enabled
- Test vault with sample notes available

---

## Basic Visual Testing

### Theme Compatibility
- [ ] **Light Theme**: Open Vault Pal → Settings → Appearance → Theme → Light
  - Background color matches Obsidian's light theme (no white-on-gray)
  - Pet view background inherits theme color
  - Buttons have appropriate contrast
  - All text is readable

- [ ] **Dark Theme**: Switch to dark theme
  - Background color matches Obsidian's dark theme
  - Pet view background inherits theme color
  - Buttons have appropriate contrast
  - All text is readable

- [ ] **Custom Community Theme**: Install and test with 1-2 popular themes
  - Minimal: Test with minimal theme (common choice)
  - Other: Test with user's preferred theme if known
  - Verify no visual artifacts or color clashes

### Button Positioning and Styling

- [ ] **Sidebar Placement**
  - Open Pet View in right sidebar
  - Calendar button appears in top-right corner
  - Button is floating style (no border, no shadow)
  - Button has slight background (visible but not intrusive)
  - Hover state shows darker background
  - More options menu (three dots) appears below calendar button

- [ ] **Main View Placement**
  - Drag Pet View to main editor area
  - Button adapts to new context (background matches)
  - No white background or border appears on buttons
  - Buttons remain in top-right corner (not in header bar)
  - Layout doesn't break or overlap content

- [ ] **Multiple Locations**
  - Test moving Pet View between different panes
  - Test split view with Pet View on left/right/top/bottom
  - Verify consistent styling across all placements

### Pet Display

- [ ] **State-Specific Styling**
  - Pet in idle state: Default styling
  - Pet in greeting state: Default styling
  - Pet in sleeping state: Opacity reduced (visible dimming)
  - Pet in encouraging state: Left border with accent color visible

- [ ] **Sprite Sheet Loading**
  - Sprite sheet loads correctly (no broken images)
  - Animations play smoothly
  - No visual glitches or tearing during state transitions

### Responsive Design

- [ ] **Window Resizing**
  - Resize Obsidian window to minimum width
  - Verify Pet View remains usable
  - Buttons don't overlap or disappear
  - Pet display scales appropriately

- [ ] **Narrow Panes**
  - Split view into narrow panes (200-300px wide)
  - Verify Pet View degrades gracefully
  - Padding adjusts for narrow width (media query at 768px)

---

## Error State Testing

- [ ] **Loading State**
  - Restart Obsidian
  - Verify loading message appears briefly
  - Loading state styling is consistent with theme

- [ ] **Error State**
  - Simulate error (e.g., delete sprite sheet file temporarily)
  - Verify error message displays correctly
  - Error styling uses appropriate color (red/warning)
  - Error hint text is readable and helpful

---

## Interaction Testing

- [ ] **Button Clicks**
  - Click calendar button
  - Verify button visual feedback on click (no stuck states)
  - Verify note opens without visual glitches

- [ ] **Hover States**
  - Hover over calendar button
  - Background darkens slightly
  - Transition is smooth (no jarring changes)
  - Cursor changes to pointer

- [ ] **Focus States**
  - Tab to calendar button using keyboard
  - Focus indicator is visible and clear
  - Focus style matches Obsidian's patterns

---

## Integration Testing

- [ ] **With Other Plugins**
  - Enable common plugins (Calendar, Kanban, Excalidraw)
  - Verify no visual conflicts
  - Verify buttons don't overlap other plugins' UI

- [ ] **Modal Overlays**
  - Open settings modal while Pet View is visible
  - Verify modal appears on top correctly
  - Verify Pet View doesn't interfere with modal styling

---

## Cross-Platform Testing (If Available)

- [ ] **Windows**
  - Test on Windows 10/11
  - Verify fonts render correctly
  - Verify button sizing is appropriate

- [ ] **macOS**
  - Test on macOS (if available)
  - Verify native macOS appearance works
  - Verify button styling matches platform expectations

- [ ] **Linux**
  - Test on Linux (if available)
  - Verify compatibility with GTK/Qt themes

---

## Regression Checks

Before marking as complete, verify that previous issues don't reoccur:

- [ ] No white background on top of gray (Issue from manual testing session)
- [ ] Buttons visible in all contexts (Issue from manual testing session)
- [ ] Buttons adapt to sidebar vs main view (Issue from manual testing session)
- [ ] No border or drop shadow on buttons (Graph view styling pattern)

---

## Documentation

After completing visual testing:

- [ ] Update `TEST_SUMMARY.md` with visual testing results
- [ ] Note any visual issues found and their resolution
- [ ] Capture screenshots for documentation (optional but recommended)
- [ ] Update this checklist if new visual tests are needed

---

## Known Visual Issues

Document any known visual issues that are acceptable or planned for future fixes:

- **None currently** - All visual issues from Issue #13 testing have been resolved

---

## Testing Tools (Optional)

For automated visual regression testing in the future:

- **Playwright**: For screenshot comparison
- **Percy**: Visual testing platform
- **Chromatic**: Storybook visual testing
- **Manual Comparison**: Side-by-side screenshot comparison

---

## Sign-Off

Tester: ___________________
Date: ___________________
Obsidian Version: ___________________
Plugin Version: ___________________

Result: [ ] PASS  [ ] FAIL  [ ] PARTIAL (with notes)

Notes:
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
