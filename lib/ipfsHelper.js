/**
 * IPFS Helper Module
 * Provides utilities for storing and retrieving credential data from IPFS.
 */

import { create } from 'ipfs-http-client';

// Initialize IPFS client (connects to public IPFS gateway or local node)
// For production, replace with your own IPFS node or Pinata gateway
const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

/**
 * Upload credential data to IPFS.
 * @param {string|object} credentialData - The credential data (JSON string or object).
 * @returns {Promise<string>} The IPFS CID (Content Identifier).
 */
export async function uploadCredentialToIPFS(credentialData) {
  try {
    const dataString = typeof credentialData === 'string' 
      ? credentialData 
      : JSON.stringify(credentialData);
    
    // Add file to IPFS
    const result = await ipfs.add(dataString);
    console.log(`Credential uploaded to IPFS: ${result.path}`);
    return result.path; // Returns CID
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

/**
 * Retrieve credential data from IPFS.
 * @param {string} ipfsHash - The IPFS CID.
 * @returns {Promise<string>} The credential data.
 */
export async function retrieveCredentialFromIPFS(ipfsHash) {
  try {
    let data = '';
    
    // Read file from IPFS
    for await (const chunk of ipfs.cat(ipfsHash)) {
      data += chunk.toString();
    }
    
    console.log(`Credential retrieved from IPFS (CID: ${ipfsHash})`);
    return data;
  } catch (error) {
    console.error('Error retrieving from IPFS:', error);
    throw error;
  }
}

/**
 * Compute keccak256 hash of credential data (for on-chain verification).
 * @param {string|object} credentialData - The credential data.
 * @returns {string} The keccak256 hash (hex string with 0x prefix).
 */
export function computeCredentialHash(credentialData) {
  const { ethers } = require('ethers');
  const dataString = typeof credentialData === 'string' 
    ? credentialData 
    : JSON.stringify(credentialData);
  
  return ethers.keccak256(ethers.toUtf8Bytes(dataString));
}

/**
 * Verify a credential by retrieving from IPFS and comparing hash.
 * @param {string} ipfsHash - The IPFS CID.
 * @param {string} expectedHash - The expected keccak256 hash (from on-chain).
 * @returns {Promise<boolean>} True if hash matches, false otherwise.
 */
export async function verifyCredentialIntegrity(ipfsHash, expectedHash) {
  try {
    const data = await retrieveCredentialFromIPFS(ipfsHash);
    const computedHash = computeCredentialHash(data);
    
    const isValid = computedHash.toLowerCase() === expectedHash.toLowerCase();
    console.log(`Credential integrity check: ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
  } catch (error) {
    console.error('Error verifying credential:', error);
    return false;
  }
}

export default {
  uploadCredentialToIPFS,
  retrieveCredentialFromIPFS,
  computeCredentialHash,
  verifyCredentialIntegrity
};
