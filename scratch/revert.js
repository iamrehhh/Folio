const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

walkDir('./src', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes("'Palatino Linotype', 'Book Antiqua', Palatino, serif")) {
            // Restore to the most common Lora format, this will work for CSS and JS
            let newContent = content.replace(/'Palatino Linotype', 'Book Antiqua', Palatino, serif/g, "Lora, Georgia, serif");
            fs.writeFileSync(filePath, newContent);
            console.log("Reverted in " + filePath);
        }
    }
});
