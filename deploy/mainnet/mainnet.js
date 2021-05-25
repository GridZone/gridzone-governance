const { deployments } = require("hardhat");

module.exports = async () => {
  const zone = await deployments.get("ZONE");
  const timelock = await deployments.get("Timelock");
  const governorAlpha = await deployments.get("GovernorAlpha");
  const voteBox = await deployments.get("VoteBox");

  console.log("Summary:");
  console.log("ZONE address: ", zone.address);
  console.log("");
  console.log("Timelock address: ", timelock.address);
  console.log("");
  console.log("GovernorAlpha address: ", governorAlpha.address);
  console.log("");
  console.log("VoteBox address: ", voteBox.address);
  console.log("");
};
module.exports.tags = ["mainnet"];
module.exports.dependencies = [
  "mainnet_ZONE_deploy",
  "mainnet_Timelock_deploy",
  "mainnet_GovernorAlpha_deploy",
  "mainnet_VoteBox_deploy",
  "mainnet_ZONE_verify",
  "mainnet_Timelock_verify",
  "mainnet_GovernorAlpha_verify",
  "mainnet_VoteBox_verify"
];
