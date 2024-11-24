const express = require('express');
const path = require('path');
const XLSX = require('xlsx');

const app = express();
const port = 3000;

// Serve static files (like your HTML and JS files)
app.use(express.static(path.join(__dirname, 'public')));

// Load data from Excel
const workbook = XLSX.readFile(path.join(__dirname, 'top_10_players_stats.xlsx'));

// Create an endpoint to get data for a specific season
app.get('/api/data/:season', (req, res) => {
    const season = req.params.season;
    const sheetName = `Top 10 Players Stats ${season}`;
    
    if (!workbook.SheetNames.includes(sheetName)) {
        return res.status(404).json({ error: 'Season data not found' });
    }
    
    const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    res.json(worksheet);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});