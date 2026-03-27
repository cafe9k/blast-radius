# Contributing to Blast Radius

Thank you for your interest in contributing to Blast Radius! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Clone repository
git clone https://github.com/qing/blast-radius.git
cd blast-radius

# Install dependencies
pnpm install

# Build CLI
pnpm build

# Build React app
cd app && pnpm install && pnpm build
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow the existing code style
- Write clear commit messages
- Add tests for new functionality

### 3. Run Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck
```

### 4. Submit a Pull Request

- Push your branch to GitHub
- Create a pull request with a clear description
- Link any relevant issues

## Project Structure

```
blast-radius/
├── src/              # CLI source code
│   ├── analyzer/     # File scanner and parser
│   ├── metrics/      # Blast radius calculation
│   ├── ai/           # LLM integration
│   ├── output/       # Report generation
│   └── types/        # TypeScript types
├── app/              # React visualization app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   └── types/       # App types
├── __tests__/        # Unit tests
└── docs/             # Documentation
```

## Coding Guidelines

### TypeScript

- Use strict mode
- Define explicit types for all functions
- Avoid `any` when possible
- Use interfaces for object shapes

### React

- Use functional components
- Follow hooks rules
- Keep components under 300 lines
- Use Tailwind CSS for styling

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
test: add tests
refactor: refactor code
```

## Testing

### Unit Tests

- Write tests for all new functionality
- Maintain > 80% code coverage
- Use vitest for testing

### Integration Tests

- Test CLI commands
- Test React components

## Documentation

- Update README.md for user-facing changes
- Update CHANGELOG.md for releases
- Add inline comments for complex logic

## Questions?

Open an issue on GitHub or join our discussions.

Thank you for contributing! 🎉
