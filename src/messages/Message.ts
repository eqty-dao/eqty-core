import Binary from "../Binary";
import {
  IMessageMeta,
  IMessageJSON,
  IMessageData,
  ISignData,
  ISigner,
  VerifyFn,
} from "../types";
import { isBinary } from "../utils/bytes";

const MESSAGE_V3 = 3;

export default class Message {
  /** Version of the message */
  version = MESSAGE_V3;

  /** Extra info and details about the message */
  meta: IMessageMeta = { type: "basic", title: "", description: "" };

  /** Meta type of the data */
  mediaType!: string;

  /** Data of the message */
  data!: Binary;

  /** Time when the message was signed */
  timestamp?: number;

  /** Ethereum address of the sender */
  sender?: string;

  /** Signature of the message */
  signature?: Binary;

  /** Address of the recipient */
  recipient?: string;

  /** Hash (see dynamic property) */
  private _hash?: Binary;

  constructor(
    data: IMessageData | string | Uint8Array,
    mediaType?: string,
    meta: Partial<IMessageMeta> | string = {}
  ) {
    if (typeof meta === "string") meta = { type: meta }; // Backwards compatibility
    this.meta = { ...this.meta, ...meta };

    if (typeof data === "string") {
      this.mediaType = mediaType ?? "text/plain";
      this.data = new Binary(data);
    } else if (isBinary(data)) {
      this.mediaType = mediaType ?? "application/octet-stream";
      this.data = data instanceof Binary ? data : new Binary(data);
    } else {
      if (mediaType && mediaType !== "application/json")
        throw new Error(`Unable to encode data as ${mediaType}`);
      this.mediaType = mediaType ?? "application/json";
      this.data = new Binary(JSON.stringify(data));
    }
  }

  get hash(): Binary {
    if (!this._hash) {
      this._hash = new Binary(this.toBinary(false)).hash();
    }
    return this._hash;
  }

  to(recipient: string): Message {
    if (this.signature) throw new Error("Message is already signed");

    this.recipient = recipient;
    return this;
  }

  private getSignData(): ISignData {
    if (this.version !== MESSAGE_V3) {
      throw new Error(`version ${this.version} not supported`);
    }

    if (!this.sender) throw new Error("sender is required");
    if (!this.recipient) throw new Error("recipient is required");
    if (!this.timestamp) throw new Error("timestamp is required");

    const domain = {
      name: "EqtyMessage",
      version: String(this.version),
    };

    const types = {
      Message: [
        { name: "version", type: "uint256" },
        { name: "sender", type: "address" },
        { name: "recipient", type: "address" },
        { name: "timestamp", type: "uint256" },
        { name: "mediaType", type: "string" },
        { name: "dataHash", type: "bytes32" },
        { name: "metaHash", type: "bytes32" },
      ],
    };

    const metaHash = new Binary(JSON.stringify(this.meta)).hash();
    const value = {
      version: this.version,
      sender: this.sender!,
      recipient: this.recipient!,
      timestamp: this.timestamp!,
      mediaType: this.mediaType,
      dataHash: new Binary(this.data).hash().hex,
      metaHash: metaHash.hex,
    };

    return { domain, types, value };
  }

  async signWith(sender: ISigner): Promise<this> {
    if (this.signature) throw new Error("Message is already signed");

    this.sender = await sender.getAddress();
    this.timestamp = Math.floor(Date.now() / 1000);

    const { domain, types, value } = this.getSignData();
    const signature: string = await sender.signTypedData(domain, types, value);

    this.signature = Binary.fromHex(signature);

    return this;
  }

  isSigned(): boolean {
    return !!this.signature;
  }

  async verifySignature(verify: VerifyFn): Promise<boolean> {
    if (!this.signature || !this.sender) return false;

    const { domain, types, value } = this.getSignData();
    return await verify(this.sender, domain, types, value, this.signature.hex);
  }

  verifyHash(): boolean {
    try {
      const computedHash = new Binary(this.toBinary(false)).hash();
      return this.hash.hex === computedHash.hex;
    } catch (error) {
      return false;
    }
  }

  private toBinaryV3(withSignature = true): Uint8Array {
    const metaBytes = Binary.from(JSON.stringify(this.meta));
    const mediaTypeBytes = Binary.from(this.mediaType);
    const senderBytes = this.sender ? Binary.from(this.sender) : new Binary(0);
    const recipientBytes = this.recipient ? Binary.from(this.recipient) : new Binary(0);

    const parts: Uint8Array[] = [
      Binary.fromInt32(this.version),            // 4 bytes
      Binary.fromInt16(metaBytes.length),         // 2 bytes length prefix
      metaBytes,                                  // variable
      Binary.fromInt16(mediaTypeBytes.length),    // 2 bytes length prefix
      mediaTypeBytes,                             // variable
      Binary.fromInt32(this.data.length),          // 4 bytes length prefix
      this.data,                                  // variable
      Binary.fromInt32(Math.floor((this.timestamp || 0) / 1000)), // 4 bytes (unix seconds)
      Uint8Array.from([senderBytes.length]),       // 1 byte length prefix
      senderBytes,                                // variable (42 for 0x address)
      Uint8Array.from([recipientBytes.length]),    // 1 byte length prefix
      recipientBytes,                             // variable
    ];

    if (withSignature && this.signature) {
      parts.push(Uint8Array.from([this.signature.length]));  // 1 byte length prefix
      parts.push(this.signature);
    }

    return Binary.concat(...parts);
  }

