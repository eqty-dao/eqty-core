import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import Message from "../../src/messages/Message";
import Binary from "../../src/Binary";
import { Wallet, verifyTypedData } from "ethers";
import { Account, createWalletClient, http, WalletClient, verifyTypedData as viemVerifyTypedData } from "viem";
import { privateKeyToAccount } from "viem/accounts"
import { mainnet } from "viem/chains"
import { ViemSigner } from "../../src"

const hexSignature = `0x${"11".repeat(65)}`;

function createBinaryMessage(options: {
  version?: number;
  meta?: { type: string; title: string; description: string };
  mediaType?: string;
  data?: Uint8Array;
  timestamp?: number;
  sender?: string;
  recipient?: string;
  signatureHex?: string | null;
}): Uint8Array {
  const {
    version = 3,
    meta = { type: "basic", title: "", description: "" },
    mediaType = "text/plain",
    data = new TextEncoder().encode("payload"),
    timestamp = Math.floor(Date.now() / 1000),
    sender = "0xSender",
    recipient = "0xRecipient",
    signatureHex = hexSignature,
  } = options;

  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];

  // Version: 4 bytes int32 BE
  const versionBytes = new Uint8Array(4);
  new DataView(versionBytes.buffer).setInt32(0, version, false);
  parts.push(versionBytes);

  // Meta: 2-byte length prefix + JSON string
  const metaStr = encoder.encode(JSON.stringify(meta));
  const metaLenBytes = new Uint8Array(2);
  new DataView(metaLenBytes.buffer).setUint16(0, metaStr.length, false);
  parts.push(metaLenBytes);
  parts.push(metaStr);

  // MediaType: 2-byte length prefix + string
  const mediaTypeBytes = encoder.encode(mediaType);
  const mediaTypeLenBytes = new Uint8Array(2);
  new DataView(mediaTypeLenBytes.buffer).setUint16(0, mediaTypeBytes.length, false);
  parts.push(mediaTypeLenBytes);
  parts.push(mediaTypeBytes);

  // Data: 4-byte length prefix + bytes
  const dataLenBytes = new Uint8Array(4);
  new DataView(dataLenBytes.buffer).setUint32(0, data.length, false);
  parts.push(dataLenBytes);
  parts.push(data);

  // Timestamp: 4 bytes int32 BE (unix seconds)
  const timestampBytes = new Uint8Array(4);
  new DataView(timestampBytes.buffer).setInt32(0, timestamp, false);
  parts.push(timestampBytes);

  // Sender: 1-byte length prefix + string
  const senderBytes = encoder.encode(sender);
  parts.push(Uint8Array.of(senderBytes.length));
  parts.push(senderBytes);

  // Recipient: 1-byte length prefix + string
  const recipientBytes = encoder.encode(recipient);
  parts.push(Uint8Array.of(recipientBytes.length));
  parts.push(recipientBytes);

  // Signature: 1-byte length prefix + bytes (optional)
  if (signatureHex) {
    const signatureBytes = Binary.fromHex(signatureHex);
    parts.push(Uint8Array.of(signatureBytes.length));
    parts.push(signatureBytes);
  }

  return Binary.concat(...parts);
}

