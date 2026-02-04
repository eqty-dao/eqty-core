import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Contract } from "ethers";
import { AnchorClient } from "../../src/anchor";
import Binary from "../../src/Binary";

// A dummy contract address (any 20-byte hex)
const DUMMY_ADDRESS = "0x0000000000000000000000000000000000000001" as const;

let ethersContract: Contract;
let client: AnchorClient<any>;
let anchorSpy: ReturnType<typeof vi.fn>;
let maxAnchorsSpy: ReturnType<typeof vi.fn>;
let getEthFeeSpy: ReturnType<typeof vi.fn>;
let previewEthCostSpy: ReturnType<typeof vi.fn>;

describe("AnchorClient with ethers", () => {
  const key = Binary.fromHex("11".repeat(32));
  const value = Binary.fromHex("22".repeat(32));

  beforeEach(() => {
    ethersContract = new Contract(DUMMY_ADDRESS, AnchorClient.ABI);
    anchorSpy = vi.fn(async (_anchors: Array<{ key: `0x${string}`; value: `0x${string}` }>, _options?: { value?: bigint }) => ({ hash: "0xdeadbeef" } as any));
    maxAnchorsSpy = vi.fn(async () => 16n);
    getEthFeeSpy = vi.fn(async () => 1000000000000000n); // 0.001 ETH
    previewEthCostSpy = vi.fn(async (numAnchors: number) => BigInt(numAnchors) * 1000000000000000n);
    // @ts-expect-error override for testing
    ethersContract.anchor = anchorSpy;
    // @ts-expect-error override for testing
    ethersContract.maxAnchors = maxAnchorsSpy;
    // @ts-expect-error override for testing
    ethersContract.getEthFee = getEthFeeSpy;
    // @ts-expect-error override for testing
    ethersContract.previewEthCost = previewEthCostSpy;
    client = new AnchorClient(ethersContract);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("anchor", () => {
    it("calls ethers.Contract.anchor with a single pair", async () => {
      await client.anchor(key, value);
      expect(anchorSpy).toHaveBeenCalledTimes(1);
      const args = anchorSpy.mock.calls[0][0];
      expect(args).toHaveLength(1);
      expect(args[0].key).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(args[0].value).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(args[0].key).toBe(new Binary(key).hex);
      expect(args[0].value).toBe(new Binary(value).hex);
    });

    it("calls ethers.Contract.anchor with array of pairs", async () => {
      await client.anchor([{ key, value }]);
      expect(anchorSpy).toHaveBeenCalledTimes(1);
      const args = anchorSpy.mock.calls[0][0];
      expect(args).toHaveLength(1);
      expect(args[0].key).toBe(new Binary(key).hex);
      expect(args[0].value).toBe(new Binary(value).hex);
    });

    it("calls ethers.Contract.anchor with array of keys and ZERO_HASH values", async () => {
      await client.anchor([key]);
      expect(anchorSpy).toHaveBeenCalledTimes(1);
      const args = anchorSpy.mock.calls[0][0];
      expect(args).toHaveLength(1);
      expect(args[0].key).toBe(new Binary(key).hex);
      expect(args[0].value).toMatch(/^0x0{64}$/);
    });

    it("calls ethers.Contract.anchor with single key and ZERO_HASH value", async () => {
      await client.anchor(key);
      expect(anchorSpy).toHaveBeenCalledTimes(1);
      const args = anchorSpy.mock.calls[0][0];
      expect(args).toHaveLength(1);
      expect(args[0].key).toBe(new Binary(key).hex);
      expect(args[0].value).toMatch(/^0x0{64}$/);
    });

    it("calls ethers.Contract.anchor with ETH value option", async () => {
      const ethValue = 1000000000000000n; // 0.001 ETH
      await client.anchor(key, value, { ethValue });
      expect(anchorSpy).toHaveBeenCalledTimes(1);
      const [anchors, options] = anchorSpy.mock.calls[0];
      expect(anchors).toHaveLength(1);
      expect(options).toEqual({ value: ethValue });
    });

    it("calls ethers.Contract.anchor with ETH value for array input", async () => {
      const ethValue = 2000000000000000n; // 0.002 ETH
      await client.anchor([{ key, value }], { ethValue });
      expect(anchorSpy).toHaveBeenCalledTimes(1);
      const [anchors, options] = anchorSpy.mock.calls[0];
      expect(anchors).toHaveLength(1);
      expect(options).toEqual({ value: ethValue });
    });

    it("calls ethers.Contract.anchor without ETH value when not provided", async () => {
      await client.anchor([{ key, value }]);
      expect(anchorSpy).toHaveBeenCalledTimes(1);
      const [, options] = anchorSpy.mock.calls[0];
      expect(options).toEqual({});
    });
  });

  describe("getEthFee", () => {
    it("returns ETH fee per anchor as bigint", async () => {
      const fee = await client.getEthFee();
      expect(getEthFeeSpy).toHaveBeenCalledTimes(1);
      expect(fee).toBe(1000000000000000n);
    });
  });

  describe("previewEthCost", () => {
    it("returns total ETH cost for multiple anchors", async () => {
      const cost = await client.previewEthCost(5);
      expect(previewEthCostSpy).toHaveBeenCalledTimes(1);
      expect(previewEthCostSpy).toHaveBeenCalledWith(5);
      expect(cost).toBe(5000000000000000n); // 5 * 0.001 ETH
    });

    it("returns zero for zero anchors", async () => {
      previewEthCostSpy.mockResolvedValueOnce(0n);
      const cost = await client.previewEthCost(0);
      expect(cost).toBe(0n);
    });
  });

  describe("getMaxAnchors", () => {
    it("coerces bigint to number", async () => {
      const max = await client.getMaxAnchors();
      expect(maxAnchorsSpy).toHaveBeenCalledTimes(1);
      expect(max).toBe(16);
    });
  });
});

