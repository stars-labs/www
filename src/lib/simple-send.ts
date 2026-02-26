// Simple send method that works around MetaMask's internal errors
export async function simpleSend(from: string, to: string, amount: string): Promise<string | null> {
  try {
    // Convert STARS to wei (18 decimals)
    const amountInWei = BigInt(Math.floor(parseFloat(amount) * (10 ** 18)));
    const value = '0x' + amountInWei.toString(16);
    
    console.log('Simple send attempt:', { from, to, value });
    
    // Create a simple transaction without any extra parameters
    const transactionParameters = {
      to: to, // Required
      from: from, // Required
      value: value, // Required
    };

    // Use ethereum.request directly without any wrappers
    const txHash = await (window as any).ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });

    return txHash;
  } catch (error: any) {
    console.error('Simple send error:', error);
    
    // If MetaMask throws internal error, try alternative approach
    if (error.code === -32603) {
      console.log('MetaMask internal error detected, trying alternative...');
      
      // Try with explicit gas parameters
      try {
        const amountInWei = BigInt(Math.floor(parseFloat(amount) * (10 ** 18)));
        const value = '0x' + amountInWei.toString(16);
        
        const transactionWithGas = {
          to: to,
          from: from,
          value: value,
          gas: '0x5208', // 21000
          gasPrice: '0x1', // 1 wei (minimal gas price for our chain)
        };

        const txHash = await (window as any).ethereum.request({
          method: 'eth_sendTransaction',
          params: [transactionWithGas],
        });

        return txHash;
      } catch (retryError: any) {
        console.error('Retry also failed:', retryError);
        return null;
      }
    }
    
    return null;
  }
}

// Alternative: Use personal_sign to create a signed message
export async function signedSend(from: string, to: string, amount: string): Promise<string | null> {
  try {
    // Create a message to sign
    const message = JSON.stringify({
      from,
      to,
      amount,
      timestamp: Date.now(),
      action: 'transfer'
    });

    // Sign the message
    const signature = await (window as any).ethereum.request({
      method: 'personal_sign',
      params: [message, from],
    });

    // Send the signed message to our API
    const response = await fetch('https://starslab-app.freeman-xiong.workers.dev/api/wallet/signed-send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        amount,
        message,
        signature
      })
    });

    const result = await response.json();
    return result.txHash || null;
  } catch (error) {
    console.error('Signed send error:', error);
    return null;
  }
}