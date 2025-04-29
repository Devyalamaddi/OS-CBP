const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")

// Get leaderboard
router.get("/", (req, res) => {
  const { level, search, limit = 10, page = 1 } = req.query

  // In a real app, you would fetch from a database with filtering
  // For demo purposes, we'll return sample data

  const entries = [
    { id: 1, name: "Alice", rollNumber: "CS2001", score: 950, level: 3 },
    { id: 2, name: "Bob", rollNumber: "CS2002", score: 920, level: 3 },
    { id: 3, name: "Charlie", rollNumber: "CS2003", score: 880, level: 3 },
    { id: 4, name: "David", rollNumber: "CS2004", score: 850, level: 3 },
    { id: 5, name: "Eve", rollNumber: "CS2005", score: 820, level: 3 },
    { id: 6, name: "Frank", rollNumber: "CS2006", score: 780, level: 2 },
    { id: 7, name: "Grace", rollNumber: "CS2007", score: 750, level: 2 },
    { id: 8, name: "Heidi", rollNumber: "CS2008", score: 720, level: 2 },
    { id: 9, name: "Ivan", rollNumber: "CS2009", score: 680, level: 2 },
    { id: 10, name: "Judy", rollNumber: "CS2010", score: 650, level: 2 },
  ]

  // Filter by level if provided
  let filteredEntries = entries
  if (level) {
    filteredEntries = entries.filter((entry) => entry.level === Number.parseInt(level))
  }

  // Filter by search term if provided
  if (search) {
    const searchLower = search.toLowerCase()
    filteredEntries = filteredEntries.filter(
      (entry) => entry.name.toLowerCase().includes(searchLower) || entry.rollNumber.toLowerCase().includes(searchLower),
    )
  }

  // Paginate results
  const startIndex = (Number.parseInt(page) - 1) * Number.parseInt(limit)
  const endIndex = startIndex + Number.parseInt(limit)
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex)

  res.json({
    entries: paginatedEntries,
    total: filteredEntries.length,
    page: Number.parseInt(page),
    limit: Number.parseInt(limit),
  })
})

// Submit score
router.post("/", (req, res) => {
  const { sessionId, level, score } = req.body
  const authHeader = req.headers["authorization"]

  // Validate input
  if (!sessionId || !level || !score) {
    return res.status(400).json({ error: "Session ID, level, and score are required" })
  }

  // In a real app, you would store the score in a database
  // For demo purposes, we'll just return success

  res.json({
    success: true,
    rank: 5,
    previousBest: 820,
  })
})

module.exports = router
