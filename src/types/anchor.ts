export interface AnchorTxOptions {
  value?: bigint;
}

export interface AnchorContract<T = any> {
  anchor(anchors: { key: string; value: string }[], txOptions?: AnchorTxOptions): Promise<T>;
}
