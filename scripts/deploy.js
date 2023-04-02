const { ethers } = require('hardhat');
const hre = require("hardhat");
const saveToConfig = require('../utils/saveToConfig')

async function main() {
        const NFT = await ethers.getContractFactory("MyToken");
        const NFTABI = (await artifacts.readArtifact('MyToken')).abi
        await saveToConfig('NFT', 'ABI', NFTABI)
        const nft = await NFT.deploy();
        await saveToConfig('NFT', 'ADDRESS', nft.address)
        console.log(`NFT:- ${nft.address} `);

        const AUCTION = await ethers.getContractFactory("Auction");
        const AUCTIONABI = (await artifacts.readArtifact('Auction')).abi
        await saveToConfig('AUCTION', 'ABI', AUCTIONABI)
        const auction = await AUCTION.deploy(nft.address);
        await saveToConfig('AUCTION', 'ADDRESS', auction.address)
        console.log(`AUCTION:- ${auction.address} `);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

