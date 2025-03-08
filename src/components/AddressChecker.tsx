
import React, { useState, useEffect } from 'react';
import { privateKeyToAddress, checkAddressBalance, isValidPrivateKey } from '@/utils/bitcoin';
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
  const [isDerivingAddress, setIsDerivingAddress] = useState<boolean>(false);
  const [isValidKey, setIsValidKey] = useState<boolean>(true);
  const { toast } = useToast();
  
  // When the private key changes, check if valid and derive the address
  useEffect(() => {
    if (!privateKey) return;
    
    const deriveAddress = async () => {
      // First check if the private key is valid
      const valid = isValidPrivateKey(privateKey);
      setIsValidKey(valid);
      
      if (valid) {
        try {
          setIsDerivingAddress(true);
          
          // Use setTimeout to make sure the UI gets updated and shows the "deriving" state
          setTimeout(() => {
            try {
              // Then derive the address
              const derivedAddress = privateKeyToAddress(privateKey);
              
              if (derivedAddress && derivedAddress.length > 25) {
                setAddress(derivedAddress);
                setBalance(0);
                setIsChecking(false);
              } else {
                console.error('Generated address is invalid:', derivedAddress);
                setAddress('');
                setIsValidKey(false);
              }
            } catch (error) {
              console.error('Error deriving address:', error);
              setAddress('');
              setIsValidKey(false);
            } finally {
              setIsDerivingAddress(false);
            }
          }, 50); // Small delay to ensure UI updates
          
        } catch (error) {
          console.error('Error initiating address derivation:', error);
          setAddress('');
          setIsValidKey(false);
          setIsDerivingAddress(false);
        }
      } else {
        // If invalid key, clear the address
        setAddress('');
        console.log('Invalid private key generated, will try a new one');
        setIsDerivingAddress(false);
      }
    };
    
    deriveAddress();
  }, [privateKey]);
  
  // Check the balance when we have a valid address
  useEffect(() => {
    const checkBalance = async () => {
      if (!address || !isRunning || isChecking || !isValidKey || isDerivingAddress) return;
      
      if (!address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/)) {
        console.error('Invalid Bitcoin address format before checking balance:', address);
        return;
      }
      
      setIsChecking(true);
      onAddAttempt();
      
      try {
        // Only check balance if we have a valid address
        const newBalance = await checkAddressBalance(address);
        
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
  }, [address, isRunning, isChecking, privateKey, isValidKey, isDerivingAddress, onAddAttempt, onSuccess, toast]);
  
  // Render a link to blockchain explorer for mainnet addresses
  const renderAddressLink = () => {
    if (!address || !address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/)) return null;
    
    return (
      <a
        href={`https://www.blockchain.com/explorer/addresses/btc/${address}`}
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
          <Badge variant={isChecking || isDerivingAddress ? "outline" : "secondary"} 
                 className={isChecking || isDerivingAddress ? "animate-pulse-subtle" : ""}>
            {isDerivingAddress ? "Deriving Address..." : 
             isChecking ? "Checking Balance..." : 
             isValidKey && address ? "Ready" : "Invalid Key/Address"}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-3">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <div className="bg-secondary/50 rounded p-3 overflow-hidden">
              {isDerivingAddress ? (
                <p className="text-muted-foreground text-sm italic animate-pulse">
                  Deriving address from private key...
                </p>
              ) : address && address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) ? (
                <p className="crypto-text select-all break-all">{address}</p>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  {isValidKey ? "No valid address yet" : "Invalid private key or address, generating new one..."}
                </p>
              )}
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
