const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register new teacher
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, employeeId, department } = req.body;

    // Validate required fields
    if (!name || !email || !password || !employeeId || !department) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists
    const existingTeacher = await req.prisma.teacher.findUnique({
      where: { email },
    });

    if (existingTeacher) {
      return res.status(400).json({
        message:
          "Email already registered. Please use a different email address.",
      });
    }

    // Check if employeeId already exists
    const existingEmployeeId = await req.prisma.teacher.findUnique({
      where: { employeeId },
    });

    if (existingEmployeeId) {
      return res.status(400).json({
        message:
          "Employee ID already registered. Please contact administrator.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create teacher
    const teacher = await req.prisma.teacher.create({
      data: {
        name,
        email,
        password: hashedPassword,
        employeeId,
        department,
      },
    });

    // Remove password from response
    const { password: _, ...teacherWithoutPassword } = teacher;

    res.status(201).json(teacherWithoutPassword);
  } catch (error) {
    console.error("Error registering teacher:", error);
    res.status(500).json({
      message: "Registration failed: " + error.message,
    });
  }
});

// Login teacher
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find teacher by email
    const teacher = await req.prisma.teacher.findUnique({
      where: { email },
    });

    if (!teacher) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, teacher.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: teacher.id,
        email: teacher.email,
        role: "TEACHER",
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Remove password from response
    const { password: _, ...teacherWithoutPassword } = teacher;

    res.json({
      ...teacherWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Error logging in teacher:", error);
    res.status(500).json({
      message: "Login failed: " + error.message,
    });
  }
});

// Get teacher profile (requires authentication)
router.get("/profile", async (req, res) => {
  try {
    // For now, we'll get teacher by ID from query params
    // In a real app, you'd extract this from JWT token
    const { teacherId } = req.query;

    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    const teacher = await req.prisma.teacher.findUnique({
      where: { id: parseInt(teacherId) },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        department: true,
        createdAt: true,
      },
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(teacher);
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    res.status(500).json({
      message: "Failed to fetch profile: " + error.message,
    });
  }
});

module.exports = router;
