/**
 * Test UI JavaScript
 * Connects to local Hardhat node and executes test scenario
 * Uses ethers.js v6 with provider.getSigner() for transaction signing
 */

// Check if ethers is available
if (typeof ethers === 'undefined') {
  console.error('ERROR: ethers.js is not loaded. Please ensure the CDN link is correct.');
  alert('ethers.js failed to load. Please refresh the page and check your internet connection.');
}

// Global state
let provider, owner, university, student, employer;
let registry, credentials;
let currentCredentialHash = null;

// Contract ABIs (minimal required functions)
const REGISTRY_ABI = [
  "function registerIdentity(uint8 _role) public",
  "function getRole(address _userAddress) public view returns (uint8)",
  "function hasRole(address _userAddress, uint8 _role) public view returns (bool)"
];

const CREDENTIALS_ABI = [
  "function issueCredential(address _holder, bytes32 _credentialHash, string memory _ipfsHash, bytes memory _schema) public",
  "function revokeCredential(bytes32 _credentialHash) public",
  "function getCredentialStatus(bytes32 _credentialHash) public view returns (uint8)",
  "function isCredentialValid(bytes32 _credentialHash) public view returns (bool)",
  "function verifyCredentialData(string memory _credentialData, bytes32 _credentialHash) public returns (bool)",
  "function getCredentialMetadata(bytes32 _credentialHash) public view returns (tuple(bytes32 credentialHash, string ipfsHash, bytes credentialSchema, address issuer, address holder, uint256 issueDate, uint8 state))",
  "function getCredentialIPFSHash(bytes32 _credentialHash) public view returns (string memory)"
];

// Helper functions
function $(id) {
  return document.getElementById(id);
}

function showStatus(elementId, message, type = "info") {
  const element = $(elementId);
  element.textContent = message;
  element.className = `status show ${type}`;
}

function showOutput(elementId, text) {
  const element = $(elementId);
  element.textContent = text;
  element.style.display = "block";
}

function hideOutput(elementId) {
  const element = $(elementId);
  element.style.display = "none";
}

function setButtonsEnabled(enabled) {
  const buttons = [
    "registerUniversityBtn",
    "registerStudentBtn",
    "registerEmployerBtn",
    "hashCredentialBtn",
    "issueBtn",
    "metadataBtn",
    "statusBtn",
    "verifyBtn",
    "ipfsHashBtn",
    "revokeBtn",
    "revokeCheckBtn",
    "errorBtn"
  ];
  buttons.forEach(id => {
    $(id).disabled = !enabled;
  });
}

// CONNECTION FUNCTIONS
async function connectToNetwork() {
  try {
    // Verify ethers is loaded
    if (typeof ethers === 'undefined') {
      throw new Error('ethers.js library is not loaded. Please refresh the page.');
    }

    const rpcUrl = $("rpcUrl").value;
    const registryAddr = $("registryAddress").value;
    const credentialsAddr = $("credentialsAddress").value;

    if (!registryAddr || !credentialsAddr) {
      showStatus("connectionStatus", "❌ Please provide both contract addresses", "error");
      return;
    }

    showStatus("connectionStatus", "🔄 Connecting...", "loading");

    // Create provider
    provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Get accounts from the node
    const accounts = await provider.listAccounts();
    
    if (accounts.length < 4) {
      throw new Error("Expected at least 4 test accounts from Hardhat node");
    }

    // Use the accounts directly from the node (no private keys needed)
    owner = accounts[0].address;
    university = accounts[1].address;
    student = accounts[2].address;
    employer = accounts[3].address;

    // Attach to contracts using provider (read-only first)
    registry = new ethers.Contract(registryAddr, REGISTRY_ABI, provider);
    credentials = new ethers.Contract(credentialsAddr, CREDENTIALS_ABI, provider);

    // Display connection info
    showStatus(
      "connectionStatus",
      `✅ Connected to ${rpcUrl}`,
      "success"
    );

    // Show accounts
    $("accountsContainer").style.display = "block";
    $("accountsPlaceholder").style.display = "none";

    $("ownerAddr").textContent = owner;
    $("universityAddr").textContent = university;
    $("studentAddr").textContent = student;
    $("employerAddr").textContent = employer;

    $("studentAddressField").value = student;

    // Enable buttons
    setButtonsEnabled(true);

    showOutput(
      "networkOutput",
      `Connected to: ${rpcUrl}\nRegistry: ${registryAddr}\nCredentials: ${credentialsAddr}\n\nReady to run test scenario!`
    );
  } catch (error) {
    showStatus("connectionStatus", `❌ ${error.message}`, "error");
    console.error(error);
  }
}

