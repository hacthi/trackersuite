#!/usr/bin/env node

// Production startup script with comprehensive error handling and diagnostics
console.log('🚀 Starting production server...');
console.log('Environment:', process.env.NODE_ENV || 'undefined');
console.log('Port:', process.env.PORT || '5000');
console.log('Database URL available:', !!process.env.DATABASE_URL);

// Check if required files exist
import { existsSync } from 'fs';
import { resolve } from 'path';

const requiredPaths = [
  './dist/index.js',
  './dist/public',
  './dist/public/index.html'
];

console.log('🔍 Checking required files...');
for (const filePath of requiredPaths) {
  const exists = existsSync(filePath);
  console.log(`  ${filePath}: ${exists ? '✅' : '❌'}`);
  if (!exists) {
    console.error(`❌ Critical file missing: ${filePath}`);
    process.exit(1);
  }
}

console.log('📦 All required files found');
console.log('🎯 Starting main application...');

// Import and start the main application
try {
  await import('./dist/index.js');
} catch (error) {
  console.error('❌ Failed to start application:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}