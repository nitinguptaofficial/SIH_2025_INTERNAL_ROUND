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

// Set up multer for file uploads
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
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Register new user with face data
router.post("/register", upload.single("photo"), async (req, res) => {
  try {
    console.log("Registration request received");
    console.log("Request body:", req.body);
    console.log("File:", req.file);

    // Ensure models are loaded before processing
    await loadModels();

    const { name, email, role, rollNumber, class: studentClass } = req.body;

    // Using direct null/undefined checks instead of deprecated util.isNullOrUndefined
    if (
      name === null ||
      name === undefined ||
      email === null ||
      email === undefined ||
      role === null ||
      role === undefined
    ) {
      cleanupUploadedFile(req.file?.path);
      return res
        .status(400)
        .json({ message: "Name, email, and role are required" });
    }

    if (req.file === null || req.file === undefined) {
      return res.status(400).json({ message: "Photo is required" });
    }

    // Load and process the uploaded image
    const img = await canvas.loadImage(req.file.path);
    const detections = await faceapi
      .detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    if (detections.length === 0) {
      return res.status(400).json({ message: "No face detected in the image" });
    }

    if (detections.length > 1) {
      return res
        .status(400)
        .json({ message: "Multiple faces detected in the image" });
    }

    // Check if email already exists
    const existingUser = await req.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "Email already registered. Please use a different email address.",
      });
    }

    // Get the face descriptor and convert it to a string
    const faceDescriptor = detections[0].descriptor.toString();

    // Check if face is already registered
    const existingFaceUsers = await req.prisma.user.findMany({
      where: {
        faceDescriptor: {
          not: null,
        },
      },
    });

    // Compare face with existing users
    for (const existingUser of existingFaceUsers) {
      const existingDescriptor = new Float32Array(
        existingUser.faceDescriptor.split(",").map(Number)
      );
      const distance = faceapi.euclideanDistance(
        detections[0].descriptor,
        existingDescriptor
      );

      if (distance < 0.6) {
        // Same threshold as used for recognition
        return res.status(400).json({
          message: "This face is already registered with a different email.",
        });
      }
    }

    // Create user with the face descriptor
    const user = await req.prisma.user.create({
      data: {
        name,
        email,
        rollNumber,
        class: studentClass,
        faceDescriptor,
        role: role.toUpperCase(),
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("Error registering user:", error);
    console.error("Stack trace:", error.stack);

    // Clean up uploaded file
    cleanupUploadedFile(req.file?.path);

    // Send a more detailed error response
    res.status(500).json({
      message: "Registration failed: " + error.message,
      type: error.name,
      details: error.stack,
    });
  }
});

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await req.prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get students by department with their attendance records
router.get("/by-department/:department", async (req, res) => {
  try {
    const { department } = req.params;

    // Get all students first, then filter in JavaScript for better compatibility
    const allStudents = await req.prisma.user.findMany({
      where: {
        role: "STUDENT",
      },
      include: {
        attendance: {
          orderBy: {
            date: "desc",
          },
          take: 30, // Get last 30 attendance records
        },
      },
    });

    // Parse the department parameter - it might be comma-separated classes
    const teacherDepartments = department
      .split(",")
      .map((dept) => dept.trim().toLowerCase());

    // Filter students based on their class matching any of the teacher's departments
    const filteredStudents = allStudents.filter((student) => {
      if (!student.class) return false;

      // Split student's classes by comma and trim whitespace
      const studentClasses = student.class
        .split(",")
        .map((cls) => cls.trim().toLowerCase());

      // Check if any student class matches any teacher department
      return studentClasses.some((studentClass) =>
        teacherDepartments.some((teacherDept) => studentClass === teacherDept)
      );
    });

    res.json(filteredStudents);
  } catch (error) {
    console.error("Error fetching students by department:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
