/**
 * Cryptography Helper Module
 * Provides utilities for signing and verifying credentials.
 */

import { ethers } from 'ethers';

/**
 * Sign credential data with a private key.
 * @param {string} credentialData - The credential data (JSON string or plaintext).
 * @param {string} privateKey - The private key (0x-prefixed hex string).
 * @returns {string} The signature (hex string).
 */
export function signCredential(credentialData, privateKey) {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const messageHash = ethers.hashMessage(credentialData);
    const signature = wallet.signingKey.sign(messageHash).serialized;
    
    console.log(`Credential signed. Signature: ${signature}`);
    return signature;
  } catch (error) {
    console.error('Error signing credential:', error);
    throw error;
  }
}

/**
 * Verify a credential signature.
 * @param {string} credentialData - The original credential data.
 * @param {string} signature - The signature (hex string).
 * @param {string} signerAddress - The expected signer's Ethereum address.
 * @returns {boolean} True if signature is valid, false otherwise.
 */
export function verifyCredentialSignature(credentialData, signature, signerAddress) {
  try {
    const messageHash = ethers.hashMessage(credentialData);
    const recoveredAddress = ethers.recoverAddress(messageHash, signature);
    
    const isValid = recoveredAddress.toLowerCase() === signerAddress.toLowerCase();
    console.log(`Signature verification: ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Compute hash of credential data (deterministic, for on-chain comparison).
 * @param {string|object} credentialData - The credential data.
 * @returns {string} The keccak256 hash (0x-prefixed hex string).
 */
export function hashCredential(credentialData) {
  const dataString = typeof credentialData === 'string' 
    ? credentialData 
    : JSON.stringify(credentialData);
  
  return ethers.keccak256(ethers.toUtf8Bytes(dataString));
}

/**
 * Create a credential object with metadata.
 * @param {object} credentialData - The credential data (e.g., { degree: "BSc", university: "MIT" }).
 * @param {string} holderAddress - The holder's Ethereum address.
 * @param {string} issuerAddress - The issuer's Ethereum address.
 * @returns {object} The credential object with metadata and hash.
 */
export function createCredential(credentialData, holderAddress, issuerAddress) {
  const credential = {
    data: credentialData,
    holder: holderAddress,
    issuer: issuerAddress,
    issuedAt: new Date().toISOString(),
    credentialHash: hashCredential(credentialData)
  };
  
  return credential;
}

/**
 * Verify a complete credential (data + signature + on-chain status).
 * @param {string} credentialData - The credential data.
 * @param {string} signature - The issuer's signature.
 * @param {string} issuerAddress - The issuer's address.
 * @param {string} expectedHash - The on-chain hash (from CredentialStatus contract).
 * @returns {object} Verification result { isValid, signatures, hash, reasons }.
 */
export function verifyCompleteCredential(credentialData, signature, issuerAddress, expectedHash) {
  const result = {
    isValid: false,
    checks: {
      signatureValid: false,
      hashValid: false
    },
    reasons: []
  };

  // Check signature
  const sigValid = verifyCredentialSignature(credentialData, signature, issuerAddress);
  result.checks.signatureValid = sigValid;
  if (!sigValid) result.reasons.push('Signature verification failed');

  // Check hash
  const computedHash = hashCredential(credentialData);
  const hashValid = computedHash.toLowerCase() === expectedHash.toLowerCase();
  result.checks.hashValid = hashValid;
  if (!hashValid) result.reasons.push('Credential data hash does not match on-chain hash');

  // Overall validity
  result.isValid = sigValid && hashValid;

  return result;
}

export default {
  signCredential,
  verifyCredentialSignature,
  hashCredential,
  createCredential,
  verifyCompleteCredential
};
