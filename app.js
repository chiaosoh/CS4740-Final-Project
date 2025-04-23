require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fileRoutes = require('./routes/files');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/files', fileRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});