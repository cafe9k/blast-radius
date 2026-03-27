---
name: blast-radius-webapp
overview: 创建一个 CLI 工具 + React 可视化应用的混合方案：CLI 负责分析项目依赖并生成数据，React 应用负责生成交互式可视化报告，用户可在浏览器中查看分析结果。
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Cyberpunk Neon UI
    - Data Visualization
    - Dark Theme
    - Interactive Graph
    - Glassmorphism
  fontSystem:
    fontFamily: JetBrains Mono
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#00D9FF"
      - "#7C3AED"
      - "#10B981"
    background:
      - "#0F0F23"
      - "#1A1A2E"
      - "#16213E"
    text:
      - "#E2E8F0"
      - "#94A3B8"
      - "#64748B"
    functional:
      - "#10B981"
      - "#F59E0B"
      - "#F97316"
      - "#EF4444"
todos:
  - id: setup-project
    content: 初始化项目：配置 TypeScript、tsup、ESLint、package.json，搭建 CLI + React 双入口结构
    status: completed
  - id: implement-scanner
    content: 实现文件扫描器和 AST 解析器（React），支持路径别名解析
    status: completed
    dependencies:
      - setup-project
  - id: build-dependency-graph
    content: 使用 graphology 构建依赖图并实现爆炸半径计算引擎
    status: completed
    dependencies:
      - implement-scanner
  - id: create-react-app
    content: 搭建 React 可视化应用：配置 Vite + Tailwind + Sigma.js，实现布局和基础组件
    status: completed
    dependencies:
      - setup-project
  - id: integrate-llm
    content: 集成 LLM API（OpenAI/Claude/DeepSeek）并实现智能分析和提示词模板
    status: completed
    dependencies:
      - build-dependency-graph
  - id: implement-visualization
    content: 实现图可视化组件：GraphCanvas、Stats、DetailPanel，完成交互逻辑
    status: completed
    dependencies:
      - create-react-app
      - build-dependency-graph
  - id: build-cli-integration
    content: 完善 CLI 命令：实现报告生成器，集成 React 应用，添加进度条和错误处理
    status: completed
    dependencies:
      - implement-visualization
      - integrate-llm
  - id: test-release
    content: 编写单元测试，准备 npm 发布配置和文档
    status: completed
    dependencies:
      - build-cli-integration
---

## 产品概述

一个本地 CLI 工具，用于分析前端项目的组件依赖关系，评估每个组件的"爆炸半径"（blast radius），从而反映项目的工程复杂度和可扩展性。

## 核心功能

- **组件依赖解析**：自动扫描和解析 React 项目中的组件导入/导出关系（后续扩展 Vue/Angular）
- **爆炸半径计算**：计算每个组件的被依赖数量、影响深度、修改风险等指标
- **LLM 智能分析**：通过大语言模型（OpenAI/Claude/DeepSeek）对依赖关系进行智能解读，提供风险评估和重构建议
- **交互式可视化**：使用 Sigma.js 生成的 React 应用展示依赖网络和爆炸半径热力图
- **多格式导出**：支持 JSON/YAML 结构化数据导出

## 用户交互流程

1. 用户在项目根目录运行 `blast-radius` 命令
2. 工具自动扫描项目文件，识别组件和依赖关系
3. 构建依赖图并计算爆炸半径指标
4. 调用 LLM API 进行智能分析（可选）
5. 生成包含 React 可视化应用的 HTML 报告并在浏览器中打开

## 技术栈选择

### CLI 部分（分析引擎）

- **语言**：Node.js 18+ / TypeScript 5.x
- **CLI 框架**：Commander.js - 成熟的 CLI 开发框架
- **构建工具**：tsup - 快速的 TypeScript 打包工具
- **代码解析**：TypeScript Compiler API / @babel/parser - 支持 JSX/TSX
- **路径解析**：enhanced-resolve - Webpack 同款模块解析器
- **文件扫描**：fast-glob - 高性能文件匹配
- **图数据结构**：graphology - 高性能图库

### 可视化应用部分

