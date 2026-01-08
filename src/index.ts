import MCPClient from "./MCPClient";
import Agent from "./Agent";
import path from "path";
import EmbeddingRetrivers from "./EmbeddingRetrivers";
import fs from "fs";
import { logTitle } from "./utils";

const currentDir = process.cwd(); //当前工作文件夹

const fetchMcp = new MCPClient("fetch", "uvx", ["mcp-server-fetch"]);
const fileMcp = new MCPClient("file", "npx", [
  "-y",
  "@modelcontextprotocol/server-filesystem",
  currentDir,
]);

// async function main() {
//   const agent = new Agent("gpt-4o-mini", [fetchMcp, fileMcp]);
//   await agent.init();
//   const response = await agent.invoke(
//     `爬取https://news.ycombinator.com/的内容,并且总结后保存到${currentDir}的news.md文件中`
//   );
//   console.log(response);
// }

// main();
const URL = "https://news.ycombinator.com/";
const outPath = path.join(process.cwd(), "output");
const TASK = `
告诉我Antonette的信息,先从我给你的context中找到相关信息,总结后创作一个关于她的故事
把故事和她的基本信息保存到${outPath}/antonette.md,输出一个漂亮md文件
`;

async function main() {
  // RAG
  const context = await retrieveContext();

  // Agent
  const agent = new Agent(
    "openai/gpt-4o-mini",
    [fetchMcp, fileMcp],
    "",
    context
  );
  await agent.init();
  await agent.invoke(TASK);
  await agent.close();
}

main();

async function retrieveContext() {
  // RAG
  const embeddingRetriever = new EmbeddingRetrivers("BAAI/bge-m3");
  const knowledgeDir = path.join(process.cwd(), "knowledge");
  const files = fs.readdirSync(knowledgeDir);
  for await (const file of files) {
    const content = fs.readFileSync(path.join(knowledgeDir, file), "utf-8");
    await embeddingRetriever.embedDocument(content);
  }
  const context = (await embeddingRetriever.retrieve(TASK, 3)).join("\n");
  logTitle("CONTEXT");
  console.log(context);
  return context;
}
