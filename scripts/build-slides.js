/**
 * Build all Marp slides to HTML/PDF
 * Usage: node scripts/build-slides.js [--pdf]
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const modulesDir = path.join(__dirname, "..", "modules");
const outputDir = path.join(__dirname, "..", "slides-output");
const format = process.argv.includes("--pdf") ? "pdf" : "html";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const modules = fs.readdirSync(modulesDir).filter((d) => {
  return fs.statSync(path.join(modulesDir, d)).isDirectory();
});

let built = 0;
let failed = 0;

for (const mod of modules) {
  const slidesFile = path.join(modulesDir, mod, "slides", "slides.md");
  if (!fs.existsSync(slidesFile)) {
    console.log(`  Skip: ${mod} (no slides.md)`);
    continue;
  }

  const outputFile = path.join(outputDir, `${mod}-slides.${format}`);
  try {
    const cmd = `npx @marp-team/marp-cli "${slidesFile}" --${format} -o "${outputFile}"`;
    console.log(`  Building: ${mod}...`);
    execSync(cmd, { stdio: "pipe" });
    built++;
    console.log(`  Done: ${outputFile}`);
  } catch (error) {
    failed++;
    console.error(`  Failed: ${mod} - ${error.message}`);
  }
}

console.log(`\nSlides build complete: ${built} built, ${failed} failed`);
