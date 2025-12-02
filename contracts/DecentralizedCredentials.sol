// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Import Hardhat's console.log for debugging (optional)
import "hardhat/console.sol";

/**
 * @title DIDRegistry
 * @author Group 18
 * @notice Manages Decentralized Identifiers (DIDs) for all stakeholders.
 * This contract registers and stores the roles for Students, Universities,
 * and Employers, linking their wallet address to a role.
 */
contract DIDRegistry {
    // Enum to define the roles of participants in the system
    enum Role { None, Student, University, Employer }

    // Struct to store information about a registered identity
    struct Identity {
        address walletAddress; // The user's public key address
        Role role;             // The user's role
        bool isRegistered;     // Flag to check if the identity is registered
    }

    // Mapping from a user's wallet address to their Identity info
    mapping(address => Identity) public identities;

    // Event emitted when a new identity is registered
    event IdentityRegistered(address indexed userAddress, Role indexed role);

    /**
     * @notice Registers a new identity (Student, University, or Employer).
     * @dev Only allows registration once per address.
     * @param _role The role to assign (1 for Student, 2 for University, 3 for Employer).
     */
    function registerIdentity(Role _role) public {
        // Ensure the user is not already registered
        require(!identities[msg.sender].isRegistered, "DIDRegistry: Address already registered");
        // Ensure a valid role is provided
        require(_role != Role.None, "DIDRegistry: Invalid role");

        // Store the new identity
        identities[msg.sender] = Identity({
            walletAddress: msg.sender,
            role: _role,
            isRegistered: true
        });

        // Emit an event
        emit IdentityRegistered(msg.sender, _role);
    }

    /**
     * @notice Fetches the role for a given user address.
     * @param _userAddress The address to check.
     * @return The Role enum of the user.
     */
    function getRole(address _userAddress) public view returns (Role) {
        return identities[_userAddress].role;
    }

    /**
     * @notice Checks if an address has a specific role.
     * @param _userAddress The address to check.
     * @param _role The role to check for.
     * @return true if the user has the role, false otherwise.
     */
    function hasRole(address _userAddress, Role _role) public view returns (bool) {
        return identities[_userAddress].role == _role;
    }
}


/**
 * @title CredentialStatus
 * @author Group 18
 * @notice Manages the issuance, verification, and revocation of academic credentials.
 * This contract relies on DIDRegistry to authenticate issuers.
 */
