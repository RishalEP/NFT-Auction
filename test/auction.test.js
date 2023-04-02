const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const chai = require("chai");
const { BN } = require("@openzeppelin/test-helpers");
const chaiBN = require("chai-bn");
chai.use(chaiBN(BN));
const { ethers } = require("hardhat");

describe.only("Auction Smart Contract Test-Cases", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployTenxFixture() {
    // Contracts are deployed using the first signer/account by default
    const tokenId = 1
    const basePrice = 1

    const [
      owner,
      newOwner,
      bidder1,
      bidder2
    ] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("MyToken");
    const AUCTION = await ethers.getContractFactory("Auction");

    const nft = await NFT.deploy();
    const auction = await AUCTION.deploy(nft.address);

    const EIGHT_DAYS_IN_SECS = 8 * 24 * 60 * 60;
    const bidEndTime = (await time.latest()) + EIGHT_DAYS_IN_SECS;

    return {
      nft,
      auction,
      owner,
      newOwner,
      bidder1,
      bidder2,
      tokenId,
      basePrice,
      bidEndTime
    };
  }

  describe("Contract Deployment", function () {
    it("Should return contract owner for NFT", async function () {
      const { nft, owner } = await loadFixture(deployTenxFixture);

      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should return contract owner for Auction", async function () {
      const { auction, owner } = await loadFixture(deployTenxFixture);

      expect(await auction.owner()).to.equal(owner.address);
    });

    it("Should return nft address from Auction contract", async function () {
      const { auction, owner , nft } = await loadFixture(deployTenxFixture);

      expect(await auction.nft()).to.equal(nft.address);
    });
  });

  describe("Change Contract OwnerShip", function () {
    it("Should change the ownership correctly for NFT", async function () {
      const { nft, newOwner } = await loadFixture(deployTenxFixture);
      await nft.transferOwnership(newOwner.address);
      expect(await nft.owner()).to.equal(newOwner.address);
    });
    it("Should change the ownership correctly for Auction", async function () {
      const { auction, newOwner } = await loadFixture(deployTenxFixture);
      await auction.transferOwnership(newOwner.address);
      expect(await auction.owner()).to.equal(newOwner.address);
    });
  });

  describe("Start an Auction", function () {
    it("Should revert if seller is not token owner", async function () {
      const { nft, auction, newOwner,tokenId,basePrice } = await loadFixture(deployTenxFixture);
      await nft.safeMint(newOwner.address,tokenId);
      await expect(
        auction.startAuction(
          tokenId,
          basePrice
        )
      ).to.be.revertedWith("Seller not the token Owner");
    });

    it("Should revert if contract is not given approval by seller", async function () {
      const { nft, auction, owner, tokenId, basePrice } = await loadFixture(deployTenxFixture);
      await nft.safeMint(owner.address,1);
      await expect(
        auction.startAuction(
          tokenId,
          basePrice
        )
      ).to.be.revertedWith("Seller not given the approval for contract");
    });

    it("Should start an auction successfully", async function () {
      const { nft, auction, owner, tokenId, basePrice } = await loadFixture(deployTenxFixture);
      await nft.safeMint(owner.address,tokenId);
      await nft.approve(auction.address,tokenId)
      await auction.startAuction(tokenId,basePrice);

      const auctionInfo = await auction.bidAsset(tokenId);

      expect(auctionInfo)
        .to.have.property("bidValue")
        .to.equal(basePrice);

      expect(auctionInfo)
        .to.have.property("started")
        .to.equal(true);
    });
  });

  describe("Bid on an Auction", function () {
    it("Should revert if Auction is not started", async function () {
      const { nft, auction, newOwner, tokenId, basePrice, bidder1 } = await loadFixture(deployTenxFixture);
      await nft.safeMint(newOwner.address,tokenId);
      await expect(
        auction.connect(bidder1).bid(
          tokenId,
          { value: basePrice + 1 }
        )
      ).to.be.revertedWith("Not started.");
    });

    it("Should Bid successfully", async function () {
      const { nft, auction, owner, tokenId, basePrice, bidder1 } = await loadFixture(deployTenxFixture);
      await nft.safeMint(owner.address,tokenId);
      await nft.approve(auction.address,tokenId)
      await auction.startAuction(tokenId,basePrice);
      await auction.connect(bidder1).bid(tokenId,{ value: basePrice + 2 });
      const auctionInfo = await auction.bidAsset(tokenId);
      expect(auctionInfo)
        .to.have.property("bidValue")
        .to.equal(basePrice+2);

      expect(auctionInfo)
        .to.have.property("currentBidder")
        .to.equal(bidder1.address); 
    });

    it("Should revert if bidder is the current highest bidder", async function () {
      const { nft, auction, owner, tokenId, basePrice, bidder1 } = await loadFixture(deployTenxFixture);
      await nft.safeMint(owner.address,tokenId);
      await nft.approve(auction.address,tokenId)
      await auction.startAuction(tokenId,basePrice);
      await auction.connect(bidder1).bid(tokenId,{ value: basePrice+1 });
      await expect(
        auction.connect(bidder1).bid(
          tokenId,
          { value: basePrice+2 }
        )
      ).to.be.revertedWith("This is the current highest bidder");
    });

    it("Should revert if bid amount is low", async function () {
      const { nft, auction, owner, tokenId, basePrice, bidder1 } = await loadFixture(deployTenxFixture);
      await nft.safeMint(owner.address,tokenId);
      await nft.approve(auction.address,tokenId)
      await auction.startAuction(tokenId,basePrice);
      await expect(
        auction.connect(bidder1).bid(
          tokenId,
          { value: basePrice }
        )
      ).to.be.revertedWith("Bid for a greater amount");
    });

    it("Should OverBid successfully", async function () {
      const { nft, auction, owner, tokenId, basePrice, bidder1, bidder2 } = await loadFixture(deployTenxFixture);
      await nft.safeMint(owner.address,tokenId);
      await nft.approve(auction.address,tokenId)
      await auction.startAuction(tokenId,basePrice);
      await auction.connect(bidder1).bid(tokenId,{ value: basePrice + 1 });
      await auction.connect(bidder2).bid(tokenId,{ value: basePrice + 2 });

      const auctionInfo = await auction.bidAsset(tokenId);
      expect(auctionInfo)
        .to.have.property("bidValue")
        .to.equal(basePrice+2);

      expect(auctionInfo)
        .to.have.property("currentBidder")
        .to.equal(bidder2.address); 
    });

    it("Should revert if bidded after auction ends", async function () {
      const { nft, auction, owner, tokenId, basePrice, bidder1, bidEndTime } = await loadFixture(deployTenxFixture);
      await nft.safeMint(owner.address,tokenId);
      await nft.approve(auction.address,tokenId)
      await auction.startAuction(tokenId,basePrice);
      await time.increaseTo(bidEndTime);

      await expect(
        auction.connect(bidder1).bid(
          tokenId,
          { value: basePrice+1 }
        )
      ).to.be.revertedWith("Ended!");
    });
 
  });

  describe("Withdraw the bid amount", function () {
    it("Should revert if no amount to withdraw", async function () {
      const { auction, bidder1 } = await loadFixture(deployTenxFixture);
      await expect(
        auction.connect(bidder1).withdraw()
      ).to.be.revertedWith("No Amount to withdraw");
    });

    it("Should withdraw successfully", async function () {
      const { nft, auction, owner, tokenId, basePrice, bidder1, bidder2 } = await loadFixture(deployTenxFixture);
      await nft.safeMint(owner.address,tokenId);
      await nft.approve(auction.address,tokenId)
      await auction.startAuction(tokenId,basePrice);
      await auction.connect(bidder1).bid(tokenId,{ value: basePrice + 1 });
      await auction.connect(bidder2).bid(tokenId,{ value: basePrice + 2 });
      expect(await auction.bidAmounts(bidder1.address)).to.equal(basePrice+1)
      const withdrawAmount = await auction.connect(bidder1).withdraw()
      expect(withdrawAmount).to.have.property("hash")
      expect(await auction.bidAmounts(bidder1.address)).to.equal(0)
    });
  });

  describe("End the Auction", function () {
    it("Should revert if caller is not owner", async function () {
      const { auction, nft, owner, bidder1, basePrice, tokenId } = await loadFixture(deployTenxFixture);
      await nft.safeMint(owner.address,tokenId);
      await nft.approve(auction.address,tokenId)
      await auction.startAuction(tokenId,basePrice);
      await expect(
        auction.connect(bidder1).endAuction(tokenId)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert if auction is not yet started", async function () {
      const { auction, nft, owner, tokenId } = await loadFixture(deployTenxFixture);
      await nft.safeMint(owner.address,tokenId);
      await nft.approve(auction.address,tokenId)
      await expect(
        auction.endAuction(tokenId)
      ).to.be.revertedWith("You need to start first!");
    });

    it("Should revert if auction is still ongoing", async function () {
      const { auction, nft, owner, basePrice, tokenId } = await loadFixture(deployTenxFixture);
      await nft.safeMint(owner.address,tokenId);
      await nft.approve(auction.address,tokenId)
      await auction.startAuction(tokenId,basePrice);
      await expect(
        auction.endAuction(tokenId)
      ).to.be.revertedWith("Auction is still ongoing!");
    });

    it("Should be able to end the auction successfully if there is a bidder", async function () {
      const { nft, auction, owner, tokenId, basePrice, bidder1, bidEndTime } = await loadFixture(deployTenxFixture);
      await nft.safeMint(owner.address,tokenId);
      await nft.approve(auction.address,tokenId)
      await auction.startAuction(tokenId,basePrice);
      await auction.connect(bidder1).bid(tokenId,{ value: basePrice + 1 });
      await time.increaseTo(bidEndTime);
      expect(await nft.ownerOf(tokenId)).to.equal(auction.address)
      const endAuction = await auction.endAuction(tokenId)
      expect(endAuction).to.have.property("hash")
      expect(await nft.ownerOf(tokenId)).to.equal(bidder1.address)
    });

    it("Should be able to end the auction successfully if there is no bidder", async function () {
      const { nft, auction, owner, tokenId, basePrice, bidEndTime } = await loadFixture(deployTenxFixture);
      await nft.safeMint(owner.address,tokenId);
      await nft.approve(auction.address,tokenId)
      await auction.startAuction(tokenId,basePrice);
      await time.increaseTo(bidEndTime);
      expect(await nft.ownerOf(tokenId)).to.equal(auction.address)
      const endAuction = await auction.endAuction(tokenId)
      expect(endAuction).to.have.property("hash")
      expect(await nft.ownerOf(tokenId)).to.equal(owner.address)
    });
  });
});
