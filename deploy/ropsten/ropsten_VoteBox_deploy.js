const { ethers } = require("hardhat");

module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  const [deployer] = await ethers.getSigners();

  const timelock = await ethers.getContract("Timelock");

  console.log("Now deploying VoteBox...");
  const voteBox = await deploy("VoteBox", {
    from: deployer.address,
    args: [
      timelock.address,
    ],
  });
  console.log("VoteBox contract address: ", voteBox.address);

};
module.exports.tags = ["ropsten_VoteBox_deploy"];
