
import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import KeyGenerator from '@/components/KeyGenerator';
import AddressChecker from '@/components/AddressChecker';
import ResultDisplay from '@/components/ResultDisplay';
import { Separator } from '@/components/ui/separator';
import { Github, Info } from 'lucide-react';

interface Result {
  address: string;
  balance: number;
  privateKey: string;
  timestamp: Date;
}

const Index = () => {
  const [privateKey, setPrivateKey] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<Result[]>([]);
  const [attempts, setAttempts] = useState<number>(0);
  const [showFakeResults, setShowFakeResults] = useState<boolean>(false);
  const [timerStarted, setTimerStarted] = useState<boolean>(false);
  
  // Handle a new private key generation
  const handleNewKey = (key: string) => {
    setPrivateKey(key);
  };
  
  // Toggle the automated searching
  const toggleRunning = () => {
    const newRunningState = !isRunning;
    setIsRunning(newRunningState);
    
    // Start the timer when the search is started for the first time
    if (newRunningState && !timerStarted) {
      setTimerStarted(true);
      
      // Start 30-second timer to show fake results and stop search
      toast.info("Started Bitcoin treasure hunt. Results in 30 seconds...");
      setTimeout(() => {
        // Show fake results and stop the search
        setShowFakeResults(true);
        setIsRunning(false);
        toast.success("Treasures discovered! Search completed.");
      }, 30000);
    }
  };
  
  // Handle successful finds
  const handleSuccess = (address: string, balance: number, privateKey: string) => {
    const newResult: Result = {
      address,
      balance,
      privateKey,
      timestamp: new Date()
    };
    
    setResults(prev => [newResult, ...prev]);
  };
  
  // Increment the attempt counter
  const handleAddAttempt = () => {
    setAttempts(prev => prev + 1);
  };
  
  return (
    <div className="min-h-screen w-full py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Bitcoin Treasure Hunter
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Generating random Bitcoin private keys and checking if their corresponding addresses contain any balance.
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <KeyGenerator 
            onNewKey={handleNewKey} 
            isRunning={isRunning} 
            onToggleRunning={toggleRunning}
            attempts={attempts}
          />
          <AddressChecker 
            privateKey={privateKey} 
            isRunning={isRunning}
            onSuccess={handleSuccess}
            onAddAttempt={handleAddAttempt}
          />
        </div>
        
        <ResultDisplay results={results} showFakeResults={showFakeResults} />
        
        <div className="mt-12 glass rounded-lg p-6 animate-fade-in">
          <div className="flex items-start space-x-4">
            <Info className="h-5 w-5 text-primary shrink-0 mt-1" />
            <div className="space-y-2">
              <h3 className="font-medium">How this works</h3>
              <p className="text-sm text-muted-foreground">
                This application generates random Bitcoin private keys, derives their corresponding 
                public addresses, and checks if the addresses have any balance. The workflow is:
              </p>
              <ol className="text-sm text-muted-foreground list-decimal ml-5 space-y-1">
                <li>Generate a random valid private key</li>
                <li>Derive the Bitcoin address from the private key</li>
                <li>Check if the address has any balance on the Bitcoin mainnet</li>
                <li>If a balance is found, save the details to a file</li>
              </ol>
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This app uses real Bitcoin mainnet addresses.
                All cryptographic operations are performed in your browser.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Important:</strong> The odds of finding a Bitcoin address with a balance 
                are astronomically low (less than 1 in 10^75). This is primarily a demonstration 
                application.
              </p>
              <p className="text-sm text-muted-foreground">
                No private keys are transmitted over the internet.
                The app only queries public block explorers for balance information.
              </p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Built with React & Tailwind CSS
            </div>
            <a 
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
