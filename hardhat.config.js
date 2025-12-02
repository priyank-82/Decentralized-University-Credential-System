import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter"; // Import the gas reporter plugin

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // sepolia: { ... } 
  },
  gasReporter: {
    enabled: true, // Auto-enable gas reporting
    currency: 'USD', // Show costs in USD
    noColors: false,
    showTimeSpent: true, // Useful for performance tracking
    coinmarketcap: process.env.COINMARKETCAP_API_KEY, // Optional: for accurate USD prices
    // outputFile: "gas-report.txt", // Uncomment to save to file instead of console
  },
};

export default config;