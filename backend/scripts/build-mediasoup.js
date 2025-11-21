#!/usr/bin/env node

/**
 * Script to build mediasoup worker binary after npm install
 * This ensures the worker binary is available on platforms where
 * the prebuilt binary download fails or isn't available
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const mediasoupPath = join(projectRoot, 'node_modules', 'mediasoup');

try {
  // Check if mediasoup is installed
  if (!existsSync(join(mediasoupPath, 'package.json'))) {
    console.warn('[mediasoup] mediasoup package not found, skipping worker build');
    process.exit(0);
  }

  // Check if worker binary already exists
  const workerPath = join(mediasoupPath, 'worker', 'out', 'Release', 'mediasoup-worker');
  if (existsSync(workerPath)) {
    console.log('[mediasoup] Worker binary already exists, skipping build');
    process.exit(0);
  }

  console.log('[mediasoup] Building worker binary...');
  
  // Try to build the worker
  // mediasoup should have built during its own postinstall, but if not, try manual build
  try {
    // Check if mediasoup has a build script
    const mediasoupPackageJsonPath = join(mediasoupPath, 'package.json');
    if (existsSync(mediasoupPackageJsonPath)) {
      const mediasoupPackageJson = JSON.parse(readFileSync(mediasoupPackageJsonPath, 'utf8'));
      
      if (mediasoupPackageJson.scripts && mediasoupPackageJson.scripts['build:worker']) {
        console.log('[mediasoup] Running mediasoup build:worker script...');
        execSync('npm run build:worker', {
          cwd: mediasoupPath,
          stdio: 'inherit',
          env: {
            ...process.env,
          },
        });
      } else {
        // Try running mediasoup's postinstall script directly
        console.log('[mediasoup] Running mediasoup postinstall script...');
        const npmScriptsPath = join(mediasoupPath, 'npm-scripts.js');
        if (existsSync(npmScriptsPath)) {
          execSync(`node ${npmScriptsPath} postinstall`, {
            cwd: mediasoupPath,
            stdio: 'inherit',
            env: process.env,
          });
        } else {
          console.warn('[mediasoup] No build script found, mediasoup should build automatically');
        }
      }
    }
    
    // Verify the binary was created
    if (existsSync(workerPath)) {
      console.log('[mediasoup] Worker binary built successfully');
    } else {
      console.warn('[mediasoup] Worker binary not found after build attempt');
      console.warn('[mediasoup] This may be due to missing build tools on the deployment platform');
    }
  } catch (buildError) {
    console.warn('[mediasoup] Worker build failed:', buildError.message);
    console.warn('[mediasoup] The server will start but voice features will be unavailable');
    // Don't exit with error - allow deployment to continue
    process.exit(0);
  }
} catch (error) {
  console.warn('[mediasoup] Error during worker build check:', error.message);
  // Don't exit with error - allow deployment to continue
  process.exit(0);
}

