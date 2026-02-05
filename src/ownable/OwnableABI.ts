/**
 * OwnableNFT Contract ABI
 * 
 * TypeScript wrapper for interacting with the OwnableNFT smart contract.
 * This ABI matches the OwnableNFT.sol contract on Base blockchain.
 */

export const OWNABLE_NFT_ABI = [
    // ============ Core Functions ============

    // mint(bytes32 contentHash, string cid, uint96 royaltyBps, bool isPublic) returns (uint256)
    {
        type: "function",
        name: "mint",
        inputs: [
            { name: "contentHash", type: "bytes32" },
            { name: "cid", type: "string" },
            { name: "royaltyBps", type: "uint96" },
            { name: "isPublic", type: "bool" }
        ],
        outputs: [{ name: "tokenId", type: "uint256" }],
        stateMutability: "payable"
    },

    // anchor(uint256 tokenId, bytes32[] hashes)
    {
        type: "function",
        name: "anchor",
        inputs: [
            { name: "tokenId", type: "uint256" },
            { name: "hashes", type: "bytes32[]" }
        ],
        outputs: [],
        stateMutability: "payable"
    },

    // setPublic(uint256 tokenId, bool isPublic)
    {
        type: "function",
        name: "setPublic",
        inputs: [
            { name: "tokenId", type: "uint256" },
            { name: "isPublic", type: "bool" }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },

    // setRoyalty(uint256 tokenId, uint96 newRoyaltyBps)
    {
        type: "function",
        name: "setRoyalty",
        inputs: [
            { name: "tokenId", type: "uint256" },
            { name: "newRoyaltyBps", type: "uint96" }
        ],
        outputs: [],
        stateMutability: "nonpayable"
    },

    // ============ DeFi Locking ============

    // lock(uint256 tokenId)
    {
        type: "function",
        name: "lock",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [],
        stateMutability: "nonpayable"
    },

    // unlock(uint256 tokenId)
    {
        type: "function",
        name: "unlock",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [],
        stateMutability: "nonpayable"
    },

    // isLocked(uint256 tokenId) returns (bool)
    {
        type: "function",
        name: "isLocked",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view"
    },

    // ============ View Functions ============

    // getOwnable(uint256 tokenId) returns tuple
    {
        type: "function",
        name: "getOwnable",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{
            name: "",
            type: "tuple",
            components: [
                { name: "contentHash", type: "bytes32" },
                { name: "cid", type: "string" },
                { name: "creator", type: "address" },
                { name: "royaltyBps", type: "uint96" },
                { name: "isPublic", type: "bool" },
                { name: "isLocked", type: "bool" },
                { name: "lockedBy", type: "address" },
                { name: "createdAt", type: "uint64" }
            ]
        }],
        stateMutability: "view"
    },

    // getAnchorHistory(uint256 tokenId) returns (bytes32[])
    {
        type: "function",
        name: "getAnchorHistory",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "bytes32[]" }],
        stateMutability: "view"
    },

    // verify(uint256 tokenId, bytes32 hash) returns (bool exists, uint256 index)
    {
        type: "function",
        name: "verify",
        inputs: [
            { name: "tokenId", type: "uint256" },
            { name: "hash", type: "bytes32" }
        ],
        outputs: [
            { name: "exists", type: "bool" },
            { name: "index", type: "uint256" }
        ],
        stateMutability: "view"
    },

    // creatorOf(uint256 tokenId) returns (address)
    {
        type: "function",
        name: "creatorOf",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view"
    },

    // getCid(uint256 tokenId) returns (string)
    {
        type: "function",
        name: "getCid",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view"
    },

    // contentHashToTokenId(bytes32) returns (uint256)
    {
        type: "function",
        name: "contentHashToTokenId",
        inputs: [{ name: "", type: "bytes32" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view"
    },

    // ============ ERC-721 Functions ============

    // ownerOf(uint256 tokenId) returns (address)
    {
        type: "function",
        name: "ownerOf",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view"
    },

    // tokenURI(uint256 tokenId) returns (string)
    {
        type: "function",
        name: "tokenURI",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view"
    },

    // balanceOf(address owner) returns (uint256)
    {
        type: "function",
        name: "balanceOf",
        inputs: [{ name: "owner", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view"
    },

    // ============ EIP-2981 Royalties ============

    // royaltyInfo(uint256 tokenId, uint256 salePrice) returns (address, uint256)
    {
        type: "function",
        name: "royaltyInfo",
        inputs: [
            { name: "tokenId", type: "uint256" },
            { name: "salePrice", type: "uint256" }
        ],
        outputs: [
            { name: "receiver", type: "address" },
            { name: "royaltyAmount", type: "uint256" }
        ],
        stateMutability: "view"
    },

    // ============ Events ============

    {
        type: "event",
        name: "OwnableMinted",
        inputs: [
            { name: "tokenId", type: "uint256", indexed: true },
            { name: "creator", type: "address", indexed: true },
            { name: "contentHash", type: "bytes32", indexed: false },
            { name: "isPublic", type: "bool", indexed: false }
        ]
    },

    {
        type: "event",
        name: "OwnableAnchored",
        inputs: [
            { name: "tokenId", type: "uint256", indexed: true },
            { name: "hash", type: "bytes32", indexed: false },
            { name: "anchor", type: "address", indexed: true },
            { name: "timestamp", type: "uint64", indexed: false }
        ]
    },

    {
        type: "event",
        name: "OwnableLocked",
        inputs: [
            { name: "tokenId", type: "uint256", indexed: true },
            { name: "lockedBy", type: "address", indexed: true }
        ]
    },

    {
        type: "event",
        name: "OwnableUnlocked",
        inputs: [
            { name: "tokenId", type: "uint256", indexed: true }
        ]
    },

    {
        type: "event",
        name: "VisibilityChanged",
        inputs: [
            { name: "tokenId", type: "uint256", indexed: true },
            { name: "isPublic", type: "bool", indexed: false }
        ]
    },

    {
        type: "event",
        name: "RoyaltyUpdated",
        inputs: [
            { name: "tokenId", type: "uint256", indexed: true },
            { name: "newRoyaltyBps", type: "uint96", indexed: false }
        ]
    }
] as const;
