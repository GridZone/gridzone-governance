const { expect } = require("chai")
const { ethers, waffle } = require("hardhat")
const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const { BigNumber } = require('bignumber.js');
BigNumber.config({
  EXPONENTIAL_AT: 1e+9,
  ROUNDING_MODE: BigNumber.ROUND_FLOOR,
})

const {
  blockTimestamp,
  increaseTime,
  sendEth,
} = require('./Utils/Ethereum');

const ZONE_JSON = require('../artifacts/contracts/ZONE.sol/ZONE.json');

const SECONDS_IN_YEAR = 365 * 24 * 3600;
const SECONDS_IN_QUARTER = SECONDS_IN_YEAR / 4;
const SECONDS_IN_MONTH = 30 * 24 * 3600;

describe('ZONE', () => {
  const name = 'GridZone.io';
  const symbol = 'ZONE';

  let owner, vault, advisors, treasury, community;
  let zone, launchTime;
  let ret;

  beforeEach(async () => {
    [owner, vault, advisors, treasury, community, a1, a2, ...accounts] = await ethers.getSigners();
    deployer = owner

    zone = await waffle.deployContract(deployer, ZONE_JSON, [owner.address, vault.address, advisors.address, treasury.address]);
    launchTime = await zone.launchTime();
  });

  describe('metadata', () => {
    it('has given name', async () => {
      expect(await zone.name()).to.equal(name);
    });

    it('has given symbol', async () => {
      expect(await zone.symbol()).to.equal(symbol);
    });
  });

  describe('basic condition', () => {
    it('fallback function does not receive the ETH', async () => {
      await expectRevert(sendEth(a1.address, zone.address, '1'), "revert ZONE: Use the purchase function to buy the ZONE token.");
    });
  });

  describe('initial amount', () => {
    it('grants to initial cap and totalSupply', async () => {
      expect(await zone.totalSupply()).to.equal("4060000000000000000000000");
      expect(await zone.cap()).to.equal("28000000000000000000000000");
    });

    it('grants to initial account', async () => {
      expect(await zone.balanceOf(owner.address)).to.equal("0");
      expect(await zone.balanceOf(vault.address)).to.equal("420000000000000000000000"); // AIRDROP
      expect(await zone.balanceOf(advisors.address)).to.equal("0");
      expect(await zone.balanceOf(treasury.address)).to.equal("3640000000000000000000000"); // TREASURY
    });

    it('grants to initial locked amount', async () => {
      expect(await zone.getLockedAmount(treasury.address)).to.equal("3640000000000000000000000"); // TREASURY
    });
  });

  describe('Team sale', () => {
    const supply = (new BigNumber(3360000)).shiftedBy(18);

    it('calculate & claim', async () => {
      ret = await zone.calculateVestClaim(owner.address);
      expect(ret[0]).to.equal("0");
      expect(ret[1]).to.equal("0");
      expect(await zone.balanceOf(owner.address)).to.equal("0");

      // Check the vested amount after 1 month
      await increaseTime(SECONDS_IN_MONTH);
      ts = (await blockTimestamp()) - launchTime;
      const m1VestedAmount = supply.multipliedBy(ts).dividedBy(SECONDS_IN_YEAR*2).integerValue();
      ret = await zone.calculateVestClaim(owner.address);
      expect(ret[0]).to.equal(m1VestedAmount.toString());
      expect(ret[1]).to.equal("0");

      // Claim after 1 month
      await zone.claimVestedToken(owner.address);
      ts = (await blockTimestamp()) - launchTime;
      const m1ClaimAmount = supply.multipliedBy(ts).dividedBy(SECONDS_IN_YEAR*2).integerValue();
      ret = await zone.calculateVestClaim(owner.address);
      expect(ret[0]).to.equal(m1ClaimAmount.toString());
      expect(ret[1]).to.equal(m1ClaimAmount.toString());
      expect(await zone.balanceOf(owner.address)).to.equal(m1ClaimAmount.toString());

      // Check the vested amount after the vesting finished
      ts = (await blockTimestamp()) - launchTime;
      await increaseTime(SECONDS_IN_YEAR*2 - ts);
      ret = await zone.calculateVestClaim(owner.address);
      expect(ret[0]).to.equal(supply.toString());
      expect(ret[1]).to.equal(m1ClaimAmount.toString());

      // Claim after the vesting finished
      await zone.claimVestedToken(owner.address);
      ret = await zone.calculateVestClaim(owner.address);
      expect(ret[0]).to.equal(supply.toString());
      expect(ret[1]).to.equal(supply.toString());
      expect(await zone.balanceOf(owner.address)).to.equal(supply.toString());
    });

    it('revoke', async () => {
      ret = await zone.calculateVestClaim(owner.address);
      expect(ret[0]).to.equal("0");
      expect(ret[1]).to.equal("0");
      expect(await zone.balanceOf(owner.address)).to.equal("0");

      // revoke after 1 month
      await increaseTime(SECONDS_IN_MONTH);
      await expectRevert(zone.revokeVest(owner.address), "revert ZONE: caller is not the timelock of governor.");
      await zone.setGovernorTimelock(community.address);
      await zone.connect(community).revokeVest(owner.address);

      ret = await zone.calculateVestClaim(owner.address);
      expect(ret[0]).to.equal(supply.toString());
      expect(ret[1]).to.equal(supply.toString());
      expect(await zone.balanceOf(owner.address)).to.equal(supply.toString());
    });
  });

  describe('Advisors sale', () => {
    const supply = (new BigNumber(980000)).shiftedBy(18);

    it('calculate & claim', async () => {
      ret = await zone.calculateVestClaim(advisors.address);
      expect(ret[0]).to.equal("0");
      expect(ret[1]).to.equal("0");
      expect(await zone.balanceOf(advisors.address)).to.equal("0");

      // Check the vested amount after 1 month
      await increaseTime(SECONDS_IN_MONTH);
      ts = (await blockTimestamp()) - launchTime;
      const m1VestedAmount = supply.multipliedBy(ts).dividedBy(SECONDS_IN_YEAR).integerValue();
      ret = await zone.calculateVestClaim(advisors.address);
      expect(ret[0]).to.equal(m1VestedAmount.toString());
      expect(ret[1]).to.equal("0");

      // Claim after 1 month
      await zone.claimVestedToken(advisors.address);
      ts = (await blockTimestamp()) - launchTime;
      const m1ClaimAmount = supply.multipliedBy(ts).dividedBy(SECONDS_IN_YEAR).integerValue();
      ret = await zone.calculateVestClaim(advisors.address);
      expect(ret[0]).to.equal(m1ClaimAmount.toString());
      expect(ret[1]).to.equal(m1ClaimAmount.toString());
      expect(await zone.balanceOf(advisors.address)).to.equal(m1ClaimAmount.toString());

      // Check the vested amount after the vesting finished
      ts = (await blockTimestamp()) - launchTime;
      await increaseTime(SECONDS_IN_YEAR - ts);
      ret = await zone.calculateVestClaim(advisors.address);
      expect(ret[0]).to.equal(supply.toString());
      expect(ret[1]).to.equal(m1ClaimAmount.toString());

      // Claim after the vesting finished
      await zone.claimVestedToken(advisors.address);
      ret = await zone.calculateVestClaim(advisors.address);
      expect(ret[0]).to.equal(supply.toString());
      expect(ret[1]).to.equal(supply.toString());
      expect(await zone.balanceOf(advisors.address)).to.equal(supply.toString());
    });

    it('revoke', async () => {
      ret = await zone.calculateVestClaim(advisors.address);
      expect(ret[0]).to.equal("0");
      expect(ret[1]).to.equal("0");
      expect(await zone.balanceOf(advisors.address)).to.equal("0");

      // revoke after 1 month
      await increaseTime(SECONDS_IN_MONTH);
      await expectRevert(zone.revokeVest(advisors.address), "revert ZONE: caller is not the timelock of governor.");
      await zone.setGovernorTimelock(community.address);
      await zone.connect(community).revokeVest(advisors.address);

      ret = await zone.calculateVestClaim(advisors.address);
      expect(ret[0]).to.equal(supply.toString());
      expect(ret[1]).to.equal(supply.toString());
      expect(await zone.balanceOf(advisors.address)).to.equal(supply.toString());
    });
  });

  describe('Genesis sale', () => {
    const supply = (new BigNumber(1400000)).shiftedBy(18);
    const rate = supply.multipliedBy(10).div(12).dividedToIntegerBy("200000000000000000000");

    it('minimum purchase amount', async () => {
      await expectRevert(zone.connect(a1).purchase({value: (new BigNumber(0.009)).shiftedBy(18).toString()}), "revert ZONE: The purchase minimum amount is 0.01 ETH");
    });

    it('simple purchase', async () => {
      expect(await zone.isCrowdsaleFinished()).to.equal(false);
      expect(await zone.rate()).to.equal(rate.toString());

      expect(await zone.balanceOf(a1.address)).to.equal('0');
      const amount1 = (new BigNumber(0.01)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1);
      await zone.connect(a1).purchase({value: (new BigNumber(0.01)).shiftedBy(18).toString()});
      expect(await zone.balanceOf(a1.address)).to.equal(amount1.toString());

      await zone.connect(a2).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()});
      await zone.connect(a2).purchase({value: (new BigNumber(2)).shiftedBy(18).toString()});
      await zone.connect(a2).purchase({value: (new BigNumber(3)).shiftedBy(18).toString()});
      await zone.connect(a2).purchase({value: (new BigNumber(4)).shiftedBy(18).toString()});
      await zone.connect(a2).purchase({value: (new BigNumber(5)).shiftedBy(18).toString()});
      const amount2 = (new BigNumber(15)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1);
      expect(await zone.balanceOf(a2.address)).to.equal(amount2.toString());
      
      const lockedTokens = await zone.getLockedTokens(a2.address);
      expect(lockedTokens[0].amount).to.equal((new BigNumber(1)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1).toString());
      expect(lockedTokens[1].amount).to.equal((new BigNumber(2)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1).toString());
      expect(lockedTokens[2].amount).to.equal((new BigNumber(3)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1).toString());
      expect(lockedTokens[3].amount).to.equal((new BigNumber(4)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1).toString());
      expect(lockedTokens[4].amount).to.equal((new BigNumber(5)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1).toString());
    });

    it('purchase bonus', async () => {
      expect(await zone.balanceOf(a1.address)).to.equal('0');
      const amount1 = (new BigNumber(9.99)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1);
      await zone.connect(a1).purchase({value: (new BigNumber(9.99)).shiftedBy(18).toString()});
      expect(await zone.balanceOf(a1.address)).to.equal(amount1.toString());

      const amount2 = (new BigNumber(10)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.2);
      await zone.connect(a1).purchase({value: (new BigNumber(10)).shiftedBy(18).toString()});
      expect(await zone.balanceOf(a1.address)).to.equal(amount2.plus(amount1).toString());
    });

    it('set rate', async () => {
      const newRate = rate.multipliedBy(2);
      await zone.setGenesisSaleRate(newRate.toString());
      expect(await zone.getGenesisSaleRate()).to.equal(newRate.toString());

      const capacity = supply.multipliedBy(10).dividedBy(12).dividedToIntegerBy(newRate).shiftedBy(-18);
      await zone.connect(a1).purchase({value: (capacity).shiftedBy(18).toString()});
    });

    it('finish by purchase', async () => {
      const amount1 = (new BigNumber(200)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.2);
      await zone.connect(a1).purchase({value: (new BigNumber(201)).shiftedBy(18).toString()});
      expect(await zone.balanceOf(a1.address)).to.equal(amount1.toString());
      expect(await zone.balanceOf(owner.address)).to.equal(supply.minus(amount1).toString());
      expect(await zone.isGenesisSaleFinished()).to.equal(true);
      expect(await zone.isCrowdsaleFinished()).to.equal(true);
      await expectRevert(zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()}), "revert ZONE: Genesis sale already finished");
    });

    it('finish by expire', async () => {
      await increaseTime(SECONDS_IN_MONTH*3 - 3600);
      expect(await zone.isGenesisSaleFinished()).to.equal(false);
      await increaseTime(3600);
      expect(await zone.isGenesisSaleFinished()).to.equal(true);

      expect(await zone.balanceOf(owner.address)).to.equal('0');
      // _finishGenesisSale will be called by first purchase after Public sale started
      await zone.connect(a1).purchase({value: (new BigNumber(0.01)).shiftedBy(18).toString()});
      expect(await zone.balanceOf(owner.address)).to.equal(supply.toString());
    });

    it('finish by owner', async () => {
      await zone.finishCrowdsale();
      expect(await zone.isGenesisSaleFinished()).to.equal(true);
      await expectRevert(zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()}), "revert ZONE: Genesis sale already finished");
    });

    it('lock', async () => {
      const amount1 = (new BigNumber(1)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1);
      await zone.purchase({value: (new BigNumber(1)).shiftedBy(18).toString()})
      expect(await zone.balanceOf(owner.address)).to.equal(amount1.toString());
      expect(await zone.getLockedAmount(owner.address)).to.equal(amount1.toString());
      expect(await zone.voteBalanceOf(owner.address)).to.equal(amount1.toString());
      expect(await zone.getCurrentVotes(owner.address)).to.equal('0');
      await zone.delegate(owner.address);
      expect(await zone.getCurrentVotes(owner.address)).to.equal(amount1.toString());
      await expectRevert(zone.transfer(a1.address, amount1.toString()), "revert SafeMath: subtraction overflow");
    });

    it('unlock after 4 months', async () => {
      await zone.purchase({value: (new BigNumber(1)).shiftedBy(18).toString()})
      await zone.purchase({value: (new BigNumber(1)).shiftedBy(18).toString()})
      await zone.purchase({value: (new BigNumber(1)).shiftedBy(18).toString()})
      await zone.purchase({value: (new BigNumber(1)).shiftedBy(18).toString()})
      await zone.purchase({value: (new BigNumber(1)).shiftedBy(18).toString()})
      const amount1 = (new BigNumber(5)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1);

      expect(await zone.getUnlockableAmount(owner.address)).to.equal('0');
      await expectRevert(zone.Unlock(owner.address), "revert ZONE: There are no the unlockable tokens");

      await increaseTime(SECONDS_IN_MONTH*4);
      expect(await zone.getUnlockableAmount(owner.address)).to.equal(amount1.toString());
      await zone.Unlock(owner.address);
      expect(await zone.getUnlockableAmount(owner.address)).to.equal('0');
      expect(await zone.balanceOf(owner.address)).to.equal(amount1.toString());

      await zone.delegate(a2.address);
      expect(await zone.getCurrentVotes(a2.address)).to.equal(amount1.toString());

      await zone.transfer(a1.address, amount1.toString());
      expect(await zone.balanceOf(a1.address)).to.equal(amount1.toString());
      expect(await zone.getCurrentVotes(a2.address)).to.equal('0');
    });

    it('unlock after Public sale finished', async () => {
      const amount1 = (new BigNumber(1)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1);
      await zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()})

      await increaseTime(SECONDS_IN_MONTH*3);
      await zone.finishCrowdsale();

      expect(await zone.getUnlockableAmount(a1.address)).to.equal(amount1.toString());
      await zone.Unlock(a1.address);
      expect(await zone.getUnlockableAmount(a1.address)).to.equal('0');
      expect(await zone.balanceOf(a1.address)).to.equal(amount1.toString());
    });
  });

  describe('Public sale', () => {
    const supply = (new BigNumber(4200000)).shiftedBy(18);
    const rate = supply.dividedToIntegerBy("2000000000000000000000");

    it('simple purchase', async () => {
      await increaseTime(SECONDS_IN_MONTH*3);

      expect(await zone.isCrowdsaleFinished()).to.equal(false);
      expect(await zone.rate()).to.equal(rate.toString());

      expect(await zone.balanceOf(a1.address)).to.equal('0');
      const amount1 = (new BigNumber(0.01)).shiftedBy(18).multipliedBy(rate);
      await zone.connect(a1).purchase({value: (new BigNumber(0.01)).shiftedBy(18).toString()})
      expect(await zone.balanceOf(a1.address)).to.equal(amount1.toString());
      await zone.transfer(a2.address, amount1.toString());
      expect(await zone.balanceOf(a2.address)).to.equal(amount1.toString());
    });

    it('set rate', async () => {
      const newRate = rate.multipliedBy(2);
      await zone.setPublicSaleRate(newRate.toString());
      expect(await zone.getPublicSaleRate()).to.equal(newRate.toString());

      await increaseTime(SECONDS_IN_MONTH*3);
      const capacity = supply.dividedToIntegerBy(newRate).shiftedBy(-18);
      await zone.connect(a1).purchase({value: capacity.shiftedBy(18).toString()})
      expect(await zone.balanceOf(a1.address)).to.equal(supply.toString());
    });

    it('finish by purchase', async () => {
      await increaseTime(SECONDS_IN_MONTH*3);

      const amount1 = (new BigNumber(2000)).shiftedBy(18).multipliedBy(rate);
      await zone.connect(a1).purchase({value: (new BigNumber(2001)).shiftedBy(18).toString()})
      expect(await zone.balanceOf(a1.address)).to.equal(amount1.toString());

      const genesisSupply = (new BigNumber(1400000)).shiftedBy(18);
      expect(await zone.balanceOf(owner.address)).to.equal(supply.minus(amount1).plus(genesisSupply).toString());

      expect(await zone.isPublicSaleFinished()).to.equal(true);
      expect(await zone.isCrowdsaleFinished()).to.equal(true);
      await expectRevert(zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()}), "revert ZONE: Public sale already finished");
    });

    it('finish by owner', async () => {
      await increaseTime(SECONDS_IN_MONTH*3);

      await zone.finishCrowdsale();
      expect(await zone.isGenesisSaleFinished()).to.equal(true);

      const genesisSupply = (new BigNumber(1400000)).shiftedBy(18);
      expect(await zone.balanceOf(owner.address)).to.equal(supply.plus(genesisSupply).toString());

      await expectRevert(zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()}), "revert ZONE: Public sale already finished");
    });
  });

  describe('Treasury sale', () => {
    const supply = (new BigNumber(3640000)).shiftedBy(18);

    it('lock', async () => {
      expect(await zone.getLockedAmount(treasury.address)).to.equal(supply.toString());
      expect(await zone.voteBalanceOf(treasury.address)).to.equal('0');
      await expectRevert(zone.transfer(a1.address, supply.toString()), "revert SafeMath: subtraction overflow");
    });

    it('unlock after 1 year', async () => {
      expect(await zone.getUnlockableAmount(treasury.address)).to.equal('0');

      await increaseTime(SECONDS_IN_YEAR);
      expect(await zone.getUnlockableAmount(treasury.address)).to.equal(supply.toString());

      await zone.connect(treasury).Unlock(treasury.address);
      expect(await zone.getUnlockableAmount(treasury.address)).to.equal('0');
      expect(await zone.balanceOf(treasury.address)).to.equal(supply.toString());

      await zone.connect(treasury).transfer(a1.address, supply.toString());
      expect(await zone.balanceOf(a1.address)).to.equal(supply.toString());
    });
  });

  describe('Ecosystem sale', () => {
    const supply = (new BigNumber(14000000)).shiftedBy(18);
    const airdropSupply = (new BigNumber(420000)).shiftedBy(18);

    it('vest & claim', async () => {
      var vestedAmount = new BigNumber(0);
      const q1_1 = supply.dividedBy(2).multipliedBy(3182).dividedToIntegerBy(10000);
      vestedAmount = vestedAmount.plus(q1_1);
      expect(await zone.calculateEcosystemClaim()).to.equal(vestedAmount.toString());
      
      await increaseTime(SECONDS_IN_QUARTER);
      const q1_2 = supply.dividedBy(2).multipliedBy(2676).dividedToIntegerBy(10000);
      vestedAmount = vestedAmount.plus(q1_2);
      expect(await zone.calculateEcosystemClaim()).to.equal(vestedAmount.toString());

      // claim
      await zone.claimEcosystemVest();
      expect(await zone.claimedEcosystemVest()).to.equal(vestedAmount.toString());
      expect(await zone.balanceOf(vault.address)).to.equal(airdropSupply.plus(vestedAmount).toString());

      await increaseTime(SECONDS_IN_QUARTER*2);
      vestedAmount = supply.dividedBy(2);
      expect(await zone.calculateEcosystemClaim()).to.equal(vestedAmount.toString());

      await increaseTime(SECONDS_IN_QUARTER);
      const q2_1 = supply.dividedBy(4).multipliedBy(3182).dividedToIntegerBy(10000);
      vestedAmount = vestedAmount.plus(q2_1);
      expect(await zone.calculateEcosystemClaim()).to.equal(vestedAmount.toString());

      // claim
      await zone.claimEcosystemVest();
      expect(await zone.claimedEcosystemVest()).to.equal(vestedAmount.toString());
      expect(await zone.balanceOf(vault.address)).to.equal(airdropSupply.plus(vestedAmount).toString());
    });

    it('revoke', async () => {
      var vestedAmount = new BigNumber(0);
      const q1_1 = supply.dividedBy(2).multipliedBy(3182).dividedToIntegerBy(10000);
      vestedAmount = vestedAmount.plus(q1_1);
      expect(await zone.calculateEcosystemClaim()).to.equal(vestedAmount.toString());

      // claim
      await zone.claimEcosystemVest();
      expect(await zone.claimedEcosystemVest()).to.equal(vestedAmount.toString());
      expect(await zone.balanceOf(vault.address)).to.equal(airdropSupply.plus(vestedAmount).toString());

      // revoke after 4 month
      await increaseTime(SECONDS_IN_QUARTER);
      await expectRevert(zone.revokeEcosystemVest(), "revert ZONE: caller is not the timelock of governor.");
      await zone.setGovernorTimelock(community.address);
      await zone.connect(community).revokeEcosystemVest();
      expect(await zone.claimedEcosystemVest()).to.equal(supply.toString());
      expect(await zone.balanceOf(vault.address)).to.equal(airdropSupply.plus(supply).toString());
    });
  });

});
