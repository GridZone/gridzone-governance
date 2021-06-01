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
  etherBalance,
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

  const teamSupply = (new BigNumber(3360000)).shiftedBy(18);
  const advisorsSupply = (new BigNumber(980000)).shiftedBy(18);
  const genesisSupply = (new BigNumber(2800000)).shiftedBy(18);
  const publicSupply = (new BigNumber(420000)).shiftedBy(18);
  const treasurySupply = (new BigNumber(3640000)).shiftedBy(18);
  const airdropSupply = (new BigNumber(420000)).shiftedBy(18);
  const ecosystemSupply = (new BigNumber(16380000)).shiftedBy(18);

  const genesisEthCapacity = (new BigNumber(100)).shiftedBy(18);
  const publicEthCapacity = (new BigNumber(2000)).shiftedBy(18);

  let deployer, owner, vault, advisors, treasury, community;
  let zone, launchTime;
  let ret;

  beforeEach(async () => {
    [deployer, owner, vault, advisors, treasury, community, a1, a2, ...accounts] = await ethers.getSigners();

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
      const cap = (new BigNumber(28000000)).shiftedBy(18);
      expect(await zone.cap()).to.equal(cap.toString());
      expect(await zone.totalSupply()).to.equal(treasurySupply.plus(airdropSupply).toString());
    });

    it('grants to initial account', async () => {
      expect(await zone.balanceOf(owner.address)).to.equal("0");
      expect(await zone.balanceOf(vault.address)).to.equal(airdropSupply.toString()); // AIRDROP
      expect(await zone.balanceOf(advisors.address)).to.equal("0");
      expect(await zone.balanceOf(treasury.address)).to.equal(treasurySupply.toString()); // TREASURY
    });

    it('grants to initial locked amount', async () => {
      expect(await zone.getLockedAmount(treasury.address)).to.equal(treasurySupply.toString()); // TREASURY
    });
  });

  describe('Team sale', () => {
    it('calculate & claim', async () => {
      ret = await zone.calculateVestClaim(owner.address);
      expect(ret[0]).to.equal("0");
      expect(ret[1]).to.equal("0");
      expect(await zone.balanceOf(owner.address)).to.equal("0");

      // Check the vested amount after 1 month
      await increaseTime(SECONDS_IN_MONTH);
      ts = (await blockTimestamp()) - launchTime;
      const m1VestedAmount = teamSupply.multipliedBy(ts).dividedBy(SECONDS_IN_YEAR*2).integerValue();
      ret = await zone.calculateVestClaim(owner.address);
      expect(ret[0]).to.equal(m1VestedAmount.toString());
      expect(ret[1]).to.equal("0");

      // Claim after 1 month
      await zone.claimVestedToken(owner.address);
      ts = (await blockTimestamp()) - launchTime;
      const m1ClaimAmount = teamSupply.multipliedBy(ts).dividedBy(SECONDS_IN_YEAR*2).integerValue();
      ret = await zone.calculateVestClaim(owner.address);
      expect(ret[0]).to.equal(m1ClaimAmount.toString());
      expect(ret[1]).to.equal(m1ClaimAmount.toString());
      expect(await zone.balanceOf(owner.address)).to.equal(m1ClaimAmount.toString());

      // Check the vested amount after the vesting finished
      ts = (await blockTimestamp()) - launchTime;
      await increaseTime(SECONDS_IN_YEAR*2 - ts);
      ret = await zone.calculateVestClaim(owner.address);
      expect(ret[0]).to.equal(teamSupply.toString());
      expect(ret[1]).to.equal(m1ClaimAmount.toString());

      // Claim after the vesting finished
      await zone.claimVestedToken(owner.address);
      ret = await zone.calculateVestClaim(owner.address);
      expect(ret[0]).to.equal(teamSupply.toString());
      expect(ret[1]).to.equal(teamSupply.toString());
      expect(await zone.balanceOf(owner.address)).to.equal(teamSupply.toString());
    });

    it('should be able to revoke by community', async () => {
      ret = await zone.calculateVestClaim(owner.address);
      expect(ret[0]).to.equal("0");
      expect(ret[1]).to.equal("0");
      expect(await zone.balanceOf(owner.address)).to.equal("0");

      // revoke after 1 month
      await increaseTime(SECONDS_IN_MONTH);
      await expectRevert(zone.revokeVest(owner.address), "revert ZONE: The caller is not the governance timelock contract.");
      await expectRevert(zone.setGovernorTimelock(community.address), "revert Ownable: caller is not the owner");
      await zone.connect(owner).setGovernorTimelock(community.address);
      await zone.connect(community).revokeVest(owner.address);

      ret = await zone.calculateVestClaim(owner.address);
      expect(ret[0]).to.equal(teamSupply.toString());
      expect(ret[1]).to.equal(teamSupply.toString());
      expect(await zone.balanceOf(owner.address)).to.equal(teamSupply.toString());
    });
  });

  describe('Advisors sale', () => {
    it('calculate & claim', async () => {
      ret = await zone.calculateVestClaim(advisors.address);
      expect(ret[0]).to.equal("0");
      expect(ret[1]).to.equal("0");
      expect(await zone.balanceOf(advisors.address)).to.equal("0");

      // Check the vested amount after 1 month
      await increaseTime(SECONDS_IN_MONTH);
      ts = (await blockTimestamp()) - launchTime;
      const m1VestedAmount = advisorsSupply.multipliedBy(ts).dividedBy(SECONDS_IN_YEAR).integerValue();
      ret = await zone.calculateVestClaim(advisors.address);
      expect(ret[0]).to.equal(m1VestedAmount.toString());
      expect(ret[1]).to.equal("0");

      // Claim after 1 month
      await zone.claimVestedToken(advisors.address);
      ts = (await blockTimestamp()) - launchTime;
      const m1ClaimAmount = advisorsSupply.multipliedBy(ts).dividedBy(SECONDS_IN_YEAR).integerValue();
      ret = await zone.calculateVestClaim(advisors.address);
      expect(ret[0]).to.equal(m1ClaimAmount.toString());
      expect(ret[1]).to.equal(m1ClaimAmount.toString());
      expect(await zone.balanceOf(advisors.address)).to.equal(m1ClaimAmount.toString());

      // Check the vested amount after the vesting finished
      ts = (await blockTimestamp()) - launchTime;
      await increaseTime(SECONDS_IN_YEAR - ts);
      ret = await zone.calculateVestClaim(advisors.address);
      expect(ret[0]).to.equal(advisorsSupply.toString());
      expect(ret[1]).to.equal(m1ClaimAmount.toString());

      // Claim after the vesting finished
      await zone.claimVestedToken(advisors.address);
      ret = await zone.calculateVestClaim(advisors.address);
      expect(ret[0]).to.equal(advisorsSupply.toString());
      expect(ret[1]).to.equal(advisorsSupply.toString());
      expect(await zone.balanceOf(advisors.address)).to.equal(advisorsSupply.toString());
    });

    it('should be able to revoke by community', async () => {
      ret = await zone.calculateVestClaim(advisors.address);
      expect(ret[0]).to.equal("0");
      expect(ret[1]).to.equal("0");
      expect(await zone.balanceOf(advisors.address)).to.equal("0");

      // revoke after 1 month
      await increaseTime(SECONDS_IN_MONTH);
      await expectRevert(zone.revokeVest(advisors.address), "revert ZONE: The caller is not the governance timelock contract.");
      await zone.connect(owner).setGovernorTimelock(community.address);
      await zone.connect(community).revokeVest(advisors.address);

      ret = await zone.calculateVestClaim(advisors.address);
      expect(ret[0]).to.equal(advisorsSupply.toString());
      expect(ret[1]).to.equal(advisorsSupply.toString());
      expect(await zone.balanceOf(advisors.address)).to.equal(advisorsSupply.toString());
    });
  });

  describe('Genesis sale', () => {
    const rate = genesisSupply.multipliedBy(10).div(12).dividedToIntegerBy(genesisEthCapacity);

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

      expect(await zone.genesisSaleBoughtEth()).to.equal((new BigNumber(19.99)).shiftedBy(18).toString());
      expect(await zone.genesisSaleSoldToken()).to.equal(amount2.plus(amount1).toString());

    });

    it('should be able to set rate', async () => {
      await expectRevert(zone.setGenesisSaleRate(0), "revert Ownable: caller is not the owner");
      await expectRevert(zone.connect(owner).setGenesisSaleRate(0), "revert ZONE: The rate can't be 0.");

      const newRate = rate.multipliedBy(2);
      await zone.connect(owner).setGenesisSaleRate(newRate.toString());
      expect(await zone.getGenesisSaleRate()).to.equal(newRate.toString());

      const capacity = genesisSupply.multipliedBy(10).dividedBy(12).dividedToIntegerBy(newRate);
      await zone.connect(a1).purchase({value: capacity.toString()});
    });

    it('should be able to finish by purchase', async () => {
      const amount1 = genesisEthCapacity.multipliedBy(rate).multipliedBy(1.2);
      await zone.connect(a1).purchase({value: genesisEthCapacity.plus(1).toString()});
      expect(await zone.balanceOf(a1.address)).to.equal(amount1.toString());
      expect(await zone.balanceOf(owner.address)).to.equal(genesisSupply.minus(amount1).toString());
      expect(await zone.isGenesisSaleFinished()).to.equal(true);
      expect(await zone.isCrowdsaleFinished()).to.equal(true);
      await expectRevert(zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()}), "revert ZONE: Genesis sale already finished");
    });

    it('should be able to finish by expire', async () => {
      await increaseTime(SECONDS_IN_MONTH*3 - 3600);
      expect(await zone.isGenesisSaleFinished()).to.equal(false);
      await increaseTime(3600);
      expect(await zone.isGenesisSaleFinished()).to.equal(true);

      expect(await zone.balanceOf(owner.address)).to.equal('0');
      // _finishGenesisSale will be called by first purchase after Public sale started
      await zone.connect(a1).purchase({value: (new BigNumber(0.01)).shiftedBy(18).toString()});
      expect(await zone.balanceOf(owner.address)).to.equal(genesisSupply.toString());
    });

    it('should be able to finish by owner', async () => {
      await expectRevert(zone.finishCrowdsale(), "revert Ownable: caller is not the owner");

      await zone.connect(owner).finishCrowdsale();
      expect(await zone.isGenesisSaleFinished()).to.equal(true);
      await expectRevert(zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()}), "revert ZONE: Genesis sale already finished");
    });

    it('will be locked after purchased', async () => {
      const amount1 = (new BigNumber(1)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1);
      await zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()})
      expect(await zone.balanceOf(a1.address)).to.equal(amount1.toString());
      expect(await zone.getLockedAmount(a1.address)).to.equal(amount1.toString());
      expect(await zone.voteBalanceOf(a1.address)).to.equal(amount1.toString());
      expect(await zone.getCurrentVotes(a1.address)).to.equal('0');
      await zone.connect(a1).delegate(a1.address);
      expect(await zone.getCurrentVotes(a1.address)).to.equal(amount1.toString());
      await expectRevert(zone.transfer(a2.address, amount1.toString()), "revert SafeMath: subtraction overflow");
    });

    it('should be able to unlock after 4 months', async () => {
      await zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()})
      await zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()})
      await zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()})
      await zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()})
      await zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()})
      const amount1 = (new BigNumber(5)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1);

      expect(await zone.getUnlockableAmount(a1.address)).to.equal('0');
      await expectRevert(zone.connect(a1).Unlock(a1.address), "revert ZONE: No unlockable token.");

      await increaseTime(SECONDS_IN_MONTH*4);
      expect(await zone.getUnlockableAmount(a1.address)).to.equal(amount1.toString());
      await zone.Unlock(a1.address);
      expect(await zone.getUnlockableAmount(a1.address)).to.equal('0');
      expect(await zone.balanceOf(a1.address)).to.equal(amount1.toString());

      await zone.connect(a1).delegate(a2.address);
      expect(await zone.getCurrentVotes(a2.address)).to.equal(amount1.toString());

      await zone.connect(a1).transfer(deployer.address, amount1.toString());
      expect(await zone.balanceOf(deployer.address)).to.equal(amount1.toString());
      expect(await zone.getCurrentVotes(a2.address)).to.equal('0');
    });

    it('should be able to unlock after Public sale finished', async () => {
      const amount1 = (new BigNumber(1)).shiftedBy(18).multipliedBy(rate).multipliedBy(1.1);
      await zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()})

      await increaseTime(SECONDS_IN_MONTH*3);
      await zone.connect(owner).finishCrowdsale();

      expect(await zone.getUnlockableAmount(a1.address)).to.equal(amount1.toString());
      await zone.Unlock(a1.address);
      expect(await zone.getUnlockableAmount(a1.address)).to.equal('0');
      expect(await zone.balanceOf(a1.address)).to.equal(amount1.toString());
    });
  });

  describe('Public sale', () => {
    const rate = publicSupply.dividedToIntegerBy(publicEthCapacity);

    it('simple purchase', async () => {
      await increaseTime(SECONDS_IN_MONTH*3);

      expect(await zone.isCrowdsaleFinished()).to.equal(false);
      expect(await zone.rate()).to.equal(rate.toString());

      expect(await zone.balanceOf(a1.address)).to.equal('0');
      const amount1 = (new BigNumber(0.01)).shiftedBy(18).multipliedBy(rate);
      await zone.connect(a1).purchase({value: (new BigNumber(0.01)).shiftedBy(18).toString()})
      expect(await zone.balanceOf(a1.address)).to.equal(amount1.toString());
      await zone.connect(a1).transfer(a2.address, amount1.toString());
      expect(await zone.balanceOf(a2.address)).to.equal(amount1.toString());
    });

    it('should be able to set rate', async () => {
      await expectRevert(zone.setPublicSaleRate(0), "revert Ownable: caller is not the owner");
      await expectRevert(zone.connect(owner).setPublicSaleRate(0), "revert ZONE: The rate can't be 0.");

      const newRate = rate.multipliedBy(2);
      await zone.connect(owner).setPublicSaleRate(newRate.toString());
      expect(await zone.getPublicSaleRate()).to.equal(newRate.toString());

      await increaseTime(SECONDS_IN_MONTH*3);
      const newCapacity = publicSupply.dividedToIntegerBy(newRate);
      await zone.connect(a1).purchase({value: newCapacity.toString()})
      expect(await zone.balanceOf(a1.address)).to.equal(publicSupply.toString());
    });

    it('should be able to set the ETH capacity', async () => {
      await expectRevert(zone.setPublicSaleEthCapacity(0), "revert Ownable: caller is not the owner");
      await expectRevert(zone.connect(owner).setPublicSaleEthCapacity(0), "revert ZONE: The capacity must be greater than the already bought amount in the public sale.");

      expect(await zone.getPublicSaleEthCapacity()).to.equal(publicEthCapacity.toString());

      await increaseTime(SECONDS_IN_MONTH*3);
      await zone.connect(a1).purchase({value: publicEthCapacity.dividedBy(2).toString()})
      expect(await zone.publicSaleBoughtEth()).to.equal(publicEthCapacity.dividedBy(2).toString());
      expect(await zone.publicSaleSoldToken()).to.equal(publicSupply.dividedBy(2).toString());
      expect(await zone.balanceOf(a1.address)).to.equal(publicSupply.dividedBy(2).toString());

      await expectRevert(zone.connect(owner).setPublicSaleEthCapacity(publicEthCapacity.dividedBy(2).toString()), "revert ZONE: The capacity must be greater than the already bought amount in the public sale.");

      const newCapacity = publicEthCapacity.multipliedBy(2);
      await zone.connect(owner).setPublicSaleEthCapacity(newCapacity.toString());
      const remainedSupply = publicSupply.minus((await zone.publicSaleSoldToken()).toString());
      const remainedCapacity = newCapacity.minus((await zone.publicSaleBoughtEth()).toString());
      const newRate = remainedSupply.dividedToIntegerBy(remainedCapacity);
      expect(await zone.getPublicSaleEthCapacity()).to.equal(newCapacity.toString());
      expect(await zone.getPublicSaleRate()).to.equal(newRate.toString());

      await zone.connect(a2).purchase({value: newCapacity.multipliedBy(3).dividedBy(4).toString()})
      expect(await zone.publicSaleBoughtEth()).to.equal(newCapacity.toString());
      expect(await zone.publicSaleSoldToken()).to.equal(publicSupply.toString());
      expect(await zone.balanceOf(a2.address)).to.equal(publicSupply.dividedBy(2).toString());
    });

    it('should be able to finish by purchase', async () => {
      await increaseTime(SECONDS_IN_MONTH*3);

      const ethBalance = new BigNumber((await etherBalance(owner.address)).toString());
      const amount1 = publicEthCapacity.multipliedBy(rate);
      await zone.connect(a1).purchase({value: (new BigNumber(2001)).shiftedBy(18).toString()})
      expect(await zone.balanceOf(a1.address)).to.equal(amount1.toString());
      expect((await etherBalance(owner.address)).toString()).to.equal(ethBalance.plus(publicEthCapacity).toString());

      expect(await zone.balanceOf(owner.address)).to.equal(publicSupply.minus(amount1).plus(genesisSupply).toString());

      expect(await zone.isPublicSaleFinished()).to.equal(true);
      expect(await zone.isCrowdsaleFinished()).to.equal(true);
      await expectRevert(zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()}), "revert ZONE: Public sale already finished");
    });

    it('should be able to finish by owner', async () => {
      await increaseTime(SECONDS_IN_MONTH*3);

      await zone.connect(owner).finishCrowdsale();
      expect(await zone.isGenesisSaleFinished()).to.equal(true);

      expect(await zone.balanceOf(owner.address)).to.equal(publicSupply.plus(genesisSupply).toString());

      await expectRevert(zone.connect(a1).purchase({value: (new BigNumber(1)).shiftedBy(18).toString()}), "revert ZONE: Public sale already finished");
    });
  });

  describe('Treasury sale', () => {
    it('will be locked after minted', async () => {
      expect(await zone.getLockedAmount(treasury.address)).to.equal(treasurySupply.toString());
      expect(await zone.voteBalanceOf(treasury.address)).to.equal('0');
      await expectRevert(zone.transfer(a1.address, treasurySupply.toString()), "revert SafeMath: subtraction overflow");
    });

    it('will be unlocked after 1 year', async () => {
      expect(await zone.getUnlockableAmount(treasury.address)).to.equal('0');

      await increaseTime(SECONDS_IN_YEAR);
      expect(await zone.getUnlockableAmount(treasury.address)).to.equal(treasurySupply.toString());

      await zone.connect(treasury).Unlock(treasury.address);
      expect(await zone.getUnlockableAmount(treasury.address)).to.equal('0');
      expect(await zone.balanceOf(treasury.address)).to.equal(treasurySupply.toString());

      await zone.connect(treasury).transfer(a1.address, treasurySupply.toString());
      expect(await zone.balanceOf(a1.address)).to.equal(treasurySupply.toString());
    });
  });

  describe('Ecosystem sale', () => {
    it('vest & claim', async () => {
      var vestedAmount = new BigNumber(0);
      const q1_1 = ecosystemSupply.dividedBy(2).multipliedBy(3182).dividedToIntegerBy(10000);
      vestedAmount = vestedAmount.plus(q1_1);
      expect(await zone.calculateEcosystemVested()).to.equal(vestedAmount.toString());

      await increaseTime(SECONDS_IN_QUARTER);
      const q1_2 = ecosystemSupply.dividedBy(2).multipliedBy(2676).dividedToIntegerBy(10000);
      vestedAmount = vestedAmount.plus(q1_2);
      expect(await zone.calculateEcosystemVested()).to.equal(vestedAmount.toString());

      // claim
      await zone.claimEcosystemVest();
      expect(await zone.claimedEcosystemVest()).to.equal(vestedAmount.toString());
      expect(await zone.balanceOf(vault.address)).to.equal(airdropSupply.plus(vestedAmount).toString());
      await expectRevert(zone.claimEcosystemVest(), "revert ZONE: No claimable token for the ecosystem.");

      await increaseTime(SECONDS_IN_QUARTER*2);
      vestedAmount = ecosystemSupply.dividedBy(2);
      expect(await zone.calculateEcosystemVested()).to.equal(vestedAmount.toString());

      await increaseTime(SECONDS_IN_QUARTER);
      const q2_1 = ecosystemSupply.dividedBy(4).multipliedBy(3182).dividedToIntegerBy(10000);
      vestedAmount = vestedAmount.plus(q2_1);
      expect(await zone.calculateEcosystemVested()).to.equal(vestedAmount.toString());

      // claim
      await zone.claimEcosystemVest();
      expect(await zone.claimedEcosystemVest()).to.equal(vestedAmount.toString());
      expect(await zone.balanceOf(vault.address)).to.equal(airdropSupply.plus(vestedAmount).toString());
    });

    it('should be able to revoke', async () => {
      var vestedAmount = new BigNumber(0);
      const q1_1 = ecosystemSupply.dividedBy(2).multipliedBy(3182).dividedToIntegerBy(10000);
      vestedAmount = vestedAmount.plus(q1_1);
      expect(await zone.calculateEcosystemVested()).to.equal(vestedAmount.toString());

      // claim
      await zone.claimEcosystemVest();
      expect(await zone.claimedEcosystemVest()).to.equal(vestedAmount.toString());
      expect(await zone.balanceOf(vault.address)).to.equal(airdropSupply.plus(vestedAmount).toString());

      // revoke after 4 month
      await increaseTime(SECONDS_IN_QUARTER);
      await expectRevert(zone.revokeEcosystemVest(), "revert ZONE: The caller is not the governance timelock contract.");
      await zone.connect(owner).setGovernorTimelock(community.address);
      await zone.connect(community).revokeEcosystemVest();
      expect(await zone.claimedEcosystemVest()).to.equal(ecosystemSupply.toString());
      expect(await zone.balanceOf(vault.address)).to.equal(airdropSupply.plus(ecosystemSupply).toString());
      await expectRevert(zone.connect(community).revokeEcosystemVest(), "revert ZONE: All tokens already have been claimed for the ecosystem.");
    });
  });

});
