# GridZone

We detail a few of the core contracts.

<dl>
  <dt>GridZone</dt>
  <dd>GridZone.io (ZONE) governance token. Holders of this token have the ability to govern the protocol via the governor contract.</dd>
</dl>

<dl>
  <dt>Governor Alpha</dt>
  <dd>The administrator of the timelock contract. Holders of ZONE token may create and vote on proposals which will be queued into the timelock.</dd>
</dl>

## Pre-installation

    sudo apt install build-essential

and install solc

## Installation
Pull the repository from GitHub and install its dependencies. You will need [yarn](https://yarnpkg.com/lang/en/docs/install/) or [npm](https://docs.npmjs.com/cli/install) installed.

    git clone https://github.com/GridZone/gridzone-governance.git
    cd gridzone-governance
    yarn install --lock-file

Patch node_modules/eth-saddle/dist/contract.js to set the estimated gas limit and price when deploy contracts.

	+++ dist/contract.js	2021-02-06 18:46:22.800146768 +0800
	@@ -147,7 +147,15 @@
    	     receiptResolveFn = resolve;
	     });
	-    let deployment = deployer.send(sendOptions).on('receipt', (receipt) => {
	+	// update gasLimit
	+	console.log('sendOptions=', sendOptions);
	+    var newOptions = Object.create(sendOptions);
	+    Object.assign(newOptions, sendOptions);
	+    newOptions['gasPrice'] = await web3.eth.getGasPrice();
	+    newOptions['gas'] = await deployer.estimateGas();
	+    console.log('newOptions=', newOptions);
	+
	+    let deployment = deployer.send(newOptions).on('receipt', (receipt) => {
    	     return receiptResolveFn(receipt);

## Environment

Create files storing private key and infura API key.

    mkdir -p ~/.ethereum
    echo $PRIVATE_KEY > ~/.ethereum/mainnet
    echo $INFURA_API_URL > ~/.ethereum/mainnet-url

* PRIVATE_KEY is the private key of deployer account 
* INFURA_API_URL is the url of infura API. ex: https://infura.io/v3/XXXXX

## Compile

Compile the smart contracts.

    npx saddle compile

Fore more details of saddle, you can read [this page](https://github.com/compound-finance/saddle#cli).

## Deploy and Verify contracts

You can deploy contracts and verify with etherscan API key.

### GridZone.io (ZONE) token

    npx saddle deploy -n mainnet ZONE $OWNER $ACCOUNT
    npx saddle verify $ETHSCAN_API_KEY -n mainnet $DEPLOYED_ADDRESS ZONE $OWNER $ACCOUNT

* OWNER is the address of GridZone.io token owner.
* ACCOUNT is the address to receive 20% of initial supply.
* ETHSCAN_API_KEY is the API key of [etherscan.io](https://etherscan.io/).
* DEPLOYED_ADDRESS is the address of deployed contract by above command - 'npx saddle deploy'.

### Timelock

    npx saddle deploy -n mainnet Timelock $TIMELOCK_ADMIN $DELAY
    npx saddle verify $ETHSCAN_API_KEY -n mainnet $DEPLOYED_ADDRESS Timelock $TIMELOCK_ADMIN $DELAY

* TIMELOCK_ADMIN is the admin account's address of Timelock contract. This address should be changed to GovernorAlpha contract address after GovernorAlpha contract deployed.
* DELAY is the least amount of delay which the proposal can be executed after proposals is queued. Minimum delay is 2 days. This parameter is specified in seconds. ex: 172800.

### GovernorAlpha

    npx saddle deploy -n mainnet GovernorAlpha $TIMELOCK_CONTRACT $ZONE_CONTRACT $GOV_GUARDIAN
    npx saddle verify $ETHSCAN_API_KEY -n mainnet $DEPLOYED_ADDRESS GovernorAlpha $TIMELOCK_CONTRACT $ZONE_CONTRACT $GOV_GUARDIAN

* TIMELOCK_CONTRACT is the address of Timelock contract
* ZONE_CONTRACT is the address of GridZone.io token contract
* GOV_GUARDIAN is the address of governance guardian. The guardian can cancel the any not executed proposal.

### VoteBox

    npx saddle deploy -n mainnet VoteBox $TIMELOCK_CONTRACT
    npx saddle verify $ETHSCAN_API_KEY -n mainnet $DEPLOYED_ADDRESS VoteBox $TIMELOCK_CONTRACT

## Change the Timelock admin as GovernorAlpha contract

* execute setPendingAdmin of Timelock contract. The parameter is the address of GovernorAlpha contract. This function must be called by Timelock admin
* execute __acceptAdmin of GovernorAlpha contract. This function must be called by GovernorAlpha guardian