  toBinary(withSignature = true): Uint8Array {
    switch (this.version) {
      case MESSAGE_V3:
        return this.toBinaryV3(withSignature);
      default:
        throw new Error(`Message version ${this.version} not supported`);
    }
  }

  toJSON(): IMessageJSON {
    return {
      version: this.version,
      meta: this.meta,
      mediaType: this.mediaType,
      data: this.data.base64,
      timestamp: this.timestamp,
      sender: this.sender,
      signature: this.signature?.base58,
      recipient: this.recipient,
      hash: this.hash.base58,
    };
  }

  static from(data: IMessageJSON | Uint8Array): Message {
    return isBinary(data) ? Message.fromBinary(data) : Message.fromJSON(data);
  }

  private static fromJSON(json: IMessageJSON): Message {
    try {
      const data = Binary.fromBase64(json.data);

      const message = new Message(data, json.mediaType, json.meta);
      message.version = json.version;
      message.timestamp = json.timestamp;
      message.sender = json.sender;
      message.signature = json.signature
        ? Binary.fromBase58(json.signature)
        : undefined;
      message.recipient = json.recipient;
      message._hash = json.hash ? Binary.fromBase58(json.hash) : undefined;

      return message;
    } catch (error) {
      throw new Error(
        `Failed to create message from JSON: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  private static fromBinary(data: Uint8Array): Message {
    const bin = new Binary(data);
    const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);

    if (bin.length < 4 + 2 + 2 + 4 + 4 + 1 + 1) {
      throw new Error("Invalid message binary: too short");
    }

    let offset = 0;

    // Parse version (4 bytes int32 BE)
    const version = dv.getInt32(offset, false);
    offset += 4;

    if (version !== MESSAGE_V3) {
      throw new Error(`Message version ${version} not supported`);
    }

    // Parse meta (2 bytes length prefix + JSON string)
    const metaLen = dv.getUint16(offset, false);
    offset += 2;
    if (offset + metaLen > bin.length) throw new Error("Invalid message binary: meta out of bounds");
    const metaStr = new TextDecoder().decode(data.slice(offset, offset + metaLen));
    offset += metaLen;

    let meta: IMessageMeta;
    try {
      meta = JSON.parse(metaStr);
    } catch {
      throw new Error("Invalid message binary: meta is not valid JSON");
    }

    // Parse mediaType (2 bytes length prefix + string)
    const mediaTypeLen = dv.getUint16(offset, false);
    offset += 2;
    if (offset + mediaTypeLen > bin.length) throw new Error("Invalid message binary: mediaType out of bounds");
    const mediaType = new TextDecoder().decode(data.slice(offset, offset + mediaTypeLen));
    offset += mediaTypeLen;

    // Parse data (4 bytes length prefix + bytes)
    const dataLen = dv.getUint32(offset, false);
    offset += 4;
    if (offset + dataLen > bin.length) throw new Error("Invalid message binary: data out of bounds");
    const payload = new Binary(data.slice(offset, offset + dataLen));
    offset += dataLen;

    // Parse timestamp (4 bytes int32 BE, unix seconds)
    const timestampSeconds = dv.getInt32(offset, false);
    offset += 4;

    // Parse sender (1 byte length prefix + string)
    const senderLen = data[offset++];
    const sender = senderLen > 0
      ? new TextDecoder().decode(data.slice(offset, offset + senderLen))
      : undefined;
    offset += senderLen;

    // Parse recipient (1 byte length prefix + string)
    const recipientLen = data[offset++];
    const recipient = recipientLen > 0
      ? new TextDecoder().decode(data.slice(offset, offset + recipientLen))
      : undefined;
    offset += recipientLen;

    // Parse signature if present
    let signature: Binary | undefined;
    if (offset < bin.length) {
      const sigLen = data[offset++];
      if (sigLen > 0 && offset + sigLen <= bin.length) {
        signature = new Binary(data.slice(offset, offset + sigLen));
        offset += sigLen;
      }
    }

    const message = new Message(payload, mediaType, meta);
    message.version = version;
    message.timestamp = timestampSeconds > 0 ? timestampSeconds * 1000 : undefined;
    message.sender = sender;
    message.recipient = recipient;
    message.signature = signature;

    return message;
  }
}
