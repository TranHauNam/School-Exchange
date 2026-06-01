require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const memberRoutes = require('./routes/member.routes');
const categoryRoutes = require('./routes/category.routes');
const postRoutes = require('./routes/post.routes');
const itemRoutes = require('./routes/item.routes');
const transactionRoutes = require('./routes/transaction.routes');
const campaignRoutes = require('./routes/campaign.routes');
const campaignItemRoutes = require('./routes/campaignItem.routes');
const feeRoutes = require('./routes/fee.routes');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'School Exchange API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/campaign-items', campaignItemRoutes);
app.use('/api/fees', feeRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
