#!/usr/bin/env node

import { execSync } from 'child_process';
import { platform } from 'process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const action = process.argv[2];

if (!action || !['import', 'deploy'].includes(action)) {
  console.error('Usage: node bin/fo.js [import|deploy]');
  process.exit(1);
}

const scriptPath = path.join(__dirname, 'fo.sh');

try {
  if (platform === 'win32') {
    // On Windows, try to use bash from Git Bash or WSL
    try {
      // Try Git Bash first
      execSync(`bash "${scriptPath}" ${action}`, { stdio: 'inherit' });
    } catch (error) {
      // Check if it's a "command not found" error or script execution error
      if (error.message && error.message.includes('not recognized')) {
        // If bash not found, try sh
        try {
          execSync(`sh "${scriptPath}" ${action}`, { stdio: 'inherit' });
        } catch (error2) {
          console.error('Error: Could not find bash or sh. Please install Git Bash or use WSL.');
          console.error('Alternatively, you can run the script manually:');
          console.error(`  bash bin/fo.sh ${action}`);
          process.exit(1);
        }
      } else {
        // Script executed but failed (e.g., missing .env file)
        // Exit with the same code as the script
        process.exit(error.status || 1);
      }
    }
  } else {
    // On Unix-like systems, execute directly
    execSync(`bash "${scriptPath}" ${action}`, { stdio: 'inherit' });
  }
} catch (error) {
  // Script execution failed
  process.exit(error.status || 1);
}

