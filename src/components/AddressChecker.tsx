
import React, { useState, useEffect } from 'react';
import { privateKeyToAddress, checkAddressBalance, simulateAddressBalance } from '@/utils/bitcoin';
import { saveToFile } from '@/utils/fileOperations';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Wallet } from 'lucide-react';

interface AddressCheckerProps {
  privateKey: string;
  isRunning: boolean;
  onSuccess: (address: string, balance: number, privateKey: string) => void;
  onAddAttempt: () => void;
}

const AddressChecker: React.FC<AddressCheckerProps> = ({ 
  privateKey, 
  isRunning,
  onSuccess,
  onAddAttempt
}) => {
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const { toast } = useToast();
  
  // When the private key changes, derive the address
  useEffect(() => {
    if (privateKey) {
      const derivedAddress = privateKeyToAddress(privateKey);
      setAddress(derivedAddress);
      setBalance(0);
      setIsChecking(false);
    }
  }, [privateKey]);
  
  // Check the balance when needed
  useEffect(() => {
    const checkBalance = async () => {
      if (!address || !isRunning || isChecking) return;
      
      setIsChecking(true);
      
      try {
        // Use the actual API in production, simulation for demo
        // const newBalance = await checkAddressBalance(address);
        const newBalance = await simulateAddressBalance();
        
        onAddAttempt();
        
        setBalance(newBalance);
        
        // If we found a balance, save it and notify
        if (newBalance > 0) {
          saveToFile(address, newBalance, privateKey);
          onSuccess(address, newBalance, privateKey);
          
          toast({
            title: "Treasure Found!",
            description: `Address with ${newBalance} BTC discovered and saved!`,
            variant: "default",
          });
        }
      } catch (error) {
        console.error('Error checking balance:', error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkBalance();
  }, [address, isRunning, isChecking, privateKey]);
  
  // Render a link to blockchain explorer for testnet addresses
  const renderAddressLink = () => {
    if (!address) return null;
    
    return (
      <a
        href={`https://www.blockchain.com/explorer/addresses/btc-testnet/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline text-xs flex items-center mt-1"
      >
        View on Explorer <ExternalLink className="h-3 w-3 ml-1" />
      </a>
    );
  };
  
  return (
    <div className="glass rounded-lg p-6 animate-fade-in">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Address Information</h2>
          <Badge variant={isChecking ? "outline" : "secondary"} className={isChecking ? "animate-pulse-subtle" : ""}>
            {isChecking ? "Checking..." : "Ready"}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-3">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <div className="bg-secondary/50 rounded p-3 overflow-hidden">
              <p className="crypto-text select-all break-all">{address}</p>
            </div>
            {renderAddressLink()}
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium">Balance:</p>
          <p className="text-2xl font-mono tracking-tight">
            {balance > 0 ? (
              <span className="text-primary font-semibold">{balance.toFixed(8)} BTC</span>
            ) : (
              <span className="text-muted-foreground">0.00000000 BTC</span>
            )}
          </p>
        </div>
        
        {balance > 0 && (
          <Alert className="bg-primary/10 border-primary/30 animate-slide-up">
            <AlertDescription className="text-primary text-sm">
              Success! Address with balance found and saved to file.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default AddressChecker;
