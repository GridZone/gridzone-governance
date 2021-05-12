const { ethers, run } = require("hardhat");
const { ropsten: network_ } = require("../../parameters");

module.exports = async () => {
  const timelock = await ethers.getContract("Timelock");
  try {
    await run("verify:verify", {
      address: timelock.address,
      constructorArguments: [
        network_.ZONE.ownerAddress,
        network_.Timelock.delay,
      ],
      contract: "contracts/Governance/Timelock.sol:Timelock",
    });
  } catch(e) {
  }
};
module.exports.tags = ["ropsten_Timelock_verify"];
