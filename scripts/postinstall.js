/**
 * Postinstall script to apply FHEVM plugin patch
 *
 * The @fhevm/hardhat-plugin@0.4.0 has a bug where tasks get double-registered
 * when ts-node loads both the CJS and TS sources. This script:
 * 1. Adds a global guard to prevent double registration
 * 2. Removes the src/ directory to prevent ts-node conflicts
 */

const fs = require("fs");
const path = require("path");

const pluginBase = path.join(__dirname, "..", "node_modules", "@fhevm", "hardhat-plugin");
const tasksFile = path.join(pluginBase, "_cjs", "tasks", "fhevm.js");
const srcDir = path.join(pluginBase, "src");

// Patch 1: Add double-registration guard to fhevm.js
if (fs.existsSync(tasksFile)) {
  let content = fs.readFileSync(tasksFile, "utf-8");
  const guard = '// Guard against double registration\nif (global.__fhevm_tasks_registered) { return; }\nglobal.__fhevm_tasks_registered = true;';

  if (!content.includes("__fhevm_tasks_registered")) {
    // Insert guard after "use strict" and Object.defineProperty lines
    content = content.replace(
      'Object.defineProperty(exports, "__esModule", { value: true });',
      'Object.defineProperty(exports, "__esModule", { value: true });\n' + guard
    );
    fs.writeFileSync(tasksFile, content);
    console.log("[postinstall] Patched fhevm.js with double-registration guard");
  } else {
    console.log("[postinstall] fhevm.js already patched");
  }
}

// Patch 2: Remove src/ directory to prevent ts-node from loading TS sources
if (fs.existsSync(srcDir)) {
  fs.rmSync(srcDir, { recursive: true, force: true });
  console.log("[postinstall] Removed @fhevm/hardhat-plugin/src/ directory");
} else {
  console.log("[postinstall] src/ directory already removed");
}

console.log("[postinstall] FHEVM plugin patches applied successfully");
