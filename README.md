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

   await credentials.connect(university).issueCredential(student.address, credHash, "QmXxxx", "0x");
   ```
   This will fail if the university address wasn't registered first. The parameters are:
   - `student.address` — the credential holder
   - `credHash` — the keccak256 hash of the credential data
   - `"QmXxxx"` — IPFS hash (CID) where the full credential is stored
   - `"0x"` — optional schema metadata

   d. Verify the Credential: Now, anyone (even the employer) can check if it's valid.
   ```javascript
   await credentials.isCredentialValid(credHash);
   // Output should be: true
   ```

   e. Get Credential Metadata (New with IPFS):
   ```javascript
   const metadata = await credentials.getCredentialMetadata(credHash);
   console.log(metadata);
   // Output includes: issuer, holder, ipfsHash, issueDate, state
   ```

   f. Retrieve IPFS Hash for Off-Chain Data:
   ```javascript
   const ipfsHash = await credentials.getCredentialIPFSHash(credHash);
   console.log("IPFS CID:", ipfsHash);
   // Output: QmXxxx (use this to fetch full credential from IPFS)
   ```

   g. Verify Credential Data Integrity (New with Verification):
   ```javascript
   const credentialData = "Test Credential for Student 123";
   const dataHash = ethers.keccak256(ethers.toUtf8Bytes(credentialData));
   
   // Employer verifies the credential
   await credentials.connect(employer).verifyCredentialData(credentialData, credHash);
   // This emits a CredentialVerified event (no PII logged)
   
   // Check result
   await credentials.isCredentialValid(credHash);
   // Output should be: true
   ```

   h. Revoke the Credential: Only the original issuer (university) can revoke it.
   ```javascript
   await credentials.connect(university).revokeCredential(credHash);
   ```

   i. Verify Again:
   ```javascript
   await credentials.isCredentialValid(credHash);
   // Output should be: false (revoked credentials are invalid)
   ```

   j. Test Error Handling: Try to issue as a non-university account (should fail):
   ```javascript
   try {
     await credentials.connect(employer).issueCredential(student.address, credHash, "QmXxxx", "0x");
   } catch (e) {
     console.log("✓ Correctly rejected:", e.reason);
     // Output: "CredentialStatus: Caller is not a registered University"
   }
   ```

**This manual test proves that your entire workflow (role registration, issuance with IPFS, verification, revocation) is working as intended!**

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
``````

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

## Step 5: Test IPFS + Credential Verification (New)

This project now includes IPFS integration and credential verification. Use the test script to validate the full workflow:

### Prerequisites
1. Ensure your local Hardhat node is running (from Step 3):
```bash
npx hardhat node
```

2. Deploy contracts (if not already done):
```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. Install IPFS client library:
```bash
npm install ipfs-http-client ethers
```

### Run the Test Script
In a second terminal, run the comprehensive automated test script:
```bash
npx hardhat run scripts/test-ipfs-verification.js --network localhost
```

**What the test does:**
- Registers identities (University, Student, Employer)
- Creates credential data and computes keccak256 hash
- Issues credential with IPFS reference (simulated CID)
- Retrieves credential metadata from on-chain
- Verifies credential data integrity
- Tests credential revocation
- Validates error handling

**Expected Output:**
```
======================================================================
Testing Decentralized Credentials with IPFS + Verification
======================================================================

✓ Test Accounts:
  Owner:       0x...
  University:  0x...
  Student:     0x...
  Employer:    0x...

[... test progress ...]

✓ ALL TESTS PASSED!
======================================================================
```

## Step 6: Interactive Test UI (No MetaMask Required)

A new interactive web UI has been created that allows you to run the test scenario through a browser interface. This UI connects directly to your local Hardhat node and executes all test steps without requiring MetaMask.

### How to Use the Test UI

1. **Start your local Hardhat node** (if not already running):
```bash
npx hardhat node
```

2. **In another terminal, deploy contracts** (if not already deployed):
```bash
npx hardhat run scripts/deploy.js --network localhost
```
Save the contract addresses from the output.

