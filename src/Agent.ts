import MCPClient from "./MCPClient";
import ChatOpenAI from "./ChatOpenAI";
import { logTitle } from "./utils";

export default class Agent {
  private mcpClients: MCPClient[];
  private llm: ChatOpenAI | null = null;
  private model: string;
  private systemPrompt: string;
  private context: string;

  constructor(
    model: string,
    mcpClients: MCPClient[],
    systemPrompt: string = "",
    context: string = ""
  ) {
    this.mcpClients = mcpClients;
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.context = context;
  }

  async init() {
    logTitle("TOOLS");
    for await (const client of this.mcpClients) {
      await client.init();
    }
    const tools = this.mcpClients.flatMap((client) => client.getTools());
    this.llm = new ChatOpenAI(
      this.model,
      this.systemPrompt,
      tools,
      this.context
    );
  }

  async close() {
    for await (const client of this.mcpClients) {
      await client.close();
    }
  }

  async invoke(prompt: string) {
    //prompt: 人机对话的内容
    if (!this.llm) throw new Error("Agent not initialized");
    let response = await this.llm.chat(prompt); // [content, tool]
    while (true) {
      //处理工具调用
      if (response.toolCalls.length > 0) {
        //大模型返回了需要调用的工具
        for (const toolCall of response.toolCalls) {
          const mcp = this.mcpClients.find((client) =>
            client
              .getTools()
              .some((t: any) => t.name === toolCall.function.name)
          );
          if (mcp) {
            logTitle(`TOOL USE` + toolCall.function.name);
            console.log(`Calling tool: ${toolCall.function.name}`);
            console.log(`Arguments: ${toolCall.function.arguments}`);
            const result = await mcp.callTool(
              toolCall.function.name,
              JSON.parse(toolCall.function.arguments)
            );
            this.llm.appendToolResult(toolCall.id, JSON.stringify(result));
          } else {
            this.llm.appendToolResult(toolCall.id, "Tool not found");
          }
        }
        //继续对话
        response = await this.llm.chat();
        continue;
      }
      await this.close();
      return response.content;
    }
  }
}
