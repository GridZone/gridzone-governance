const { ethers } = require("hardhat");
const { mainnet: network_ } = require("../../parameters");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const timelock = await ethers.getContract("Timelock");
  const zone = await ethers.getContract("ZONE");

  console.log("Now deploying GovernorAlpha...");
  const governorAlpha = await deploy("GovernorAlpha", {
    from: deployer.address,
    args: [
      timelock.address,
      zone.address,
      network_.ZONE.ownerAddress,
    ],
  });
  console.log("GovernorAlpha contract address: ", governorAlpha.address);

};
module.exports.tags = ["mainnet_GovernorAlpha_deploy"];
