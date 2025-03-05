
// Save data to a text file
export const saveToFile = (address: string, balance: number, privateKey: string): void => {
  try {
    // Create the content to save
    const content = `Found Bitcoin Address with Balance!\n\nAddress: ${address}\nBalance: ${balance} BTC\nPrivate Key: ${privateKey}\nTimestamp: ${new Date().toISOString()}\n\n`;
    
    // Create a blob and download link
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create an anchor element and trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = `bitcoin_treasure_${address.substring(0, 8)}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error saving to file:', error);
    return false;
  }
};
