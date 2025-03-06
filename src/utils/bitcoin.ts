
import * as CryptoJS from 'crypto-js';
import { ec as EC } from 'elliptic';

// Create an instance of the elliptic curve
const ec = new EC('secp256k1');

// Base58 encoding alphabet for Bitcoin addresses
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// Convert a hex string to a byte array
const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

// Convert a byte array to a hex string
const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
};

// SHA-256 hash
const sha256 = (data: string): string => {
  return CryptoJS.SHA256(data).toString();
};

// Double SHA-256 hash
const doubleSha256 = (data: string): string => {
  return sha256(sha256(data));
};

// RIPEMD-160 hash
const ripemd160 = (data: string): string => {
  return CryptoJS.RIPEMD160(CryptoJS.enc.Hex.parse(data)).toString();
};

// Base58 encoding for Bitcoin addresses
const base58Encode = (bytes: Uint8Array): string => {
  let result = '';
  
  // Convert bytes to a big integer
  let num = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    num = num * BigInt(256) + BigInt(bytes[i]);
  }
  
  // Convert big integer to base58 string
  while (num > BigInt(0)) {
    const remainder = Number(num % BigInt(58));
    num = num / BigInt(58);
    result = BASE58_ALPHABET[remainder] + result;
  }
  
  // Add leading '1's for leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = '1' + result;
  }
  
  return result;
};

// Generate a random private key (32 bytes)
export const generatePrivateKey = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return bytesToHex(array);
};

// Derive a Bitcoin address from a private key (P2PKH format)
export const privateKeyToAddress = (privateKey: string): string => {
  try {
    // 1. Create a key pair from the private key
    const keyPair = ec.keyFromPrivate(privateKey, 'hex');
    
    // 2. Get the public key (compressed format)
    const publicKey = keyPair.getPublic(true, 'hex');
    
    // 3. Hash the public key with SHA-256
    const publicKeyHash = sha256(publicKey);
    
    // 4. Hash the result with RIPEMD-160
    const publicKeyHashRIPEMD = ripemd160(publicKeyHash);
    
    // 5. Add version byte (0x00 for mainnet)
    const versionPrefix = '00';
    const extendedRIPEMD = versionPrefix + publicKeyHashRIPEMD;
    
    // 6. Calculate checksum (first 4 bytes of double SHA-256)
    const checksum = doubleSha256(extendedRIPEMD).substring(0, 8);
    
    // 7. Combine extended RIPEMD and checksum
    const binaryAddress = extendedRIPEMD + checksum;
    
    // 8. Convert to bytes
    const addressBytes = hexToBytes(binaryAddress);
    
    // 9. Encode with Base58
    const bitcoinAddress = base58Encode(addressBytes);
    
    return bitcoinAddress;
  } catch (error) {
    console.error('Error generating address:', error);
    return '';
  }
};

// Check Bitcoin mainnet address balance using a block explorer API
export const checkAddressBalance = async (address: string): Promise<number> => {
  try {
    // We'll use blockchain.info API for mainnet addresses
    const response = await fetch(`https://blockchain.info/balance?active=${address}`);
    
    if (!response.ok) {
      console.error('API response not OK:', await response.text());
      // Avoid rate limiting by waiting a bit before returning
      await new Promise(resolve => setTimeout(resolve, 300));
      return 0;
    }
    
    const data = await response.json();
    
    if (!data[address]) {
      return 0;
    }
    
    // Convert satoshis to BTC
    return data[address].final_balance / 100000000;
  } catch (error) {
    console.error('Error checking address balance:', error);
    return 0;
  }
};

// For the demo, we'll also have a simulation function with low probability
export const simulateAddressBalance = async (): Promise<number> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  
  // 1 in 10000 chance of finding something (for demo purposes)
  if (Math.random() < 0.0001) {
    return Math.random() * 0.1; // Return a small random amount
  }
  
  return 0;
};
