
import * as CryptoJS from 'crypto-js';

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

// Encode a byte array to base58
const base58Encode = (bytes: Uint8Array): string => {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  let num = BigInt(0);
  
  for (let i = 0; i < bytes.length; i++) {
    num = num * BigInt(256) + BigInt(bytes[i]);
  }
  
  while (num > BigInt(0)) {
    const remainder = Number(num % BigInt(58));
    num = num / BigInt(58);
    result = ALPHABET[remainder] + result;
  }
  
  // Leading zeros
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) {
      result = '1' + result;
    } else {
      break;
    }
  }
  
  return result;
};

// Simple RIPEMD160 implementation since CryptoJS doesn't support it directly
// This is a simplified version for demonstration
const ripemd160 = (msg: string): string => {
  // In a real app, we'd use a proper RIPEMD160 implementation
  // This is a placeholder that returns a SHA256 hash truncated to 20 bytes
  const sha256 = CryptoJS.SHA256(msg).toString();
  return sha256.substring(0, 40);
};

// Generate a random private key (32 bytes)
export const generatePrivateKey = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return bytesToHex(array);
};

// Derive a Bitcoin address from a private key
// This is a simplified version - in production, use a proper Bitcoin library
export const privateKeyToAddress = (privateKey: string): string => {
  // In a real app, this would involve elliptic curve operations
  // This is a simplified version that generates a deterministic but not valid Bitcoin address
  const sha256 = CryptoJS.SHA256(privateKey).toString();
  const hash160 = ripemd160(sha256);
  
  // Add version byte (0x00 for mainnet)
  const withVersion = '00' + hash160;
  
  // Calculate checksum (double SHA256, first 4 bytes)
  const firstSha = CryptoJS.SHA256(withVersion).toString();
  const secondSha = CryptoJS.SHA256(firstSha).toString();
  const checksum = secondSha.substring(0, 8);
  
  // Combine with checksum
  const binary = withVersion + checksum;
  
  // Encode in Base58
  return base58Encode(hexToBytes(binary));
};

// Simulate checking a Bitcoin address balance
// In a real app, this would call a blockchain API
export const checkAddressBalance = async (address: string): Promise<number> => {
  try {
    // For demo purposes, we'll use a public API to check the balance
    const response = await fetch(`https://blockchain.info/q/addressbalance/${address}`);
    if (!response.ok) {
      // Simulate a delay and return 0 to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
      return 0;
    }
    
    const balance = await response.text();
    return parseInt(balance) / 100000000; // Convert satoshis to BTC
  } catch (error) {
    console.error('Error checking address balance:', error);
    return 0;
  }
};

// For the demo, we'll also have a testing method that rarely returns a positive balance
export const simulateAddressBalance = async (): Promise<number> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  
  // 1 in 10000 chance of finding something (for demo purposes)
  if (Math.random() < 0.0001) {
    return Math.random() * 0.1; // Return a small random amount
  }
  
  return 0;
};
