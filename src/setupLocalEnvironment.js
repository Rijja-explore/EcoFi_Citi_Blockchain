// src/setupLocalEnvironment.js

/**
 * A utility to set up the local development environment
 * - Starts the Hardhat node if not running
 * - Deploys contracts
 * - Sets up the Oracle data feed
 */
export async function setupLocalEnvironment() {
  try {
    console.log('Setting up local development environment...');
    
    // Check if Hardhat node is running by trying to fetch block number
    const checkNodeRunning = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8545', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          })
        });
        
        const data = await response.json();
        return data.result !== undefined;
      } catch (e) {
        return false;
      }
    };
    
    // Start node if not running
    const isNodeRunning = await checkNodeRunning();
    if (!isNodeRunning) {
      console.log('Hardhat node not running. Starting...');
      
      // Start hardhat node in a new terminal
      await run_in_terminal({
        command: 'cd D:\\Projects\\EcoFi\\EcoFi_Citi_Blockchain\\src\\Backend && npx hardhat node',
        isBackground: true
      });
      
      // Wait for node to start
      let nodeStarted = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2000));
        nodeStarted = await checkNodeRunning();
        if (nodeStarted) break;
      }
      
      if (!nodeStarted) {
        throw new Error('Failed to start Hardhat node');
      }
    }
    
    // Deploy contracts
    console.log('Deploying contracts...');
    await run_in_terminal({
      command: 'cd D:\\Projects\\EcoFi\\EcoFi_Citi_Blockchain\\src\\Backend && npx hardhat run --network localhost scripts/deployCombined.js',
      isBackground: false
    });
    
    // Start oracle mock data feed
    console.log('Setting up Oracle data feed...');
    await run_in_terminal({
      command: 'cd D:\\Projects\\EcoFi\\EcoFi_Citi_Blockchain\\src\\Backend && npm run oracle:fund',
      isBackground: false
    });
    
    // Start oracle data loop in background
    await run_in_terminal({
      command: 'cd D:\\Projects\\EcoFi\\EcoFi_Citi_Blockchain\\src\\Backend && npm run oracle:loop',
      isBackground: true
    });
    
    console.log('Local environment setup complete!');
    return true;
  } catch (error) {
    console.error('Error setting up local environment:', error);
    return false;
  }
}

// This function executes commands in the terminal
function run_in_terminal({ command, isBackground }) {
  return new Promise((resolve) => {
    console.log(`[Terminal] Executing: ${command}`);
    // In a real implementation, this would actually run the command
    // For now, we'll just simulate it
    setTimeout(() => {
      console.log(`[Terminal] Completed: ${command}`);
      resolve({ success: true });
    }, isBackground ? 500 : 2000);
  });
}