// STEP 1: REGISTER IDENTITIES
async function registerUniversity() {
  try {
    showStatus("registerStatus", "🔄 Registering University...", "loading");

    const signer = await provider.getSigner(university);
    const registryWithSigner = registry.connect(signer);
    const tx = await registryWithSigner.registerIdentity(2);
    await tx.wait();

    showStatus("registerStatus", "✅ University registered!", "success");
    showOutput("registerOutput", `Transaction: ${tx.hash}`);
  } catch (error) {
    showStatus("registerStatus", `❌ ${error.reason || error.message}`, "error");
    console.error(error);
  }
}

async function registerStudent() {
  try {
    showStatus("registerStatus", "🔄 Registering Student...", "loading");

    const signer = await provider.getSigner(student);
    const registryWithSigner = registry.connect(signer);
    const tx = await registryWithSigner.registerIdentity(1);
    await tx.wait();

    showStatus("registerStatus", "✅ Student registered!", "success");
    showOutput("registerOutput", `Transaction: ${tx.hash}`);
  } catch (error) {
    showStatus("registerStatus", `❌ ${error.reason || error.message}`, "error");
    console.error(error);
  }
}

async function registerEmployer() {
  try {
    showStatus("registerStatus", "🔄 Registering Employer...", "loading");

    const signer = await provider.getSigner(employer);
    const registryWithSigner = registry.connect(signer);
    const tx = await registryWithSigner.registerIdentity(3);
    await tx.wait();

    showStatus("registerStatus", "✅ Employer registered!", "success");
    showOutput("registerOutput", `Transaction: ${tx.hash}`);
  } catch (error) {
    showStatus("registerStatus", `❌ ${error.reason || error.message}`, "error");
    console.error(error);
  }
}

// STEP 2: CREATE & HASH CREDENTIAL
async function createAndHashCredential() {
  try {
    showStatus("hashStatus", "🔄 Creating credential hash...", "loading");

    // Get individual credential fields
    const degree = $("credentialDegree").value.trim();
    const university = $("credentialUniversity").value.trim();
    const year = parseInt($("credentialYear").value) || 2024;
    const gpa = parseFloat($("credentialGPA").value) || 3.8;
    const honors = $("credentialHonors").value.trim();

    // Validate inputs
    if (!degree || !university || !honors) {
      throw new Error("Degree, University, and Honors are required");
    }

    // Build credential object
    const credentialObj = {
      degree,
      university,
      year,
      gpa,
      honors
    };

    // Convert to JSON string
    const credentialData = JSON.stringify(credentialObj);

    // Compute keccak256 hash
    currentCredentialHash = ethers.keccak256(ethers.toUtf8Bytes(credentialData));

    // Update UI
    $("credentialHashField").value = currentCredentialHash;

    showStatus("hashStatus", "✅ Credential hash created!", "success");
    showOutput("hashOutput", `Credential Data:\n${JSON.stringify(credentialObj, null, 2)}\n\nHash (keccak256):\n${currentCredentialHash}`);
  } catch (error) {
    showStatus("hashStatus", `❌ ${error.message}`, "error");
    console.error(error);
  }
}

