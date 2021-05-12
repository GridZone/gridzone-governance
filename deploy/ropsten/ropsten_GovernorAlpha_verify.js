const { ethers, run } = require("hardhat");
const { ropsten: network_ } = require("../../parameters");

module.exports = async () => {
  const timelock = await ethers.getContract("Timelock");
  const zone = await ethers.getContract("ZONE");
  const governorAlpha = await ethers.getContract("GovernorAlpha");
  try {
    await run("verify:verify", {
      address: governorAlpha.address,
      constructorArguments: [
        timelock.address,
        zone.address,
        network_.ZONE.ownerAddress,
      ],
      contract: "contracts/Governance/GovernorAlpha.sol:GovernorAlpha",
    });
  } catch(e) {
  }
};
module.exports.tags = ["ropsten_GovernorAlpha_verify"];
