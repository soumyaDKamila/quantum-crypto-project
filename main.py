# main.py
import json
from web3 import Web3
from pqcrypto.kem import ml_kem_512
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Protocol.KDF import HKDF
from Crypto.Hash import SHA256

# 1) Connect to Hardhat node
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
assert w3.is_connected(), "Can't connect to Hardhat node"

# 2) Contract ABI and address
CONTRACT_ADDRESS = "PASTE_DEPLOYED_ADDRESS_HERE"
with open("artifacts/contracts/DataVault.sol/DataVault.json", "r") as f:
    abi = json.load(f)["abi"]
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)

# 3) accounts (Hardhat provides unlocked test accounts)
accounts = w3.eth.accounts
SENDER = accounts[0]
RECIPIENT = accounts[1]
w3.eth.default_account = SENDER  # default account to send txs

# Helper: derive 32-byte AES key from KEM shared secret
def derive_aes_key(shared_secret: bytes) -> bytes:
    salt = b"DataVault salt"
    return HKDF(shared_secret, 32, salt, SHA256, context=b"DataVault AES key")

def generate_keys():
    # returns (public_key, secret_key)
    pk, sk = ml_kem_512.generate_keypair()
    return pk, sk

def encrypt_and_upload(recipient_pk: bytes, recipient_address: str, message: str):
    # 1) KEM: encapsulate
    kem_ct, shared_secret = ml_kem_512.encrypt(recipient_pk)  # (ciphertext, shared_secret)

    # 2) Derive AES key and encrypt with AES-GCM
    aes_key = derive_aes_key(shared_secret)
    nonce = get_random_bytes(12)
    cipher = AES.new(aes_key, AES.MODE_GCM, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(message.encode("utf-8"))
    payload = nonce + tag + ciphertext  # store as nonce||tag||ciphertext

    # 3) Store on-chain
    tx_hash = contract.functions.storeData(recipient_address, kem_ct, payload).transact()
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print("Stored record. Tx:", receipt.transactionHash.hex())
    return receipt

def download_and_decrypt(recipient_sk: bytes, record_id: int) -> str:
    rec = contract.functions.records(record_id).call()
    kyber_ct = rec[0]
    payload = rec[1]

    # Decapsulate to get shared_secret
    shared_secret = ml_kem_512.decrypt(recipient_sk, kyber_ct)

    aes_key = derive_aes_key(shared_secret)
    nonce = payload[:12]
    tag = payload[12:28]
    ct = payload[28:]
    cipher = AES.new(aes_key, AES.MODE_GCM, nonce=nonce)
    plaintext = cipher.decrypt_and_verify(ct, tag)
    return plaintext.decode("utf-8")

if __name__ == "__main__":
    bob_pk, bob_sk = generate_keys()
    secret_message = "Hello Bob — this is quantum-safe!"
    print("Encrypting & uploading...")
    encrypt_and_upload(bob_pk, RECIPIENT, secret_message)

    print("Downloading & decrypting...")
    out = download_and_decrypt(bob_sk, 1)
    print("Decrypted:", out)
    assert out == secret_message
    print("Success ✅")
