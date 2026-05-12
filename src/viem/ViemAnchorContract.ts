import { AnchorClient } from "../anchor";
import type { AnchorTxOptions } from "../types";

export default class ViemAnchorContract {
  constructor(
    private readonly client: any,
    private readonly wallet: any,
    private readonly address: `0x${string}`
  ) {}

  async anchor(
    anchors: Array<{ key: `0x${string}`; value: `0x${string}` }>,
    txOptions?: AnchorTxOptions
  ): Promise<string> {
    const value = txOptions?.value;
    const { request } = await this.client.simulateContract({
      address: this.address,
      abi: AnchorClient.ABI,
      functionName: "anchor",
      args: [anchors],
      account: this.wallet.account!,
      value,
    });

    const result = await this.wallet.writeContract(
      value === undefined ? request : { ...request, value }
    );

    // Handle different response formats
    if (typeof result === "string") {
      return result;
    } else if (result && typeof result === "object") {
      if ("hash" in result) {
        return result.hash;
      } else if ("transactionHash" in result) {
        return result.transactionHash;
      } else if ("txHash" in result) {
        return result.txHash;
      } else {
        throw new Error(
          `Unexpected writeContract result format: ${JSON.stringify(result)}`
        );
      }
    } else {
      throw new Error(`Unexpected writeContract result type: ${typeof result}`);
    }
  }

}
