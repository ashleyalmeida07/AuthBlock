// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DegreeRegistry {
    address public owner;
    
    // Maps a hash (data_hash or pdf_hash of a final degree) to the timestamp it was registered.
    mapping(bytes32 => uint256) public registeredHashes;

    event HashRegistered(bytes32 indexed hash, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Register a degree hash
    function registerHash(bytes32 _hash) external onlyOwner {
        require(registeredHashes[_hash] == 0, "Hash already registered");
        registeredHashes[_hash] = block.timestamp;
        emit HashRegistered(_hash, block.timestamp);
    }

    // Verify if a degree hash exists
    function verifyHash(bytes32 _hash) external view returns (bool, uint256) {
        uint256 ts = registeredHashes[_hash];
        return (ts > 0, ts);
    }
}
