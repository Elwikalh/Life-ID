// Shared domain types for Life ID

export type Role =
  | "patient"
  | "doctor"
  | "clinic"
  | "pharmacy"
  | "lab"
  | "radiology"
  | "hospital"
  | "pharma_company"
  | "medical_rep"
  | "emergency"
  | "super_admin"

export interface User {
  id: string
  role: Role
  fullName: string
  email?: string
  phone?: string
  createdAt: string
}

export interface MedicalId {
  id: string
  userId: string
  qrCode: string
  bloodType?: string
  allergies: string[]
  chronicConditions: string[]
  medications: string[]
  emergencyContact?: { name: string; phone: string }
}

export interface Appointment {
  id: string
  patientId: string
  providerId: string
  scheduledAt: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  priceEGP: number
  discountPct: number
}

export interface Prescription {
  id: string
  appointmentId: string
  doctorId: string
  items: Array<{ drug: string; activeIngredient: string; dosage: string }>
  createdAt: string
}
