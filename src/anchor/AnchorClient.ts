import Binary from "../Binary";
import {
  BASE_ANCHOR_CONTRACT,
  BASE_CHAIN_ID,
  BASE_SEPOLIA_ANCHOR_CONTRACT,
  BASE_SEPOLIA_CHAIN_ID,
  ZERO_HASH
} from "../constants";
import { ANCHOR_ABI } from "./AnchorABI";
import { isBinary } from "../utils/bytes"

/**
 * Options for anchor transactions
 */
export interface AnchorOptions {
  /** ETH value to send with the transaction (in wei) */
  ethValue?: bigint;
}

/**
 * Simplified AnchorClient for blockchain anchoring
 */
export default class AnchorClient<T> {
  static readonly ABI = ANCHOR_ABI;

  constructor(private contract: any) { }

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
   * anchor method - supports both EQTY (default) and ETH payment
   * @param input Anchor data (key-value pairs, keys only, or single key)
   * @param valueOrOptions Either a value Uint8Array or AnchorOptions
   * @param options AnchorOptions when value is provided
   */
  async anchor(
    input: Array<{ key: Uint8Array; value: Uint8Array }>,
    options?: AnchorOptions
  ): Promise<T>;
  async anchor(key: Uint8Array, value: Uint8Array, options?: AnchorOptions): Promise<T>;
  async anchor(value: Array<Uint8Array>, options?: AnchorOptions): Promise<T>;
  async anchor(value: Uint8Array, options?: AnchorOptions): Promise<T>;
  async anchor(
    input: Array<{ key: Uint8Array; value: Uint8Array }> | Array<Uint8Array> | Uint8Array,
    valueOrOptions?: Uint8Array | AnchorOptions,
    options?: AnchorOptions
  ): Promise<T> {
    // Determine if second argument is value or options
    const isValueArg = valueOrOptions instanceof Uint8Array;
    const value = isValueArg ? valueOrOptions : undefined;
    const opts = isValueArg ? options : (valueOrOptions as AnchorOptions | undefined);

    const anchors = this.convertAnchors(input, value);
    const txOptions = opts?.ethValue ? { value: opts.ethValue } : {};
    return await this.contract.anchor(anchors, txOptions);
  }

  /**
   * Get the current ETH fee per anchor from the contract
   * @returns ETH amount in wei required per anchor
   */
  async getEthFee(): Promise<bigint> {
    const fee = await this.contract.getEthFee();
    return BigInt(fee);
  }

  /**
   * Preview total ETH cost for a batch of anchors
   * @param numAnchors Number of anchors to submit
   * @returns Total ETH required in wei
   */
  async previewEthCost(numAnchors: number): Promise<bigint> {
    const cost = await this.contract.previewEthCost(numAnchors);
    return BigInt(cost);
  }

  /**
   * Get the maximum number of anchors allowed per transaction
   */
  async getMaxAnchors(): Promise<number> {
    const value = await this.contract.MAX_ANCHORS_PER_TX();
    return Number(value);
  }

  /**
   * Get the anchor contract address
   */
  static contractAddress(networkId: number): `0x${string}` {
    switch (networkId) {
      case BASE_CHAIN_ID: return BASE_ANCHOR_CONTRACT;
      case BASE_SEPOLIA_CHAIN_ID: return BASE_SEPOLIA_ANCHOR_CONTRACT;
      default:
        throw new Error(`Network ID ${networkId} is not supported`);
    }
  }
}
