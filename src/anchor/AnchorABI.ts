/**
 * ABI for the Base anchor contract
 */
export const ANCHOR_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "key", type: "bytes32" },
          { name: "value", type: "bytes32" },
        ],
        name: "anchors",
        type: "tuple[]",
      },
    ],
    name: "anchor",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_ANCHORS_PER_TX",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getEthFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "numAnchors", type: "uint256" }],
    name: "previewEthCost",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "key", type: "bytes32" },
      { indexed: false, name: "value", type: "bytes32" },
      { indexed: true, name: "sender", type: "address" },
      { indexed: false, name: "timestamp", type: "uint64" },
    ],
    name: "Anchored",
    type: "event",
  },
] as const;
