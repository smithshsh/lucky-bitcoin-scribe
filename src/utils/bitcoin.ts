
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

// Base58 decoding
const base58Decode = (str: string): Uint8Array => {
  let result = BigInt(0);
  let j = BigInt(1);
  
  // Convert from base58 string to integer
  for (let i = str.length - 1; i >= 0; i--) {
    const index = BASE58_ALPHABET.indexOf(str[i]);
    if (index === -1) throw new Error('Invalid Base58 character');
    result += BigInt(index) * j;
    j *= BigInt(58);
  }
  
  // Count leading '1's in the Base58 string (they represent leading zero bytes)
  let leadingZeros = 0;
  for (let i = 0; i < str.length && str[i] === '1'; i++) {
    leadingZeros++;
  }
  
  // Convert to byte array
  const resultHex = result.toString(16).padStart((str.length - leadingZeros) * 2, '0');
  const bytes = hexToBytes(resultHex);
  
  // Add leading zeros
  const finalBytes = new Uint8Array(leadingZeros + bytes.length);
  finalBytes.set(bytes, leadingZeros);
  
  return finalBytes;
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

// Decode WIF to hex private key
const wifToHex = (wif: string): string => {
  try {
    if (!wif || !isValidPrivateKey(wif)) {
      console.error('Invalid WIF format for decoding');
      return '';
    }
    
    // Decode the base58 string to bytes
    const decoded = base58Decode(wif);
    
    // Convert decoded bytes to hex string
    const decodedHex = bytesToHex(decoded);
    
    // Get the actual private key (without version byte and checksum)
    // For uncompressed keys: Remove first byte (version) and last 4 bytes (checksum)
    // For compressed keys: Remove first byte (version), last byte (compression flag), and last 4 bytes (checksum)
    let privateKeyHex;
    
    // Check if key is compressed (length would be 38 bytes including version, compression flag, and checksum)
    const isCompressed = decodedHex.length === 76; // 38 bytes * 2 = 76 hex chars
    
    if (isCompressed) {
      // Remove first byte (version) and last 5 bytes (compression flag + checksum)
      privateKeyHex = decodedHex.substring(2, 66);
    } else {
      // Remove first byte (version) and last 4 bytes (checksum)
      privateKeyHex = decodedHex.substring(2, 66);
    }
    
    // Validate result length (should be 32 bytes = 64 hex chars)
    if (privateKeyHex.length !== 64) {
      console.error('Extracted private key has invalid length:', privateKeyHex.length);
      return '';
    }
    
    return privateKeyHex;
  } catch (error) {
    console.error('Error decoding WIF to hex:', error);
    return '';
  }
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
    
    // Decode the WIF key to check the checksum
    try {
      const decoded = base58Decode(wif);
      const decodedHex = bytesToHex(decoded);
      
      // Extract the checksum from the decoded data
      const extractedChecksum = decodedHex.slice(-8);
      
      // Calculate the checksum of the data without the checksum itself
      const dataWithoutChecksum = decodedHex.slice(0, -8);
      const calculatedChecksum = doubleSha256(dataWithoutChecksum).substring(0, 8);
      
      // Compare the extracted checksum with the calculated one
      return extractedChecksum === calculatedChecksum;
    } catch (e) {
      console.error('Error validating checksum:', e);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating private key:', error);
    return false;
  }
};

// Derive a Bitcoin address from a private key (P2PKH format)
export const privateKeyToAddress = (wifPrivateKey: string): string => {
  try {
    // Ensure the private key is valid first
    if (!isValidPrivateKey(wifPrivateKey)) {
      console.error('Invalid private key format');
      return '';
    }
    
    // Get the private key in hex format
    const privateKeyHex = wifToHex(wifPrivateKey);
    if (!privateKeyHex) {
      console.error('Failed to convert WIF to hex');
      return '';
    }
    
    console.log('Decoded private key hex:', privateKeyHex);
    
    // Create key pair from the hex private key
    const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');
    
    // Get the public key (uncompressed format for Legacy addresses)
    const publicKey = keyPair.getPublic(false, 'hex');
    console.log('Derived public key:', publicKey);
    
    // Hash the public key with SHA-256
    const publicKeyHash = sha256(publicKey);
    
    // Hash the result with RIPEMD-160
    const publicKeyHashRIPEMD = ripemd160(publicKeyHash);
    
    // Add version byte (0x00 for mainnet P2PKH)
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
    
    console.log('Generated Bitcoin address:', bitcoinAddress);
    
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
