
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Clock, Coins } from 'lucide-react';

interface Result {
  address: string;
  balance: number;
  privateKey: string;
  timestamp: Date;
}

interface ResultDisplayProps {
  results: Result[];
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ results }) => {
  if (results.length === 0) {
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
          {results.map((result, index) => (
            <div key={index} className="bg-secondary/50 rounded-md p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">
                  {result.balance.toFixed(8)} BTC
                </span>
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
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ResultDisplay;
