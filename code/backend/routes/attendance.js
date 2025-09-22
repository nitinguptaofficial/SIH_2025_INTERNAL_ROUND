const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("@tensorflow/tfjs-node");
const { faceapi, canvas, loadModels } = require("../utils/faceApiUtils");

// Helper function to safely cleanup uploaded files
const cleanupUploadedFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Successfully cleaned up file: ${filePath}`);
    } catch (error) {
      console.error(`Error cleaning up file ${filePath}:`, error);
    }
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// No need for model loading code here as it's handled by faceApiUtils

// Mark attendance
router.post("/mark", upload.single("photo"), async (req, res) => {
  try {
    console.log("Received attendance marking request");
    console.log("Request files:", req.files);
    console.log("Request file:", req.file);

    if (!req.file) {
      console.log("No photo file received in request");
      return res.status(400).json({ message: "Photo is required" });
    }

    console.log("Photo file received:", {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Ensure models are loaded before processing
    await loadModels();

    // Load and process the captured image
    console.log("Loading and processing image...");
    const img = await canvas.loadImage(req.file.path);

    // Get image dimensions
    const imgDimensions = {
      width: img.width,
      height: img.height,
    };
    console.log("Image dimensions:", imgDimensions);

    // Detect faces with higher min confidence
    const detections = await faceapi
      .detectAllFaces(
        img,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.7 })
      )
      .withFaceLandmarks()
      .withFaceDescriptors();

    console.log(`Detected ${detections.length} faces in image`);

    if (detections.length === 0) {
      cleanupUploadedFile(req.file.path);
      return res.status(400).json({ message: "No face detected in the image" });
    }

    if (detections.length > 1) {
      cleanupUploadedFile(req.file.path);
      return res.status(400).json({ message: "Multiple faces detected" });
    }

    // Get all users and their face descriptors
    const users = await req.prisma.user.findMany({
      where: {
        faceDescriptor: {
          not: null,
        },
      },
    });

    // Find matching user
    let matchedUser = null;
    let minDistance = Infinity;
    const RECOGNITION_THRESHOLD = 0.5; // Lower threshold for stricter matching

    console.log("Attempting to match face with registered users...");

    for (const user of users) {
      const userDescriptor = new Float32Array(
        user.faceDescriptor.split(",").map(Number)
      );
      const distance = faceapi.euclideanDistance(
        detections[0].descriptor,
        userDescriptor
      );

      console.log(`Checking user ${user.name}, distance: ${distance}`);

      if (distance < RECOGNITION_THRESHOLD && distance < minDistance) {
        minDistance = distance;
        matchedUser = user;
      }
    }

    if (matchedUser) {
      console.log(
        `Matched user: ${matchedUser.name} with confidence: ${
          (1 - minDistance) * 100
        }%`
      );
    }

    if (!matchedUser) {
      cleanupUploadedFile(req.file.path);
      return res.status(404).json({ message: "User not recognized" });
    }

    // Check if attendance already marked for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await req.prisma.attendance.findFirst({
      where: {
        userId: matchedUser.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingAttendance) {
      return res
        .status(400)
        .json({ message: "Attendance already marked for today" });
    }

    const attendance = await req.prisma.attendance.create({
      data: {
        userId: matchedUser.id,
        status: "PRESENT",
      },
      include: {
        user: true,
      },
    });

    // Clean up the uploaded file
    cleanupUploadedFile(req.file.path);

    res.status(201).json({
      success: true,
      user: matchedUser,
      attendance,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    console.error("Error stack:", error.stack);

    // Clean up uploaded file
    cleanupUploadedFile(req.file?.path);

    res.status(500).json({
      message: error.message,
      details: error.stack,
      type: error.name,
    });
  }
});

// Get attendance by date range
router.get("/", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let where = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const attendance = await req.prisma.attendance.findMany({
      where,
      include: {
        user: true,
      },
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
