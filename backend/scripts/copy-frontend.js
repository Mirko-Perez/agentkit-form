#!/usr/bin/env node

/**
 * Script to copy frontend build files from frontend/out to backend/
 * Handles Windows permission issues and file locking gracefully
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../../frontend/out');
const destDir = path.join(__dirname, '..');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Source directory not found: ${src}`);
    return;
  }

  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    // Copy all files and subdirectories
    const entries = fs.readdirSync(src);
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      
      try {
        const entryStats = fs.statSync(srcPath);
        
        if (entryStats.isDirectory()) {
          copyRecursive(srcPath, destPath);
        } else {
          // Skip if file is locked or permission denied
          try {
            fs.copyFileSync(srcPath, destPath);
          } catch (err) {
            if (err.code === 'EPERM' || err.code === 'EBUSY') {
              console.warn(`Skipping locked file: ${entry}`);
              // Try again after a short delay
              setTimeout(() => {
                try {
                  fs.copyFileSync(srcPath, destPath);
                } catch (retryErr) {
                  console.warn(`Could not copy ${entry} after retry: ${retryErr.message}`);
                }
              }, 100);
            } else {
              throw err;
            }
          }
        }
      } catch (err) {
        console.warn(`Error processing ${entry}: ${err.message}`);
      }
    }
  } else {
    // Copy file
    try {
      fs.copyFileSync(src, dest);
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'EBUSY') {
        console.warn(`Skipping locked file: ${path.basename(src)}`);
      } else {
        throw err;
      }
    }
  }
}

// Main execution
try {
  console.log('Copying frontend build files...');
  console.log(`From: ${sourceDir}`);
  console.log(`To: ${destDir}`);
  
  copyRecursive(sourceDir, destDir);
  
  console.log('✅ Frontend files copied successfully!');
} catch (error) {
  console.error('❌ Error copying frontend files:', error.message);
  process.exit(1);
}
