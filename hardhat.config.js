import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.19",
  networks: {
    // This is the default network for `npx hardhat node`
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // You can also add other networks like Sepolia (for testing)
    // sepolia: {
    //   url: "YOUR_RPC_URL",
    //   accounts: ["YOUR_PRIVATE_KEY"],
    // },
  },
};

export default config;
