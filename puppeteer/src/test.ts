import axios from "axios";
import puppeteer from "puppeteer";
function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

(async () => {
  const useProxy = true;
  let useAuth = true;

  let url = "https://www.omegle.com/";
  // url = "https://ome.tv/";
  // url = "https://whatismyipaddress.com/proxy-check";
  //   url = "https://browserleaks.com/webrtc";
  // url = "http://lumtest.com/myip.json";
  // url = "https://whatismyipaddress.com/";
  // url= "http://ip-api.com/json"
  // url = "https://browserleaks.com/javascript";
  // url = "https://andrewdelph.com";
  // url = "http://2ip.io";
  // url = "http://192.168.49.2:30000/dashboards";
  // url = "http://ip-api.com/json";
  // url = "https://www.speed-test.dev/";

  //data center
  let proxy = "http://zproxy.lum-superproxy.io:22225";
  let proxyUser = "brd-customer-hl_62e4bd26-zone-data_center";
  let proxyPassword = "fo1f8t060olw";

  //residential
  proxy = "http://zproxy.lum-superproxy.io:22225";
  proxyUser = "brd-customer-hl_62e4bd26-zone-residential";
  proxyPassword = "ecxzzz32zjkm";

  //geonode
  // proxy = "http://premium-residential.geonode.com:9000";
  // proxyUser = "geonode_VWwZZd56Jj";
  // proxyPassword = "e970fd30-c81a-49b6-88a0-c7578f10ea75";

  // proxy = "http://resi.proxyscrape.com:8000";
  // proxyUser = "u7gb5a3u2j";
  // proxyPassword = "wpc1xhrepe"; //+ "-country-CA";
  // useAuth = true;

  // residential;
  proxy = "http://localhost:8080";
  useAuth = false;

  const hola_path =
    "/home/andrew/.config/google-chrome/Default/Extensions/gkojfkhlekighikafcpjkiklfbnlmeio/1.211.139_0";

  const args = [
    "--use-fake-ui-for-media-stream",
    // `--disable-extensions-except=${hola_path}`,
    // `--load-extension=${hola_path}`,
  ]; //, "--start-maximized"

  if (useProxy) {
    console.log("USING PROXY");
    args.push(`--proxy-server=${proxy}`);
    // args.push(
    //   "--proxy-bypass-list=localhost;192.168.*.*;127.0.0.1;::1;*.local;192.168.1.0/24;stun:stun1.l.google.com:19302;stun:stun2.l.google.com:19302;108.177.102.127;142.250.15.127;*google*;"
    // );

    args.push(
      "--proxy-bypass-list=*.*.*.*;*google*;*stun1*;*start*;*events*" //*front*;*icecandidate*;*start*;*peer*;*upload*;*events*;*check*;"
    ); //*icecandidate*;
    // args.push(
    //   "--proxy-bypass-list=stun:stun1.l.google.com:19302;stun:stun2.l.google.com:19302;108.177.102.127;142.250.15.127;*google*;"
    // );
  }

  //await fetch('https://jsonplaceholder.typicode.com/todos/1')
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

  let browser;
  if (process.env.DOCKER) {
    console.log("creating docker browser: " + process.env.DOCKER);
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-gpu", ...args],
    });
  } else {
    browser = await puppeteer.launch({
      ignoreHTTPSErrors: true,
      headless: false,
      args: args,
      defaultViewport: null,
      devtools: false,
    });
  }

  const [page] = await browser.pages();
  // const extraPage = await browser.newPage();
  // extraPage.goto("chrome://webrtc-internals/");

  await page.setRequestInterception(true);

  page.on("request", (request) => {
    // Block All Images
    if (request.url().includes("upload")) {
      request.abort();
    } else if (request.url().includes("icecandidate")) {
      request.abort();
      return;
      const originalPostData = request.postData();
      const decodedString = decodeURIComponent(originalPostData!);

      const params = new URLSearchParams(decodedString);

      let candidateList = params.getAll("candidate");

      const modifyCandidate = (candidate: string) => {
        const candidateParam = JSON.parse(candidate);

        const candidateValue = candidateParam["candidate"];
        const candidateSplit = candidateValue.split(" ");
        const oldIp = candidateSplit[4];

        if (oldIp != myIP) return candidate!;
        console.log("candidate", candidateSplit[2], candidateSplit[4]);
        return candidate!;

        return candidate!.replace(oldIp, proxyIp);

        if (Math.random() > 0.5) {
          return candidate!.replace(oldIp, myIP);
        } else {
          return candidate!.replace(oldIp, proxyIp);
        }

        // if (candidateSplit[2] != "udp" || candidateSplit[4].includes("local")) {
        //   request.abort();
        //   return;
        // }

        console.log("candidate", candidateSplit[2], candidateSplit[4]);
        // console.log("candidate", candidateSplit.join(" "));

        // candidateSplit[4] = changeIp;

        const updatedCandidate = candidateSplit.join(" ");

        candidateParam["candidate"] = updatedCandidate;
        return encodeURIComponent(JSON.stringify(candidateParam));
      };

      // request.abort();
      // request.continue();
      // return;

      const id = Math.random().toString(36).substring(2, 15);

      console.log("start", id);
      params.delete("candidate");
      for (const candidate of candidateList.map((candidate) => {
        return modifyCandidate(candidate);
      })) {
        params.append("candidate", candidate);
      }
      console.log("end", id);

      // console.log();
      // console.log("1", request.postData());
      // console.log("2", params.toString());
      // console.log();
      // request.abort();
      request.continue({ postData: params.toString() });
    } else {
      request.continue();
    }
  });

  //
  // const ipPage = await browser.newPage();
  // // ipPage.goto("https://browserleaks.com/webrtc");
  // ipPage.goto("https://andrewdelph.com");

  // await page.setDefaultNavigationTimeout(120000);

  if (useProxy && useAuth) {
    page.authenticate({ username: proxyUser, password: proxyPassword });
  }

  await page.setJavaScriptEnabled(true);
  await page.goto(url);

  await page.exposeFunction("onCustomEvent", (event: any) => {
    console.log(`Event: ${event}`);
  });

  // Evaluate the following function in the target page
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
  });

  page.on("framenavigated", (frame) => {
    const url = frame.url(); // the new url

    console.log("changed url", url);

    // do something here...
  });

  // await delay(1000 * 60 * 30);

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

  let count = 0;

  while (true) {
    await delay(1000 * 5);
    // console.log("taking screen shot");
    // await page.screenshot({ path: `screenshots/screenshot.png` });
    // await page.screenshot({ path: `screenshots/screenshot-${count}.png` });
    count = count + 1;
  }

  await delay(1000 * 60 * 5);

  await browser.close();
  console.log("closed...");
})();