3. **Serve the frontend**:
```bash
# Option 1: Using Node.js http-server (recommended)
npx http-server frontend -c-1 -p 8000

# Option 2: Using Python
python3 -m http.server 8000 --directory frontend

# Option 3: Using any other local server
```

4. **Open the UI** in your browser:
```
http://localhost:8000/test-ui.html
```

5. **Configure the connection**:
   - RPC URL: `http://127.0.0.1:8545` (default)
   - DIDRegistry Address: Paste from deployment output
   - CredentialStatus Address: Paste from deployment output
   - Click "Connect to Hardhat Node"

6. **Run the test scenario** step by step:
   - **Step 1**: Register test identities (University, Student, Employer)
   - **Step 2**: Create credential data and generate hash
   - **Step 3**: Issue credential with IPFS reference
   - **Step 4**: Retrieve credential metadata from on-chain
   - **Step 5**: Check credential status
   - **Step 6**: Verify credential data integrity
   - **Step 7**: Retrieve IPFS hash for off-chain data
   - **Step 8**: Revoke credential (University only)
   - **Step 9**: Verify revocation
   - **Step 10**: Test error handling

### Test UI Features

- **No MetaMask required**: Connects directly to local Hardhat node
- **Test accounts pre-filled**: Uses hardcoded test account private keys from Hardhat
- **Real transaction execution**: All operations are actual blockchain transactions
- **Live feedback**: See transaction hashes, block numbers, and event logs
- **Metadata display**: View credential metadata in formatted tables
- **Error handling**: Test invalid operations and see proper error messages

### What the Test UI Validates

✅ Identity registration with role-based access control  
✅ Credential issuance with IPFS references  
✅ Data integrity verification through hash comparison  
✅ Metadata retrieval and display  
✅ Credential status checking  
✅ Credential revocation (issuer only)  
✅ Error handling for unauthorized operations  
✅ Non-existent credential handling  

### Quick Reference: All Test Commands

| Command | Description |
|---------|-------------|
| `npx hardhat compile` | Compile smart contracts |
| `npx hardhat node` | Start local blockchain |
| `npx hardhat run scripts/deploy.js --network localhost` | Deploy contracts to local node |
| `npx hardhat run scripts/test-ipfs-verification.js --network localhost` | Run automated IPFS + verification tests (CLI) |
| `npx http-server frontend -c-1 -p 8000` | Start HTTP server for test UI |
| `npx hardhat console --network localhost` | Open interactive console for manual testing |

✓ ALL TESTS PASSED!
======================================================================
```

## IPFS + Verification Features

The enhanced smart contracts now support:

### 1. IPFS Storage Reference
- Credentials store IPFS CID (Content Identifier) on-chain
- Full credential blob stored off-chain on IPFS
- On-chain hash ensures integrity without exposing PII

### 2. Credential Verification
- `verifyCredentialData(data, hash)` — Verify credential by recomputing hash
- `getCredentialMetadata(hash)` — Retrieve issuer, holder, dates, schema
- `getCredentialIPFSHash(hash)` — Get IPFS CID for blob retrieval

### 3. Helper Libraries
Located in `lib/`:
- **`ipfsHelper.js`** — Upload/retrieve from IPFS, compute hashes
- **`cryptoHelper.js`** — Sign credentials, verify signatures, hash data

### 4. Frontend (Optional)
A demo frontend is available at `frontend/ipfs-ui.html`:
```bash
npx http-server frontend -c-1
# Open http://localhost:8080/ipfs-ui.html
```

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
     },
     "dependencies": {
       "ipfs-http-client": "^60.0.0",
       "ethers": "^6.0.0"
     }
   }
   ```

3. Test script deployment address mismatch:
   - Update the `registryAddress` and `credentialsAddress` in `scripts/test-ipfs-verification.js` with your deployed addresses from Step 3.

4. Running the Gas Analysis:
   - Run this command to run the gas analysis ``` npx hardhat test test/PerformanceEvaluation.js ```
   - And run this for the report of the gas cost analysis ``` node test/generateReport.js  ```
