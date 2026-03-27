# 🔥 Blast Radius

[English](README.md) | **简体中文**

一个强大的 CLI 工具，用于分析 React 组件依赖关系并评估每个组件的"爆炸半径"，帮助您了解项目的工程复杂度和可扩展性。

## ✨ 功能特性

- **组件依赖分析**：自动扫描和解析 React 组件的 import/export 关系
- **爆炸半径计算**：计算入度、出度、深度、广度和风险评分等指标
- **LLM 智能分析**：可选的 AI 分析，支持 OpenAI、Claude、DeepSeek、Gemini 或 Ollama
- **交互式可视化**：生成精美的 HTML 报告，使用 Sigma.js 驱动的图可视化
- **多种输出格式**：导出结果为 HTML、JSON 或两者
- **智能缓存**：基于文件的增量分析缓存，加快重复运行速度
- **灵活配置**：通过配置文件或环境变量进行灵活配置

## 🏗️ 架构设计

### 系统架构

```mermaid
graph TB
    subgraph "CLI 层"
        CLI[命令行界面]
        Config[配置管理器]
        Cache[缓存管理器]
    end
    
    subgraph "分析引擎"
        Scanner[文件扫描器]
        Parser[AST 解析器]
        Resolver[路径解析器]
        GraphBuilder[依赖图构建器]
        Calculator[爆炸半径计算器]
    end
    
    subgraph "AI 集成"
        LLMClient[LLM 客户端]
        OpenAI[OpenAI API]
        Claude[Claude API]
        DeepSeek[DeepSeek API]
        Gemini[Gemini API]
        Ollama[Ollama 本地模型]
    end
    
    subgraph "可视化层"
        ReportGen[报告生成器]
        ReactApp[React 应用]
        SigmaJS[Sigma.js 图表]
        Graphology[Graphology 引擎]
    end
    
    subgraph "输出"
        HTML[HTML 报告]
        JSON[JSON 数据]
        Browser[浏览器]
    end
    
    CLI --> Scanner
    CLI --> Config
    Config --> Scanner
    
    Scanner --> Parser
    Parser --> Resolver
    Resolver --> GraphBuilder
    GraphBuilder --> Calculator
    
    Calculator --> LLMClient
    LLMClient --> OpenAI
    LLMClient --> Claude
    LLMClient --> DeepSeek
    LLMClient --> Gemini
    LLMClient --> Ollama
    
    Calculator --> Cache
    
    Calculator --> ReportGen
    ReportGen --> ReactApp
    ReactApp --> SigmaJS
    SigmaJS --> Graphology
    
    ReportGen --> HTML
    ReportGen --> JSON
    HTML --> Browser
    
    style CLI fill:#4F46E5
    style Calculator fill:#EC4899
    style ReactApp fill:#06B6D4
    style Browser fill:#10B981
```

### 分析工作流程