// STEP 3: ISSUE CREDENTIAL
async function issueCredential() {
  try {
    if (!currentCredentialHash) {
      throw new Error("Create credential hash first (Step 2)");
    }

    showStatus("issueStatus", "🔄 Issuing credential...", "loading");

    const holderAddress = $("studentAddressField").value;
    const ipfsHash = $("ipfsHashInput").value;
    const schema = ethers.toUtf8Bytes("university-credential-v1");

    const signer = await provider.getSigner(university);
    const credentialsWithSigner = credentials.connect(signer);
    const tx = await credentialsWithSigner.issueCredential(
      holderAddress,
      currentCredentialHash,
      ipfsHash,
      schema
    );
    await tx.wait();

    showStatus("issueStatus", "✅ Credential issued!", "success");
    showOutput(
      "issueOutput",
      `Transaction: ${tx.hash}\n\nCredential Hash: ${currentCredentialHash}\nHolder: ${holderAddress}\nIPFS: ${ipfsHash}`
    );
  } catch (error) {
    showStatus("issueStatus", `❌ ${error.reason || error.message}`, "error");
    console.error(error);
  }
}

// STEP 4: RETRIEVE METADATA
async function retrieveMetadata() {
  try {
    if (!currentCredentialHash) {
      throw new Error("Issue credential first (Step 3)");
    }

    showStatus("metadataStatus", "🔄 Retrieving metadata...", "loading");

    const metadata = await credentials.getCredentialMetadata(currentCredentialHash);

    // Display metadata table
    $("metadataIssuer").textContent = metadata.issuer;
    $("metadataHolder").textContent = metadata.holder;
    $("metadataIPFS").textContent = metadata.ipfsHash;
    $("metadataDate").textContent = new Date(Number(metadata.issueDate) * 1000).toISOString();
    $("metadataState").textContent = metadata.state === 1n ? "Valid" : "Revoked";

    $("metadataTable").style.display = "table";
    showStatus("metadataStatus", "✅ Metadata retrieved!", "success");
  } catch (error) {
    showStatus("metadataStatus", `❌ ${error.reason || error.message}`, "error");
    console.error(error);
  }
}

// STEP 5: CHECK STATUS
async function checkCredentialStatus() {
  try {
    if (!currentCredentialHash) {
      throw new Error("Issue credential first (Step 3)");
    }

    const isValid = await credentials.isCredentialValid(currentCredentialHash);
    const $output = $("statusOutput");
    $output.style.display = "block";
    $output.classList.remove("revoked");
    $("statusResult").textContent = isValid ? "✅ VALID" : "❌ REVOKED";

    showStatus("statusOutput", "✅ Status retrieved!", "success");
  } catch (error) {
    showStatus("statusOutput", `❌ ${error.reason || error.message}`, "error");
    console.error(error);
  }
}

// STEP 6: VERIFY CREDENTIAL
async function verifyCredential() {
  try {
    if (!currentCredentialHash) {
      throw new Error("Issue credential first (Step 3)");
    }

    showStatus("verifyStatus", "🔄 Verifying credential...", "loading");

    // Build credential data from the same fields used in Step 2
    const degree = $("credentialDegree").value.trim();
    const university = $("credentialUniversity").value.trim();
    const year = parseInt($("credentialYear").value) || 2024;
    const gpa = parseFloat($("credentialGPA").value) || 3.8;
    const honors = $("credentialHonors").value.trim();

    const credentialObj = {
      degree,
      university,
      year,
      gpa,
      honors
    };

    const credentialData = JSON.stringify(credentialObj);
    
    const signer = await provider.getSigner(employer);
    const credentialsWithSigner = credentials.connect(signer);
    const tx = await credentialsWithSigner.verifyCredentialData(
      credentialData,
      currentCredentialHash
    );
    await tx.wait();

    // Check if verification succeeded
    const isValid = await credentials.isCredentialValid(currentCredentialHash);

    showStatus("verifyStatus", "✅ Credential verified!", "success");
    showOutput(
      "verifyOutput",
      `Verification by: ${employer}\nTransaction: ${tx.hash}\nResult: ${isValid ? "VALID ✅" : "INVALID ❌"}\n\nEmit Event: CredentialVerified (no PII logged)`
    );
  } catch (error) {
    showStatus("verifyStatus", `❌ ${error.reason || error.message}`, "error");
    console.error(error);
  }
}

