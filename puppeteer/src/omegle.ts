import axios from "axios";
import puppeteer, { Browser } from "puppeteer";
function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const test_id = Math.random().toString(36).substring(2, 15);

(async () => {
  const useFakeWebcam = true;
  const useProxy = true;
  let useAuth = true;
  const headless = false;

  let url = "https://www.omegle.com/";

  //data center
  let proxy = "";
  let proxyUser = "";
  let proxyPassword = "";

  // residential;
  proxy = "http://localhost:8080";
  useAuth = false;

  const args = ["--use-fake-ui-for-media-stream"];
  if (useFakeWebcam) {
    args.push(
      ...[
        `--use-fake-device-for-media-stream`,
        `--no-sandbox`,
        "-use-file-for-fake-video-capture=./input.mjpeg",
      ]
    );
  }

  if (useProxy) {
    console.log("USING PROXY");
    args.push(`--proxy-server=${proxy}`);

    args.push("--proxy-bypass-list=*.*.*.*;*google*;*stun1*;*start*;*events*"); //*icecandidate*;
  }

  const ipResponse = await axios.get("http://ip-api.com/json");
  let myIP = "199.36.223.2091";
  myIP = ipResponse.data.query;

  const proxyConfig = {
    host: "localhost",
    port: 8080,
  };

  let proxyIp: string;

  try {
    proxyIp = (
      await axios.get("http://ip-api.com/json", {
        proxy: proxyConfig,
      })
    ).data.query;
  } catch {
    proxyIp = myIP;
  }

  console.log("myIP is", myIP);
  console.log("proxyIp is", proxyIp);

  let browser: Browser;
  if (process.env.DOCKER) {
    console.log("creating docker browser: " + process.env.DOCKER);
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-gpu", ...args],
    });
  } else {
    browser = await puppeteer.launch({
      ignoreHTTPSErrors: true,
      headless: headless,
      args: args,
      defaultViewport: null,
      devtools: false,
    });
  }

  const [page] = await browser.pages();

  await page.setRequestInterception(true);

  page.on("request", (request) => {
    // Block All Images
    if (request.url().includes("upload")) {
      request.abort();
    } else if (request.url().includes("icecandidate")) {
      request.abort();
      return;
    } else {
      request.continue();
    }
  });

  if (useProxy && useAuth) {
    page.authenticate({ username: proxyUser, password: proxyPassword });
  }

  await page.setJavaScriptEnabled(true);

  page.on("framenavigated", async (frame) => {
    const url = frame.url(); // the new url

    console.log("changed url", url);
    if (url.includes("ban")) {
      console.error("BANNED");
      process.exit();
      await browser.close();
    }

    // do something here...
  });

  await page.goto(url);
  let count = 0;

  await page.exposeFunction("onCustomEvent", async (event: any) => {
    console.log(`Event: ${event}`);
    if (event.includes("loadedmetadata")) {
      const screenshot_id = Math.random();
      console.log("screenshot");
      await page.screenshot({
        path: `screenshots/screenshot-${new Date()}-${test_id}}.png`,
      });
      count = count + 1;
    }
  });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions(url, ["camera", "microphone"]);

  await delay(2000);

  // Wait and click on first result
  const searchResultSelector = "#chattypevideocell";
  await page.waitForSelector(searchResultSelector);
  await page.click(searchResultSelector);

  await delay(2000);

  // Select all checkboxes
  const checkboxes = await page.$$('input[type="checkbox"]');

  console.log("checkboxes.length", checkboxes.length);

  // Click on each checkbox
  for (const checkbox of checkboxes) {
    console.log("checkbox", checkbox);
    try {
      await checkbox.click();
    } catch (e) {
      console.error(e);
    }
  }

  await delay(1000);

  await page.click('input[value="Confirm & continue"]');

  await page.waitForSelector("#othervideo");

  await page.evaluate(() => {
    // Override the RTCPeerConnection class in the window object
    window.RTCPeerConnection = class extends RTCPeerConnection {
      constructor(configuration: RTCConfiguration | undefined) {
        console.log("Create");
        super(configuration);

        // Add event listener for connection state change
        this.addEventListener("connectionstatechange", () => {
          console.log("Connection State:", this.connectionState);
          const myWindow: any = window;
          myWindow.onCustomEvent(this.connectionState);
        });
      }
    };

    const video: any = document.getElementById("othervideo");
    let previousSource = video.src;

    video.addEventListener("loadedmetadata", () => {
      const myWindow: any = window;
      myWindow.onCustomEvent("loadedmetadata");

      if (video.src !== previousSource) {
        console.log("Video source has changed.");
        myWindow.onCustomEvent("Video source has changed.");
        // Perform additional actions as needed
      }
    });
    const myWindow: any = window;
    myWindow.onCustomEvent("evalulate");
  });

  delay(1000 * 60 * 5).then(() => {
    process.exit();
  });

  while (true) {
    await page.screenshot({ path: `screenshots/screenshot.png` });

    await delay(1000 * 5 + 1000 * 20 * Math.random());
  }

  // await delay(1000 * 60 * 5);

  // await browser.close();
  // console.log("closed...");
})();
