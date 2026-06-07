## 目的

当前分支 `poc/directory-collaboration` 的目标是：理清一个 Agent 项目中各个目录的职责，以及这些目录在一次 Agent 运行过程中如何协作。

这个分支不优先追求功能完整，而是优先回答一个问题：

```text
一个 Agent 项目为什么要拆出这些目录？
它们分别负责什么？
一次任务执行时，它们之间如何传递信息？
```

## 当前项目状态

当前分支基于本地 `feature/news-agent` 创建。

当前已有的主要结构是：

```text
BaseAgent/
├── agent.js          # Agent 入口，目前仍集中负责调用大模型
├── llm/              # 大模型连接层目录，目前为空目录占位
├── skills/           # Agent 角色、规则、prompt 配置目录，目前为空目录占位
├── mcp/              # 工具调用协议和路由目录，目前为空目录占位
├── tools/            # 可执行工具目录，目前为空目录占位
├── utils/            # 内部通用函数目录，目前为空目录占位
├── resources/        # 只读资源目录，目前包含 address.js
├── package.json      # Node 项目依赖声明
├── package-lock.json # 依赖锁定文件
└── readme.md         # 当前说明文档
```

当前已经补齐了 `llm/`、`skills/`、`mcp/`、`tools/`、`utils/` 等目录，但多数目录还只是结构占位。实际运行逻辑仍主要集中在 `agent.js` 中，后续可以按职责逐步迁移。

## 当前目录协作模型

当前项目已经按更完整的 Agent 项目形态拆出了下面几类目录：

```text
BaseAgent/
├── agent.js
├── llm/
├── skills/
├── mcp/
├── tools/
├── utils/
└── resources/
```

它们的定位如下：

### agent.js：主引擎

`agent.js` 是 Agent 的入口和主循环。

它会影响整个 Agent 的执行流程。

它负责：

- 读取配置
- 组装 `messages`
- 调用大模型
- 解析大模型输出
- 判断是否调用工具
- 把工具结果回填给大模型
- 控制循环何时结束

简单说：

```text
agent.js 负责让整个 Agent 跑起来。
```

### llm/：大模型连接层

`llm/` 用来封装和大模型服务通信相关的逻辑。

它会影响模型连接、模型请求和模型响应的稳定性。

它负责：

- 创建模型客户端
- 读取模型相关配置
- 设置 `baseURL`、`apiKey`、`model`
- 发送 `messages`
- 处理流式响应
- 处理模型调用错误、超时和重试

当前项目已经创建了 `llm/` 目录，但模型调用逻辑暂时还在 `agent.js` 中。后续工程化时，可以把这部分逻辑从 `agent.js` 拆到 `llm/`。

简单说：

```text
llm/ 负责让程序稳定连接大模型。
```

### skills/：角色和工作规则

`skills/` 用来存放 Agent 的能力设定、角色边界和工作流程。

它会影响 `systemPrompt`，进而影响模型的角色、行为规则和输出风格。

例如：

```text
你是一个新闻查询 Agent。
你只能处理新闻相关任务。
如果用户要求查询新闻，请优先调用新闻工具。
如果信息不足，需要先追问用户。
```

简单说：

```text
skills/ 负责告诉大模型：你是谁，你应该怎么工作。
```

### mcp/：协议和路由层

`mcp/` 可以理解为大模型和本地工具之间的“翻译官”。

它会影响模型调用工具时的协议、参数校验和路由过程。

它负责：

- 暴露工具清单
- 描述工具参数
- 接收模型输出的工具调用意图
- 校验工具名和参数
- 把请求路由到真正的工具函数
- 把工具结果包装成统一格式返回

简单说：

```text
mcp/ 负责把模型的 action 翻译成程序可以执行的工具调用。
```

### tools/：可执行动作

`tools/` 存放真正可以被 Agent 调用的工具函数。

它会影响 Agent 能执行哪些真实动作，以及这些动作返回什么结果。

例如：

```text
fetch_news_api
get_current_time
search_by_keyword
read_resource
```

