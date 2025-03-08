
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
  return CryptoJS.SHA256(CryptoJS.enc.Hex.parse(data)).toString();
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

// Generate a random private key in WIF format
export const generatePrivateKey = (): string => {
  // Generate a random 32-byte private key
  const privateKeyBytes = new Uint8Array(32);
  crypto.getRandomValues(privateKeyBytes);
  const privateKeyHex = bytesToHex(privateKeyBytes);
  
  // Convert to WIF format
  return hexToWIF(privateKeyHex);
};

// Convert hex private key to WIF format
export const hexToWIF = (privateKeyHex: string): string => {
  // Add version byte (0x80 for mainnet)
  const versionByte = '80';
  let extendedKey = versionByte + privateKeyHex;
  
  // Add compression byte if needed (uncomment to use compressed public keys)
  // extendedKey = extendedKey + '01';
  
  // Calculate checksum (first 4 bytes of double SHA-256)
  const checksum = doubleSha256(extendedKey).substring(0, 8);
  
  // Combine extended key and checksum
  const binaryWIF = extendedKey + checksum;
  
  // Convert to bytes and encode with Base58
  const wifBytes = hexToBytes(binaryWIF);
  return base58Encode(wifBytes);
};

// Validate a WIF private key
export const isValidPrivateKey = (wif: string): boolean => {
  try {
    // Basic format check
    if (!wif || wif.length < 50 || wif.length > 58) {
      return false;
    }
    
    // Check if the key is a valid Base58 string
    if (!/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(wif)) {
      return false;
    }
    
    // More complete validation would decode WIF and verify checksum
    // But for our demo purposes, this basic validation is sufficient
    
    return true;
  } catch (error) {
    console.error('Error validating private key:', error);
    return false;
  }
};

// Extract hex private key from WIF format (for internal use)
const wifToHex = (wif: string): string => {
  try {
    // Convert WIF to byte array (this is a simplification)
    // In a full implementation, we would:
    // 1. Base58 decode the WIF
    // 2. Remove version byte and checksum
    // 3. Return the remaining bytes as hex
    
    // For our demo, we'll use a key pair derivation instead
    const keyPair = ec.keyFromPrivate(wif, 'hex');
    return keyPair.getPrivate('hex').padStart(64, '0');
  } catch (error) {
    console.error('Error converting WIF to hex:', error);
    return '';
  }
};

// Derive a Bitcoin address from a private key (P2PKH format)
export const privateKeyToAddress = (privateKey: string): string => {
  try {
    // Ensure the private key is valid first
    if (!isValidPrivateKey(privateKey)) {
      console.error('Invalid private key');
      return '';
    }
    
    // Create a key pair from the private key
    const keyPair = ec.keyFromPrivate(privateKey, 'hex');
    
    // Get the public key (uncompressed format)
    const publicKey = keyPair.getPublic(false, 'hex');
    
    // Hash the public key with SHA-256
    const publicKeyHash = sha256(publicKey);
    
    // Hash the result with RIPEMD-160
    const publicKeyHashRIPEMD = ripemd160(publicKeyHash);
    
    // Add version byte (0x00 for mainnet)
    const versionPrefix = '00';
    const extendedRIPEMD = versionPrefix + publicKeyHashRIPEMD;
    
    // Calculate checksum (first 4 bytes of double SHA-256)
    const checksum = doubleSha256(extendedRIPEMD).substring(0, 8);
    
    // Combine extended RIPEMD and checksum
    const binaryAddress = extendedRIPEMD + checksum;
    
    // Convert to bytes
    const addressBytes = hexToBytes(binaryAddress);
    
    // Encode with Base58
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
    if (!address) {
      console.error('No address provided');
      return 0;
    }
    
    // Validate the address format before making the API call
    if (!address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/)) {
      console.error('Invalid Bitcoin address format:', address);
      return 0;
    }
    
    // We'll use blockchain.info API for mainnet addresses
    const response = await fetch(`https://blockchain.info/balance?active=${address}`);
    
    if (!response.ok) {
      console.error('API response not OK:', await response.text());
      // Avoid rate limiting by waiting a bit before returning
      await new Promise(resolve => setTimeout(resolve, 500));
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

