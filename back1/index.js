const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;


const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf-8'));
const total = users.length;


app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello from paginated user API!');
});

app.get('/api/users', (req, res) => {
  let { page = 1, limit = 50 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
    return res.status(400).json({ error: 'Invalid page or limit query parameters' });
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = users.slice(startIndex, endIndex);

  res.json({
    data: paginatedUsers,
    total,
    page,
    limit
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
