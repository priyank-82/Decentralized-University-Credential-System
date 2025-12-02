const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("University System Evaluation: Gas & Scalability", function () {
  let didRegistry, credentialStatus;
  let owner, university, student, employer, addrs;
  
  // Storage for metrics
  const metrics = {
    didGas: 0n,
    issuanceGas: 0n,
    revocationGas: 0n,
    verificationGas: 0n
  };

  before(async function () {
    [owner, university, student, employer, ...addrs] = await ethers.getSigners();
    
    // 1. Deploy DIDRegistry
    const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    didRegistry = await DIDRegistry.deploy();
    await didRegistry.waitForDeployment(); // v6 syntax
    console.log(`\n  [Setup] DIDRegistry deployed at: ${didRegistry.target}`);

    // 2. Deploy CredentialStatus
    const CredentialStatus = await ethers.getContractFactory("CredentialStatus");
    credentialStatus = await CredentialStatus.deploy(didRegistry.target);
    await credentialStatus.waitForDeployment(); // v6 syntax
    console.log(`  [Setup] CredentialStatus deployed at: ${credentialStatus.target}\n`);
  });

  // =========================================================
  // PART 1: GAS USAGE BENCHMARKS
  // =========================================================
  describe("PART 1: Key Operation Gas Benchmarks", function () {
    
    it("Measure Gas: University DID Registration", async function () {
      const tx = await didRegistry.connect(university).registerIdentity(2); // Role 2 = University
      const receipt = await tx.wait();
      metrics.didGas = receipt.gasUsed;
      
      console.log(`\t⛽ DID Registration (University): ${receipt.gasUsed}`);
    });

    it("Measure Gas: Student DID Registration", async function () {
      const tx = await didRegistry.connect(student).registerIdentity(1); // Role 1 = Student
      await tx.wait();
    });

    it("Measure Gas: Issue Credential", async function () {
      const credentialData = "Bachelor of Computer Science - 2024";
      // FIX: ethers.utils.id -> ethers.id
      const credentialHash = ethers.id(credentialData); 
      const ipfsHash = "QmXyZ123...";
      // FIX: ethers.utils.toUtf8Bytes -> ethers.toUtf8Bytes
      const schema = ethers.toUtf8Bytes("DegreeSchemaV1"); 

      const tx = await credentialStatus.connect(university).issueCredential(
        student.address,
        credentialHash,
        ipfsHash,
        schema
      );
      const receipt = await tx.wait();
      metrics.issuanceGas = receipt.gasUsed;
      
      console.log(`\t⛽ Credential Issuance: ${receipt.gasUsed}`);
    });

    it("Measure Gas: Verify Credential (On-Chain with Event)", async function () {
      const credentialData = "Bachelor of Computer Science - 2024";
      const credentialHash = ethers.id(credentialData); // FIX

      const tx = await credentialStatus.verifyCredentialData(credentialData, credentialHash);
      const receipt = await tx.wait();
      metrics.verificationGas = receipt.gasUsed;

      console.log(`\t⛽ Verification (On-Chain/Event Emit): ${receipt.gasUsed}`);
    });

    it("Measure Gas: Revoke Credential", async function () {
      const credentialData = "Bachelor of Computer Science - 2024";
      const credentialHash = ethers.id(credentialData); // FIX

      const tx = await credentialStatus.connect(university).revokeCredential(credentialHash);
      const receipt = await tx.wait();
      metrics.revocationGas = receipt.gasUsed;

      console.log(`\t⛽ Credential Revocation: ${receipt.gasUsed}`);
    });
  });

  // =========================================================
  // PART 2: SCALABILITY STRESS TEST
  // =========================================================
  describe("PART 2: Scalability Stress Test (Growth Analysis)", function () {
    
    it("Evaluate performance as repository grows", async function () {
      console.log("\n\t[Stress Test] Issuing batches of credentials...");
      
      const batchSizes = [10, 50, 100]; 
      
      for (let batch of batchSizes) {
        // FIX: BigNumber.from(0) -> 0n (BigInt)
        let totalGas = 0n; 
        
        const start = Date.now();

        for (let i = 0; i < batch; i++) {
          const uniqueId = `Batch${batch}-Student${i}-${Date.now()}`;
          const hash = ethers.id(uniqueId); // FIX
          
          const tx = await credentialStatus.connect(university).issueCredential(
            student.address, 
            hash, 
            "QmStressTestHash", 
            ethers.toUtf8Bytes("StressTest") // FIX
          );
          const receipt = await tx.wait();
          // FIX: .add() -> +=
          totalGas += receipt.gasUsed; 
        }

        const duration = (Date.now() - start) / 1000;
        // FIX: .div() -> / (BigInt division)
        const avgGas = totalGas / BigInt(batch); 
        
        console.log(`\n\t📊 Batch Size: ${batch} Credentials`);
        console.log(`\t   - Time Taken: ${duration.toFixed(2)}s`);
        console.log(`\t   - Avg Gas/Tx: ${avgGas}`);
        console.log(`\t   - Est. TPS (Simulated): ${(batch / duration).toFixed(2)}`);

        // Check Stability
        // FIX: .gt() -> > and .add() -> +
        if (avgGas > (metrics.issuanceGas + 5000n)) {
           console.log("\t⚠️ WARNING: Gas costs are rising significantly.");
        } else {
           console.log("\t✅ PASS: Gas costs are stable. System scales linearly (O(1)).");
        }
      }
    });
  });
});