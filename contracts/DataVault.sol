// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DataVault {
    struct EncryptedData {
        bytes kyberCiphertext; // encapsulated AES key
        bytes aesCiphertext;   // AES-GCM: nonce||tag||ciphertext
    }

    mapping(uint256 => EncryptedData) public records;
    uint256 public recordCount;

    event DataStored(uint256 indexed recordId, address indexed owner, address indexed recipient);

    function storeData(
        address _recipient,
        bytes calldata _kyberCiphertext,
        bytes calldata _aesCiphertext
    ) external {
        recordCount++;
        records[recordCount] = EncryptedData({
            kyberCiphertext: _kyberCiphertext,
            aesCiphertext: _aesCiphertext
        });
        emit DataStored(recordCount, msg.sender, _recipient);
    }
}