工具函数负责执行真实动作，比如请求接口、查询数据、读取文件、计算结果等。

简单说：

```text
tools/ 是 Agent 的手脚。
```

### utils/：内部辅助能力

`utils/` 存放程序内部使用的通用函数。

它会影响内部代码复用、数据处理和错误处理的一致性。

例如：

```text
格式化时间
清洗接口返回值
统一错误处理
校验参数
转换数据结构
```

这些函数通常不直接暴露给大模型，而是被 `tools/`、`mcp/` 或 `agent.js` 调用。

简单说：

```text
utils/ 是程序自己的工具箱，不是大模型直接调用的工具。
```

### resources/：只读上下文资源

`resources/` 存放静态资料或只读上下文。

它会影响 Agent 可以参考哪些固定数据，以及大模型最终能看到哪些补充上下文。

例如：

```text
地址数据
业务规则
新闻分类
术语表
固定配置
参考文档
```

这些数据可以被 `tools/` 或 `agent.js` 读取，再整理后提供给大模型。

简单说：

```text
resources/ 是 Agent 可以参考的资料库。
```

## 一次完整协作流程

假设用户提出任务：

```text
帮我查询今天和北京相关的新闻。
```

各目录之间的协作关系可以理解为：

```text
1. agent.js 接收用户任务
   ↓
2. agent.js 从 skills/ 读取 Agent 角色和工作规则
   ↓
3. agent.js 从 mcp/ 获取可用工具说明
   ↓
4. agent.js 组装 messages，并通过 llm/ 发送给大模型
   ↓
5. 大模型根据 systemPrompt、用户任务和工具说明做决策
   ↓
6. 大模型输出 action，例如：调用 fetch_news_api
   ↓
7. agent.js 把 action 交给 mcp/
   ↓
8. mcp/ 校验 action 和参数，并路由到 tools/
   ↓
9. tools/ 执行新闻查询
   ↓
10. tools/ 如有需要，调用 utils/ 做数据清洗
   ↓
11. tools/ 如有需要，读取 resources/ 中的参考资料
   ↓
12. tools/ 把执行结果返回给 mcp/
   ↓
13. mcp/ 把结果包装成 observation 返回给 agent.js
   ↓
14. agent.js 把 observation 放回 messages
   ↓
15. 大模型基于新的 messages 继续判断
   ↓
16. 如果任务完成，大模型输出 final
   ↓
17. agent.js 输出最终结果，循环结束
```

## 目录之间的关系

可以把它们理解成下面这张关系图：

```text
用户任务
  ↓
agent.js
  ↓
llm/
  ↓
LLM 大模型
  ↓ action
mcp/
  ↓
tools/
  ├─ 调用 utils/
  └─ 读取 resources/
  ↓
mcp/
  ↓ observation
agent.js
  ↓
llm/
  ↓
LLM 大模型
  ↓
final 最终回答
```

其中：

```text
agent.js    负责主循环
llm/        负责连接大模型
skills/     负责角色和规则
mcp/        负责协议和路由
tools/      负责真实动作
utils/      负责内部辅助函数
resources/ 负责只读资料
```

## 当前分支的学习重点

这个分支的重点不是马上把所有目录都实现出来，而是先明确它们的协作边界：

```text
哪些内容应该给大模型看？
哪些内容应该由程序执行？
哪些内容只是程序内部辅助？
哪些内容是只读上下文？
工具调用请求应该由谁校验和路由？
工具结果应该如何回到大模型上下文？
```

理解清楚这些问题后，再逐步把当前 `agent.js` 中的逻辑拆分到对应目录中，项目结构就不会只是“为了分目录而分目录”，而是每个目录都有明确职责。

## 延伸文档

以下内容属于 Agent 学习、设计路线和产品规划，不直接描述当前项目实现，已拆分到 `docs/` 目录：

```text
docs/stability.md        稳定性与错误
docs/agent-design.md     Agent 设计
docs/todo-agents.md      TODO Agent 路线
docs/production.md       生产形态
docs/automation-agent.md 自动化 Agent 需求书
```
