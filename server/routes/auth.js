const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")

// Register a new user
router.post("/register", (req, res) => {
  const { name, email, rollNumber, password } = req.body

  // Validate input
  if (!name || !email || !rollNumber || !password) {
    return res.status(400).json({ error: "All fields are required" })
  }

  // In a real app, you would hash the password and store in a database
  // For demo purposes, we'll just create a token

  const user = {
    id: `user-${Date.now()}`,
    name,
    email,
    rollNumber,
  }

  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" })

  res.json({
    success: true,
    token,
    user,
  })
})

// Login a user
router.post("/login", (req, res) => {
  const { email, password } = req.body

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" })
  }

  // In a real app, you would verify credentials against a database
  // For demo purposes, we'll just create a token

  const user = {
    id: "user-123",
    name: "Demo User",
    email,
    rollNumber: "CS2001",
  }

  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" })

  res.json({
    success: true,
    token,
    user,
  })
})

module.exports = router
