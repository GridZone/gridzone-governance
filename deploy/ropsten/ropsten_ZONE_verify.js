const { ethers, run } = require("hardhat");
const { ropsten: network_ } = require("../../parameters");

module.exports = async () => {
  const zone = await ethers.getContract("ZONE");
  try {
    await run("verify:verify", {
      address: zone.address,
      constructorArguments: [
        network_.ZONE.ownerAddress,
        network_.ZONE.vaultAddress,
        network_.ZONE.advisorsAddress,
        network_.ZONE.treasuryAddress,
      ],
      contract: "contracts/ZONE.sol:ZONE",
    });
  } catch(e) {
  }
};
module.exports.tags = ["ropsten_ZONE_verify"];
