import { Builder, By, until } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

import { join } from 'path';
import { promisify } from 'util';
import { readFile } from 'fs';

const readFileAsync = promisify(readFile);

const CHROME_WEBDRIVER_URL = 'http://chrome:4444/wd/hub';
// const CHROME_WEBDRIVER_URL = 'http://localhost:4444/wd/hub';
// const CHROME_WEBDRIVER_URL = 'http://hub-cloud.browserstack.com/';

function buildChromeDriver() {
  const builder = new Builder();

  return builder
    // .withCapabilities({
    //   user: '',
    //   key: ''
    // })
    .forBrowser('chrome')
    .usingServer(CHROME_WEBDRIVER_URL)
    .setChromeOptions(
      (builder.getChromeOptions() || new Options())
        .headless()
        .windowSize({ height: 4096, width: 360 })
    );
}

export default async function (activities) {
  const builder = buildChromeDriver();
  const driver = builder.build();

  try {
    const htmlBuffer = await readFileAsync(join(__dirname, '../public/index.html'));
    const base64URL = `data:text/html;base64,${ htmlBuffer.toString('base64') }`;

    await driver.get(base64URL);
    await driver.executeScript(activities => {
      window.ChatdownImaginator.renderTranscript(activities);
    }, activities);

    await driver.wait(until.elementLocated(By.css('[role="list"]'), 10000));
    await driver.sleep(2000);

    const transcriptElement = await driver.findElement(By.css('[role="list"]'));
    const base64PNG = await transcriptElement.takeScreenshot();

    return Buffer.from(base64PNG, 'base64');
  } finally {
    driver.quit();
  }
}
