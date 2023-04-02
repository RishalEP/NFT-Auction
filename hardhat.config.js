require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-waffle");
require("ethereum-waffle");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-ethers");

const {
  MUMBAI_RPC_URL,
  GOERLI,
  ADMIN_PRIVATE_KEY,
  ETHERSCAN_API_KEY
} = require("./config/index");
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: MUMBAI_RPC_URL,
        blockNumber: 32999798
      }
    },
    mumbai: {
      url: MUMBAI_RPC_URL,
      accounts: [ADMIN_PRIVATE_KEY],
      chainId: 80001
    },
    goerli: {
      url: GOERLI,
      accounts: [ADMIN_PRIVATE_KEY],
      chainId: 5
    }

  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API_KEY,
  },
};
