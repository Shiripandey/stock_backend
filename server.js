const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ["POST", "GET"],
  credentials: true
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

const polygonApiKey = 'QlOE7feVp6mhdVa4sovHtWyAhpB3BIAb';
const stocksFile = path.join(__dirname, 'stocks.json');

const fetchStockList = async () => {
  try {
    const response = await axios.get(`https://api.polygon.io/v3/reference/tickers?sort=ticker&perpage=20&page=1&apiKey=${polygonApiKey}`);
    const stocks = response.data.results.map(stock => ({
      symbol: stock.ticker,
      openPrice: stock.open || 0, // Fallback to 0 if open price is missing
      lastUpdated: Date.now(),
    }));
    fs.writeFileSync(stocksFile, JSON.stringify(stocks, null, 2));
  } catch (error) {
    console.error("Error fetching stock list:", error);
  }
};

const updateStockPrices = () => {
  setInterval(() => {
    try {
      const stocks = JSON.parse(fs.readFileSync(stocksFile, 'utf-8'));
      stocks.forEach(stock => {
        stock.lastUpdated = Date.now();
        stock.openPrice += (Math.random() * 10 - 5); // Random price update
      });
      fs.writeFileSync(stocksFile, JSON.stringify(stocks, null, 2));
    } catch (error) {
      console.error("Error updating stock prices:", error);
    }
  }, 1000); // Run every second
};

// Expose an API to fetch stock prices
app.get('/api/stocks', (req, res) => {
  try {
    const stocks = JSON.parse(fs.readFileSync(stocksFile, 'utf-8'));
    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Run the initial setup to fetch stock list and start updating prices
fetchStockList();
updateStockPrices();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
