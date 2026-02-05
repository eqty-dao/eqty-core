/**
 * Ownable module exports
 * 
 * Provides TypeScript client and ABI for interacting with OwnableNFT contract
 */

export { default as OwnableClient } from "./OwnableClient";
export { OWNABLE_NFT_ABI } from "./OwnableABI";
export {
    BASE_OWNABLE_CONTRACT,
    BASE_SEPOLIA_OWNABLE_CONTRACT
} from "./OwnableClient";
export type {
    OwnableData,
    MintOptions,
    OwnableAnchorOptions,
    VerifyResult,
    RoyaltyInfo
} from "./OwnableClient";
