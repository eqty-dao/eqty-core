# EQTY Core

EQTY Core Events Library - Base-compatible event chain and messaging for EQTY

## Overview

This library provides a clean, Base-compatible implementation of event chains and messaging for the EQTY platform. It replaces the LTO Network private layer components with Ethereum wallet-native signing and Base blockchain anchoring.

## Features

- **Event Chains**: Cryptographically linked events with Ethereum wallet signing
- **Messaging**: Encrypted messaging with wallet-based authentication
- **Base Anchoring**: Stateless smart contract anchoring on Base
- **Wallet Integration**: Native support for MetaMask, WalletConnect, and other Ethereum wallets
- **TypeScript**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install eqty-core
```

## Quick Start with Ethers

### Basic Event Chain Usage

```typescript
import { Event, EventChain, AnchorClient } from "eqty-core";
import { BrowserProvider, verifyTypedData, Contract } from "ethers";

const BASE_SEPOLIA_ANCHOR = "0xe518BB784B8cB17e6F16e445A9275A16d61700b5";

// Connect to wallet
const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const address = await signer.getAddress();
const { chainId: networkId } = await provider.getNetwork();

// Create an event chain
const chain = EventChain.create(address, networkId);

// Create event and add to chain
const event = new Event({ message: "Hello EQTY!" }, "application/json").addTo(chain);

// Sign event
await event.signWith(signer);

// Create anchor client using the network-specific contract address
const contract = new Contract(
  BASE_SEPOLIA_ANCHOR,
  AnchorClient.ABI,
  signer,
);
const anchorClient = new AnchorClient(contract as any);
const ethFee = 1_000_000_000_000_000n; // Example only; compute this outside eqty-core

// EQTY payment
await anchorClient.anchor(chain.anchorMap());

// ETH payment
await anchorClient.anchor(chain.anchorMap(), { value: ethFee });

// Validate a received event chain
chain.validate((address, domain, types, value, signature) =>
  verifyTypedData(domain, types, value, signature).toLowerCase() === address.toLowerCase()
);
```

### Messaging

```typescript
import { Message, AnchorClient } from "eqty-core";
import { BrowserProvider, Contract } from "ethers";

const BASE_SEPOLIA_ANCHOR = "0xe518BB784B8cB17e6F16e445A9275A16d61700b5";

// Connect to wallet
const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const { chainId: networkId } = await provider.getNetwork();

// Create a message
const message = new Message("Hello from EQTY!", "text/plain", {
  type: "greeting",
  title: "Welcome Message",
});

// Set the recipient and sign the message
await message
  .to("0x8dB7BC85A8ec23B2190D6dA004DE58FeFB2FBbAD")
  .signWith(signer);

// Create anchor client
const contract = new Contract(
  BASE_SEPOLIA_ANCHOR,
  AnchorClient.ABI,
  signer,
);
const anchorClient = new AnchorClient(contract as any);

// Anchor message hash to blockchain
await anchorClient.anchor(message.hash);

// Validate a received message
chain.validate((address, domain, types, value, signature) =>
  verifyTypedData(domain, types, value, signature).toLowerCase() === address.toLowerCase()
);
```

## Quick Start with Viem

### Basic Event Chain Usage

```typescript
import { Event, EventChain, AnchorClient, ViemSigner, ViemContract } from "eqty-core";
import { createWalletClient, createPublicClient, custom, recoverTypedDataAddress } from "viem";
import { baseSepolia } from "viem/chains";

const BASE_SEPOLIA_ANCHOR = "0xe518BB784B8cB17e6F16e445A9275A16d61700b5";

// Request accounts and set up viem wallet client with an account
const [address] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];

const walletClient = createWalletClient({
  account: address as `0x${string}`,
  chain: baseSepolia, // or base
  transport: custom(window.ethereum),
});

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: custom(window.ethereum),
});

// Create an EQTY signer for viem
const signer = new ViemSigner(walletClient);

// Create an event chain
const networkId = baseSepolia.id;
const chain = EventChain.create(address, networkId);

// Create event and add to chain
const event = new Event({ message: "Hello EQTY!" }, "application/json").addTo(chain);

// Sign event with viem signer
await event.signWith(signer);

// Set up ViemContract and AnchorClient
const contract = new ViemContract(
  publicClient,
  walletClient,
  BASE_SEPOLIA_ANCHOR,
);
const anchorClient = new AnchorClient(contract as any);
const ethFee = 1_000_000_000_000_000n; // Example only; compute this outside eqty-core

// EQTY payment
await anchorClient.anchor(chain.anchorMap());

// ETH payment
await anchorClient.anchor(chain.anchorMap(), { value: ethFee });

