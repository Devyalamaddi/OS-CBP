"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useStore } from "@/lib/store"

type AddProcessModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function AddProcessModal({ isOpen, onClose }: AddProcessModalProps) {
  const { addProcess, simulation } = useStore()
  const [formData, setFormData] = useState({
    name: "",
    arrivalTime: simulation.currentTime.toString(),
    burstTime: "5",
    priority: "1",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    addProcess({
      name: formData.name || `Process ${Math.floor(Math.random() * 1000)}`,
      state: "new",
      priority: Number.parseInt(formData.priority),
      burstTime: Number.parseInt(formData.burstTime),
      arrivalTime: Number.parseFloat(formData.arrivalTime),
      resources: [],
      color: "",
    })

    // Reset form and close modal
    setFormData({
      name: "",
      arrivalTime: simulation.currentTime.toString(),
      burstTime: "5",
      priority: "1",
    })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-os-dark rounded-lg border border-os-light p-6 shadow-xl w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add New Process</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                    Process Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Process Name"
                    className="bg-os-darker border border-os-light rounded-md py-2 px-3 w-full text-white focus:outline-none focus:ring-1 focus:ring-os-blue"
                  />
                </div>

                <div>
                  <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-400 mb-1">
                    Arrival Time
                  </label>
                  <input
                    type="number"
                    id="arrivalTime"
                    name="arrivalTime"
                    value={formData.arrivalTime}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className="bg-os-darker border border-os-light rounded-md py-2 px-3 w-full text-white focus:outline-none focus:ring-1 focus:ring-os-blue"
                  />
                </div>

                <div>
                  <label htmlFor="burstTime" className="block text-sm font-medium text-gray-400 mb-1">
                    Burst Time
                  </label>
                  <input
                    type="number"
                    id="burstTime"
                    name="burstTime"
                    value={formData.burstTime}
                    onChange={handleChange}
                    min="1"
                    max="20"
                    className="bg-os-darker border border-os-light rounded-md py-2 px-3 w-full text-white focus:outline-none focus:ring-1 focus:ring-os-blue"
                  />
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-400 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    className="bg-os-darker border border-os-light rounded-md py-2 px-3 w-full text-white focus:outline-none focus:ring-1 focus:ring-os-blue"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-os-light text-white py-2 px-4 rounded-md hover:bg-os-lighter transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-os-blue text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Add Process
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
