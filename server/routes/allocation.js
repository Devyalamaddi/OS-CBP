const express = require("express")
const router = express.Router()

// Allocate a resource to a process
router.post("/", (req, res) => {
  const { processId, resourceId, amount } = req.body

  // Validate input
  if (!processId || !resourceId || !amount) {
    return res.status(400).json({ error: "Process ID, resource ID, and amount are required" })
  }

  // In a real app, you would update the allocation in a database
  // For demo purposes, we'll just return success

  res.json({
    success: true,
    process: {
      id: processId,
      resources: [resourceId],
    },
    resource: {
      id: resourceId,
      available: 4,
      allocated: {
        [processId]: amount,
      },
    },
  })
})

// Release a resource from a process
router.delete("/", (req, res) => {
  const { processId, resourceId, amount } = req.body

  // Validate input
  if (!processId || !resourceId || !amount) {
    return res.status(400).json({ error: "Process ID, resource ID, and amount are required" })
  }

  // In a real app, you would update the allocation in a database
  // For demo purposes, we'll just return success

  res.json({
    success: true,
    process: {
      id: processId,
      resources: [],
    },
    resource: {
      id: resourceId,
      available: 5,
      allocated: {},
    },
  })
})

module.exports = router
