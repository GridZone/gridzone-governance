const { ethers, run } = require("hardhat");

module.exports = async () => {
  const timelock = await ethers.getContract("Timelock");
  const voteBox = await ethers.getContract("VoteBox");
  try {
    await run("verify:verify", {
      address: voteBox.address,
      constructorArguments: [
        timelock.address,
      ],
      contract: "contracts/Governance/VoteBox.sol:VoteBox",
    });
  } catch(e) {
  }
};
module.exports.tags = ["mainnet_VoteBox_verify"];
