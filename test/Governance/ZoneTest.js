const { expect } = require("chai")
const { ethers, waffle } = require("hardhat")
const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const ZONE_JSON = require('../../artifacts/contracts/ZONE.sol/ZONE.json');

const {
  address,
  minerStart,
  minerStop,
  mineBlock
} = require('../Utils/Ethereum');

const EIP712 = require('../Utils/EIP712');

describe('ZONE', () => {
  const name = 'GridZone.io';

  let owner, vault, advisors, treasury, a1, a2, accounts, chainId;
  let zone;

  beforeEach(async () => {
    [deployer, owner, vault, advisors, treasury, a1, a2, ...accounts] = await ethers.getSigners();
    chainId = (await ethers.provider.getNetwork()).chainId;

    zone = await waffle.deployContract(deployer, ZONE_JSON, [owner.address, vault.address, advisors.address, treasury.address]);
  });

  describe('delegateBySig', () => {
    const Domain = (zone) => ({ name, chainId, verifyingContract: zone.address });
    const Types = {
      Delegation: [
        { name: 'delegatee', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'expiry', type: 'uint256' }
      ]
    };

    it('reverts if the signatory is invalid', async () => {
      const delegatee = owner.address, nonce = 0, expiry = 0;
      await expectRevert(zone.delegateBySig(
        delegatee, nonce, expiry, 0,
        '0x0000000000000000000000000000000000000000000000000000000000000bad',
        '0x0000000000000000000000000000000000000000000000000000000000000bad'
      ), "revert ZONE::delegateBySig: invalid signature");
    });

    it('reverts if the nonce is bad ', async () => {
      const delegatee = owner.address, nonce = 1, expiry = 0;
      const { v, r, s } = await EIP712.sign(Domain(zone), 'Delegation', { delegatee, nonce, expiry }, Types, a1);
      await expectRevert(zone.delegateBySig(delegatee, nonce, expiry, v, r, s), "revert ZONE::delegateBySig: invalid nonce");
    });

    it('reverts if the signature has expired', async () => {
      const delegatee = owner.address, nonce = 0, expiry = 0;
      const { v, r, s } = await EIP712.sign(Domain(zone), 'Delegation', { delegatee, nonce, expiry }, Types, a1);
      await expectRevert(zone.delegateBySig(delegatee, nonce, expiry, v, r, s), "revert ZONE::delegateBySig: signature expired");
    });

    it('delegates on behalf of the signatory', async () => {
      const delegatee = owner.address, nonce = 0, expiry = 10e9;
      const { v, r, s } = await EIP712.sign(Domain(zone), 'Delegation', { delegatee, nonce, expiry }, Types, a1);
      expect(await zone.delegates(a1.address)).to.equal(address(0));
      const tx = await zone.delegateBySig(delegatee, nonce, expiry, v, r, s);
      expect(tx.gasUsed < 80000);
      expect(await zone.delegates(a1.address)).to.equal(delegatee);
    });
  });
});
