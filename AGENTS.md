# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## 🚀 Build/Test Commands

- **Dev Server:** `npm run dev`
- **Build:** `npm run build`
- **Preview Build:** `npm run preview`
- **Testing:** No test script found. Check project structure for tests.

## 📋 Code Style Guidelines

- **Project Type:** TypeScript, React, Vite.
- **Formatting:** Follow standard TypeScript/Prettier conventions.
- **Imports:** Order: 1. Standard library, 2. Third-party, 3. Local.
- **Types:** Use TypeScript `interface` or `type` for complex objects.
- **Naming:** `camelCase` for variables/functions, `PascalCase` for components/classes, `UPPERCASE` for constants.
- **Error Handling:** Use `try/catch` for async operations. Provide meaningful error messages.
- **Dependencies:** Use existing libraries (`react`, `@google/genai`) before adding new ones.
