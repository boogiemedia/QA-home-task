// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { chromium } = require("playwright");

async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

//arrays
  let errors = [];
  let allArticles = [];
  let clickMore = 0;

  // Add listeners for console errors and uncaught exceptions
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Browser Console Error: ${msg.text()}`);
    }
  });

  page.on('pageerror', exception => {
    errors.push(`Uncaught Exception: ${exception.message}`);
  });

  // Add listener for request failures
  page.on('requestfailed', request => {
    errors.push(`Request failed: ${request.url()} ${request.failure().errorText}`);
  });

  try {
    // go to Hacker News
    await page.goto("https://news.ycombinator.com/newest", { waitUntil: 'networkidle' });
    console.log("Navigated to Hacker News");
  } catch (error) {
    errors.push(`Error during initial navigation: ${error.message}`);
    await browser.close();
    return { articles: [], isByOrder: false, totalFound: 0, errors };
  }



  // limit clicks by amount of articles
  while (allArticles.length < 100) {

    try {
      const newArticles = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.athing')).map(article => {
          const meta = article.nextElementSibling;
          const time = meta.querySelector('.age');
          return {
            time: new Date(time.getAttribute('title')).getTime(),
          }
        });
      });

      allArticles = allArticles.concat(newArticles);

      if (allArticles.length >= 100) {
        console.log("Reached at least 100 articles. Stopping.");
        break;
      }

      const moreButton = page.locator('.morelink');
      if (await moreButton.count() === 0) {
        break;
      }

      await moreButton.click();
      await page.waitForLoadState('networkidle');
      clickMore++;
    } catch (error) {
      errors.push(`Error on click ${clickMore}: ${error.message}`);
      break;
    }
  }

  const articles = allArticles.slice(0, 100);
  const isByOrder = articles.every((article, index, array) =>
      index === 0 || article.time <= array[index - 1].time
  );

  await browser.close();
  return { articles, isByOrder, totalFound: allArticles.length, errors, clicks: clickMore};
}

(async () => {
  try {
    const { articles, isByOrder, totalFound, errors, clicks } = await sortHackerNewsArticles();
    console.log(`Articles are arranged from newest to oldest: ${isByOrder}`);
    console.log('Total clicks:', `${clicks}`)
    console.log(`Total articles found: ${totalFound}`);
    console.log(`Total articles checked: ${articles.length}`);

    if (errors.length > 0) {
      console.log("\nErrors encountered during execution:");
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log("\nNo errors encountered during execution.");
    }
  } catch (error) {
    console.error('An unexpected error occurred:', error);
  }
})();