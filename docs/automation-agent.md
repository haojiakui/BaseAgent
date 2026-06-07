# 自动化 Agent 需求书

## 项目定位

目标是做一个面向个人工作流的自动化 Agent 系统。

它允许用户配置任务，并让系统在合适的时机自动执行某些操作。执行过程中可以使用大模型进行判断、总结、分类、生成内容，也可以调用本地工具或外部接口完成真实动作。

可以简单理解为：

```text
一个带大模型判断能力的自动化任务系统。
```

核心问题是：

```text
什么时候做？
做什么？
怎么做？
```

## 核心需求

### 什么时候做

第一阶段先支持：

```text
手动执行
定时执行
```

后续扩展：

```text
文件变化时执行
收到某类消息时执行
检测到 git diff 时执行
外部 webhook 触发
某个 API 返回特定状态时触发
```

### 做什么

用户可以定义任务目标，例如：

```text
生成日报
检查 git diff
生成 commit message
检查 README
整理指定文件夹里的文档
分析 CSV / Excel
生成 PR 描述
总结会议记录
提醒待办事项
```

### 怎么做

Agent 执行器负责完成任务：

```text
读取任务配置
读取相关文件或数据
调用大模型判断
调用工具执行动作
整理执行结果
写入报告或日志
必要时等待人工确认
```

对应关系：

```text
什么时候做 = Scheduler / Trigger
做什么 = Task / Goal
怎么做 = Agent / Tools / Workflow
```

## 未来目标

长期目标是支持三端运行：

```text
Windows 桌面端
网页端
移动设备端
```

三端职责可以先这样划分：

```text
网页端：负责任务配置、管理后台、查看执行记录
Windows 端：负责本地文件读取、本地项目扫描、本地任务执行
移动端：负责查看结果、接收通知、确认高风险操作
```

长期形态：

```text
用户在任意端创建任务
  ↓
任务配置同步到云端
  ↓
云端或本地执行器按规则执行
  ↓
Agent 调用模型和工具
  ↓
执行结果同步回所有端
```

## 可能的桎梏

```text
后端和数据库能力不足：先用 JSON 文件，后续升级 SQLite，再考虑云端数据库。
多端同步复杂：多端同步放到后期，不作为第一版目标。
Key 和模型成本：优先用户自带 Key，不提供公共免费额度。
权限和安全：不能默认读取全盘，高风险操作必须确认。
Agent 不稳定：用最大循环次数、参数校验、结构化输出校验和日志兜底。
```

## 迭代计划

### 阶段 1：本地 CLI MVP

目标：跑通自动化 Agent 的最小闭环，不做 UI，不做数据库，不做多端。

最小功能：

```text
读取 tasks.json
支持手动执行一个任务
调用大模型
输出结果到 reports/
记录执行日志到 logs.json
```

最小流程：

```text
node agent.js run daily-summary
  ↓
读取 tasks.json 中的任务
  ↓
调用对应 tools
  ↓
把上下文发给大模型
  ↓
生成结果
  ↓
写入 reports/
```

可能用到：

```text
Node.js
dotenv
fs
OpenAI-compatible API
JSON 文件
Markdown 报告
```

MVP 标准：

```text
能手动执行一个任务
能调用模型
能保存结果
失败时有错误提示
```

### 阶段 2：定时任务 MVP

目标：让任务可以按时间自动执行。

最小功能：

```text
在 tasks.json 中配置 schedule
使用 node-cron 定时触发
任务执行后写入 logs.json
失败时记录错误
```

可能用到：

```text
node-cron
JSON schema 校验
日志文件
错误重试
```

MVP 标准：

```text
程序启动后能按时间自动执行任务
可以启用 / 停用任务
每次执行都有日志
```

### 阶段 3：开发者任务 MVP

目标：先做几个真正能提高开发效率的任务。

优先实现：

```text
Git Diff Review Agent
Commit Message Agent
README 检查 Agent
Daily Work Summary Agent
```

可能用到：

```text
child_process
git diff
git log
Markdown
skills/code-review.md
tools/getGitDiff.js
tools/getGitLog.js
```

MVP 标准：

```text
至少有 2 个任务能稳定执行
输出结果可直接用于工作
错误信息可理解
```

### 阶段 4：Electron 桌面版 MVP

目标：把 CLI 工具变成 Windows 桌面软件。

最小功能：

```text
任务列表
新增任务
手动执行任务
查看执行日志
查看执行结果
填写模型 API Key
```

可能用到：

```text
Electron
React / Vue / Next.js
Node 主进程
IPC 通信
本地文件读写
keytar 或系统凭据管理
```

MVP 标准：

```text
可以在界面创建任务
可以点击执行任务
可以查看结果
Key 不硬编码在代码里
```

### 阶段 5：SQLite 本地数据版

目标：从 JSON 文件升级到本地数据库。

可能用到：

```text
SQLite
better-sqlite3
数据库迁移
本地数据备份
```

MVP 标准：

```text
任务和日志不再依赖多个 JSON 文件
可以按时间查询执行记录
可以保存历史结果
```

### 阶段 6：Web 版 MVP

目标：做一个网页端，用来管理任务和查看结果。

可能用到：

```text
Next.js / React
Node 后端 API
SQLite 或 PostgreSQL
REST API
简单登录
```

MVP 标准：

```text
能通过网页管理任务
能通过网页查看执行结果
后端能执行任务
```

### 阶段 7：云端调度 MVP

目标：让任务即使本地设备关闭，也可以在云端执行。

可能用到：

```text
PostgreSQL
Redis / BullMQ
云服务器
Docker
CI/CD
环境变量 / Secret Manager
```

MVP 标准：

```text
云端可以按时执行任务
网页端可以查看结果
失败任务有日志
模型 Key 不暴露在前端
```

### 阶段 8：移动端 MVP

目标：移动端先负责查看结果、接收通知和确认操作。

可能用到：

```text
React Native / Expo
Push Notification
后端 API
用户登录
```

MVP 标准：

```text
手机能看到任务结果
能收到通知
能确认或拒绝高风险操作
```

## 推荐顺序

```text
1. Node CLI + tasks.json
2. 定时任务 node-cron
3. 开发者任务：git diff review / commit message / README 检查
4. reports/ 和 logs.json
5. Electron 桌面 UI
6. SQLite 本地存储
7. Web 管理端
8. 云端调度
9. 移动端查看和确认
10. 多端同步
```

## 技术路线

```text
语言：Node.js / JavaScript
模型调用：OpenAI-compatible API
本地配置：.env
任务配置：tasks.json → SQLite → 云端数据库
定时调度：node-cron → BullMQ / 云端 scheduler
桌面端：Electron
网页端：React / Next.js
移动端：React Native / Expo
本地数据库：SQLite
云端数据库：PostgreSQL
部署：Docker + CI/CD
Key 管理：本地 .env / 系统凭据 / Secret Manager
日志：logs.json → SQLite logs → 云端日志系统
```

## 当前最小起点

```text
一个 Node CLI 自动化 Agent。
```

它只需要支持：

```text
读取 tasks.json
手动执行任务
调用大模型
调用一个本地 tool
把结果写入 reports/
把日志写入 logs.json
```

一句话总结：

```text
先做本地可用的自动化 Agent；
再做桌面可视化；
再做本地数据管理；
最后再做云端调度和多端同步。
```
