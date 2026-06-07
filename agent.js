const { existsSync, readFileSync } = require('node:fs');

// Agent 可以分成两层理解：
// 1. 启动前装配：准备配置、工具、工具说明、系统提示词。
// 2. 运行时循环：感知 Perceive -> 决策 Reason -> 行动 Act -> 反馈 Observe。
// 这个 demo 把所有逻辑放在一个文件里，是为了看清最小 Agent 如何转起来。

function logStep(stepName, detail = '') {
    console.log(`\n=== ${stepName} ===`);
    if (detail) {
        console.log(detail);
    }
}

// 装配阶段 A：启动配置。读取本地 .env，把模型 Key 和模型名放入 process.env。
function loadEnvFile(filePath = '.env') {
    if (!existsSync(filePath)) {
        return;
    }

    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) {
            continue;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

loadEnvFile();

const API_KEY = process.env.BAI_LIAN_KEY;
const MODEL = process.env.BAI_LIAN_MODEL || 'deepseek-v4-pro';
const ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

// 装配阶段 B：工具集合。这里放 Agent 可以真正执行的本地动作。
const tools = {
    // 行动 Act：本地工具。获取当前北京时间，供 LLM 在需要实时信息时调用。
    get_current_time() {
        return new Date().toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            hour12: false
        });
    }
};

// 装配阶段 C：工具说明。把本地工具能力用自然语言告诉 LLM。
const toolDescriptions = `
可用工具：
1. get_current_time
   作用：获取当前北京时间。
   参数：无。
`;

// 装配阶段 D：系统提示词。规定 Agent 如何决策，以及必须输出什么格式。
const systemPrompt = `
你是一个最小化 Agent Demo。

你的工作方式：
1. 如果需要工具，请只输出 JSON：{"action":"工具名","args":{}}
2. 如果已经可以回答用户，请只输出 JSON：{"final":"你的最终回答"}
3. 不要输出 JSON 以外的文本。

${toolDescriptions}
`;

// 感知 Perceive：读取用户任务。优先读取命令行输入，没有输入时使用默认任务。
function readUserTask() {
    return process.argv.slice(2).join(' ') || '现在北京时间是多少？请调用工具后回答。';
}

// 决策 Reason：把当前上下文发给模型，让模型决定“回答”还是“调用工具”。
async function callLLM(messages) {
    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: MODEL,
            messages,
            temperature: 0.2
        })
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`LLM 请求失败：${response.status} ${detail}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// 决策 Reason：把模型返回的 JSON 文本解析成程序可执行的对象。
function parseAgentMessage(content) {
    try {
        return JSON.parse(content);
    } catch {
        const matched = content.match(/\{[\s\S]*\}/);
        if (!matched) {
            throw new Error(`模型没有返回可解析的 JSON：${content}`);
        }
        return JSON.parse(matched[0]);
    }
}

// 行动 Act：根据模型给出的 action，路由到真实的本地函数。
function runTool(action, args = {}) {
    const tool = tools[action];
    if (!tool) {
        throw new Error(`未知工具：${action}`);
    }

    return tool(args);
}

// 主循环：串起“感知 -> 决策 -> 行动 -> 反馈”，直到 LLM 给出最终回答。
async function main() {
    logStep('装配阶段 A：启动配置', '读取 .env，并检查 BAI_LIAN_KEY 是否存在。');

    if (!API_KEY) {
        throw new Error('请先设置环境变量 BAI_LIAN_KEY');
    }

    const userTask = readUserTask();
    logStep('装配阶段 B：注册本地工具', `可用工具：${Object.keys(tools).join(', ')}`);
    logStep('装配阶段 C/D：准备工具说明和系统提示词', '告诉 LLM 它是 Agent、有哪些工具、必须用 JSON 输出决策。');
    logStep('运行时 1：感知 Perceive', `用户任务：${userTask}`);

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userTask }
    ];

    for (let step = 1; step <= 4; step += 1) {
        logStep(`运行时 2：决策 Reason，第 ${step} 轮`, `当前上下文消息数：${messages.length}`);
        const content = await callLLM(messages);
        console.log(`[LLM 原始输出]\n${content}`);

        logStep('运行时 2.1：解析决策结果');
        const decision = parseAgentMessage(content);
        console.log(decision);

        if (decision.final) {
            logStep('运行结束：最终回答', decision.final);
            return;
        }
        
        if (decision.action) {
            logStep('运行时 3：行动 Act', `执行工具：${decision.action}`);
            const result = runTool(decision.action, decision.args);
            console.log(`[工具观察结果]\n${result}`);

            logStep('运行时 4：反馈 Observe', '把工具结果追加到上下文，然后再次交给 LLM。');
            messages.push({ role: 'assistant', content });
            messages.push({
                role: 'user',
                content: `工具 ${decision.action} 的执行结果是：${result}。请基于这个结果继续。`
            });
            continue;
        }

        throw new Error(`无法理解模型决策：${content}`);
    }

    throw new Error('达到最大循环次数，Agent 仍未给出最终回答');
}

main().catch((error) => {
    console.error('\n[Error]', error.message);
    process.exit(1);
});
