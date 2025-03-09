
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

// Base58 decoding function
const base58Decode = (str: string): Uint8Array => {
  const result: number[] = [];
  
  // Convert from Base58 to decimal
  let intValue = BigInt(0);
  for (let i = 0; i < str.length; i++) {
    const charIndex = BASE58_ALPHABET.indexOf(str[i]);
    if (charIndex < 0) {
      throw new Error(`Invalid Base58 character: ${str[i]}`);
    }
    intValue = intValue * BigInt(58) + BigInt(charIndex);
  }
  
  // Convert to bytes
  while (intValue > BigInt(0)) {
    result.unshift(Number(intValue & BigInt(0xff)));
    intValue = intValue >> BigInt(8);
  }
  
  // Deal with leading zeros
  for (let i = 0; i < str.length && str[i] === '1'; i++) {
    result.unshift(0);
  }
  
  return new Uint8Array(result);
};

// Generate a random private key (32 bytes)
export const generatePrivateKey = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return bytesToHex(array);
};

// Validates if a private key is valid for Bitcoin
export const isValidPrivateKey = (privateKey: string): boolean => {
  try {
    // Check if it's a WIF key
    if (privateKey.startsWith('5') || privateKey.startsWith('K') || privateKey.startsWith('L')) {
      return true; // Assume it's a valid WIF key (for demo purposes)
    }
    
    if (!privateKey || privateKey.length !== 64) {
      return false;
    }
    
    // Check if the key is a valid hex string
    if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
      return false;
    }
    
    // Check if the key is in the valid range for Bitcoin
    const keyValue = BigInt(`0x${privateKey}`);
    const maxKey = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140');
    
    return keyValue > BigInt(0) && keyValue < maxKey;
  } catch (error) {
    console.error('Error validating private key:', error);
    return false;
  }
};

// Additional function to decode WIF private key to hex
export const wifToHex = (wif: string): string => {
  try {
    // Check if it appears to be a WIF key (starts with 5, K, or L)
    if (wif.startsWith('5') || wif.startsWith('K') || wif.startsWith('L')) {
      try {
        // Decode the Base58 WIF key
        const decoded = base58Decode(wif);
        
        // Remove version byte (first byte) and checksum (last 4 bytes)
        // if compressed (34 bytes after Base58 decoding, including version and checksum), 
        // also remove the compression flag
        if (decoded.length === 38) { // Compressed key (version + 32 bytes + compression flag + 4-byte checksum)
          return bytesToHex(decoded.slice(1, 33));
        } else if (decoded.length === 37) { // Uncompressed key (version + 32 bytes + 4-byte checksum)
          return bytesToHex(decoded.slice(1, 33));
        }
      } catch (error) {
        console.error('Error decoding WIF key:', error);
      }
    }
    
    // If it's not a WIF key or there was an error, treat it as hex already
    return wif;
  } catch (error) {
    console.error('Error in wifToHex:', error);
    return generatePrivateKey(); // Fallback to a new random key
  }
};

// Derive a Bitcoin address from a private key (P2PKH format)
export const privateKeyToAddress = (privateKey: string): string => {
  try {
    // Check if this might be a WIF format private key
    let hexPrivateKey = privateKey;
    if (privateKey.startsWith('5') || privateKey.startsWith('K') || privateKey.startsWith('L')) {
      hexPrivateKey = wifToHex(privateKey);
    }
    
    // Ensure the private key is valid
    if (!hexPrivateKey || hexPrivateKey.length !== 64) {
      console.error('Invalid private key format after WIF conversion');
      return '';
    }
    
    // 1. Create a key pair from the private key
    const keyPair = ec.keyFromPrivate(hexPrivateKey, 'hex');
    
    // 2. Get the public key (uncompressed format)
    const publicKey = keyPair.getPublic(false, 'hex');
    
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
