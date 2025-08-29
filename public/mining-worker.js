// Mining Web Worker - runs PoW calculations in background thread

// Simple SHA-256 implementation for browser
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Check if hash meets target
function meetsTarget(hash, target) {
  // Remove 0x prefix if present
  const hashClean = hash.startsWith('0x') ? hash.slice(2) : hash;
  const targetClean = target.startsWith('0x') ? target.slice(2) : target;
  
  // Compare as hex strings (both should be 64 chars)
  const hashBig = BigInt('0x' + hashClean);
  const targetBig = BigInt('0x' + targetClean);
  
  return hashBig <= targetBig;
}

// Mining function
async function mine(blockHeader, target, startNonce = 0) {
  let nonce = startNonce;
  let found = false;
  let bestHash = null;
  let hashCount = 0;
  const startTime = Date.now();
  
  // Report initial status
  self.postMessage({
    type: 'status',
    message: 'Mining started',
    nonce: 0,
    hashRate: 0
  });
  
  while (!found) {
    // Create hash input
    const data = blockHeader + ':' + nonce;
    const hash = await sha256(data);
    const fullHash = '0x' + hash;
    
    hashCount++;
    
    // Check if hash meets target
    if (meetsTarget(fullHash, target)) {
      found = true;
      bestHash = fullHash;
      
      // Report solution found
      self.postMessage({
        type: 'solution',
        nonce: nonce.toString(),
        hash: bestHash,
        hashCount,
        timeMs: Date.now() - startTime
      });
      
      break;
    }
    
    // Report progress every 10000 hashes
    if (hashCount % 10000 === 0) {
      const timeMs = Date.now() - startTime;
      const hashRate = Math.round((hashCount / timeMs) * 1000);
      
      self.postMessage({
        type: 'progress',
        hashCount,
        hashRate,
        currentNonce: nonce,
        timeMs
      });
    }
    
    // Check for stop signal
    if (self.stopMining) {
      self.postMessage({
        type: 'stopped',
        hashCount,
        lastNonce: nonce
      });
      break;
    }
    
    nonce++;
    
    // Prevent browser freeze - yield occasionally
    if (hashCount % 100000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}

// Handle messages from main thread
self.onmessage = async function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'start':
      self.stopMining = false;
      
      // Extract mining parameters
      const { blockTemplate, target } = data;
      
      // Create block header
      const blockHeader = [
        blockTemplate.height,
        blockTemplate.previousHash,
        blockTemplate.merkleRoot,
        blockTemplate.timestamp,
        blockTemplate.difficulty,
        blockTemplate.minerAddress
      ].join(':');
      
      // Start mining
      await mine(blockHeader, target);
      break;
      
    case 'stop':
      self.stopMining = true;
      self.postMessage({
        type: 'stopped',
        message: 'Mining stopped by user'
      });
      break;
      
    case 'ping':
      self.postMessage({
        type: 'pong',
        timestamp: Date.now()
      });
      break;
      
    default:
      self.postMessage({
        type: 'error',
        message: 'Unknown command: ' + type
      });
  }
};

// Report that worker is ready
self.postMessage({
  type: 'ready',
  message: 'Mining worker initialized'
});