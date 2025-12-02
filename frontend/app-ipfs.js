/**
 * Frontend logic for IPFS + Credential Verification
 * Demonstrates upload, verification, and retrieval from IPFS.
 */

// Helper functions
function $(id) { return document.getElementById(id); }

// Mock credential helpers (for demo purposes; replace with lib imports in production)
function computeHash(data) {
  // Simple hash simulation (use ethers.keccak256 in production)
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}

function initIPFSUI() {
  // Config button
  $('configBtn').addEventListener('click', () => {
    const contractAddr = $('contractAddr').value;
    const registryAddr = $('registryAddr').value;
    if (!contractAddr || !registryAddr) {
      $('configResult').innerText = 'Please provide both contract addresses';
    } else {
      $('configResult').innerText = `Loaded: ${contractAddr.slice(0, 10)}... | ${registryAddr.slice(0, 10)}...`;
    }
  });

  // Register button
  $('registerBtn').addEventListener('click', () => {
    const role = $('roleSelect').value;
    const roles = ['', 'Student', 'University', 'Employer'];
    $('registerResult').innerText = `Demo: registered as ${roles[role]}`;
  });

  // Issue credential button
  $('issueBtn').addEventListener('click', () => {
    const holder = $('holderAddress').value || '(demo)';
    const data = $('credentialData').value || '{}';
    
    try {
      const parsed = JSON.parse(data);
      const hash = computeHash(data);
      
      // Simulate IPFS upload
      const ipfsHash = 'Qm' + Math.random().toString(36).substring(7);
      
      $('issueResult').innerText = `
✓ Credential issued
- Hash: ${hash}
- IPFS: ${ipfsHash}
- Holder: ${holder}
- To: Store this hash on-chain via smart contract
      `.trim();
    } catch (e) {
      $('issueResult').innerText = `Error: Invalid JSON. ${e.message}`;
    }
  });

  // Verify credential button
  $('verifyBtn').addEventListener('click', () => {
    const hash = $('verifyHash').value;
    const data = $('verifyData').value;
    
    if (!hash && !data) {
      $('verifyResult').innerText = 'Provide either hash or credential data';
      return;
    }

    let result = '';
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const computedHash = computeHash(data);
        result = `
✓ Credential verified (demo)
- Data: ${JSON.stringify(parsed, null, 2)}
- Computed Hash: ${computedHash}
- Status: VALID (on-chain verification would check issuer signature and revocation status)
        `.trim();
      } catch (e) {
        result = `Error: Invalid JSON. ${e.message}`;
      }
    } else {
      result = `
Verification for hash: ${hash}
(In production, would query smart contract for on-chain status)
- Status: UNKNOWN (connect to blockchain to verify)
      `.trim();
    }

    $('verifyResult').innerText = result;
  });

  // Retrieve from IPFS button
  $('retrieveBtn').addEventListener('click', () => {
    const ipfsHash = $('ipfsHash').value;
    if (!ipfsHash) {
      $('retrievedData').innerText = 'Please provide IPFS hash';
      return;
    }

    // Simulate IPFS retrieval (in production, use actual IPFS client)
    const mockData = {
      degree: 'Bachelor of Science in Computer Science',
      university: 'MIT',
      year: 2024,
      gpa: 3.8,
      issuer: '0x5FbDB2315678afecb367f032d93F642f64180aa3'
    };

    $('retrievedData').innerText = JSON.stringify(mockData, null, 2);
  });
}

window.addEventListener('load', initIPFSUI);
