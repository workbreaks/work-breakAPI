const fs = require("fs");
const path = require("path");

// Define the source and destination directories
// this file is to copy htm to dist
const srcDir = path.join(__dirname, "src");
const destDir = path.join(__dirname, "dist");

// Function to copy .html files from src to dist
function copyHtmlFiles(srcDir, destDir) {
  // Recursively walk through the source directory
  fs.readdirSync(srcDir).forEach((file) => {
    const srcFilePath = path.join(srcDir, file);
    const destFilePath = path.join(destDir, file);

    const stats = fs.statSync(srcFilePath);

    if (stats.isDirectory()) {
      // If it's a directory, recursively call the function
      const newDestDir = path.join(destDir, file);
      fs.mkdirSync(newDestDir, { recursive: true });
      copyHtmlFiles(srcFilePath, newDestDir); // Recurse into subdirectories
    } else if (file.endsWith(".html")) {
      // If it's an HTML file, copy it
      fs.copyFileSync(srcFilePath, destFilePath);
    }
  });
}

// Call the function to copy HTML files
copyHtmlFiles(srcDir, destDir);
