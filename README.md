# Android & Flutter Reference Projects 📱

> **Curated collection of production-ready Android (Kotlin) and Flutter reference implementations for mobile app development**

A comprehensive learning resource featuring real production apps, official samples, and complete architecture examples. Perfect for developers building modern Android/Flutter applications or migrating from iOS.

## 🎯 Purpose

**This is a personal reference library** - a curated collection of existing open-source projects organized for quick learning and pattern reference. This repository does NOT contain original code but rather serves as:

- **Learning Resource** - Study production-quality code from trusted sources
- **Quick Reference** - Find patterns and solutions without searching multiple repos
- **Architecture Comparison** - See different approaches side-by-side (Riverpod vs BLoC, Compose patterns, etc.)
- **iOS → Android/Flutter Migration Guide** - Technology mappings and equivalent patterns

**What this is NOT:**
- ❌ Not a template or starter kit (use official ones instead)
- ❌ Not original work (all credit to original authors)
- ❌ Not for redistribution (reference only)

**How to use this repo:**
1. Browse to find relevant examples for your use case
2. Study the code patterns and architecture
3. Apply learnings to your own projects
4. Reference the detailed READMEs in each section

---

## 📦 What's Included

This repository contains **18,340+ files** (~251 MB) of production-quality code organized into two main sections:

### 🟢 Kotlin Android (5,960 files)
Three approaches to modern Android development with Jetpack Compose

### 🔵 Flutter (8,090 files)
Three state management patterns with complete app examples

---

## 🗂️ Repository Structure

```
Android/
├── Kotlin/android/                     # Native Android with Kotlin
│   ├── 01-openclaw-production-app/    # Real production AI voice app
│   ├── 02-compose-playground-examples/ # UI component examples
│   ├── 03-official-compose-samples/   # Google's official samples
│   └── README.md                      # Detailed Kotlin guide
│
└── flutter/                           # Cross-platform Flutter
    ├── 1-riverpod-examples/           # Modern state management
    ├── 2-bloc-examples/               # Structured state management
    ├── 3-flutter-official-samples/    # Official Flutter samples
    ├── README.md                      # Detailed Flutter guide
    └── QUICK_REFERENCE.md            # iOS → Flutter migration guide
```

---

## 🚀 Quick Start

### Prerequisites

**For Kotlin/Android:**
```bash
# Install Android Studio
# https://developer.android.com/studio

# Open a project
open -a "Android Studio" Kotlin/android/01-openclaw-production-app/apps/android
```

**For Flutter:**
```bash
# Install Flutter
brew install flutter
flutter doctor

# Run an example
cd flutter/3-flutter-official-samples/compass_app/app
flutter pub get
flutter run
```

---

## 📚 Learning Paths

### Path 1: Kotlin/Android (Native)