```mermaid
flowchart TD
    Start([用户运行 blast-radius analyze]) --> Scan[扫描项目文件]
    Scan --> Filter{应用文件过滤器}
    Filter -->|包含| ParseFiles[解析 TypeScript/JSX 文件]
    Filter -->|排除| Skip[跳过 node_modules, 测试文件等]
    
    ParseFiles --> ExtractImports[提取 import 语句]
    ExtractImports --> ResolvePaths[解析导入路径]
    ResolvePaths --> BuildGraph[构建依赖图]
    
    BuildGraph --> CalcMetrics[计算指标]
    CalcMetrics --> FanIn[计算入度 Fan-In]
    CalcMetrics --> FanOut[计算出度 Fan-Out]
    CalcMetrics --> Depth[计算深度]
    CalcMetrics --> Breadth[计算广度]
    CalcMetrics --> RiskScore[计算风险评分]
    
    FanIn --> Aggregate[汇总结果]
    FanOut --> Aggregate
    Depth --> Aggregate
    Breadth --> Aggregate
    RiskScore --> Aggregate
    
    Aggregate --> CheckCache{是否启用缓存?}
    CheckCache -->|是| SaveCache[保存到缓存]
    CheckCache -->|否| LLMCheck{是否启用 LLM?}
    SaveCache --> LLMCheck
    
    LLMCheck -->|是| CallLLM[调用 LLM 进行分析]
    LLMCheck -->|否| GenReport[生成报告]
    CallLLM --> GenReport
    
    GenReport --> Output{输出格式?}
    Output -->|HTML| GenHTML[生成 HTML 和 React 应用]
    Output -->|JSON| GenJSON[生成 JSON 文件]
    Output -->|两者| GenBoth[生成两种格式]
    
    GenHTML --> OpenBrowser{打开浏览器?}
    GenBoth --> OpenBrowser
    OpenBrowser -->|是| Launch[在浏览器中启动]
    OpenBrowser -->|否| Done([分析完成])
    Launch --> Done
    GenJSON --> Done
    
    style Start fill:#10B981
    style CalcMetrics fill:#F59E0B
    style CallLLM fill:#8B5CF6
    style Done fill:#10B981
```

### 组件交互流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant CLI as 命令行
    participant Scanner as 扫描器
    participant Parser as 解析器
    participant GraphBuilder as 图构建器
    participant Calculator as 计算器
    participant LLM as LLM 服务
    participant Reporter as 报告生成器
    
    User->>CLI: blast-radius analyze
    CLI->>Scanner: 扫描项目目录
    Scanner->>Scanner: 按配置过滤文件
    Scanner->>Parser: 发送文件路径
    Parser->>Parser: 解析 AST
    Parser->>Parser: 提取 imports
    Parser->>GraphBuilder: 发送导入数据
    GraphBuilder->>GraphBuilder: 构建依赖图
    GraphBuilder->>Calculator: 发送图数据
    Calculator->>Calculator: 计算指标
    Calculator->>Calculator: 计算爆炸半径
    
    opt 启用 LLM
        Calculator->>LLM: 发送分析数据
        LLM->>LLM: 分析模式
        LLM->>Calculator: 返回洞察建议
    end
    
    Calculator->>Reporter: 发送结果
    Reporter->>Reporter: 生成可视化
    Reporter->>User: 打开 HTML 报告
```

## 📦 安装

### 从 npm 安装（推荐）

```bash
# 全局安装
npm install -g blast-radius

# 或使用 npx
npx blast-radius analyze
```

### 本地开发测试

如果要在发布前进行本地测试：

```bash
# 克隆仓库
git clone https://github.com/qing/blast-radius.git
cd blast-radius

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 方式 1: 使用 npm link（推荐）
npm link
blast-radius analyze  # 现在可以全局使用了

# 方式 2: 直接运行
node dist/index.js analyze

# 方式 3: 安装到全局
npm install -g .

