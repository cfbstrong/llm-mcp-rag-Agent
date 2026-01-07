import MCPClient from "./MCPClient";
import Agent from "./Agent";

const currentDir = process.cwd(); //当前工作文件夹

const fetchMcp = new MCPClient("fetch", "uvx", ["mcp-server-fetch"]);
const fileMcp = new MCPClient("file", "npx", [
  "-y",
  "@modelcontextprotocol/server-filesystem",
  currentDir,
]);

async function main() {
  const agent = new Agent("gpt-4o-mini", [fetchMcp, fileMcp]);
  await agent.init();
  const response = await agent.invoke(
    `爬取https://news.ycombinator.com/的内容,并且总结后保存到${currentDir}的news.md文件中`
  );
  console.log(response);
}

main();