// Validate a received event chain
chain.validate(
  async (address, domain, types, value, signature) => {
    return await viemVerifyTypedData({
      address: address as `0x${string}`,
      domain: domain,
      types: types,
      primaryType: "Event",
      message: value,
      signature: signature as `0x${string}`,
    });
  }
);
```

### Messaging

```typescript
import { Message, AnchorClient, ViemSigner, ViemContract } from "eqty-core";
import { createWalletClient, createPublicClient, custom } from "viem";
import { baseSepolia } from "viem/chains";

const BASE_SEPOLIA_ANCHOR = "0xe518BB784B8cB17e6F16e445A9275A16d61700b5";

// Set up viem wallet/public clients
const [address] = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];

const walletClient = createWalletClient({
  account: address as `0x${string}`,
  chain: baseSepolia,
  transport: custom(window.ethereum),
});
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: custom(window.ethereum),
});

const signer = new ViemSigner(walletClient);
const networkId = baseSepolia.id;

// Create a message
const message = new Message("Hello from EQTY!", "text/plain", {
  type: "greeting",
  title: "Welcome Message",
});


// Set the recipient and sign the message
await message
  .to("0x8dB7BC85A8ec23B2190D6dA004DE58FeFB2FBbAD")
  .signWith(signer);

// Set up ViemContract and AnchorClient
const contract = new ViemContract(
  publicClient,
  walletClient,
  BASE_SEPOLIA_ANCHOR
);
const anchorClient = new AnchorClient(contract as any);

// Anchor message hash to blockchain
await anchorClient.anchor(message.hash);

// Validate a received message
message.validate(
  async (address, domain, types, value, signature) => {
    return await viemVerifyTypedData({
      address: address as `0x${string}`,
      domain: domain,
      types: types,
      primaryType: "Event",
      message: value,
      signature: signature as `0x${string}`,
    });
  }
);

```

## API Reference

## Anchor Contracts

Use the deployed addresses from `eqty-contracts` when constructing your contract adapter.

### Base Mainnet

- EQTY token: `0xC71F37D9bF4C5d1E7Fe4bCcB97e6f30B11b37D29`
- Anchor: pending deployment

### Base Sepolia

- EQTY token: `0x24159513a74ca294f5367764557438d318eb7ffe`
- Anchor: `0xe518BB784B8cB17e6F16e445A9275A16d61700b5`

## Paying Anchor Fees

Anchor accepts payment in either EQTY or ETH. EQTY payment is typically cheaper. Fee discovery stays outside `eqty-core`; callers should determine the required EQTY amount or ETH `value` before calling `anchor()`.

### Pay with EQTY

Approve the Anchor contract to spend the required EQTY fee, then call `anchor()` normally.

```typescript
import { AnchorClient } from "eqty-core";
import { BrowserProvider, Contract } from "ethers";

const BASE_SEPOLIA_ANCHOR = "0xe518BB784B8cB17e6F16e445A9275A16d61700b5";
const BASE_SEPOLIA_EQTY = "0x24159513a74ca294f5367764557438d318eb7ffe";
const ERC20_ABI = [
  "function approve(address spender, uint256 value) returns (bool)",
];

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const eqty = new Contract(BASE_SEPOLIA_EQTY, ERC20_ABI, signer);
await eqty.approve(BASE_SEPOLIA_ANCHOR, eqtyFee);

const anchorContract = new Contract(BASE_SEPOLIA_ANCHOR, AnchorClient.ABI, signer);
const anchorClient = new AnchorClient(anchorContract as any);

await anchorClient.anchor(chain.anchorMap());
```

### Pay with ETH

Pass the ETH fee through as `value`.

```typescript
import { AnchorClient } from "eqty-core";
import { BrowserProvider, Contract } from "ethers";

const BASE_SEPOLIA_ANCHOR = "0xe518BB784B8cB17e6F16e445A9275A16d61700b5";

const provider = new BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const anchorContract = new Contract(BASE_SEPOLIA_ANCHOR, AnchorClient.ABI, signer);
const anchorClient = new AnchorClient(anchorContract as any);

await anchorClient.anchor(chain.anchorMap(), { value: ethFee });
```

### Core Classes

#### Event
Represents a single event in an event chain.

```typescript
class Event {
  constructor(data: any, mediaType?: string, previous?: string | Uint8Array);

  // Build and read
  addAttachment(name: string, data: Uint8Array, mediaType: string): this;
  addTo(chain: EventChain): this;
  get parsedData(): any;
  toJSON(): IEventJSON;

  // Signing & verification
  async signWith(signer: ISigner): Promise<this>;
  async verifySignature(verify: VerifyFn): Promise<boolean>;
  verifyHash(): boolean;

