const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  console.log('Navigating to reader...');
  await page.goto('http://localhost:3000/read/aea44cce-a5bc-4a99-ad8d-758cb8722244', { waitUntil: 'networkidle2' });
  
  // Wait for epub.js iframe to load
  console.log('Waiting for iframe...');
  await page.waitForSelector('#epub-viewer iframe');
  
  // Get the iframe's internal dimensions
  const scrollData = await page.evaluate(() => {
    const iframe = document.querySelector('#epub-viewer iframe');
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const body = doc.body;
    const html = doc.documentElement;
    
    return {
      iframeHeight: iframe.clientHeight,
      bodyScrollHeight: body.scrollHeight,
      bodyOverflow: window.getComputedStyle(body).overflow,
      htmlOverflow: window.getComputedStyle(html).overflow,
      epubViewerHeight: document.querySelector('#epub-viewer').clientHeight,
      readingColumnHeight: document.querySelector('.flex-1.flex.justify-center').clientHeight
    };
  });
  
  console.log('Scroll Data:', scrollData);
  
  await browser.close();
})();
