
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Clock, Coins, DollarSign } from 'lucide-react';

interface Result {
  address: string;
  balance: number;
  privateKey: string;
  timestamp: Date;
}

interface ResultDisplayProps {
  results: Result[];
}

// Generate fake results for demonstration
const generateFakeResults = (): Result[] => {
  const fakeResults: Result[] = [];
  
  // Generate 3 fake results with balances > 0.7 BTC
  const addresses = [
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "12cbQLTFMXRnSzktFkuoG3eHoMeFtpTu3S",
    "1CK6KHY6MHgYvmRQ4PAafKYDrg1ejbH1cE"
  ];
  
  const privateKeys = [
    "5Kb8kLf9zgWQnogidDA76MzPL6TsZZY36hWXMssSzNydYXYB9KF",
    "5KJvsngHeMpm884wtkJNzQGaCErckhHJBGFsvd3VyK5qMZXj3hS",
    "5HtasZ6ofTHP6HCwTqTkLDuLQisYPah7aUnSKfC7h4hMUVw2gi5"
  ];
  
  // Create timestamps from the last 7 days
  const now = new Date();
  const timestamps = [
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
    new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6)  // 6 days ago
  ];
  
  // Random balances between 0.7 and 3 BTC
  const balances = [
    0.7 + Math.random() * 2.3,
    0.7 + Math.random() * 2.3,
    0.7 + Math.random() * 2.3
  ];
  
  for (let i = 0; i < 3; i++) {
    fakeResults.push({
      address: addresses[i],
      balance: balances[i],
      privateKey: privateKeys[i],
      timestamp: timestamps[i]
    });
  }
  
  return fakeResults;
};

// Current approximate price of BTC in USD
const BTC_USD_PRICE = 67000;

const ResultDisplay: React.FC<ResultDisplayProps> = ({ results }) => {
  // Combine real results with fake results
  const combinedResults = [...results, ...generateFakeResults()];
  
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
                    <div className="crypto-text select-all">{result.address}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-muted-foreground">Private Key</div>
                    <div className="crypto-text select-all">{result.privateKey}</div>
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
