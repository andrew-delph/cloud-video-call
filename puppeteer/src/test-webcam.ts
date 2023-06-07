import puppeteer from 'puppeteer-core';
function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

(async () => {
  const args = [`--use-fake-ui-for-media-stream`];

  const browser = await puppeteer.launch({
    headless: false,
    args: args,
  });

  const context = browser.defaultBrowserContext();
  const page = await browser.newPage();

  let url = `https://webcamtests.com/`;

  await page.goto(url);
  await context.overridePermissions(url, [`camera`, `microphone`]);

  await delay(5000);

  const testid = `#webcam-launcher`;
  await page.waitForSelector(testid);
  await page.click(testid);
  await delay(100000);

  await browser.close();
  console.log(`closed...`);
})();
