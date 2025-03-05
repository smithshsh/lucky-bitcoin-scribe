
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { generatePrivateKey } from '@/utils/bitcoin';
import { Loader2 } from 'lucide-react';

interface KeyGeneratorProps {
  onNewKey: (privateKey: string) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  attempts: number;
}

const KeyGenerator: React.FC<KeyGeneratorProps> = ({ 
  onNewKey, 
  isRunning, 
  onToggleRunning,
  attempts 
}) => {
  const [privateKey, setPrivateKey] = useState<string>('');
  const [keyAge, setKeyAge] = useState<number>(0);
  
  // Generate a new key and update state
  const generateNewKey = () => {
    const key = generatePrivateKey();
    setPrivateKey(key);
    onNewKey(key);
    setKeyAge(0);
  };
  
  // Generate a key immediately on component mount
  useEffect(() => {
    generateNewKey();
  }, []);
  
  // Set up an interval to automatically generate new keys when running
  useEffect(() => {
    let intervalId: number | undefined;
    
    if (isRunning) {
      intervalId = window.setInterval(() => {
        generateNewKey();
        setKeyAge(0);
      }, 300); // Generate a new key every 300ms
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning]);
  
  // Increment the key age counter
  useEffect(() => {
    let ageInterval: number | undefined;
    
    if (isRunning) {
      ageInterval = window.setInterval(() => {
        setKeyAge(prev => prev + 1);
      }, 100);
    }
    
    return () => {
      if (ageInterval) {
        clearInterval(ageInterval);
      }
    };
  }, [isRunning]);
  
  return (
    <div className="glass rounded-lg p-6 animate-fade-in">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Private Key Generator</h2>
          <span className="text-xs text-muted-foreground">Attempts: {attempts.toLocaleString()}</span>
        </div>
        
        <div className="bg-secondary/50 rounded p-3 overflow-hidden">
          <p className="crypto-text select-all break-all">{privateKey}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <Button 
            variant={isRunning ? "destructive" : "default"}
            onClick={onToggleRunning}
            className="transition-all duration-300"
          >
            {isRunning ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Stop
              </span>
            ) : (
              "Start Searching"
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={generateNewKey}
            disabled={isRunning}
          >
            Generate Once
          </Button>
        </div>
      </div>
    </div>
  );
};

export default KeyGenerator;