- **前端框架**：React 18
- **开发工具**：Vite 5
- **语言**：TypeScript
- **图可视化**：
- Sigma.js - 大规模图渲染
- Graphology - 图数据结构
- graphology-layout - 布局算法
- graphology-layout-force - 力导向布局
- **样式方案**：
- Tailwind CSS 3
- tailwindcss-animate - 动画插件
- Lucide React - 图标库

### LLM 集成

- **Provider 模式**：统一接口抽象，支持多种 LLM 提供商
- OpenAI GPT（支持 Azure OpenAI）
- Anthropic Claude
- DeepSeek
- Google Gemini
- Ollama（本地模型，支持离线分析）
- **配置驱动**：通过 `blast-radius.config.json` 和环境变量管理配置
- **环境变量配置**：API Key、Base URL、模型选择等

## 实施方案

### 系统架构

采用 **CLI + SPA 混合架构**：

```
blast-radius CLI (本地分析)
    ↓ 生成 JSON 数据
React 可视化应用 (预构建产物)
    ↓ 数据注入
用户浏览器 (离线运行)
```

**工作流程**：

1. CLI 扫描项目并分析依赖
2. 计算爆炸半径指标
3. 调用 LLM API 进行智能分析（可选）
4. 将分析结果序列化为 JSON 并注入预构建的 React 应用
5. 在浏览器中打开生成的报告

### 核心算法

**依赖图构建**：

- 扫描项目文件识别组件（支持 .tsx, .jsx）
- 解析 import/require 语句构建依赖关系
- 处理动态导入和别名路径（tsconfig.json paths）

**爆炸半径计算**：

- **Fan-out（出度）**：组件依赖的其他组件数量
- **Fan-in（入度）**：被其他组件依赖的数量
- **影响深度**：BFS 计算下游最大层级
- **影响广度**：修改该组件影响的文件总数
- **风险评分**：综合指标加权计算

### 性能优化

- **缓存机制**：
- 本地缓存解析结果到 `.blast-radius/cache/`
- 基于文件哈希的增量分析，仅重新分析变更文件
- LLM 分析结果缓存，避免重复调用 API
- **流式响应**：
- 实时显示分析进度（扫描、解析、计算）
- LLM 分析流式输出，实时显示分析过程
- Server-Sent Events (SSE) 或 WebSocket 实现进度推送
- **并行处理**：
- 使用 Worker Threads 并行解析多个文件
- 异步文件扫描和图构建
- **文件过滤**：
- 通过配置文件排除无关文件（node_modules、测试文件、配置文件）
- 支持 glob 模式匹配
- 默认忽略列表：`node_modules/**`, `**/*.test.{ts,tsx}`, `**/*.spec.{ts,tsx}`
- **图渲染优化**：
- WebGL 渲染（Sigma.js）
- 大规模节点虚拟化和懒加载

### 项目目录结构

