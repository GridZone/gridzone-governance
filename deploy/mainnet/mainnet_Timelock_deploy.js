const { ethers } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  console.log("Now deploying Timelock...");
  const timelock = await deploy("Timelock", {
    from: deployer.address,
    args: [
      network_.ZONE.ownerAddress,
      network_.Timelock.delay,
    ],
  });
  console.log("Timelock contract address: ", timelock.address);
};
module.exports.tags = ["mainnet_Timelock_deploy"];