  // Static helpers
  static from(json: IEventJSON, defaultVersion?: number): Event;
}
```

#### EventChain
Manages a chain of cryptographically linked events.

```typescript
class EventChain {
  // Factory
  static create(address: string, networkId: number, nonce?: Uint8Array): EventChain;
  withVerification(verify: VerifyFn): this;

  // Compose
  add(eventOrChain: Event | EventChain): this;
  addEvent(event: Event): this;
  addChain(chain: EventChain): this;
  has(event: Event): boolean;

  // State
  latestHash(): Uint8Array | undefined;
  initialHash(): Uint8Array | undefined;
  latestEvent(): Event | undefined;
  state(): Uint8Array;
  initialState(): Uint8Array;
  stateAt(length: number): Uint8Array;
  isSigned(): boolean;

  // Validation and metadata
  validate(verify: VerifyFn): Promise<void>;
  isCreatedBy(address: string, networkId: number): boolean;

  // Anchoring
  anchorMap: Array<{ key: Uint8Array; value: Uint8Array }>;

  // Serialization
  toJSON(): IEventChainJSON;
  static from(json: IEventChainJSON): EventChain;
}
```

#### Message
Represents a message with optional metadata that can be signed and anchored.

```typescript
class Message {
  constructor(data: any, mediaType?: string, meta?: IMessageMeta);

  hash(): Uint8Array;
  to(recipient: string): Message;

  // Signing & verification
  async signWith(sender: ISigner): Promise<this>;
  isSigned(): boolean;
  async verifySignature(verify: VerifyFn): Promise<boolean>;
  verifyHash(): boolean;

  // Binary/JSON
  toJSON(): IMessageJSON;
  static fromJSON(json: IMessageJSON): Message;
  static fromBinary(data: Uint8Array): Message;
}
```

#### AnchorClient
Interfaces with the Base Anchor smart contract. You pass in a contract adapter that implements `anchor()`.

```typescript
interface AnchorTxOptions {
  value?: bigint;
}

class AnchorClient<T> {
  static readonly ABI: any;

  constructor(contract: AnchorContract<T>);

  // Anchor 1 or many entries (Uint8Array inputs)
  anchor(input: Array<{ key: Uint8Array; value: Uint8Array }>, txOptions?: AnchorTxOptions): Promise<T>;
  anchor(key: Uint8Array, value: Uint8Array, txOptions?: AnchorTxOptions): Promise<T>;
  anchor(value: Array<Uint8Array>, txOptions?: AnchorTxOptions): Promise<T>;
  anchor(value: Uint8Array, txOptions?: AnchorTxOptions): Promise<T>;
}
```

### Binary Utilities

#### Binary
Extended Uint8Array with blockchain-specific functionality.

```typescript
class Binary extends Uint8Array {
  // Encodings
  get base58(): string;
  get base64(): string;
  get hex(): string; // 0x-prefixed
  get hexRaw(): string; // without 0x

  // Hashing
  hash(): Binary;

  // Construction
  static from(value: string | ArrayLike<number> | Iterable<any>): Binary;
  static fromBase58(value: string): Binary;
  static fromBase64(value: string): Binary;
  static fromHex(value: string): Binary;
  static fromMultibase(value: string): Binary;

  // Numbers (big-endian)
  static fromInt16(value: number): Binary;
  static fromInt32(value: number): Binary;

  // Utilities
  static concat(...items: Array<ArrayLike<number>>): Binary;
}
```

### Viem helpers

```typescript
class ViemSigner<T extends IViemAccount> implements ISigner {
  constructor(client: IViemWalletClient<T>);
  getAddress(): Promise<string>;
  signTypedData(domain, types, value): Promise<string>;
}

class ViemContract<T extends IViemAccount> {
  constructor(publicClient: IViemPublicClient, walletClient: IViemWalletClient<T>, address: `0x${string}`);
  anchor(anchors: Array<{ key: `0x${string}`; value: `0x${string}` }>, txOptions?: AnchorTxOptions): Promise<void>;
}
```

## Migration from LTO

This library replaces the following LTO components:

| LTO Component       | EQTY Replacement | Notes                                                        |
|---------------------|------------------|--------------------------------------------------------------|
| `events/Event`      | `Event`          | Uses Ethereum signing instead of LTO keypairs                |
| `events/EventChain` | `EventChain`     | Anchors to Base instead of LTO blockchain                    |
| `messages/Message`  | `Message`        | Wallet-native authentication                                 |
| `messages/Relay`    | `Relay`          | Simplified for Base compatibility                            |
| `Binary`            | `Binary`         | Ported with minimal changes                                  |
| `LTO.anchor()`      | `AnchorClient`   | Replaced with helper class to anchor using an smart contract |

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint-fix
```

## License

MIT