#### Beginner (Week 1)
1. **02-compose-playground-examples/** - Learn Compose components
2. **03-official-compose-samples/JetNews/** - Basic app structure

#### Intermediate (Week 2)
1. **03-official-compose-samples/Jetcaster/** - Complete production app
2. **03-official-compose-samples/Reply/** - Complex navigation

#### Advanced (Week 3)
1. **01-openclaw-production-app/** - Real AI voice app architecture
   - Study MVVM pattern
   - Hilt dependency injection
   - Background services
   - WebRTC integration

### Path 2: Flutter (Cross-platform)

#### Beginner (Week 1)
1. **3-flutter-official-samples/navigation_and_routing/** - Learn go_router
2. **1-riverpod-examples/examples/counter/** - State management basics

#### Intermediate (Week 2)
1. **1-riverpod-examples/examples/marvel/** ⭐ - REST API integration
2. **2-bloc-examples/examples/flutter_login/** - Forms & authentication

#### Advanced (Week 3)
1. **3-flutter-official-samples/compass_app/** ⭐⭐⭐ - **MOST IMPORTANT**
   - Complete production architecture
   - Clean architecture pattern
   - Repository pattern
   - Freezed models
   - Comprehensive testing

---

## 🎯 Key Projects to Study

### Kotlin Android

| Project | Best For | Key Technologies |
|---------|----------|------------------|
| **OpenClaw Production App** | Real-world architecture | Compose, Hilt, MVVM, WebRTC |
| **Compose Playground** | Learning UI components | All Compose widgets, animations |
| **Jetcaster** (Official) | Media apps | ExoPlayer, background services |
| **Jetsnack** (Official) | E-commerce UI | Complex layouts, animations |

### Flutter

| Project | Best For | Key Technologies |
|---------|----------|------------------|
| **Compass App** ⭐⭐⭐ | Complete blueprint | go_router, Freezed, clean architecture |
| **Marvel API Example** | REST integration | Dio, async/await, error handling |
| **Flutter Login (BLoC)** | Authentication | Form validation, BLoC pattern |
| **Riverpod Todos** | CRUD operations | State management, local storage |

---

## 🛠️ Tech Stack Overview

### Kotlin Android Stack

```kotlin
// Core
- Jetpack Compose (UI)
- Material 3 (Design)
- Kotlin Coroutines (Async)
- Hilt (Dependency Injection)

// Architecture
- MVVM (Model-View-ViewModel)
- Repository Pattern
- UseCase Pattern

// Navigation
- Navigation Compose

// Networking
- Ktor or Retrofit
- OkHttp
```

### Flutter Stack

```yaml
# State Management (Choose one)
- Riverpod (Modern, recommended)
- BLoC (Structured, testable)
- Provider (Simple)

# Navigation
- go_router (Type-safe routing)

# Networking
- Dio (HTTP client)
- pretty_dio_logger

# Local Storage
- Hive (NoSQL database)
- flutter_secure_storage (Keychain equivalent)

# Code Generation
- Freezed (Immutable models)
- json_serializable
```

---

## 💡 iOS to Android/Flutter Migration

Perfect for iOS developers! This repository includes:

### Technology Mapping

| iOS | Kotlin Android | Flutter |
|-----|----------------|---------|
| `SwiftUI` | `Jetpack Compose` | `Flutter Widgets` |
| `@Observable` | `ViewModel + StateFlow` | `Riverpod Provider` |
| `SwiftData` | `Room` | `Hive` / `Drift` |
| `Keychain` | `EncryptedSharedPreferences` | `flutter_secure_storage` |
| `AVFoundation` | `ExoPlayer` / `MediaPlayer` | `audioplayers` / `record` |
| `URLSession` | `Ktor` / `Retrofit` | `Dio` |
| `NavigationStack` | `Navigation Compose` | `go_router` |
| `@Published` | `StateFlow` / `LiveData` | `StateNotifier` / `AsyncValue` |

See **`flutter/QUICK_REFERENCE.md`** for comprehensive iOS → Flutter migration guide.

---

## 🔍 Find Specific Patterns

| I Need... | Look Here |
|-----------|-----------|
| **REST API calls** | `flutter/1-riverpod-examples/examples/marvel/` |
| **Authentication flow** | `flutter/2-bloc-examples/examples/flutter_login/` |
| **Form validation** | `flutter/3-flutter-official-samples/form_app/` |
| **Navigation & routing** | `flutter/3-flutter-official-samples/compass_app/` |
| **Media playback** | `Kotlin/android/03-official-compose-samples/Jetcaster/` |
| **Complex animations** | `Kotlin/android/02-compose-playground-examples/` |
| **Dependency injection** | `Kotlin/android/01-openclaw-production-app/` |
| **Complete architecture** | `flutter/3-flutter-official-samples/compass_app/` ⭐ |
| **Testing patterns** | `flutter/3-flutter-official-samples/compass_app/test/` |
| **Platform channels** | `flutter/3-flutter-official-samples/platform_channels/` |

---

## 📖 Documentation

Each section includes comprehensive documentation:

- **[Kotlin/android/README.md](Kotlin/android/README.md)** - Complete Kotlin/Android guide
  - Project structures
  - Build configurations
  - Architecture patterns
  - Learning recommendations

- **[flutter/README.md](flutter/README.md)** - Complete Flutter guide
  - State management comparison
  - API integration patterns
  - Production architecture
  - iOS → Flutter mapping

- **[flutter/QUICK_REFERENCE.md](flutter/QUICK_REFERENCE.md)** - iOS developer's Flutter cheat sheet

---

## 🎓 Recommended Study Order

**For Complete Beginners:**
1. Start with Flutter (easier learning curve)
2. Study `compass_app` for architecture
3. Build a simple CRUD app with Riverpod

**For iOS Developers:**
1. Read `flutter/QUICK_REFERENCE.md` first
2. Compare iOS patterns with Flutter equivalents
3. Study `compass_app` architecture
4. Port a small iOS app to Flutter

**For Android Developers:**
1. Study Kotlin examples if new to Compose
2. Compare with Flutter for cross-platform needs
3. Reference OpenClaw for production patterns

**For Full Production Apps:**
1. Study `compass_app` (Flutter) or `Jetcaster` (Android) first
2. Understand clean architecture pattern
3. Study `openclaw-production-app` for real-world complexity
4. Reference `marvel` example for API integration

---

## 🏗️ Building Your Own App

### Quick Template Setup

**Kotlin Android:**
```bash
# Create new Android project in Android Studio
# File → New → New Project → Empty Activity (Compose)

# Then reference these patterns:
# - Architecture: openclaw-production-app
# - UI Components: compose-playground-examples
# - Best practices: official-compose-samples
```

**Flutter:**
```bash
# Create new Flutter app
flutter create --org com.yourcompany your_app_name
cd your_app_name

# Add dependencies (see flutter/README.md for full list)
flutter pub add flutter_riverpod
flutter pub add go_router
flutter pub add dio
flutter pub add hive_flutter

# Study compass_app for folder structure
# Copy architecture patterns from examples
```

---

## 🤝 Attribution & Credits

This is a curated reference collection. All credit goes to the original authors:

### Kotlin Android
- **OpenClaw** - [openclaw.ai](https://openclaw.ai) - Production AI app
- **Compose Playground** - Community Compose examples
- **Official Compose Samples** - [Google](https://github.com/android/compose-samples)

### Flutter
- **Riverpod Examples** - [riverpod.dev](https://riverpod.dev)
- **BLoC Examples** - [bloclibrary.dev](https://bloclibrary.dev)
- **Flutter Samples** - [Google Flutter Team](https://github.com/flutter/samples)

**Purpose of this repository:** Personal learning and quick reference. Not intended for redistribution without proper attribution to original authors.

---

## 📊 Repository Stats

- **Total Files:** 18,340+
- **Total Size:** ~251 MB
- **Languages:** Kotlin, Dart, TypeScript
- **Kotlin Projects:** 3 major reference implementations
- **Flutter Projects:** 3 state management approaches + 15+ example apps

---

## 📝 License

Each project within this repository maintains its original license:
- **Official Google Samples:** Apache 2.0
- **Community Examples:** Various open source licenses
- **OpenClaw:** Check original repository

See individual project directories for specific license information.

---

## 🔗 Useful Resources

### Official Documentation
- [Android Developers](https://developer.android.com)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)
- [Flutter](https://flutter.dev)
- [Kotlin](https://kotlinlang.org)
- [Dart](https://dart.dev)

### State Management
- [Riverpod](https://riverpod.dev)
- [BLoC](https://bloclibrary.dev)
- [Provider](https://pub.dev/packages/provider)

### Architecture
- [Android Architecture Guide](https://developer.android.com/topic/architecture)
- [Flutter Architecture Samples](https://github.com/brianegan/flutter_architecture_samples)

---

## 🎯 Next Steps

1. **Explore the code** - Pick a project from the table above
2. **Run the examples** - Follow quick start instructions
3. **Study the patterns** - Read the detailed READMEs in each section
4. **Build something** - Apply what you learned to your own project

---

**Happy coding!** 🚀

*Last Updated: February 2, 2026*
*Maintained by: [willem4130](https://github.com/willem4130)*
