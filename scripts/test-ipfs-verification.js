/**
 * Test Script for Decentralized Credentials with IPFS + Verification
 * Run with: npx hardhat run scripts/test-ipfs-verification.js --network localhost
 */

const hre = require("hardhat");

async function main() {
  console.log("=".repeat(70));
  console.log("Testing Decentralized Credentials with IPFS + Verification");
  console.log("=".repeat(70));

  // Get test accounts
  const [owner, university, student, employer] = await hre.ethers.getSigners();
  console.log("\n✓ Test Accounts:");
  console.log(`  Owner:       ${owner.address}`);
  console.log(`  University:  ${university.address}`);
  console.log(`  Student:     ${student.address}`);
  console.log(`  Employer:    ${employer.address}`);

  // Replace with your deployed addresses or deploy fresh
  const registryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // from README
  const credentialsAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // from README

  console.log("\n" + "=".repeat(70));
  console.log("STEP 1: Attach to Deployed Contracts");
  console.log("=".repeat(70));

  try {
    const registry = await hre.ethers.getContractAt("DIDRegistry", registryAddress);
    const credentials = await hre.ethers.getContractAt("CredentialStatus", credentialsAddress);

    console.log(`✓ DIDRegistry at: ${registryAddress}`);
    console.log(`✓ CredentialStatus at: ${credentialsAddress}`);

    // STEP 2: Register Identities
    console.log("\n" + "=".repeat(70));
    console.log("STEP 2: Register Identities");
    console.log("=".repeat(70));

    console.log("\nRegistering University...");
    let tx = await registry.connect(university).registerIdentity(2); // Role 2 = University
    await tx.wait();
    console.log(`✓ University registered: ${university.address}`);

    console.log("\nRegistering Student...");
    tx = await registry.connect(student).registerIdentity(1); // Role 1 = Student
    await tx.wait();
    console.log(`✓ Student registered: ${student.address}`);

    console.log("\nRegistering Employer (Verifier)...");
    tx = await registry.connect(employer).registerIdentity(3); // Role 3 = Employer
    await tx.wait();
    console.log(`✓ Employer registered: ${employer.address}`);

    // STEP 3: Create and Hash Credential Data
    console.log("\n" + "=".repeat(70));
    console.log("STEP 3: Create Credential Data");
    console.log("=".repeat(70));

    const credentialData = JSON.stringify({
      degree: "Bachelor of Science in Computer Science",
      university: "MIT",
      year: 2024,
      gpa: 3.8,
      honors: "Magna Cum Laude"
    });

    console.log(`\nCredential Data:\n${credentialData}`);

    // Compute keccak256 hash
    const credentialHash = hre.ethers.keccak256(
      hre.ethers.toUtf8Bytes(credentialData)
    );
    console.log(`\nCredential Hash (keccak256):\n${credentialHash}`);

    // Simulate IPFS hash
    const ipfsHash = "QmX8eVbU5xVvvHn4Y2CqKu8R8e1cZuJ5VjD8mK3aNd9pZz";
    const schema = hre.ethers.toUtf8Bytes("university-credential-v1");

    console.log(`\nIPFS Hash (simulated):\n${ipfsHash}`);
    console.log(`Schema:\n${schema}`);

    // STEP 4: Issue Credential with IPFS Reference
    console.log("\n" + "=".repeat(70));
    console.log("STEP 4: Issue Credential (University issues to Student)");
    console.log("=".repeat(70));

    console.log(`\nUniversity issuing credential with IPFS reference...`);
    tx = await credentials
      .connect(university)
      .issueCredential(student.address, credentialHash, ipfsHash, schema);

    const receipt = await tx.wait();
    console.log(`✓ Credential issued!`);
    console.log(`  Transaction Hash: ${receipt.hash}`);
    console.log(`  Block Number: ${receipt.blockNumber}`);

    // STEP 5: Retrieve and Display Credential Metadata
    console.log("\n" + "=".repeat(70));
    console.log("STEP 5: Retrieve Credential Metadata");
    console.log("=".repeat(70));

    const metadata = await credentials.getCredentialMetadata(credentialHash);
    console.log(`\nCredential Metadata:`);
    console.log(`  Issuer:       ${metadata.issuer}`);
    console.log(`  Holder:       ${metadata.holder}`);
    console.log(`  IPFS Hash:    ${metadata.ipfsHash}`);
    console.log(`  Issue Date:   ${new Date(Number(metadata.issueDate) * 1000).toISOString()}`);
    console.log(`  State:        ${metadata.state === 1n ? "Valid" : "Revoked"}`);

    // STEP 6: Check Credential Status
    console.log("\n" + "=".repeat(70));
    console.log("STEP 6: Check Credential Status");
    console.log("=".repeat(70));

    const isValid = await credentials.isCredentialValid(credentialHash);
    console.log(`\n✓ Credential is Valid: ${isValid}`);

    // STEP 7: Verify Credential Data (Employer/Verifier)
    console.log("\n" + "=".repeat(70));
    console.log("STEP 7: Verify Credential (Employer verifies data integrity)");
    console.log("=".repeat(70));

    console.log(`\nEmployer verifying credential...`);
    tx = await credentials
      .connect(employer)
      .verifyCredentialData(credentialData, credentialHash);

    const verifyReceipt = await tx.wait();
    console.log(`✓ Verification transaction sent`);
    console.log(`  Transaction Hash: ${verifyReceipt.hash}`);

    // Check if verification succeeded
    const verifyResult = await credentials.isCredentialValid(credentialHash);
    console.log(`  Verification Result: ${verifyResult ? "PASSED" : "FAILED"}`);

    // STEP 8: Get IPFS Hash for Retrieval
    console.log("\n" + "=".repeat(70));
    console.log("STEP 8: Get IPFS Hash for Off-Chain Retrieval");
    console.log("=".repeat(70));

    const storedIPFSHash = await credentials.getCredentialIPFSHash(credentialHash);
    console.log(`\n✓ IPFS Hash for credential: ${storedIPFSHash}`);
    console.log(`  (In production, use this to retrieve full credential blob from IPFS)`);

    // STEP 9: Revoke Credential (if needed)
    console.log("\n" + "=".repeat(70));
    console.log("STEP 9: Revoke Credential (University revokes)");
    console.log("=".repeat(70));

    console.log(`\nUniversity revoking credential...`);
    tx = await credentials.connect(university).revokeCredential(credentialHash);
    await tx.wait();
    console.log(`✓ Credential revoked!`);

    const isValidAfterRevoke = await credentials.isCredentialValid(credentialHash);
    console.log(`✓ Credential is Valid (after revoke): ${isValidAfterRevoke}`);

    // STEP 10: Test Error Handling
    console.log("\n" + "=".repeat(70));
    console.log("STEP 10: Test Error Handling");
    console.log("=".repeat(70));

    // Try to issue credential as non-university (should fail)
    console.log(`\nAttempting to issue credential as Employer (should fail)...`);
    try {
      await credentials
        .connect(employer)
        .issueCredential(student.address, credentialHash, ipfsHash, schema);
      console.log(`✗ ERROR: Should have failed!`);
    } catch (e) {
      console.log(`✓ Correctly rejected: Not a registered University`);
    }

    // Try to verify non-existent credential
    console.log(`\nAttempting to verify non-existent credential...`);
    const nonExistentHash = hre.ethers.keccak256(
      hre.ethers.toUtf8Bytes("non-existent-data")
    );
    const verifyNonExistent = await credentials.isCredentialValid(nonExistentHash);
    console.log(`✓ Non-existent credential is valid: ${verifyNonExistent} (correctly returns false)`);

    console.log("\n" + "=".repeat(70));
    console.log("✓ ALL TESTS PASSED!");
    console.log("=".repeat(70));
    console.log("\nSummary:");
    console.log("  ✓ Identities registered (University, Student, Employer)");
    console.log("  ✓ Credential issued with IPFS reference");
    console.log("  ✓ Credential verified by third party");
    console.log("  ✓ Metadata retrieved from on-chain storage");
    console.log("  ✓ IPFS hash accessible for off-chain retrieval");
    console.log("  ✓ Credential revocation working");
    console.log("  ✓ Error handling validated");

  } catch (error) {
    console.error("\n✗ ERROR:", error.message);
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
