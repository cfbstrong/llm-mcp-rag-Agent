import VectorStore from "./VectorStore";

export default class EmbeddingRetrivers {
  private embeddingModel: string;
  private vectorStore: VectorStore;

  constructor(embeddingModel: string) {
    this.embeddingModel = embeddingModel;
    this.vectorStore = new VectorStore();
  }

  async embed(document: string): Promise<number[]> {
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
}
