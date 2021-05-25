const { ethers } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying ZONE...");
  const zone = await deploy("ZONE", {
    from: deployer.address,
    args: [
      network_.ZONE.ownerAddress,
      network_.ZONE.vaultAddress,
      network_.ZONE.advisorsAddress,
      network_.ZONE.treasuryAddress,
    ],
  });
  console.log("ZONE contract address: ", zone.address);
};
module.exports.tags = ["mainnet_ZONE_deploy"];
