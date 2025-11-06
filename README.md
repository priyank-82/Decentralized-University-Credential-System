# Decentralized Credentials Smart Contract

## Project Overview
This project implements a decentralized university credentials system using Ethereum smart contracts. It allows universities to issue and manage academic credentials (degrees, certificates, etc.) on the blockchain, ensuring they are tamper-proof, verifiable, and permanently accessible. The system enables universities to issue credentials to students, and anyone can verify the authenticity of these credentials directly through the blockchain.

### Tech Stack
- **Smart Contracts**: Solidity 0.8.19
- **Development Environment**: Hardhat
- **Testing Framework**: Hardhat Test Runner with Mocha & Chai
- **Blockchain**: Ethereum (EVM-compatible)
- **Development Tools**: 
  - Node.js & NPM for package management
  - Hardhat Toolbox for compilation, testing, and deployment

## Step 1: Project Setup
First, you need to set up the project on your local machine.

1. Create Project Folder: Create a new folder (e.g., cse540-credentials) and cd into it.

2. Add Your Files: Add the files I generated for you into the correct subfolders (e.g., create a contracts/ folder for the .sol file).

3. Initialize NPM: In your terminal, run this command to create a package.json file.
```bash
npm init -y
```

4. Install Hardhat: Install the Hardhat development environment.
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

## Step 2: Compile the Contracts
This step checks your Solidity code for errors and prepares it for deployment.

Run Compile:
```bash
npx hardhat compile
```

What it Does: This will create the artifacts/ and cache/ folders. If there are any syntax errors in your .sol file, Hardhat will report them here.

## Step 3: Run (Deploy) the Contracts
To deploy your contracts, you need to run a local blockchain and then run your deployment script against it. This requires two separate terminals.

### Terminal 1: Start the Local Node 
Run this command and keep this terminal open.
```bash
npx hardhat node
```
This starts a local Ethereum blockchain on your machine. It will also print a list of 20 test accounts and their private keys.

### Terminal 2: Deploy Your Contracts 
In a new terminal, run this command.
```bash
npx hardhat run scripts/deploy.js --network localhost
```

Check the Output: You should see the output from your deploy.js script:
```
Deploying contracts...
DIDRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
CredentialStatus deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```
Save these two addresses! You will need them for testing.

## Step 4: Test (Interact with) Your Contracts
Now that your contracts are live on your local node, you can "test" them by interacting with them using the Hardhat console.

1. Open the Console: In your second terminal (the one you used for deployment), run:
```bash
npx hardhat console --network localhost
```
This connects a command-line interface to your local blockchain.

2. Get Test Accounts: First, let's get some of those test accounts to simulate different users.
```javascript
const [owner, student, university, employer] = await ethers.getSigners();
```

3. Attach to Your Deployed Contracts: Replace the addresses below with the ones you got from Step 3.
```javascript
// Paste the address from your 'DIDRegistry deployed to:' output
const registryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const registry = await ethers.getContractAt("DIDRegistry", registryAddress);

// Paste the address from your 'CredentialStatus deployed to:' output
const credentialsAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const credentials = await ethers.getContractAt("CredentialStatus", credentialsAddress);
```

4. Run a Test Scenario: Now you can call your contract functions just like you would in JavaScript.

   a. Register a University and a Student: (Role 1=Student, 2=University)
   ```javascript
   await registry.connect(university).registerIdentity(2);
   await registry.connect(student).registerIdentity(1);
   ```
   You are "connecting" as the university or student signer to make them the msg.sender.

   b. Check their roles:
   ```javascript
   await registry.getRole(university.address);
   // Output should be: 2n
   await registry.getRole(student.address);
   // Output should be: 1n
   ```

   c. Issue a Credential: Let's create a bytes32 hash for a test credential.
   ```javascript
   const credHash = ethers.id("Test Credential for Student 123");
   // 'ethers.id' is a handy way to create a bytes32 hash from a string.

   await credentials.connect(university).issueCredential(student.address, credHash);
   ```
   This will fail if the university address wasn't registered first.

   d. Verify the Credential: Now, anyone (even the employer) can check if it's valid.
   ```javascript
   await credentials.isCredentialValid(credHash);
   // Output should be: true
   ```

   e. Revoke the Credential: Only the original issuer (university) can revoke it.
   ```javascript
   await credentials.connect(university).revokeCredential(credHash);
   ```

   f. Verify Again:
   ```javascript
   await credentials.isCredentialValid(credHash);
   // Output should be: false
   ```

This manual test proves that your entire workflow (role registration, issuance, verification, revocation) is working as intended!

### Prerequisites
- Node.js and npm installed on your system
- Basic understanding of Solidity and Hardhat

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cse540-credentials
```

2. Install dependencies:
```bash
npm install
```

### Configuration

The project uses Hardhat as the development environment. The main configuration files are:
- `hardhat.config.js`: Contains the Hardhat configuration including network settings
- `contracts/DecentralizedCredentials.sol`: Contains the smart contract code

## Development and Testing

1. Compile the contracts:
```bash
npx hardhat compile
```

2. Start a local Hardhat node:
```bash
npx hardhat node
```

3. Run tests:
```bash
npx hardhat test
```

## Contract Details

### DIDRegistry Contract
- Manages stakeholder identities and roles
- Supports three roles: Student, University, and Employer
- Provides functions for registration and role verification

### CredentialStatus Contract
- Manages academic credentials
- Features:
  - Credential issuance by universities
  - Credential verification
  - Credential revocation
  - Status checking

## Common Issues and Solutions

1. If you encounter compilation errors related to Hardhat console:
   - Ensure the console import in Solidity files uses `.sol` extension:
   ```solidity
   import "hardhat/console.sol";
   ```

2. Package.json configuration:
   - Make sure you have the correct dependencies:
   ```json
   {
     "devDependencies": {
       "@nomicfoundation/hardhat-toolbox": "^3.0.0",
       "hardhat": "^2.17.0"
     }
   }
   ```

