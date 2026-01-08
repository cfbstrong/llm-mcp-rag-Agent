import VectorStore from "./VectorStore";

export default class EmbeddingRetrivers {
  private embeddingModel: string;
  private vectorStore: VectorStore;

  constructor(embeddingModel: string) {
    this.embeddingModel = embeddingModel;
    this.vectorStore = new VectorStore();
  }

  async embedQuery(query: string): Promise<number[]> {
    //将prompt转换为向量
    return this.embed(query);
  }

  async embedDocument(document: string): Promise<number[]> {
    //将私域知识转换为向量
    this.vectorStore.add({
      embeddings: await this.embed(document),
      document,
    });
    return this.embed(document);
  }

  private async embed(document: string): Promise<number[]> {
    //将文本转换为向量
    const response = await fetch(
      `${process.env.EMBEDDING_BASE_URL}/embedding`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EMBEDDING_API_KEY}`,
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: document,
        }),
      }
    );
    const data = await response.json();
    return data.data[0].embedding;
  }

  async retrieve(query: string, k: number) {
    const queryEmbedding = await this.embedQuery(query);
    return this.vectorStore.search(queryEmbedding, k);
  }
}
