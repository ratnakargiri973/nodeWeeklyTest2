const puppeteer = require('puppeteer');
const XLSX = require('xlsx');

const seasons = [2024, 2023, 2022, 2021, 2020];
const baseURL = 'https://www.iplt20.com/stats/';

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const workbook = XLSX.utils.book_new();

    for (const season of seasons) {
        const page = await browser.newPage();
        
        // Navigate to the IPL stats page for the given season
        const url = `${baseURL}${season}`;
        console.log(`Navigating to: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Attempt to click on the cookie accept button, if available
        try {
            await page.waitForSelector('.cookie__accept', { visible: true, timeout: 10000 });
            await page.click('.cookie__accept');
        } catch (error) {
            console.log('Cookie accept button not found or not clickable. Skipping this step.');
        }

        // Wait for the page to load and necessary elements to appear
        await page.waitForSelector('#battingTAB');
        
        // Optional: additional wait time for dynamic content
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        await delay(5000); // Wait for 5 seconds

        // Extract player data
        const playerData = await page.evaluate(() => {
            const rows = document.querySelectorAll('#battingTAB > table > tbody > tr');
            return Array.from(rows).map(row => {
                const columns = row.querySelectorAll('td');
                return {
                    POS: columns[0]?.innerText.trim() || 'N/A',
                    Player: columns[1]?.innerText.trim() || 'N/A',
                    Runs: columns[2]?.innerText.trim() || 'N/A',
                    Sixes: columns[13]?.innerText.trim() || 'N/A',
                    Fours: columns[12]?.innerText.trim() || 'N/A',
                    Fifties: columns[11]?.innerText.trim() || 'N/A',
                    Hundreds: columns[10]?.innerText.trim() || 'N/A',
                };
            })
            .filter(player => player.POS !== 'N/A' && player.Player !== 'N/A') // Filter out N/A rows
            .slice(0, 10); // Limit to top 10 positions
        });

        console.log(`Data for season ${season}:`, playerData);

        // Convert data to Excel format
        const worksheet = XLSX.utils.json_to_sheet(playerData);
        XLSX.utils.book_append_sheet(workbook, worksheet, `Top 10 Players Stats ${season}`);

        await page.close();
    }

    // Save to file
    XLSX.writeFile(workbook, 'top_10_players_stats.xlsx');
    await browser.close();
})();