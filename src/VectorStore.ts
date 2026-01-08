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

  search(query: number[], k: number): VectorStoreItem[] {}
}
