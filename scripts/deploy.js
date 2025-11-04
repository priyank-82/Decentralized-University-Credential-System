// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // 1. Deploy DIDRegistry
  const didRegistry = await hre.ethers.deployContract("DIDRegistry");
  await didRegistry.waitForDeployment();
  console.log(`DIDRegistry deployed to: ${didRegistry.target}`);

  // 2. Deploy CredentialStatus, passing the DIDRegistry's address to the constructor
  const credentialStatus = await hre.ethers.deployContract("CredentialStatus", [
    didRegistry.target, // The address of the registry
  ]);
  await credentialStatus.waitForDeployment();
  console.log(`CredentialStatus deployed to: ${credentialStatus.target}`);

  console.log("\nDeployment complete!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
