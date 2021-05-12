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
module.exports.tags = ["ropsten"];
module.exports.dependencies = [
  "ropsten_ZONE_deploy",
  "ropsten_Timelock_deploy",
  "ropsten_GovernorAlpha_deploy",
  "ropsten_VoteBox_deploy",
  "ropsten_ZONE_verify",
  "ropsten_Timelock_verify",
  "ropsten_GovernorAlpha_verify",
  "ropsten_VoteBox_verify"
];