# 测试完成后取消链接
npm unlink -g blast-radius
```

**注意：** 本项目使用 TypeScript 路径别名（`@/*` 代表 `./src/*`）来简化导入。构建过程（tsup）会在编译时自动解析这些别名。

## 🚀 快速开始

```bash
# 分析当前目录
blast-radius analyze

# 分析指定项目
blast-radius analyze /path/to/react/project

# 不使用 LLM 分析
blast-radius analyze --no-llm

# 仅生成 JSON 报告
blast-radius analyze -o json
```

## ⚙️ 配置

在项目根目录创建 `blast-radius.config.json`：

```json
{
  "scan": {
    "include": ["src/**/*.{ts,tsx,jsx}"],
    "exclude": [
      "node_modules/**",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/__tests__/**"
    ]
  },
  "analysis": {
    "depth": "full",
    "enableCache": true,
    "cacheDir": ".blast-radius/cache"
  },
  "llm": {
    "provider": "openai",
    "model": "gpt-4",
    "apiKey": "${OPENAI_API_KEY}",
    "enableCache": true
  },
  "output": {
    "format": ["html", "json"],
    "openBrowser": true
  }
}
```

### 环境变量

- `BLAST_RADIUS_LLM_PROVIDER`：覆盖 LLM 提供商
- `BLAST_RADIUS_LLM_API_KEY`：覆盖 API 密钥
- `BLAST_RADIUS_LLM_MODEL`：覆盖模型选择
- `BLAST_RADIUS_CACHE_DIR`：覆盖缓存目录
- `BLAST_RADIUS_LOG_LEVEL`：设置日志级别（DEBUG/INFO/WARN/ERROR）

## 📊 指标说明

### 爆炸半径指标

- **Fan-In (入度)**：依赖此组件的其他组件数量
- **Fan-Out (出度)**：此组件依赖的其他组件数量
- **Depth**：最大下游依赖链长度
- **Breadth**：修改此组件会影响的总文件数
- **Risk Score**：基于所有指标的加权评分（0-100）

### 风险等级

- 🟢 **低风险** (0-39)：可以安全修改
- 🟡 **中风险** (40-59)：影响适中
- 🟠 **高风险** (60-79)：影响较大，需谨慎操作
- 🔴 **极高风险** (80-100)：核心组件，修改会影响大量文件

## 🤖 LLM 集成

Blast Radius 支持多种 LLM 提供商：

- **OpenAI**：GPT-4, GPT-3.5-turbo
- **Anthropic**：Claude 3 (Opus, Sonnet, Haiku)
- **DeepSeek**：DeepSeek Chat, DeepSeek Coder
- **Google**：Gemini Pro
- **Ollama**：运行本地模型（Llama 2, Mistral 等）

### 示例：使用 Ollama 进行离线分析

```bash
# 安装 Ollama 并拉取模型
ollama pull llama2

# 配置 blast-radius
export BLAST_RADIUS_LLM_PROVIDER=ollama
export BLAST_RADIUS_LLM_MODEL=llama2

# 运行分析
blast-radius analyze
```

## 🎨 可视化

生成的 HTML 报告包含以下特性：

- **交互式图表**：缩放、平移和探索依赖关系
- **节点大小**：映射到爆炸半径（越大 = 影响越大）
- **节点颜色**：映射到风险等级（绿色 → 红色）
- **点击探索**：点击节点查看依赖链
- **搜索与过滤**：按名称查找组件或按风险等级过滤
- **统计面板**：项目健康指标概览

## 🔧 CLI 命令

```bash
# 分析项目
blast-radius analyze [path] [options]

# 管理配置
blast-radius config --init          # 创建配置文件
blast-radius config --show          # 显示当前配置
blast-radius config --set key=value # 更新配置

# 清除缓存
blast-radius clear-cache

# 显示帮助
blast-radius --help
```

## 📈 使用场景

1. **代码审查**：在合并前了解拟议更改的影响
2. **重构**：识别可安全修改的组件与关键组件
3. **架构审查**：可视化和分析组件依赖模式
4. **技术债务**：发现需要解耦的高度耦合组件
5. **入职培训**：帮助新开发人员了解代码库结构

## 🛠️ 开发

```bash
# 克隆仓库
git clone https://github.com/qing/blast-radius.git
cd blast-radius

# 安装依赖
pnpm install

# 构建 CLI
pnpm build

# 构建 React 应用
pnpm build:app

# 运行测试
pnpm test

# 开发模式
pnpm dev
```

## 📝 许可证

MIT

## 🤝 贡献

欢迎贡献！请阅读我们的[贡献指南](.github/CONTRIBUTING.md)并向我们的仓库提交 Pull Request。

## 📚 文档

更多详细文档，请访问我们的 [GitHub Wiki](https://github.com/qing/blast-radius/wiki)。

## 🐛 问题反馈

发现错误或有功能请求？请在我们的 [GitHub Issues](https://github.com/qing/blast-radius/issues) 上开一个问题。
