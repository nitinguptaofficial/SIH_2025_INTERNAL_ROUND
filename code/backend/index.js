const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const attendanceRoutes = require("./routes/attendance");
const userRoutes = require("./routes/user");
const teacherRoutes = require("./routes/teacher");

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: true, // Allow all origins with credentials
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Allow all common HTTP methods
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
  ], // Allow more headers
  exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
  credentials: true, // Allow credentials
  maxAge: 86400, // Cache preflight request results for 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

// Log all incoming requests
app.use((req, res, next) => {
  console.log("\n=== Incoming Request ===");
  console.log("Time:", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("======================\n");
  next();
});

app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Handle OPTIONS preflight requests
app.options("*", cors(corsOptions));

app.get("/", (req, res) => {
  res.send("Welcome to the Attendance Management API");
});

// Make Prisma available in routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use("/api/attendance", attendanceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teachers", teacherRoutes);

app.listen(PORT, "0.0.0.0", () => {
  const { networkInterfaces } = require("os");
  const nets = networkInterfaces();
  console.log("\n=== Server Started ===");
  console.log(`Server is running on port ${PORT}`);
  console.log("\nAvailable on:");

  // List all IPv4 addresses
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        console.log(` - http://${net.address}:${PORT}`);
      }
    }
  }
  console.log(
    "\nCheck if you can access any of these URLs from your mobile browser"
  );
});