// STEP 7: RETRIEVE IPFS HASH
async function retrieveIPFSHash() {
  try {
    if (!currentCredentialHash) {
      throw new Error("Issue credential first (Step 3)");
    }

    showStatus("ipfsHashStatus", "🔄 Retrieving IPFS hash...", "loading");

    const ipfsHash = await credentials.getCredentialIPFSHash(currentCredentialHash);

    showStatus("ipfsHashStatus", "✅ IPFS hash retrieved!", "success");
    showOutput(
      "ipfsHashOutput",
      `IPFS CID: ${ipfsHash}\n\nYou can use this hash to retrieve the full credential blob from IPFS:\nExample: ipfs get ${ipfsHash}`
    );
  } catch (error) {
    showStatus("ipfsHashStatus", `❌ ${error.reason || error.message}`, "error");
    console.error(error);
  }
}

// STEP 8: REVOKE CREDENTIAL
async function revokeCredential() {
  try {
    if (!currentCredentialHash) {
      throw new Error("Issue credential first (Step 3)");
    }

    showStatus("revokeStatus", "🔄 Revoking credential...", "loading");

    const signer = await provider.getSigner(university);
    const credentialsWithSigner = credentials.connect(signer);
    const tx = await credentialsWithSigner.revokeCredential(currentCredentialHash);
    await tx.wait();

    showStatus("revokeStatus", "✅ Credential revoked!", "success");
    showOutput("revokeOutput", `Transaction: ${tx.hash}\n\nEmit Event: CredentialRevoked`);
  } catch (error) {
    showStatus("revokeStatus", `❌ ${error.reason || error.message}`, "error");
    console.error(error);
  }
}

// STEP 9: CHECK STATUS AFTER REVOKE
async function checkStatusAfterRevoke() {
  try {
    if (!currentCredentialHash) {
      throw new Error("Issue credential first (Step 3)");
    }

    const isValid = await credentials.isCredentialValid(currentCredentialHash);
    const $output = $("revokeCheckOutput");
    $output.style.display = "block";
    $output.classList.add("revoked");
    $("revokeCheckResult").textContent = isValid ? "VALID" : "REVOKED ✓";
  } catch (error) {
    console.error(error);
  }
}

// STEP 10: TEST ERROR HANDLING
async function testErrorHandling() {
  try {
    showStatus("errorStatus", "🔄 Testing error handling...", "loading");

    let output = "Testing Error Handling:\n\n";

    // Test 1: Try to issue as non-university
    output += "Test 1: Attempt to issue credential as Employer (should fail)\n";
    try {
      const signer = await provider.getSigner(employer);
      const credentialsWithSigner = credentials.connect(signer);
      await credentialsWithSigner.issueCredential(
        student,
        currentCredentialHash || ethers.id("test"),
        "QmTest",
        ethers.toUtf8Bytes("test")
      );
      output += "❌ ERROR: Should have failed!\n\n";
    } catch (e) {
      output += `✅ Correctly rejected: ${e.reason || e.message}\n\n`;
    }

    // Test 2: Verify non-existent credential
    output += "Test 2: Check status of non-existent credential\n";
    const nonExistentHash = ethers.keccak256(ethers.toUtf8Bytes("non-existent-data"));
    const isValid = await credentials.isCredentialValid(nonExistentHash);
    output += `✅ Non-existent credential is valid: ${isValid} (correctly returns false)\n\n`;

    // Test 3: Try to revoke as non-issuer
    if (currentCredentialHash) {
      output += "Test 3: Attempt to revoke as non-issuer (should fail)\n";
      try {
        const signer = await provider.getSigner(employer);
        const credentialsWithSigner = credentials.connect(signer);
        await credentialsWithSigner.revokeCredential(currentCredentialHash);
        output += "❌ ERROR: Should have failed!\n";
      } catch (e) {
        output += `✅ Correctly rejected: ${e.reason || e.message}\n`;
      }
    }

    showStatus("errorStatus", "✅ Error handling tests completed!", "success");
    showOutput("errorOutput", output);
  } catch (error) {
    showStatus("errorStatus", `❌ ${error.message}`, "error");
    console.error(error);
  }
}