contract CredentialStatus {
    // Reference to the deployed DIDRegistry contract
    DIDRegistry public didRegistry;

    // Enum to define the state of a credential
    enum CredentialState { None, Valid, Revoked }

    // Struct to store information about a credential
    struct Credential {
        bytes32 credentialHash; // The cryptographic hash of the off-chain credential data (e.g., from IPFS)
        string ipfsHash;        // IPFS CID where full credential blob is stored
        bytes credentialSchema; // Metadata about credential type/schema
        address issuer;         // The address of the University that issued it
        address holder;         // The address of the Student who owns it
        uint256 issueDate;      // Timestamp when the credential was issued
        CredentialState state;  // Current status (Valid, Revoked)
    }

    // Mapping from the unique credential hash to its Struct
    mapping(bytes32 => Credential) public credentials;

    // Event emitted when a new credential is issued
    event CredentialIssued(bytes32 indexed credentialHash, address indexed issuer, address indexed holder, string ipfsHash);

    // Event emitted when a credential's status is revoked
    event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer);

    // Event emitted when a credential is verified
    event CredentialVerified(bytes32 indexed credentialHash, address indexed verifier, bool isValid);

    /**
     * @notice Modifier to restrict function access to only addresses with the University role.
     */
    modifier onlyUniversity() {
        bool isUniversity = didRegistry.hasRole(msg.sender, DIDRegistry.Role.University);
        require(isUniversity, "CredentialStatus: Caller is not a registered University");
        _;
    }

    /**
     * @notice Constructor: Links this contract to the DIDRegistry.
     * @param _registryAddress The deployment address of the DIDRegistry contract.
     */
    constructor(address _registryAddress) {
        require(_registryAddress != address(0), "CredentialStatus: Invalid registry address");
        didRegistry = DIDRegistry(_registryAddress);
    }

    /**
     * @notice Issues a new academic credential with IPFS storage reference.
     * @dev Only a registered University can call this function.
     * @param _holder The wallet address of the Student.
     * @param _credentialHash The unique cryptographic hash of the credential data.
     * @param _ipfsHash The IPFS CID where the full credential blob is stored.
     * @param _schema Optional schema metadata (e.g., credential type).
     */
    function issueCredential(address _holder, bytes32 _credentialHash, string memory _ipfsHash, bytes memory _schema) public onlyUniversity {
        // Check that the holder is a registered Student
        require(didRegistry.hasRole(_holder, DIDRegistry.Role.Student), "CredentialStatus: Holder is not a registered Student");
        
        // Ensure this credential hash hasn't been used
        require(credentials[_credentialHash].state == CredentialState.None, "CredentialStatus: Credential hash already exists");

        // Store the new credential with IPFS reference
        credentials[_credentialHash] = Credential({
            credentialHash: _credentialHash,
            ipfsHash: _ipfsHash,
            credentialSchema: _schema,
            issuer: msg.sender,
            holder: _holder,
            issueDate: block.timestamp,
            state: CredentialState.Valid
        });

        // Emit the issuance event with IPFS hash
        emit CredentialIssued(_credentialHash, msg.sender, _holder, _ipfsHash);
    }

    /**
     * @notice Revokes an existing academic credential.
     * @dev Only the original issuing University can revoke it.
     * @param _credentialHash The hash of the credential to revoke.
     */
    function revokeCredential(bytes32 _credentialHash) public {
        // Check if the credential exists and is valid
        Credential storage cred = credentials[_credentialHash];
        require(cred.state == CredentialState.Valid, "CredentialStatus: Credential is not valid or does not exist");
        
        // Ensure only the original issuer can revoke it
        require(cred.issuer == msg.sender, "CredentialStatus: Caller is not the original issuer");

        // Update the state to Revoked
        cred.state = CredentialState.Revoked;

        // Emit the revocation event
        emit CredentialRevoked(_credentialHash, msg.sender);
    }

    /**
     * @notice Public function to check the status of a credential.
     * @dev Anyone (e.g., an Employer) can call this function.
     * @param _credentialHash The hash of the credential to verify.
     * @return The current state (None, Valid, Revoked).
     */
    function getCredentialStatus(bytes32 _credentialHash) public view returns (CredentialState) {
        return credentials[_credentialHash].state;
    }

    /**
     * @notice A simple boolean check for verification.
     * @param _credentialHash The hash of the credential to verify.
     * @return true if the credential's state is Valid, false otherwise.
     */
    function isCredentialValid(bytes32 _credentialHash) public view returns (bool) {
        return credentials[_credentialHash].state == CredentialState.Valid;
    }

    /**
     * @notice Verify a credential by recomputing hash from data and comparing with on-chain commitment.
     * @dev Anyone (e.g., an Employer/Verifier) can call this function to verify a credential.
     * @param _credentialData The original credential data (plaintext or JSON).
     * @param _credentialHash The on-chain stored credential hash.
     * @return true if the recomputed hash matches the on-chain hash AND credential is Valid.
     */
    function verifyCredentialData(string memory _credentialData, bytes32 _credentialHash) public returns (bool) {
        // Recompute hash from provided data
        bytes32 computedHash = keccak256(abi.encodePacked(_credentialData));
        
        // Check if computed hash matches on-chain hash and credential is valid
        bool isValid = (computedHash == _credentialHash) && credentials[_credentialHash].state == CredentialState.Valid;
        
        // Emit verification event for audit trail (no PII)
        emit CredentialVerified(_credentialHash, msg.sender, isValid);
        
        return isValid;
    }

    /**
     * @notice Get full credential metadata (IPFS hash, schema, issuer, dates).
     * @param _credentialHash The credential hash to retrieve.
     * @return The Credential struct with all metadata.
     */
    function getCredentialMetadata(bytes32 _credentialHash) public view returns (Credential memory) {
        return credentials[_credentialHash];
    }

    /**
     * @notice Get only the IPFS hash for a credential (to retrieve the full blob).
     * @param _credentialHash The credential hash.
     * @return The IPFS CID string.
     */
    function getCredentialIPFSHash(bytes32 _credentialHash) public view returns (string memory) {
        return credentials[_credentialHash].ipfsHash;
    }
}
