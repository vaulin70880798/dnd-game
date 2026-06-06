# Dungeon Master AI (SwiftUI)

This folder contains a full SwiftUI implementation scaffold for the **Dungeon Master AI** iOS experience, styled with the Ember-Gold on Charcoal design system.

## Implemented

- Splash -> Home transition with pulsing logo animation
- Root `TabView` navigation: Home, Campaigns, Codex, Settings
- Setup Wizard (3-step character creation) with AI auto-fill (magic wand)
- Gameplay interface with:
  - custom segmented control (`Adventure` / `Gameplay`)
  - scrollable game log using `ScrollViewReader` auto-scroll
  - D20 roll action + haptics
  - AI tuning sliders (temperature, length, top-p, top-k)
  - parallax header blended by linear gradient
- Codex cards with detail modal and manual card creation
- Campaign list with resume and summary modal
- SwiftData persistence for campaigns, messages, and codex entries
- OpenAI key storage in iOS Keychain (`Settings` only input location)
- Functional gate: app interactions remain locked until API key exists

## Integration note

These source files are ready to be dropped into an Xcode iOS app target (iOS 17+ recommended for SwiftData).