describe("Message", () => {
  it("creates message from string data and meta string", () => {
    const message = new Message("hello", undefined, "notification");

    expect(message.mediaType).toBe("text/plain");
    expect(message.meta.type).toBe("notification");
    expect(message.data.toString()).toBe("hello");
  });

  it("creates message from binary data", () => {
    const binaryData = Binary.from("abc");
    const message = new Message(binaryData, undefined, { title: "Binary" });

    expect(message.mediaType).toBe("application/octet-stream");
    expect(message.data.hex).toBe(binaryData.hex);
    expect(message.meta.title).toBe("Binary");
  });

  it("creates message from JSON data", () => {
    const message = new Message({ foo: "bar" }, undefined, { description: "json" });

    expect(message.mediaType).toBe("application/json");
    expect(message.data.toString()).toBe(JSON.stringify({ foo: "bar" }));
    expect(message.meta.description).toBe("json");
  });

  it("throws when encoding object with invalid media type", () => {
    expect(() => new Message({ foo: "bar" }, "text/plain")).toThrow(
      "Unable to encode data as text/plain"
    );
  });

  it("sets recipient and prevents changes after signing", () => {
    const message = new Message("hello");
    expect(message.to("0xRecipient")).toBe(message);
    expect(message.recipient).toBe("0xRecipient");

    message.signature = Binary.fromInt32(1);

    expect(() => message.to("0xAnother")).toThrow("Message is already signed");
  });

  it("computes hash and verifies correctly", () => {
    const message = new Message("hash me");
    const hashBefore = message.hash.hex;

    expect(hashBefore).toBe(message.hash.hex);
    expect(message.verifyHash()).toBe(true);
  });

  it("returns false when verifyHash encounters errors", () => {
    const message = new Message("data");
    message.version = 99;

    expect(message.verifyHash()).toBe(false);
  });

  it("rejects signing without recipient", async () => {
    const wallet = Wallet.createRandom();
    const message = new Message("data");

    await expect(message.signWith(wallet as any)).rejects.toThrow("recipient is required");
  });

  it("rejects signing when version unsupported", async () => {
    const wallet = Wallet.createRandom();
    const message = new Message("data");
    message.to(wallet.address);
    message.version = 2;

    await expect(message.signWith(wallet as any)).rejects.toThrow("version 2 not supported");
  });

  it("rejects signing when sender unavailable", async () => {
    const signer = {
      async getAddress() {
        return undefined as unknown as string;
      },
      async signTypedData() {
        return hexSignature;
      },
    };

    const message = new Message("data").to("0xRecipient");

    await expect(message.signWith(signer)).rejects.toThrow("sender is required");
  });

  it("signs and verifies with ethers", async () => {
    const wallet = Wallet.createRandom();
    const recipient = Wallet.createRandom().address;
    const message = new Message("hello ethers").to(recipient);

    await message.signWith(wallet as any);

    expect(message.sender?.toLowerCase()).toBe(wallet.address.toLowerCase());
    expect(message.isSigned()).toBe(true);

    const verified = await message.verifySignature(async (address, domain, types, value, signature) => {
      const recovered = verifyTypedData(domain, types, value, signature);
      return recovered.toLowerCase() === address.toLowerCase();
    });

    expect(verified).toBe(true);
  });

  it("rejects re-signing already signed message", async () => {
    const wallet = Wallet.createRandom();
    const message = new Message("data").to(wallet.address);

    await message.signWith(wallet as any);

    await expect(message.signWith(wallet as any)).rejects.toThrow("Message is already signed");
  });

  it("returns false when verifySignature lacks signature or sender", async () => {
    const message = new Message("unsigned");
    const result = await message.verifySignature(async () => true);

    expect(result).toBe(false);
  });

  it("throws if timestamp missing during verification", async () => {
    const message = new Message("data");
    message.sender = "0x123";
    message.recipient = "0x456";
    message.signature = Binary.fromHex(hexSignature);

    await expect(message.verifySignature(async () => true)).rejects.toThrow(
      "timestamp is required"
    );
  });

  it("serializes and deserializes via JSON", () => {
    const wallet = Wallet.createRandom();
    const message = new Message("serialize").to(wallet.address);
    message.sender = wallet.address;
    message.timestamp = 1234567890;
    message.signature = Binary.fromHex(hexSignature);

    const json = message.toJSON();
    const restored = Message.from(json);

    expect(restored.meta).toEqual(message.meta);
    expect(restored.hash.base58).toBe(json.hash);
  });

  it("throws descriptive error when JSON parsing fails", () => {
    expect(() =>
      Message.from({
        version: 3,
        meta: { type: "bad" },
        mediaType: "text/plain",
        data: "not-base58",
      } as any)
    ).toThrow(/Failed to create message from JSON/);
  });

  it("deserializes from binary with signature", () => {
    const timestamp = 1720000000;
    const binary = createBinaryMessage({ timestamp });
    const message = Message.from(binary);

    expect(message.version).toBe(3);
    expect(message.timestamp).toBe(timestamp);
    expect(message.signature?.hex.startsWith("0x")).toBe(true);
  });

  it("deserializes from binary without signature", () => {
    const binary = createBinaryMessage({ signatureHex: null });
    const message = Message.from(binary);

    expect(message.signature).toBeUndefined();
  });

  it("throws for unsupported binary version", () => {
    // Must be at least 18 bytes to pass minimum length check (4+2+2+4+4+1+1)
    const binary = new Uint8Array(18);
    new DataView(binary.buffer).setInt32(0, 2, false); // version = 2

    expect(() => Message.from(binary)).toThrow("Message version 2 not supported");
  });

  it("excludes signature when requested", async () => {
    const wallet = Wallet.createRandom();
    const message = new Message("binary").to(wallet.address);

    await message.signWith(wallet as any);

    const withSignature = message.toBinary();
    const withoutSignature = message.toBinary(false);

    expect(withoutSignature.length).toBeLessThan(withSignature.length);
  });

  it("toBinary throws on unsupported version", () => {
    const message = new Message("data");
    message.version = 42;

    expect(() => message.toBinary()).toThrow("Message version 42 not supported");
  });

  describe("viem", () => {
    let walletClient: WalletClient;
    let account: Account;
    let signer: ViemSigner;

    beforeEach(() => {
      // Create real viem clients
      account = privateKeyToAccount(`0x${"11".repeat(32)}`);
      walletClient = createWalletClient({ chain: mainnet, transport: http("http://127.0.0.1:8545"), account });

      signer = new ViemSigner(walletClient);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("signs and verifies messages with viem using ViemSigner", async () => {
      const recipient = privateKeyToAccount(`0x${"22".repeat(32)}`).address;
      const message = new Message("hello viem").to(recipient);

      await message.signWith(signer);

      expect(message.sender?.toLowerCase()).toBe(account.address.toLowerCase());
      expect(message.isSigned()).toBe(true);

      const verified = await message.verifySignature(async (address, domain, types, value, signature) => {
        return await viemVerifyTypedData({
          address: address as `0x${string}`,
          domain: domain,
          types: types,
          primaryType: "Message",
          message: value,
          signature: signature as `0x${string}`,
        });
      });

      expect(verified).toBe(true);
    });
  });
});
