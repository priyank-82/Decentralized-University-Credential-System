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
        address issuer;         // The address of the University that issued it
        address holder;         // The address of the Student who owns it
        uint256 issueDate;      // Timestamp when the credential was issued
        CredentialState state;  // Current status (Valid, Revoked)
    }

    // Mapping from the unique credential hash to its Struct
    mapping(bytes32 => Credential) public credentials;

    // Event emitted when a new credential is issued
    event CredentialIssued(bytes32 indexed credentialHash, address indexed issuer, address indexed holder);

    // Event emitted when a credential's status is revoked
    event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer);

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
     * @notice Issues a new academic credential.
     * @dev Only a registered University can call this function.
     * @param _holder The wallet address of the Student.
     * @param _credentialHash The unique cryptographic hash of the credential data.
     */
    function issueCredential(address _holder, bytes32 _credentialHash) public onlyUniversity {
        // Check that the holder is a registered Student
        require(didRegistry.hasRole(_holder, DIDRegistry.Role.Student), "CredentialStatus: Holder is not a registered Student");
        
        // Ensure this credential hash hasn't been used
        require(credentials[_credentialHash].state == CredentialState.None, "CredentialStatus: Credential hash already exists");

        // Store the new credential
        credentials[_credentialHash] = Credential({
            credentialHash: _credentialHash,
            issuer: msg.sender,
            holder: _holder,
            issueDate: block.timestamp,
            state: CredentialState.Valid
        });

        // Emit the issuance event
        emit CredentialIssued(_credentialHash, msg.sender, _holder);
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
}
