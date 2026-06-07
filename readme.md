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
├── agent.js          # Agent 入口，目前负责调用大模型
├── resources/        # 只读资源目录，目前包含 address.js
├── package.json      # Node 项目依赖声明
├── package-lock.json # 依赖锁定文件
└── readme.md         # 当前说明文档
```

当前代码还没有完整拆出 `skills/`、`mcp/`、`tools/`、`utils/` 等目录，但这些目录是后续理解完整 Agent 协作关系时的重要模块。

## 目标目录协作模型

一个更完整的 Agent 项目可以拆成下面几类目录：

```text
BaseAgent/
├── agent.js
├── skills/
├── mcp/
├── tools/
├── utils/
└── resources/
```

它们的定位如下：

### agent.js：主引擎

`agent.js` 是 Agent 的入口和主循环。

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

### skills/：角色和工作规则

`skills/` 用来存放 Agent 的能力设定、角色边界和工作流程。

它通常会影响 `systemPrompt`。

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
4. agent.js 组装 messages，发送给大模型
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
LLM 大模型
  ↓
final 最终回答
```

其中：

```text
agent.js    负责主循环
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

## 各目录解决的稳定性问题

如果说 `skills/` 存在的目标，是为了让模型输出更稳定，那么其它目录也可以理解为在解决不同层面的稳定性问题。

```text
skills/
让模型思考和表达更稳定
```

它约束模型：你是谁、按什么流程做、什么时候该调用工具、输出格式是什么。

```text
mcp/
让模型调用工具这件事更稳定
```

它约束工具调用：有哪些工具、参数是什么、参数是否合法、调用结果怎么返回。

```text
tools/
让真实动作更稳定
```

它把“查天气、读文件、请求接口、查数据库”这些动作写成确定的程序函数，而不是让模型凭空猜。

```text
resources/
让上下文来源更稳定
```

它存放固定资料、配置数据、知识文件、示例数据等。模型需要信息时，可以从这里读取，而不是靠记忆或编造。

```text
utils/
让内部代码复用更稳定
```

它放通用辅助函数，比如日志、格式化、错误处理、读取文件、参数处理等，避免到处复制同一段逻辑。

```text
agent.js
让整个执行流程更稳定
```

它负责主循环：接收输入、组装 prompt、调用模型、解析 tool call、调用 MCP/tools、把结果回填给模型、决定何时结束。

可以简单记成：

```text
skills/    稳定模型行为
mcp/       稳定工具协议
tools/     稳定真实执行
resources/ 稳定信息来源
utils/     稳定代码复用
agent.js   稳定整体流程
```

## Agent 流程中的错误捕获

Agent 流程越复杂，出错点越多。因为它不是一段单纯代码，而是一条由多个模块组成的执行链路：

```text
用户输入
  ↓
组装 prompt
  ↓
连接大模型
  ↓
解析模型输出
  ↓
判断 tool call
  ↓
MCP 校验和路由
  ↓
tools 调接口 / 查数据
  ↓
结果回填模型
  ↓
