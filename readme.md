#### 目的

这个分支用于学习 Agent 的最小运转流程。

它故意删除了 `skills/`、`tools/`、`mcp/`、`resources/`、`utils/` 等目录，只保留最小运行所需文件：

```text
BaseAgent/
├── .env
├── .gitignore
├── agent.js
└── readme.md
```

这样做的目的不是否定这些目录，而是在学习早期先把注意力集中到 Agent 最核心的闭环上。

#### 这个 Demo 展示什么

一个最小可用 Agent 至少包含：

1. 用户任务
2. 系统提示词
3. LLM 决策
4. 本地工具
5. 工具执行结果回填
6. 再次请求 LLM 生成最终回答

当前 `agent.js` 把这些内容全部放在一个文件里，方便观察完整流程。

#### 当前流程

```text
用户输入
  ↓
agent.js 把任务和系统提示词发送给 LLM
  ↓
LLM 返回 JSON 决策
  ↓
如果 JSON 中有 action，agent.js 调用本地工具
  ↓
agent.js 把工具结果作为观察结果追加回上下文
  ↓
LLM 基于工具结果输出 final
```

#### 内置工具

当前只内置了一个工具：

```text
get_current_time
```

它用于获取当前北京时间。

#### 运行方式

先在 `.env` 中填写百炼 API Key：

```text
BAI_LIAN_KEY=你的 API Key
BAI_LIAN_MODEL=deepseek-v4-pro
```

然后运行：

```powershell
node agent.js
```

也可以传入自己的任务：

```powershell
node agent.js "现在北京时间是多少？请调用工具后回答。"
```

`.env` 用来保存本地模型 Key，已经通过 `.gitignore` 排除，不应该提交到 Git。

#### 学习重点

这个分支只关注一件事：

> 看清楚 Agent 如何完成“LLM 决策 -> 工具执行 -> 结果回填 -> 最终回答”的闭环。

等这个闭环理解清楚后，再把系统提示词拆到 `skills/`，把工具拆到 `tools/`，把工具注册和路由拆到 `mcp/`，会更容易理解每个目录为什么存在。
