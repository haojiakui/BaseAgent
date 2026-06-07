# TODO Agent 路线

如果目标是把 Agent 变成工作中可用的东西，建议从低风险、可验证、贴近日常开发流程的 Agent 开始。

整体路线：

```text
只读辅助型 Agent
  ↓
开发辅助型 Agent
  ↓
半自动执行型 Agent
  ↓
工作流型 Agent
```

## 第一层：只读辅助型

### Git Diff Review Agent

目标：提交代码前自动审查本次 `git diff`。

功能：

```text
读取 git diff
分析潜在 bug
检查遗漏测试
检查命名和结构问题
按严重程度输出 review
```

价值：贴近日常开发，结果容易验证，适合作为第一个可用 Agent。

优先级：最高。

### Commit Message Agent

目标：根据 `git diff` 自动生成清晰、规范的 commit message。

功能：

```text
读取 git diff
总结改动意图
判断提交类型
生成 commit message
```

价值：高频使用，实现简单，能让提交记录更清楚。

优先级：高。

### README / 文档检查 Agent

目标：检查项目文档是否能让别人理解项目并跑起来。

功能：

```text
检查 README 结构
检查启动命令
检查环境变量说明
检查目录结构说明
检查文档和代码是否不一致
```

价值：适合整理个人项目和求职作品，风险低。

优先级：高。

## 第二层：开发辅助型

### Error Log Debug Agent

目标：根据错误日志和相关代码生成排查方向。

功能：

```text
输入错误日志
读取相关文件
分析可能原因
给出排查步骤
给出可能修复点
```

优先级：中高。

### Test Suggestion Agent

目标：根据代码改动判断应该补哪些测试。

功能：

```text
读取 git diff
判断影响范围
列出边界情况
生成测试用例描述
```

优先级：中高。

### API Contract Check Agent

目标：检查前端请求代码和后端接口文档是否匹配。

功能：

```text
读取接口文档
读取前端请求代码
检查字段名、参数类型和响应结构
指出不一致的地方
```

优先级：中。

## 第三层：半自动执行型

### Patch Suggestion Agent

目标：根据问题描述和相关代码生成可审查的 patch 建议。

功能：

```text
读取问题描述
读取相关代码
生成修改方案
输出 patch
说明风险和验证方式
```

优先级：中。

### Auto Fix Small Issues Agent

目标：自动修复低风险、可验证的小问题。

功能：

```text
修复 lint
修复简单类型错误
补充缺失 import
调整简单格式
运行测试验证
```

优先级：后置。

## 第四层：工作流型

### PR Description Agent

目标：根据 `git diff` 自动生成 PR 描述。

功能：

```text
总结改动
列出影响范围
生成测试计划
提醒风险点
```

优先级：中高。

### Daily Work Summary Agent

目标：根据提交记录、diff 和笔记生成日报或周报。

功能：

```text
读取今日 git log
读取本地改动
总结完成内容
总结遇到的问题
生成日报 / 周报
```

优先级：中。

## 推荐实现顺序

```text
1. Git Diff Review Agent
2. Commit Message Agent
3. README / 文档检查 Agent
4. Test Suggestion Agent
5. Error Log Debug Agent
6. PR Description Agent
7. API Contract Check Agent
8. Patch Suggestion Agent
9. Auto Fix Small Issues Agent
10. Daily Work Summary Agent
```

第一个最小可用目标：

```text
node agent.js review
```

它只需要完成：

```text
读取 git diff
调用大模型
输出结构化 code review
```
