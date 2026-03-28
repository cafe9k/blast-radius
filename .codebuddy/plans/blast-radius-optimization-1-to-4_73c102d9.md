---
name: blast-radius-optimization-1-to-4
overview: 按顺序实施 4 个优化方案：1) 力导向图布局 2) 社区检测聚类可视化 3) Worker 并行解析 4) 图数据库缓存。每完成一个验证后再进行下一个。
todos:
  - id: force-layout
    content: 在 useGraph.ts 中集成 forceLayout 替换随机坐标，构建 App 验证节点分布效果
    status: completed
  - id: community-detect
    content: 集成 graphology-communities Louvain 算法，添加社区着色模式和图例切换，构建 App 验证
    status: completed
    dependencies:
      - force-layout
  - id: parallel-parse
    content: 使用 worker_threads 重构 parseReactComponents 为并行解析，测试结果一致性
    status: completed
    dependencies:
      - community-detect
  - id: graph-cache
    content: 引入 better-sqlite3 实现图结构增量缓存，验证二次分析只处理变更文件
    status: completed
    dependencies:
      - parallel-parse
---

## 用户需求

按顺序实施 4 个优化方案，每完成一个验证后再进行下一个：

1. **力导向图布局** - 修复前端图中节点使用随机坐标的问题，改用力导向布局算法使节点自然分布
2. **社区检测/聚类可视化** - 使用 Louvain 算法进行社区检测，按功能模块对节点着色分组
3. **Worker 并行解析** - 将 CLI 端串行的 AST 文件解析改为 worker_threads 并行处理
4. **图数据库缓存** - 将基于文件的简单缓存升级为图结构增量缓存，只解析变更文件

## 产品概述

blast-radius 是一个 CLI 工具，用于分析 React 项目组件依赖关系。当前可视化报告中节点位置随机、缺少功能分组、大项目解析慢、缓存无增量能力。

## 核心功能

- 力导向布局：节点按依赖关系自然排列，紧密耦合的组件聚集在一起
- 社区检测：自动识别功能模块，不同社区用不同颜色区分，图例展示社区信息
- 并行解析：利用多核 CPU 加速 AST 解析，大项目分析时间显著缩短
- 增量缓存：检测文件变更，仅重新解析修改的文件，二次分析速度大幅提升

## 技术栈

- **现有**: TypeScript, React 18, graphology, sigma v3 beta, @babel/parser, fast-glob, fs-extra, worker_threads (Node 18+)
- **新增依赖**: `graphology-communities` (Louvain 算法), `better-sqlite3` (嵌入式数据库)

## 实现方案

### 优化 1: 力导向图布局

**策略**: 在 `useGraph.ts` 构建图之后调用 `graphology-layout-force` 的 `forceLayout` 计算节点坐标，替换当前的 `Math.random()` 随机坐标。

**关键决策**: 在前端 useMemo 中同步计算力导向布局（graphology-layout-force 是纯同步库），对 <1000 节点的图计算耗时 <100ms，不阻塞 UI。

**改动范围**:

- `app/src/hooks/useGraph.ts`: 在添加完所有节点和边后，调用 `forceLayout(graph, { iterations: 100 })`，然后移除节点创建时的随机坐标赋值（x/y 交给 forceLayout 计算）

**验证标准**: 构建前端 App，打开报告页面，节点应按依赖关系自然聚集，不再随机分布。

### 优化 2: 社区检测/聚类可视化

**策略**: 使用 `graphology-communities` 的 `louvain` 算法在力导向布局后计算社区归属，将社区 ID 映射到一组预设颜色，作为节点的 `color` 属性（覆盖风险等级颜色模式或作为第二视觉通道）。

**关键决策**: 引入"着色模式"概念，支持在 `riskLevel` 和 `community` 两种模式间切换。默认保持风险等级着色，用户可在图例区域切换。

**改动范围**:

- `app/package.json`: 新增 `graphology-communities` 依赖
- `app/src/hooks/useGraph.ts`: 导入 `louvain`，在力布局后计算社区，为节点添加 `community` 属性和社区颜色
- `app/src/types/index.ts`: 新增 `colorMode: 'risk' | 'community'` 类型
- `app/src/App.tsx`: 新增 `colorMode` state 并传递
- `app/src/components/Graph/GraphCanvas.tsx`: 图例区域增加社区颜色展示和模式切换按钮
- `app/src/hooks/useSigma.ts`: 根据模式切换节点颜色渲染

**验证标准**: 图例区域可切换"风险等级/社区分组"模式，社区模式下紧密耦合的节点颜色相同。

### 优化 3: Worker 并行解析

**策略**: 使用 Node.js `worker_threads` 将文件列表分片，每片分配给一个 worker 并行解析，最后在主线程合并结果并构建 dependents 列表。

**关键决策**:

- Worker 数量 = `navigator.hardwareConcurrency || 4`，上限 8
- 将 `parseFile` 函数提取到独立 worker 脚本 `src/analyzer/parser/worker.ts`
- 使用 `p-limit` 或手写信号量控制并发
- 增加回退机制：worker 创建失败时降级为串行解析

**改动范围**:

- `src/analyzer/parser/react.ts`: 重构 `parseReactComponents`，支持并行分片
- `src/analyzer/parser/worker.ts`: [NEW] Worker 脚本，接收文件分片，返回 ComponentNode[]
- `src/analyzer/parser/index.ts`: [NEW] 统一导出
- `tsup.config.ts`: 将 worker 脚本加入额外入口或标记为外部
- `package.json`: 新增 `p-limit` 依赖（可选，手写也可）

**验证标准**: 对本项目的分析时间在并行模式下应明显缩短，结果与串行模式一致。

### 优化 4: 图数据库缓存

**策略**: 使用 `better-sqlite3` 嵌入式数据库存储图结构和文件 hash，下次分析时对比 hash 只解析变更文件，对图做增量更新。

**关键决策**:

- 数据库位置: `.blast-radius/cache/graph.db`
- 存储内容: files 表（path, hash, content_hash）, nodes 表, edges 表
- 增量逻辑: 新文件 -> 解析并插入；删除文件 -> 移除节点和边；修改文件 -> 重新解析并更新
- 兼容性: `--no-cache` 时跳过数据库，与现有缓存 API 保持接口一致

**改动范围**:

- `package.json`: 新增 `better-sqlite3` 依赖
- `src/utils/cache.ts`: 重构，新增 SQLite 数据库管理（初始化、查询、写入、增量 diff）
- `src/utils/graph-cache.ts`: [NEW] 图结构专用缓存层（序列化/反序列化 graphology 图，增量 merge）
- `src/cli/commands/analyze.ts`: 在解析前检查缓存 diff，传递变更文件列表给 parser

**验证标准**: 第二次分析只处理变更文件，终端输出显示 "X cached, Y changed" 统计。

## 实现注意事项

- **向后兼容**: 所有优化不改变 CLI 参数接口和 JSON 输出格式
- **性能**: 力布局在前端同步计算，社区检测在力布局后同步计算；Worker 并行在 CLI 端；SQLite 缓存在 CLI 端
- **回退**: Worker 创建失败降级串行；SQLite 安装失败降级文件缓存
- **tsup 配置**: worker 脚本需要单独入口或使用 `import.meta.url` 动态加载，需确保 ESM 兼容