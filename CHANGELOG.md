# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-03-27

### Added
- Initial release of Blast Radius
- React component dependency analysis
- Blast radius metrics calculation (Fan-In, Fan-Out, Depth, Breadth, Risk Score)
- Interactive graph visualization with Sigma.js
- Multiple LLM provider support (OpenAI, Claude, DeepSeek, Gemini, Ollama)
- AI-powered architecture analysis
- Configurable file scanning with glob patterns
- Path alias resolution from tsconfig.json
- Incremental analysis with caching
- Multiple output formats (HTML, JSON)
- CLI with progress indicators
- Dark Cyberpunk Neon UI theme
- Risk level distribution visualization
- Top risk components ranking
- Component detail panel with dependency tree

### Features
- **Component Detection**: Automatic detection of React components (function components, class components, memo, forwardRef)
- **Dependency Resolution**: Full support for import/export analysis and path aliases
- **Risk Assessment**: Weighted algorithm calculating blast radius and risk levels
- **Interactive Visualization**: Zoomable, searchable dependency graph
- **AI Insights**: LLM-powered architectural analysis and refactoring suggestions
- **Performance**: Worker threads for parallel parsing, incremental analysis

### Technical Details
- Built with TypeScript 5.4
- CLI using Commander.js
- Bundled with tsup
- Visualization with React 18 + Vite 5
- Graph rendering with Sigma.js + Graphology
- Styling with Tailwind CSS 3

### Supported File Types
- `.tsx` (TypeScript React)
- `.ts` (TypeScript)
- `.jsx` (JavaScript React)
- `.js` (JavaScript)

### Tested With
- Node.js 18+
- React 18.2+
- Vite 5.4+

[1.0.0]: https://github.com/qing/blast-radius/releases/tag/v1.0.0
