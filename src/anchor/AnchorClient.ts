import Binary from "../Binary";
import { ZERO_HASH } from "../constants";
import type { AnchorTxOptions } from "../types";
import { ANCHOR_ABI } from "./AnchorABI";
import { isBinary } from "../utils/bytes"

/**
 * Simplified AnchorClient for blockchain anchoring
 */
export default class AnchorClient<T> {
  static readonly ABI = ANCHOR_ABI;

  constructor(private contract: any) {}

  private convertAnchors(
    input: Array<{ key: Uint8Array; value: Uint8Array }> | Array<Uint8Array> | Uint8Array,
    value?: Uint8Array
  ): { key: string; value: string }[] {
    if (isBinary(input)) {
      return [{ key: new Binary(input).hex, value: value ? new Binary(value).hex : ZERO_HASH }];
    }

    return input.map((item) =>
      isBinary(item)
        ? { key: new Binary(item).hex, value: ZERO_HASH }
        : { key: new Binary(item.key).hex, value: new Binary(item.value).hex },
    );
  }

  /**
   * anchor method
   */
  async anchor(
    input: Array<{ key: Uint8Array; value: Uint8Array }>,
    txOptions?: AnchorTxOptions
  ): Promise<T>;
  async anchor(key: Uint8Array, value: Uint8Array, txOptions?: AnchorTxOptions): Promise<T>;
  async anchor(value: Array<Uint8Array>, txOptions?: AnchorTxOptions): Promise<T>;
  async anchor(value: Uint8Array, txOptions?: AnchorTxOptions): Promise<T>;
  async anchor(
    input: Array<{ key: Uint8Array; value: Uint8Array }> | Array<Uint8Array> | Uint8Array,
    valueOrTxOptions?: Uint8Array | AnchorTxOptions,
    txOptions?: AnchorTxOptions
  ): Promise<T> {
    const anchorValue = isBinary(input) && isBinary(valueOrTxOptions) ? valueOrTxOptions : undefined;
    const options = isBinary(valueOrTxOptions) ? txOptions : valueOrTxOptions;
    const anchors = this.convertAnchors(input, anchorValue);

    if (options?.value === undefined) {
      return await this.contract.anchor(anchors);
    }

    return await this.contract.anchor(anchors, options);
  }
}
