#!/usr/bin/env node

// Script to add test balance to a wallet address
// Usage: node add-test-balance.js <address> <amount>

const address = process.argv[2];
const amount = process.argv[3] || '1000000000000000000000'; // Default 1000 STARS

if (!address) {
  console.error('Usage: node add-test-balance.js <address> [amount]');
  process.exit(1);
}

const API_URL = 'https://starslab-app.freeman-xiong.workers.dev/api';

async function addTestBalance() {
  try {
    // First, try to initialize the wallet through the blockchain API
    const response = await fetch(`${API_URL}/blockchain/faucet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: address.toLowerCase(),
        amount: amount
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to add balance:', error);
      process.exit(1);
    }

    const result = await response.json();
    console.log('Balance added successfully:', result);
    
  } catch (error) {
    console.error('Error:', error);
    
    // Alternative: Direct database update via init endpoint
    console.log('Trying alternative method...');
    
    try {
      const initResponse = await fetch(`${API_URL}/init/fund-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address.toLowerCase(),
          amount: amount
        })
      });
      
      if (initResponse.ok) {
        const result = await initResponse.json();
        console.log('Balance added via init endpoint:', result);
      } else {
        console.error('Init endpoint failed:', await initResponse.text());
      }
    } catch (initError) {
      console.error('Init endpoint error:', initError);
    }
  }
}

addTestBalance();