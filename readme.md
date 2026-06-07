#### 目的
为了企业级架构式的捋清agent的流程，同时搞懂各个模块的功能，故写了这个项目


#### 目录分类

BaseAgent/
├── resources/        <-- 【AI 的字典】如 rules.md
├── tools/            <-- 【AI 的武器】如 fetch_news_api.js (暴露给大模型调用)
├── utils/            <-- 【你的工具箱】如 formatter.js (大模型不知道，只有 Node.js 用)
├── skills/           <-- 【AI 的灵魂】如 news_skill.json
├── mcp/              <-- 【翻译官】包装工具和资源
└── agent.js          <-- 【引擎】


#### 流程说明

- `agent.js`：主循环引擎（入口）。
- `skills/`：静态配置层（定义 Agent 边界与 SOP）。
- `mcp/`：协议解析网关（连接大模型与本地代码）。
- `tools/`：对外暴露的原子动作层。
- `utils/`：对内屏蔽的基础基建层。
- `resources/`：只读的上下文数据源。

##### 1. 启动装配阶段
1. `agent.js` 启动，首去 `skills/` 读取系统提示词（System Prompt）。
2. `agent.js` 向 `mcp/` 请求可用工具和资源的 Schema 列表。
3. `agent.js` 将 Prompt 与 Schema 拼装完成，准备就绪。

##### 2. 核心运转阶段 (ReAct Loop)
1. **下发指令：** `agent.js` 将组装好的上下文发往 LLM（大模型）。
2. **文本转路由：** LLM 返回工具调用 JSON 指令，`agent.js` 拦截该指令并转发给 `mcp/`。
3. **接口映射：** `mcp/` 解析 JSON，找到对应的本地执行接口，将其透传给 `tools/` 目录下的具体函数。
4. **底层执行：** - `tools/` 接收参数并开始执行核心逻辑。
   - 若需数据清洗或通用运算，`tools/` 静默调用 `utils/`。
   - 若需加载业务参考文本，`tools/` 访问 `resources/` 读取。
5. **结果回溯：** `tools/` 执行完毕，将结果原路返回给 `mcp/`，再由 `mcp/` 封装标准格式交还 `agent.js`。
6. **循环闭环：** `agent.js` 将执行结果追加到上下文中，再次发往 LLM，直至 LLM 给出最终自然语言结论，循环结束。
