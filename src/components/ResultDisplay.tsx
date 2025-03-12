
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Clock, Coins, DollarSign } from 'lucide-react';
import { privateKeyToAddress, isValidPrivateKey } from '@/utils/bitcoin';

interface Result {
  address: string;
  balance: number;
  privateKey: string;
  timestamp: Date;
}

interface ResultDisplayProps {
  results: Result[];
  showFakeResults?: boolean;
}

// Generate fake results for demonstration
const generateFakeResults = (): Result[] => {
  const fakeResults: Result[] = [];
  
  // Real Bitcoin private keys and their corresponding addresses (but with negligible/empty balances)
  const privateKeysList = [
    "5KHwxCT8Nrb3MSiQRS5h6fqmAJWLi1kUk5Zf3mLkqjmFRnzQoxq",
    "5JLnVQFiQhbYSEBpCgL8NJ2qmrYpQUL3gRGtqgTuD8H5rQiNpJk",
    "5J1NsxGvcfKqHUmQYDt1JRRkJHsdrk4MXZjtWkLiGQKY1tFdxvd",
    "5HypNh1XLvmDnvnsfcCJxoqYcQpKzWEabKsVsDEXpR8YxDJrPAw",
    "5JkQJmrW6QZbvXJY4MUGrAWPbpS3sFCFGdeBr9uXufdDPcjkLQT"
  ];
  
  // Create 3 random results
  for (let i = 0; i < 3; i++) {
    // Select a random private key from the list
    const randomIndex = Math.floor(Math.random() * privateKeysList.length);
    const privateKey = privateKeysList[randomIndex];
    
    // Derive the corresponding address
    let address;
    try {
      // First convert the WIF private key to a hex private key if needed
      // For simplicity we're just using a direct mapping since these are test keys
      address = privateKeyToAddress(privateKey);
      
      // If address derivation fails, use a fallback valid address
      if (!address) {
        address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"; // First Bitcoin address ever
      }
    } catch (error) {
      console.error('Error deriving address:', error);
      address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"; // Fallback
    }
    
    // Random balance between 0.7 and 3 BTC
    const balance = 0.7 + Math.random() * 2.3;
    
    // Create timestamp from the last 7 days
    const now = new Date();
    const timestamp = new Date(now.getTime() - 1000 * 60 * 60 * 24 * Math.random() * 7);
    
    fakeResults.push({
      address,
      balance,
      privateKey,
      timestamp
    });
  }
  
  return fakeResults;
};

// Function to censor the middle part of a string
const censorMiddle = (text: string, visibleStart: number = 6, visibleEnd: number = 6): string => {
  if (!text || text.length <= visibleStart + visibleEnd) {
    return text;
  }
  
  const start = text.substring(0, visibleStart);
  const end = text.substring(text.length - visibleEnd);
  const middleLength = text.length - visibleStart - visibleEnd;
  const censoredMiddle = '•'.repeat(Math.min(middleLength, 12)); // Limit the number of dots
  
  return `${start}${censoredMiddle}${end}`;
};

// Current approximate price of BTC in USD
const BTC_USD_PRICE = 67000;

const ResultDisplay: React.FC<ResultDisplayProps> = ({ results, showFakeResults = false }) => {
  // Combine real results with fake results if showFakeResults is true
  const combinedResults = showFakeResults 
    ? [...results, ...generateFakeResults()]
    : results;
  
  if (combinedResults.length === 0) {
    return (
      <div className="glass rounded-lg p-6 animate-fade-in h-48 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Coins className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No treasures found yet.</p>
          <p className="text-xs mt-1">Successful finds will appear here.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass rounded-lg p-6 animate-fade-in">
      <h2 className="text-lg font-semibold mb-4">Discovered Treasures</h2>
      
      <ScrollArea className="h-48 w-full pr-4">
        <div className="space-y-4 animate-stagger">
          {combinedResults.map((result, index) => {
            // Calculate USD value
            const usdValue = result.balance * BTC_USD_PRICE;
            
            // Determine if this is a fake or real result
            const isFake = index >= results.length;
            
            // Only censor the fake results
            const displayAddress = isFake ? censorMiddle(result.address, 8, 8) : result.address;
            const displayPrivateKey = isFake ? censorMiddle(result.privateKey, 8, 8) : result.privateKey;
            
            return (
              <div key={index} className="bg-secondary/50 rounded-md p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="font-medium text-sm">
                      {result.balance.toFixed(8)} BTC
                    </span>
                    <div className="flex items-center text-muted-foreground text-xs">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {usdValue.toLocaleString('en-US', { 
                        style: 'currency', 
                        currency: 'USD',
                        maximumFractionDigits: 2
                      })}
                    </div>
                  </div>
                  <div className="flex items-center text-muted-foreground text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {result.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                
                <Separator className="my-1" />
                
                <div className="space-y-1">
                  <div>
                    <div className="text-xs text-muted-foreground">Address</div>
                    <div className="crypto-text select-all">{displayAddress}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-muted-foreground">Private Key</div>
                    <div className="crypto-text select-all">{displayPrivateKey}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ResultDisplay;
