module.exports = {
  mainnet: {
    ZONE: {
      ownerAddress: "0xab0B18523e8fe8CBF947C55632e8aB5Ce936ae8c",
      vaultAddress: "0x7205731e9643235Aa313D46552c7aa81E559fB6F",
      advisorsAddress: "0x2e229B4172a7157ea0db8caa0cA580636A05dce3",
      treasuryAddress: "0x0C1Ac3eDE7A6a22CF36457BD3759BceA44b0B643",
    },
    Timelock: {
      delay: 172800, // 2 days
    },
  },
  ropsten: {
    ZONE: {
      ownerAddress: "0xb88B8041E91adB1F084d1bB20B425c3D640B97E9",
      vaultAddress: "0x6CdeD499E788eC7be89E4A4aC183065B1f38Cb16",
      advisorsAddress: "0xef2757646921f8bac0e0d910886ecbcD815A9B8f",
      treasuryAddress: "0x4184e549c96D7081eBE5fD4Af3889646fBd36Aa9",
    },
    Timelock: {
      delay: 172800, // 2 days
    },
  },
};
