/**
 * ABI for the Base anchor contract
 */
export const ANCHOR_ABI = [
  {
    type: "function",
    name: "anchor",
    inputs: [
      {
        components: [
          { name: "key", type: "bytes32", internalType: "bytes32" },
          { name: "value", type: "bytes32", internalType: "bytes32" },
        ],
        name: "anchors",
        type: "tuple[]",
        internalType: "struct IAnchor.Anchor[]",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "event",
    name: "Anchored",
    inputs: [
      { name: "key", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "value", type: "bytes32", indexed: false, internalType: "bytes32" },
      { name: "sender", type: "address", indexed: true, internalType: "address" },
      { name: "timestamp", type: "uint64", indexed: false, internalType: "uint64" },
    ],
    anonymous: false,
  },
] as const;
