# Changelog

All notable changes to Vault Pal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Welcome modal for first-run configuration (Issue #3)
- Pet name setting with validation (1-30 chars, alphanumeric + spaces)
- User name setting (optional) with validation (0-30 chars, alphanumeric + spaces)
- Personalized messages using pet name and user name
  - Greeting message: "Hello [userName]!" (or "Hello there!" if no userName)
  - Talking message: "How was your day, [userName]?" (or generic if no userName)
- Command palette command "Edit Pet Settings" to reopen welcome modal
- 37 comprehensive tests for settings validation and persistence
- Automatic Daily Notes configuration detection
- Manual state triggers for development (console debug commands)

### Changed
- Welcome modal now appears on first view open instead of plugin load
- Settings stored in modal-based pattern instead of settings page

### Technical
- Settings interface: `VaultPalSettings` (petName, userName, hasCompletedWelcome)
- Settings persistence to `.obsidian/plugins/vault-pal/data.json`
- Real-time input validation with error messages
- Modal-based settings pattern (no dedicated settings page)
- Build-time conditionals for debug code (`__DEV__` flag)

## [0.0.1] - 2026-02-04

### Added
- Initial project setup
- Pet view foundation with state machine (Issue #4)
- 7 animation states (idle, greeting, talking, listening, small-celebration, big-celebration, petting)
- 120 tests for pet view and state machine with 100% coverage
- Sprite-based animation system with pixel art
- State transitions with auto-return to idle
- Svelte component architecture
- Security hardening (path validation, state validation, error cleanup)
- Integration tests for complex state sequences
- Development console commands for manual state testing (`window.vaultPalDebug`)
