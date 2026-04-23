/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

import authRoutes from './src/routes/authRoutes.js'
import schoolRoutes from './src/routes/schoolRoutes.js'
import classRoutes from './src/routes/classRoutes.js'
import timetableRoutes from './src/routes/timetableRoutes.js'
import lessonPlanRoutes from './src/routes/lessonPlanRoutes.js'
import horizontalPlanRoutes from './src/routes/horizontalPlanRoutes.js'
import progressRoutes from './src/routes/progressRoutes.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/schools', schoolRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/timetables', timetableRoutes)
app.use('/api/lesson-plans', lessonPlanRoutes)
app.use('/api/horizontal-plans', horizontalPlanRoutes)
app.use('/api/progress', progressRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
