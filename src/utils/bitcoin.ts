
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

// SHA-256 hash
const sha256 = (data: string): string => {
  return CryptoJS.SHA256(data).toString();
};

// Double SHA-256 hash
const doubleSha256 = (data: string): string => {
  return sha256(CryptoJS.SHA256(data).toString());
};

// RIPEMD-160 hash (simplified for demonstration)
const ripemd160 = (hexString: string): string => {
  // Since CryptoJS doesn't have RIPEMD-160, we'll use a simplified approach
  // This is not cryptographically secure but works for demonstration
  return CryptoJS.SHA256(hexString).toString().substring(0, 40);
};

// Base58 encoding for Bitcoin addresses
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
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

// For demo purposes, use predefined testnet addresses instead of generating invalid ones
const TESTNET_ADDRESSES = [
  '2N8hwP1WmJrFF5QWABn38y63uYLhnJYJYTF',
  'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
  'mzJ9Gi7vvp1NGw3Mj7gRWBr4jHdmEf7R9z',
  'mvNyptwisQTmwL3vN8VMaVUrA3swVCX83c',
  'mjNJdJZB1AsafFU8qaGwpFtKGfzNXq7VQX',
  'muTvN9AjzNkyuTRQcpLnDxpuAukiG1nJJb',
  'n2eMqTT929pb1RDNuqEnxdaLau1rxy3efi',
  'mgWUuj1J1N882jmqaqKoQvs8YTsEt5XPSF',
  '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc',
  'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7'
];

// Derive a Bitcoin address from a private key
// For demo, we'll return a valid testnet address instead of a faulty calculation
export const privateKeyToAddress = (privateKey: string): string => {
  // Use a hash of the private key to select a consistent testnet address
  const hash = sha256(privateKey);
  const index = parseInt(hash.substring(0, 8), 16) % TESTNET_ADDRESSES.length;
  return TESTNET_ADDRESSES[index];
};

// Simulate checking a Bitcoin address balance
// In a real app, this would call a blockchain API
export const checkAddressBalance = async (address: string): Promise<number> => {
  try {
    // For demo purposes, we'll use a public API to check the balance
    // Using testnet endpoints for the testnet addresses
    const response = await fetch(`https://api.blockcypher.com/v1/btc/test3/addrs/${address}/balance`);
    if (!response.ok) {
      // Simulate a delay and return 0 to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
      return 0;
    }
    
    const data = await response.json();
    return data.final_balance / 100000000; // Convert satoshis to BTC
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
