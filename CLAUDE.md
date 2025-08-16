# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jan is a local AI assistant application that runs 100% offline. It's built with a Tauri desktop application architecture using React (TypeScript) for the frontend and Rust for the backend. The project allows users to download and run Large Language Models (LLMs) locally with full privacy control.

## Build and Development Commands

### Quick Setup
```bash
# Using Make (recommended)
make dev          # Full development setup and launch
make build        # Production build
make test         # Run tests and linting
make clean        # Delete everything and start fresh

# Using Mise (alternative, handles tool versions automatically)
mise dev          # Full development setup and launch
mise build        # Production build
mise test         # Run tests and linting
mise clean        # Delete everything and start fresh
```

### Manual Development
```bash
yarn install
yarn build:core
yarn build:extensions
yarn dev          # Start development server
```

### Testing and Quality
```bash
yarn lint                    # Run ESLint on web-app
yarn test                    # Run all tests (Vitest)
yarn test:watch             # Run tests in watch mode
yarn test:coverage          # Run tests with coverage
yarn workspace @janhq/web-app test  # Run web-app tests only
cd core && yarn test         # Run core tests only
```

### Building Components
```bash
yarn build:core             # Build @janhq/core package
yarn build:extensions       # Build all extensions (creates .tgz files)
yarn build:web              # Build web-app
yarn build:tauri            # Build Tauri desktop app
```

## Architecture Overview

### Core Components

**@janhq/core** (`/core/`): Central library containing:
- Type definitions for all entities (models, messages, threads, assistants, etc.)
- Event system using RxJS
- Browser and Node.js compatibility layer
- Extension interfaces and APIs

**Web App** (`/web-app/`): React frontend using:
- Vite for bundling
- TanStack Router for routing
- Zustand for state management
- Tauri APIs for desktop integration
- Tailwind CSS with Radix UI components

**Tauri Backend** (`/src-tauri/`): Rust backend providing:
- File system operations
- Model management and inference (llama.cpp integration)
- MCP (Model Context Protocol) server management
- Hardware detection and system info
- Extension lifecycle management
- App configuration and data folder management

### Extension System

Extensions are packaged as `.tgz` files in `/pre-install/` and loaded at runtime:
- `janhq-assistant-extension`: Assistant management
- `janhq-conversational-extension`: Chat/conversation handling  
- `janhq-download-extension`: Model downloading
- `janhq-llamacpp-extension`: llama.cpp inference engine

Each extension in `/extensions/` has its own `package.json`, TypeScript source, and build configuration.

### Key Directories

- `/core/src/types/`: TypeScript type definitions for all entities
- `/web-app/src/services/`: Frontend service layer for API calls
- `/web-app/src/hooks/`: React hooks for state management
- `/web-app/src/containers/`: Complex UI components
- `/src-tauri/src/core/`: Rust backend modules (commands, MCP, threads, etc.)
- `/docs/`: Documentation website (Next.js)

### State Management

- Frontend uses Zustand stores for local state
- Backend maintains state through Tauri's managed state system
- Cross-component communication via events from @janhq/core
- Local storage for user preferences and configuration

### API Layer

- Tauri invoke commands bridge frontend/backend
- OpenAI-compatible API server runs on localhost:1337
- MCP integration for external tool connectivity
- Extension API for third-party integrations

## Development Workflow

1. Install dependencies: `make install-and-build` or `yarn install && yarn build:core && yarn build:extensions`
2. Start development: `make dev` or `yarn dev`
3. The app launches with hot reload enabled
4. Backend changes require restart; frontend changes hot reload
5. Run tests before committing: `make test` or `yarn test`
6. Use `make clean` if you encounter build issues

## Testing Strategy

- **Web App**: Vitest with React Testing Library, JSDOM environment
- **Core**: Vitest for TypeScript logic and type validation  
- **Backend**: Cargo test for Rust components
- **Integration**: Full app testing through Tauri test features
- Coverage reports available via `yarn test:coverage`

## Key Technologies

- **Frontend**: React 19, TypeScript, Vite, TanStack Router, Zustand, Tailwind CSS
- **Backend**: Rust, Tauri 2.x, tokio for async operations
- **AI/ML**: llama.cpp integration, HuggingFace model support
- **Build**: Yarn workspaces, Rolldown for bundling, cross-platform builds
- **Testing**: Vitest, React Testing Library, Cargo test