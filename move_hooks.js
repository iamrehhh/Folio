const fs = require('fs');
const file = 'src/components/reader/ReaderClient.tsx';
const code = fs.readFileSync(file, 'utf8');

const hookStart = "      rendition.hooks.content.register((contents: any) => {";
// End of the rendition.on('markClicked') block
const hookEndStr = "      rendition.on('markClicked', (cfiRange: string, _data: any) => {\n        const isOurHighlight = highlightsRef.current.some(h => h.cfi_range === cfiRange);\n        if (isOurHighlight) {\n          const pos = lastIframeMouseRef.current;\n          setHighlightToolbar({ x: pos.x, y: pos.y, cfiRange });\n          setSelectionToolbar(null);\n          setWordPopover(null);\n        }\n      });";

const startIndex = code.indexOf(hookStart);
const endIndex = code.indexOf(hookEndStr, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find block", {startIndex, endIndex});
    process.exit(1);
}

const finalEndIndex = endIndex + hookEndStr.length;
const blockToMove = code.substring(startIndex, finalEndIndex);

// Remove block
let newCode = code.slice(0, startIndex) + code.slice(finalEndIndex);

// Find insert point
const insertTarget = "      await Promise.race([\n        (displayCfi";
const insertIndex = newCode.indexOf(insertTarget);

if (insertIndex === -1) {
    console.error("Could not find insert point");
    process.exit(1);
}

newCode = newCode.slice(0, insertIndex) + blockToMove + '\n\n' + newCode.slice(insertIndex);

fs.writeFileSync(file, newCode);
console.log("Moved hooks successfully!");
