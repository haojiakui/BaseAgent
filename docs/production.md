# 生产形态

学习阶段的 Agent 可能只是一个 `agent.js` 脚本，但生产形态的 Agent 通常是一个可运行、可监控、可控制、可回滚的服务或工作流系统。

## 常见形态

### 后端服务型 Agent

```text
前端页面
  ↓
后端 API
  ↓
Agent 服务
  ↓
LLM
  ↓
Tools / DB / 外部接口
```

常见场景：

```text
AI 客服
企业知识库问答
数据分析助手
代码审查助手
报表生成助手
```

### 工作流型 Agent

```text
收到任务
  ↓
分析任务
  ↓
调用工具
  ↓
生成中间结果
  ↓
必要时交给人工确认
  ↓
输出最终结果
```

常见场景：

```text
客服工单
财务审核
运营自动化
数据报表
内容审核
```

### 命令行 / 开发工具型 Agent

```text
node agent.js review
node agent.js commit
node agent.js test-suggest
```

常见场景：

```text
Code Review Agent
Commit Message Agent
Test Suggestion Agent
CI Fix Agent
```

### 插件型 Agent

```text
VSCode / Cursor 插件
浏览器插件
飞书 / 钉钉 / Slack Bot
Chrome Extension
```

### 多 Agent 协作系统

```text
Supervisor Agent
  ↓
Research Agent
Code Agent
Review Agent
Test Agent
Deploy Agent
```

多 Agent 不应该为了复杂而复杂，只有当任务边界清晰、确实需要分工时才适合拆分。

## 生产级组成

```text
入口层：HTTP API / CLI / Bot / Web UI
Agent 编排层：主循环、状态管理、任务拆解、停止条件
LLM 层：模型调用、流式输出、重试、token 控制
Prompt / Skill 层：角色、规则、输出格式、工具使用策略
Tool 层：数据库、外部接口、文件系统、搜索、业务 API
权限层：用户鉴权、工具权限、高风险操作确认
记忆 / 数据层：会话历史、用户数据、RAG、缓存
观测层：日志、trace、调用耗时、token 成本、错误记录
验证层：测试、规则校验、人工审核、结果评分
部署层：Docker、CI/CD、环境变量、监控、回滚
```

学习 demo 关注：

```text
能不能跑通
```

生产 Agent 关注：

```text
能不能稳定跑
出错时能不能解释
成本能不能控制
权限会不会越界
结果能不能验证
用户能不能信任
```

一句话概括：

```text
生产形态的 Agent，不是“一个会调用大模型的脚本”，而是“围绕大模型构建的一套可控业务系统”。
```
