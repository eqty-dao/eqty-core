import Binary from "../Binary";
import {
    BASE_CHAIN_ID,
    BASE_SEPOLIA_CHAIN_ID,
    ZERO_ADDRESS
} from "../constants";
import { OWNABLE_NFT_ABI } from "./OwnableABI";

/**
 * Ownable data structure matching the contract's OwnableData struct
 */
export interface OwnableData {
    contentHash: `0x${string}`;
    cid: string;
    creator: `0x${string}`;
    royaltyBps: number;
    isPublic: boolean;
    isLocked: boolean;
    lockedBy: `0x${string}`;
    createdAt: number;
}

/**
 * Options for mint transactions
 */
export interface MintOptions {
    /** ETH value to send with the transaction (in wei) */
    ethValue?: bigint;
}

/**
 * Options for anchor transactions on Ownables
 */
export interface OwnableAnchorOptions {
    /** ETH value to send with the transaction (in wei) */
    ethValue?: bigint;
}

/**
 * Result of verify() call
 */
export interface VerifyResult {
    exists: boolean;
    index: number;
}

/**
 * Royalty info from royaltyInfo() call
 */
export interface RoyaltyInfo {
    receiver: `0x${string}`;
    royaltyAmount: bigint;
}

// Contract addresses - to be filled when deployed
export const BASE_OWNABLE_CONTRACT = ZERO_ADDRESS as `0x${string}`;
export const BASE_SEPOLIA_OWNABLE_CONTRACT = ZERO_ADDRESS as `0x${string}`;

/**
 * OwnableClient for interacting with the OwnableNFT smart contract
 * 
 * This client provides TypeScript-friendly methods for:
 * - Minting new Ownables (ERC-721 NFTs)
 * - Anchoring provenance hashes to Ownables
 * - Managing visibility (public/private)
 * - DeFi locking/unlocking
 * - Querying ownership and royalty info
 */
export default class OwnableClient<T> {
    static readonly ABI = OWNABLE_NFT_ABI;

    constructor(private contract: any) { }

    // ============ Core Functions ============

    /**
     * Mint a new Ownable NFT
     * @param contentHash Hash of the ownable content (bytes32)
     * @param cid IPFS CID for metadata (can be encrypted off-chain)
     * @param royaltyBps Royalty in basis points (max 1000 = 10%)
     * @param isPublic Whether the metadata is publicly visible
     * @param options Transaction options including ETH value
     * @returns Promise resolving to token ID
     */
    async mint(
        contentHash: Uint8Array | `0x${string}`,
        cid: string,
        royaltyBps: number,
        isPublic: boolean,
        options?: MintOptions
    ): Promise<T> {
        const hashHex = contentHash instanceof Uint8Array
            ? new Binary(contentHash).hex
            : contentHash;

        const txOptions = options?.ethValue ? { value: options.ethValue } : {};
        return await this.contract.mint(hashHex, cid, royaltyBps, isPublic, txOptions);
    }

    /**
     * Anchor provenance hashes to an Ownable
     * @param tokenId The Ownable token ID
     * @param hashes Array of hashes to anchor
     * @param options Transaction options including ETH value
     */
    async anchor(
        tokenId: bigint | number,
        hashes: Array<Uint8Array | `0x${string}`>,
        options?: OwnableAnchorOptions
    ): Promise<T> {
        const hashesHex = hashes.map(h =>
            h instanceof Uint8Array ? new Binary(h).hex : h
        );

        const txOptions = options?.ethValue ? { value: options.ethValue } : {};
        return await this.contract.anchor(BigInt(tokenId), hashesHex, txOptions);
    }

    /**
     * Set visibility of an Ownable
     * @param tokenId The token ID
     * @param isPublic New visibility state
     */
    async setPublic(tokenId: bigint | number, isPublic: boolean): Promise<T> {
        return await this.contract.setPublic(BigInt(tokenId), isPublic);
    }

    /**
     * Update royalty for an Ownable (only callable by creator)
     * @param tokenId The token ID
     * @param newRoyaltyBps New royalty in basis points
     */
    async setRoyalty(tokenId: bigint | number, newRoyaltyBps: number): Promise<T> {
        return await this.contract.setRoyalty(BigInt(tokenId), newRoyaltyBps);
    }

    // ============ DeFi Locking ============

    /**
     * Lock an Ownable (prevents transfers)
     * Used for collateralization in DeFi protocols
     * @param tokenId The token ID to lock
     */
    async lock(tokenId: bigint | number): Promise<T> {
        return await this.contract.lock(BigInt(tokenId));
    }

