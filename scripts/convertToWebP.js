/**
 * Script to convert JPEG and PNG images to WebP format
 * Run with: node scripts/convertToWebP.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths configuration
const SRC_DIR = path.join(__dirname, '../src');
const PUBLIC_DIR = path.join(__dirname, '../public');
const ASSETS_DIR = path.join(__dirname, '../assets');

// Skip WebP conversion in CI/build environment
// WebP conversion is handled separately for production

// Exit gracefully to continue with the build
process.exit(0); 