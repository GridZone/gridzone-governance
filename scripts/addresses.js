const { deployments } = require("hardhat");

async function main() {
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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