    /**
     * Unlock an Ownable (only callable by original locker)
     * @param tokenId The token ID to unlock
     */
    async unlock(tokenId: bigint | number): Promise<T> {
        return await this.contract.unlock(BigInt(tokenId));
    }

    /**
     * Check if an Ownable is locked
     * @param tokenId The token ID
     * @returns True if locked
     */
    async isLocked(tokenId: bigint | number): Promise<boolean> {
        return await this.contract.isLocked(BigInt(tokenId));
    }

    // ============ View Functions ============

    /**
     * Get full Ownable data
     * @param tokenId The token ID
     * @returns OwnableData struct
     */
    async getOwnable(tokenId: bigint | number): Promise<OwnableData> {
        const data = await this.contract.getOwnable(BigInt(tokenId));
        return {
            contentHash: data.contentHash,
            cid: data.cid,
            creator: data.creator,
            royaltyBps: Number(data.royaltyBps),
            isPublic: data.isPublic,
            isLocked: data.isLocked,
            lockedBy: data.lockedBy,
            createdAt: Number(data.createdAt)
        };
    }

    /**
     * Get anchor history for an Ownable
     * @param tokenId The token ID
     * @returns Array of anchored hashes
     */
    async getAnchorHistory(tokenId: bigint | number): Promise<`0x${string}`[]> {
        return await this.contract.getAnchorHistory(BigInt(tokenId));
    }

    /**
     * Verify a hash exists in the anchor history
     * @param tokenId The token ID
     * @param hash The hash to verify
     * @returns Object with exists flag and index
     */
    async verify(
        tokenId: bigint | number,
        hash: Uint8Array | `0x${string}`
    ): Promise<VerifyResult> {
        const hashHex = hash instanceof Uint8Array
            ? new Binary(hash).hex
            : hash;

        const [exists, index] = await this.contract.verify(BigInt(tokenId), hashHex);
        return { exists, index: Number(index) };
    }

    /**
     * Get the original creator of an Ownable
     * @param tokenId The token ID
     * @returns Creator address
     */
    async creatorOf(tokenId: bigint | number): Promise<`0x${string}`> {
        return await this.contract.creatorOf(BigInt(tokenId));
    }

    /**
     * Get the CID for an Ownable (returns empty if private and caller not owner)
     * @param tokenId The token ID
     * @returns CID string
     */
    async getCid(tokenId: bigint | number): Promise<string> {
        return await this.contract.getCid(BigInt(tokenId));
    }

    /**
     * Get token ID by content hash
     * @param contentHash The content hash
     * @returns Token ID (0 if not minted)
     */
    async getTokenIdByHash(contentHash: Uint8Array | `0x${string}`): Promise<bigint> {
        const hashHex = contentHash instanceof Uint8Array
            ? new Binary(contentHash).hex
            : contentHash;

        return await this.contract.contentHashToTokenId(hashHex);
    }

    // ============ ERC-721 Functions ============

    /**
     * Get owner of an Ownable
     * @param tokenId The token ID
     * @returns Owner address
     */
    async ownerOf(tokenId: bigint | number): Promise<`0x${string}`> {
        return await this.contract.ownerOf(BigInt(tokenId));
    }

    /**
     * Get token URI (metadata URL)
     * @param tokenId The token ID
     * @returns URI string (or private placeholder if not public)
     */
    async tokenURI(tokenId: bigint | number): Promise<string> {
        return await this.contract.tokenURI(BigInt(tokenId));
    }

    /**
     * Get balance (number of owned tokens) for an address
     * @param owner Owner address
     * @returns Number of owned tokens
     */
    async balanceOf(owner: `0x${string}`): Promise<bigint> {
        return await this.contract.balanceOf(owner);
    }

    // ============ EIP-2981 Royalties ============

    /**
     * Get royalty info for a sale
     * @param tokenId The token ID
     * @param salePrice Sale price in wei
     * @returns Receiver address and royalty amount
     */
    async royaltyInfo(
        tokenId: bigint | number,
        salePrice: bigint
    ): Promise<RoyaltyInfo> {
        const [receiver, amount] = await this.contract.royaltyInfo(
            BigInt(tokenId),
            salePrice
        );
        return { receiver, royaltyAmount: amount };
    }

    // ============ Static Helpers ============

    /**
     * Get the OwnableNFT contract address for a network
     * @param networkId Chain ID
     * @returns Contract address
     */
    static contractAddress(networkId: number): `0x${string}` {
        switch (networkId) {
            case BASE_CHAIN_ID: return BASE_OWNABLE_CONTRACT;
            case BASE_SEPOLIA_CHAIN_ID: return BASE_SEPOLIA_OWNABLE_CONTRACT;
            default:
                throw new Error(`Network ID ${networkId} is not supported for OwnableNFT`);
        }
    }
}
