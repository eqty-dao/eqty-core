export interface AnchorContract<T = any> {
  anchor(anchors: { key: string; value: string }[]): Promise<T>;
  MAX_ANCHORS_PER_TX(): Promise<bigint>;
}
