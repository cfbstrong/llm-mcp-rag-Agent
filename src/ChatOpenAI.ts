import OpenAI from "openai";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import "dotenv/config";
import { logTitle } from "./utils";

export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export default class ChatOpenAI {
  private llm: OpenAI;
  private model: string;
  private messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  private tools: Tool[];

  constructor(
    model: string,
    systemPrompt: string = "",
    tools: Tool[] = [],
    context: string = ""
  ) {
    this.llm = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    });
    this.model = model;
    this.tools = tools;
    if (systemPrompt) {
      this.messages.push({
        role: "system",
        content: systemPrompt,
      });
    }
    if (context) {
      this.messages.push({
        role: "user",
        content: context,
      });
    }
  }

  async chat(prompt?: string) {
    logTitle("CHAT");
    if (prompt) {
      this.messages.push({
        role: "user",
        content: prompt,
      });
    }
    const response = await this.llm.chat.completions.create({
      model: this.model,
      messages: this.messages,
      stream: true,
      tools: this.getToolDefinition(), //把能够使用的函数工具传递给模型
    });
    //流式传输
    let content = "";
    let toolCalls: ToolCall[] = [];
    logTitle("RESPONSE");
    for await (const chunk of response) {
      const delta = chunk.choices[0].delta; //获取模型返回的文本
      //处理普通的文本返回content
      if (delta.content) {
        const contentChunk = delta.content || "";
        content += contentChunk; //流式传输
        process.stdout.write(contentChunk); //不会换行
      }
      //处理工具调用
      if (delta.tool_calls) {
        for (const toolCallChunk of delta.tool_calls) {
          if (toolCalls.length <= toolCallChunk.index) {
            //满足if条件说明之前没有这个index的toolcall，需要创建一个
            toolCalls.push({
              id: "",
              function: {
                name: "",
                arguments: "",
              },
            });
          }
          let currentCall = toolCalls[toolCallChunk.index];
          if (toolCallChunk.id) currentCall.id += toolCallChunk.id;
          if (toolCallChunk.function?.name)
            currentCall.function.name += toolCallChunk.function.name;
          if (toolCallChunk.function?.arguments)
            currentCall.function.arguments += toolCallChunk.function.arguments;
        }
      }
    }
    this.messages.push({
      role: "assistant",
      content,
      tool_calls: toolCalls.map((toolCall) => ({
        type: "function",
        id: toolCall.id,
        function: toolCall.function,
      })),
    });
    return { content, toolCalls };
  }

  public appendToolResult(toolCallId: string, toolOutput: string) {
    this.messages.push({
      role: "tool",
      content: toolOutput,
      tool_call_id: toolCallId,
    });
  }

  private getToolDefinition() {
    return this.tools.map((tool) => ({
      type: "function" as const,
      function: tool,
    }));
  }
}
