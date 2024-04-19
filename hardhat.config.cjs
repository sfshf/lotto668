require("dotenv").config();
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: "0.8.6",
  paths: {
    artifacts: "./src/artifacts",
  },
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {
    },
    // sepolia: {
    //   url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
    //   accounts: [SEPOLIA_PRIVATE_KEY]
    // },
    // fuji: {
    //   url: process.env.QUICKNODE_URL,
    //   accounts: [`0x` + process.env.PRIVATE_KEY],
    //   chainId: 43113,
    // },
    // avax: {
    //   url: "https://api.avax.network/ext/bc/C/rpc",
    //   accounts: [`0x` + process.env.PRIVATE_KEY],
    //   chainId: 43114,
    // },
  },
};
