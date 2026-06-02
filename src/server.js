require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

app.get("/", (req, res) => res.json({ message: "API Running" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/admin/categories", require("./routes/adminCategoryRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/admin/posts", require("./routes/adminPostRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/campaigns", require("./routes/campaignRoutes"));
app.use("/api/admin/campaigns", require("./routes/adminCampaignRoutes"));
app.use("/api/activity-admin", require("./routes/activityAdminRoutes"));
app.use("/api/admin/reports", require("./routes/adminReportRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

app.use((req, res) => res.status(404).json({ success: false, code: "NOT_FOUND", message: "Route not found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