```
blast-radius/
├── package.json              # 工作区配置
├── tsconfig.json             # TypeScript 配置
├── tsup.config.ts            # CLI 打包配置
├── blast-radius.config.json  # [NEW] 配置文件模板
├── Dockerfile                # [NEW] Docker 镜像配置
├── README.md
├── LICENSE
│
├── src/                      # CLI 源码
│   ├── index.ts              # [NEW] CLI 入口
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── analyze.ts    # [NEW] 分析命令
│   │   │   └── config.ts     # [NEW] 配置命令
│   │   └── ui.ts             # [NEW] 终端 UI
│   │
│   ├── analyzer/             # 分析引擎
│   │   ├── scanner.ts        # [NEW] 文件扫描器
│   │   ├── parser/
│   │   │   └── react.ts      # [NEW] React 组件解析
│   │   ├── resolver.ts       # [NEW] 模块路径解析
│   │   └── graph-builder.ts  # [NEW] 依赖图构建
│   │
│   ├── metrics/              # 指标计算
│   │   ├── calculator.ts     # [NEW] 指标计算引擎
│   │   ├── blast-radius.ts   # [NEW] 爆炸半径算法
│   │   └── types.ts          # [NEW] 指标类型定义
│   │
│   ├── ai/                   # LLM 集成
│   │   ├── client.ts         # [NEW] LLM 统一接口（Provider 模式）
│   │   ├── providers/
│   │   │   ├── base.ts       # [NEW] Provider 基类
│   │   │   ├── openai.ts     # [NEW] OpenAI 提供者（支持 Azure）
│   │   │   ├── claude.ts     # [NEW] Claude 提供者
│   │   │   ├── deepseek.ts   # [NEW] DeepSeek 提供者
│   │   │   ├── gemini.ts     # [NEW] Google Gemini 提供者
│   │   │   └── ollama.ts     # [NEW] Ollama 本地模型提供者
│   │   └── prompts.ts        # [NEW] 提示词模板
│   │
│   ├── output/
│   │   └── report-generator.ts  # [NEW] 生成 React 应用报告
│   │
│   ├── utils/                # 工具函数
│   │   ├── cache.ts          # [NEW] 缓存管理（文件哈希、增量分析）
│   │   ├── file-filter.ts    # [NEW] 文件过滤（glob 模式）
│   │   ├── logger.ts         # [NEW] 日志工具
│   │   └── config-loader.ts  # [NEW] 配置加载（JSON + 环境变量）
│   │
│   └── types/                # 类型定义
│       ├── component.ts      # [NEW] 组件类型定义
│       ├── graph.ts          # [NEW] 图类型定义
│       ├── config.ts         # [NEW] 配置类型定义
│       └── llm.ts            # [NEW] LLM 类型定义
│
├── app/                      # React 可视化应用
│   ├── package.json          # [NEW] 独立 package.json
│   ├── vite.config.ts        # [NEW] Vite 配置
│   ├── tailwind.config.js    # [NEW] Tailwind 配置
│   ├── postcss.config.js     # [NEW] PostCSS 配置
│   ├── index.html            # [NEW] 入口 HTML
│   ├── src/
│   │   ├── main.tsx          # [NEW] React 入口
│   │   ├── App.tsx           # [NEW] 根组件
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Header.tsx      # [NEW] 顶部导航栏
│   │   │   │   ├── Sidebar.tsx     # [NEW] 左侧统计面板
│   │   │   │   └── DetailPanel.tsx # [NEW] 右侧详情面板
│   │   │   ├── Graph/
│   │   │   │   ├── GraphCanvas.tsx   # [NEW] Sigma.js 图画布
│   │   │   │   ├── GraphControls.tsx # [NEW] 缩放、布局控制
│   │   │   │   └── GraphLegend.tsx   # [NEW] 图例说明
│   │   │   ├── Stats/
│   │   │   │   ├── StatsOverview.tsx # [NEW] 统计概览
│   │   │   │   ├── RiskChart.tsx     # [NEW] 风险分布图
│   │   │   │   └── TopRiskList.tsx   # [NEW] 高风险组件列表
│   │   │   └── UI/
│   │   │       ├── Button.tsx    # [NEW] 按钮组件
│   │   │       ├── Card.tsx      # [NEW] 卡片组件
│   │   │       ├── SearchBar.tsx # [NEW] 搜索栏
│   │   │       └── Filter.tsx    # [NEW] 过滤器
│   │   ├── hooks/
│   │   │   ├── useGraph.ts       # [NEW] 图数据管理
│   │   │   ├── useSigma.ts       # [NEW] Sigma.js 集成
│   │   │   └── useData.ts        # [NEW] 数据加载
│   │   ├── lib/
│   │   │   ├── graphology-setup.ts   # [NEW] Graphology 配置
│   │   │   └── layout-algorithms.ts  # [NEW] 布局算法
│   │   ├── styles/
│   │   │   └── index.css        # [NEW] Tailwind 入口
│   │   └── types/
│   │       └── index.ts         # [NEW] 应用类型定义
│   └── public/
│       └── data.json            # [NEW] 分析数据占位
│
└── __tests__/                  # 单元测试
```

