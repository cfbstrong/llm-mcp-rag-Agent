export interface VectorStoreItem {
  embeddings: number[];
  document: string;
}

export default class VectorStore {
  private VectorStore: VectorStoreItem[];

  constructor() {
    this.VectorStore = [];
  }

  add(item: VectorStoreItem) {
    this.VectorStore.push(item); // 将项目添加到items数组的末尾
  }

  search(queryEmbeddings: number[], k: number): VectorStoreItem[] {
    const scored = this.VectorStore.map((item) => {
      const score = this._calculateCosineSimilarity(
        queryEmbeddings,
        item.embeddings
      );
      return { ...item, score };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, k);
  }

  private _calculateCosineSimilarity(
    embedding1: number[],
    embedding2: number[]
  ): number {
    // 计算余弦相似度
    const dotProduct = embedding1.reduce(
      (sum, value, index) => sum + value * embedding2[index],
      0
    );
    const magnitude1 = Math.sqrt(
      embedding1.reduce((sum, value) => sum + value * value, 0)
    );
    const magnitude2 = Math.sqrt(
      embedding2.reduce((sum, value) => sum + value * value, 0)
    );
    return dotProduct / (magnitude1 * magnitude2);
  }
}
