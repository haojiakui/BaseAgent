const { existsSync, readFileSync } = require('node:fs');

function print(title, content = '') {
    console.log(`\n=== ${title} ===`);
    if (content) {
        console.log(content);
    }
}

// 0. 装配：读取 .env。这里不用 dotenv，只用 Node 原生 fs。
function loadEnv(filePath = '.env') {
    if (!existsSync(filePath)) {
        return;
    }

    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

    for (const line of lines) {
        const text = line.trim();
        if (!text || text.startsWith('#')) {
            continue;
        }

        const index = text.indexOf('=');
        if (index === -1) {
            continue;
        }

        const key = text.slice(0, index).trim();
        const value = text.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');

        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

loadEnv();

const apiKey = process.env.BAI_LIAN_KEY;
const model = process.env.BAI_LIAN_MODEL || 'deepseek-v4-pro';
const endpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

// 1. 装配：定义工具。工具是真正由程序执行的动作。
const tools = {
    get_current_time() {
        return new Date().toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            hour12: false
        });
    }
};

// 2. 装配：用自然语言告诉模型有哪些工具。
const toolDescriptions = `
可用工具：
- get_current_time：获取当前北京时间，无参数。
`;

// 3. 装配：定义系统提示词和输出协议。
const systemPrompt = `
你是一个最小化 Agent。

你必须遵守下面的输出协议：
1. 如果需要调用工具，只输出 JSON：{"action":"工具名","args":{}}
2. 如果可以给出最终答案，只输出 JSON：{"final":"最终答案"}
3. 不要输出 JSON 以外的内容。

${toolDescriptions}
`;

// 感知：读取用户任务，并把它放进 messages。
function getUserTask() {
    return process.argv.slice(2).join(' ') || '现在北京时间是多少？请调用工具后回答。';
}

// 决策：调用大模型，让它根据 messages 判断下一步。
async function askModel(messages) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.2
        })
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`模型请求失败：${response.status} ${detail}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

// 决策：把模型输出的 JSON 字符串解析成程序可读对象。
function parseDecision(text) {
    try {
        return JSON.parse(text);
    } catch {
        const matched = text.match(/\{[\s\S]*\}/);
        if (!matched) {
            throw new Error(`模型没有按协议返回 JSON：${text}`);
        }
        return JSON.parse(matched[0]);
    }
}

// 行动：根据模型的 action，执行对应工具。
function runTool(action, args = {}) {
    const tool = tools[action];
    if (!tool) {
        throw new Error(`未知工具：${action}`);
    }

    return tool(args);
}

async function main() {
    print('装配阶段', '读取配置、定义工具、准备系统提示词。');

    if (!apiKey) {
        throw new Error('缺少 BAI_LIAN_KEY，请先在 .env 中配置。');
    }

    const userTask = getUserTask();

    print('感知', `用户任务：${userTask}`);

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userTask }
    ];

    for (let round = 1; round <= 4; round += 1) {
        print('决策', `第 ${round} 轮，把 messages 发给大模型。`);
        const modelOutput = await askModel(messages);
        console.log(modelOutput);

        const decision = parseDecision(modelOutput);

        if (decision.final) {
            print('最终结果', decision.final);
            return;
        }

        if (!decision.action) {
            throw new Error(`模型输出中没有 action 或 final：${modelOutput}`);
        }

        print('行动', `执行工具：${decision.action}`);
        const result = runTool(decision.action, decision.args);
        console.log(result);

        print('反馈', '把工具执行结果放回 messages，进入下一轮。');
        messages.push({ role: 'assistant', content: modelOutput });
        messages.push({
            role: 'user',
            content: `工具 ${decision.action} 的执行结果是：${result}。请基于这个结果继续。`
        });
    }

    throw new Error('达到最大循环次数，仍然没有得到最终结果。');
}

main().catch((error) => {
    console.error('\n[Error]', error.message);
    process.exit(1);
});