生成最终回答
```

其中任何一环失败，都可能让流程中断。所以工程化 Agent 项目需要做分层错误捕获。

### 连接大模型的错误

这类错误通常发生在 LLM Client 层。

常见问题包括：

```text
API Key 错误
网络超时
模型服务不可用
限流
返回格式异常
stream 中断
```

处理方式通常包括：

```text
try/catch
timeout
retry
错误分类
给用户友好提示
记录原始错误日志
```

### 模型输出解析错误

这类错误通常发生在 `agent.js` 或 parser 层。

例如模型本该输出 JSON 或 tool call，但实际输出了普通文本、字段缺失、参数格式不对。

处理方式是：解析失败时不要直接让程序崩溃，而是可以要求模型重新输出、限制重试次数，并在超过次数后返回明确失败原因。

### MCP 工具调用错误

这类错误通常发生在 `mcp/` 层。

常见问题包括：

```text
工具名不存在
参数缺失
参数类型不对
没有权限调用该工具
```

`mcp/` 应该在真正调用工具前完成校验。校验失败时，可以返回结构化 observation，让模型知道失败原因。

例如：

```json
{
  "ok": false,
  "type": "TOOL_VALIDATION_ERROR",
  "message": "get_weather 缺少 city 参数"
}
```

### tools 执行错误

这类错误通常发生在 `tools/` 层。

常见问题包括：

```text
外部接口超时
接口返回 500
数据库连接失败
文件不存在
第三方 API 返回脏数据
```

每个 tool 应该捕获自己的执行错误，必要时设置 timeout 和 retry，并返回统一错误结构，而不是直接把异常抛到最外层。

例如：

```js
export async function getWeather({ city }) {
  try {
    const res = await fetch(url);
    return {
      ok: true,
      data: await res.json()
    };
  } catch (error) {
    return {
      ok: false,
      type: 'EXTERNAL_API_ERROR',
      message: '天气接口请求失败'
    };
  }
}
```

### Agent 主流程错误

`agent.js` 是最后的兜底层。

它应该负责：

```text
捕获未处理错误
控制最大循环次数
防止模型无限调用工具
防止空结果继续传递
决定是否终止任务
给用户最终可理解的失败说明
```

尤其要注意：错误不要只变成程序崩溃，而应该尽量变成 Agent 可以理解的结果。

也就是说，错误也可以作为 observation 回到模型上下文。

例如：

```json
{
  "ok": false,
  "tool": "get_weather",
  "error": "天气接口超时"
}
```

这样模型可以继续判断：是否重试、是否换工具、或者是否告诉用户暂时无法查询。

### 目录与错误类型对应关系

不同目录应该优先捕获自己职责范围内的错误，不要把所有错误都堆到 `agent.js` 里处理。

```text
agent.js
负责捕获流程控制类错误：
- 最大循环次数超限
- 模型连续输出无效结果
- 工具调用后无法继续推进
- 未被其它层处理的兜底异常
```

```text
llm/
负责捕获大模型连接类错误：
- API Key 错误
- baseURL 或模型名配置错误
- 网络超时
- 模型服务限流
- stream 中断
- 模型接口返回格式异常
```

如果项目暂时没有单独的 `llm/` 目录，这部分职责可以先放在 `agent.js` 中；工程化以后再拆出去。

```text
mcp/
负责捕获工具调用协议类错误：
- 工具名不存在
- 参数缺失
- 参数类型不正确
- 参数不符合 schema
- 当前 Agent 没有权限调用该工具
- 工具返回值格式不符合约定
```

```text
tools/
负责捕获真实执行类错误：
- 外部接口超时
- 外部接口返回 4xx / 5xx
- 数据库连接失败
- 文件不存在
- 资源读取失败
- 第三方服务返回异常数据
```

```text
resources/
负责暴露资源读取相关问题：
- 资源文件不存在
- 资源格式错误
- 资源内容为空
- 资源路径配置错误
```

通常 `resources/` 自己不一定写复杂逻辑，但读取它的 `tools/` 或 `utils/` 应该把这些问题识别出来。

```text
utils/
负责捕获内部辅助函数错误：
- 数据格式转换失败
- JSON 解析失败
- 时间格式处理失败
- 参数清洗失败
- 通用校验失败
```

可以把原则记成：

```text
谁最了解这个错误，谁先捕获它；
谁能决定流程是否继续，谁再处理它；
最后由 agent.js 兜底。
```

错误类型的分类总结可以写成：

```text
Agent 项目要在每一层捕获本层错误；
tools 捕获执行错误，mcp 捕获调用错误，LLM Client 捕获模型连接错误，agent.js 做最终兜底和流程控制。
```

也可以简单记成：

```text
tools/     捕获真实执行错误
mcp/       捕获工具调用和参数错误
LLM Client 捕获模型连接错误
agent.js   做最终兜底和流程控制
```
