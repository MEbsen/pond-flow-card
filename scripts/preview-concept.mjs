import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
 const page=await browser.newPage({viewport:{width:1200,height:760},deviceScaleFactor:1.5});
 await page.setContent('<style>body{margin:0}svg{display:block}</style>'+await readFile('docs/pond-section-concept.svg','utf8'));
 await page.screenshot({path:'docs/pond-section-concept.png'});
} finally {await browser.close();}
