import OpenAI from 'openai';
import process from 'process';
// require('dotenv').config(); // 加载 .env 文件
import dotenv from 'dotenv'
// 调用一次以读取env信息
dotenv.config()
const apiKey = process.env.BAI_LIAN_KEY  // 获取配置
// Initialize OpenAI client
const openai = new OpenAI({
    apiKey, // Read from environment variables
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

let reasoningContent = '';
let answerContent = '';
let isAnswering = false;

async function main() {
    try {
        const messages = [{"role":"system","content":"你是一个资深编程架构师"},
            {"role":"user","content":"hi"}]
        const stream = await openai.chat.completions.create({
            // You can replace with other Qwen3 models or QwQ models as needed
            model: "deepseek-v4-pro",
            messages,
            stream: true,
            top_p: 0.8,
            temperature: 0.7,
            enable_search: false,
            enable_thinking: false,
            thinking_budget: 4000
        });
        console.log('='.repeat(20) + 'Thinking Process' + '='.repeat(20));

        for await (const chunk of stream) {
            if (!chunk.choices?.length) {
                console.log('Usage:');
                console.log(chunk.usage);
                continue;
            }

            const delta = chunk.choices[0].delta;

            // Only collect reasoning content
            if (delta.reasoning_content !== undefined && delta.reasoning_content !== null) {
                if (!isAnswering) {
                    process.stdout.write(delta.reasoning_content);
                }
                reasoningContent += delta.reasoning_content;
            }

            // Receive content, start responding
            if (delta.content !== undefined && delta.content) {
                if (!isAnswering) {
                    console.log('='.repeat(20) + 'Complete Response' + '='.repeat(20));
                    isAnswering = true;
                }
                process.stdout.write(delta.content);
                answerContent += delta.content;
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
