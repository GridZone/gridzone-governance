# GridZone

We detail a few of the core contracts.

GridZone.io \(ZONE\) tokenHolders of ZONE token have the ability to govern the protocol via the governor contract.

Governor AlphaThe administrator of the timelock contract. Holders of ZONE token may create and vote on proposals which will be queued into the timelock.

## Installation

Pull the repository from GitHub and install its dependencies. You will need [npm](https://docs.npmjs.com/cli/install) installed.

```text
git clone https://github.com/GridZone/gridzone-governance.git
cd gridzone-governance
npm install
```

## Environment

Create files storing private key and infura API key.

```text
cp .secrets.json.template .secrets.json
```

Open .secrets.json with text editor, write menemonic, infra API key, and etherscan API key

## Compile

Compile the smart contracts.

```text
npx hardhat compile
```

## Deploy and Verify contracts

You can deploy contracts and verify with etherscan API key.

```text
npx hardhat deploy --network mainnet
```

And you can deploy contracts and verify them individually.

### GridZone

```text
npx hardhat deploy --network mainnet --tags mainnet_ZONE_deploy
npx hardhat deploy --network mainnet --tags mainnet_ZONE_verify
```

### Timelock

```text
npx hardhat deploy --network mainnet --tags mainnet_Timelock_deploy
npx hardhat deploy --network mainnet --tags mainnet_Timelock_verify
```

### Governor Alpha

```text
npx hardhat deploy --network mainnet --tags mainnet_GovernorAlpha_deploy
npx hardhat deploy --network mainnet --tags mainnet_GovernorAlpha_verify
```

### VoteBox

```text
npx hardhat deploy --network mainnet --tags mainnet_VoteBox_deploy
npx hardhat deploy --network mainnet --tags mainnet_VoteBox_verify
```

## Print out deployed contracts

```text
npx hardhat run --network mainnet scripts/addresses.js
```

## Change the Timelock admin as GovernorAlpha contract

* execute setPendingAdmin of Timelock contract. The parameter is the address of GovernorAlpha contract. This function must be called by Timelock admin
* execute \_\_acceptAdmin of GovernorAlpha contract. This function must be called by GovernorAlpha guardian

## Test

### Deploy on testnet

```text
npx hardhat deploy --network ropsten --tags ropsten
```