## 配置文件设计

```
// blast-radius.config.json
{
  "scan": {
    "include": ["src/**/*.{ts,tsx,jsx}"],
    "exclude": [
      "node_modules/**",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/__tests__/**",
      "**/*.d.ts"
    ]
  },
  "analysis": {
    "depth": "full",  // "quick" | "full"
    "enableCache": true,
    "cacheDir": ".blast-radius/cache"
  },
  "llm": {
    "provider": "openai",  // "openai" | "claude" | "deepseek" | "gemini" | "ollama"
    "model": "gpt-4",
    "apiKey": "${OPENAI_API_KEY}",  // 支持环境变量
    "baseUrl": null,  // 自定义端点
    "enableCache": true
  },
  "output": {
    "format": ["html", "json"],  // 输出格式
    "openBrowser": true  // 自动打开浏览器
  }
}
```

**环境变量支持**：

- `BLAST_RADIUS_LLM_PROVIDER`: 覆盖配置文件中的 provider
- `BLAST_RADIUS_LLM_API_KEY`: 覆盖 API Key
- `BLAST_RADIUS_LLM_MODEL`: 覆盖模型选择
- `BLAST_RADIUS_LLM_BASE_URL`: 覆盖自定义端点
- `BLAST_RADIUS_CACHE_DIR`: 覆盖缓存目录
- `BLAST_RADIUS_LOG_LEVEL`: 日志级别（DEBUG/INFO/WARN/ERROR）

## 关键代码结构

```typescript
// 组件节点
interface ComponentNode {
  id: string;                    // 唯一标识符
  name: string;                  // 组件名称
  path: string;                  // 文件路径
  type: 'react' | 'unknown';
  dependencies: string[];        // 依赖的组件 ID
  dependents: string[];          // 被依赖的组件 ID
}

// 爆炸半径指标
interface BlastRadiusMetrics {
  componentId: string;
  fanIn: number;                 // 入度（被依赖数）
  fanOut: number;                // 出度（依赖数）
  depth: number;                 // 影响深度
  breadth: number;               // 影响广度
  riskScore: number;             // 风险评分 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
}

// 分析结果
interface AnalysisResult {
  project: {
    name: string;
    path: string;
    componentCount: number;
    analyzedAt: string;
  };
  components: ComponentNode[];
  metrics: Map<string, BlastRadiusMetrics>;
  aiInsights?: AIInsights;       // LLM 分析结果（可选）
}
```

## 设计风格

采用 Cyberpunk Neon UI 风格，深色主题配合霓虹渐变色，营造科技感十足的数据可视化体验。使用毛玻璃效果面板增强层次感，配合流畅的微动画提升用户交互体验。

## 页面规划

单页应用，分为四个主要区块：

### 顶部导航栏

- 项目名称和分析时间戳
- 全局搜索组件输入框
- 快捷操作按钮：刷新、导出、设置
- 毛玻璃背景效果

### 左侧统计面板

- 组件总数、依赖关系总数统计卡片
- 风险等级分布饼图（使用渐变色）
- Top 10 高风险组件列表（可点击跳转）
- 过滤器：按组件类型、风险等级筛选

### 中央图可视化区域

- Sigma.js 渲染的交互式依赖关系图
- 节点大小映射爆炸半径
- 节点颜色映射风险等级（绿→黄→橙→红）
- 悬停显示组件详情浮层
- 点击展开依赖链高亮
- 缩放、拖拽、布局切换控制

### 右侧详情面板

- 选中组件的详细信息卡片
- 依赖树状图（上游/下游）
- LLM 分析建议（如启用）
- 代码预览片段

## 交互设计

- 节点悬停时放大并高亮连接线
- 点击节点展开依赖链
- 风险等级切换过滤
- 全局搜索组件定位
- 图布局切换（力导向/树状/环形）

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 探索和分析类似 CLI 工具的最佳实践，包括依赖解析模式、AST 解析技巧和图构建方法
- Expected outcome: 获取成熟的代码模式和架构设计参考，加速开发并避免常见陷阱