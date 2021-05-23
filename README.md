# GridZone

We detail a few of the core contracts.

<dl>
  <dt>GridZone.io (ZONE) token</dt>
  <dd>Holders of ZONE token have the ability to govern the protocol via the governor contract.</dd>
</dl>

<dl>
  <dt>Governor Alpha</dt>
  <dd>The administrator of the timelock contract. Holders of ZONE token may create and vote on proposals which will be queued into the timelock.</dd>
</dl>

## Installation
Pull the repository from GitHub and install its dependencies. You will need [npm](https://docs.npmjs.com/cli/install) installed.

    git clone https://github.com/GridZone/gridzone-governance.git
    cd gridzone-governance
    npm install

## Environment

Create files storing private key and infura API key.

    cp .secrets.json.template .secrets.json

Open .secrets.json with text editor, write menemonic, infra API key, and etherscan API key

## Compile

Compile the smart contracts.

	npx hardhat compile


## Deploy and Verify contracts

You can deploy contracts and verify with etherscan API key.

	npx hardhat deploy --network mainnet

And you can deploy contracts and verify them individually.

### GridZone

	npx hardhat deploy --network mainnet --tags ropsten_ZONE_deploy
	npx hardhat deploy --network mainnet --tags ropsten_ZONE_verify

### Timelock

	npx hardhat deploy --network mainnet --tags ropsten_Timelock_deploy
	npx hardhat deploy --network mainnet --tags ropsten_Timelock_verify

### Governor Alpha

	npx hardhat deploy --network mainnet --tags ropsten_GovernorAlpha_deploy
	npx hardhat deploy --network mainnet --tags ropsten_GovernorAlpha_verify

### VoteBox

	npx hardhat deploy --network mainnet --tags ropsten_VoteBox_deploy
	npx hardhat deploy --network mainnet --tags ropsten_VoteBox_verify

## Print out deployed contracts

    npx hardhat run --network mainnet scripts/addresses.js

## Change the Timelock admin as GovernorAlpha contract

* execute setPendingAdmin of Timelock contract. The parameter is the address of GovernorAlpha contract. This function must be called by Timelock admin
* execute __acceptAdmin of GovernorAlpha contract. This function must be called by GovernorAlpha guardian
