import { rename, stat } from 'fs/promises'
import { resolve } from 'path'

const MAX_LOG_SIZE = 10 * 1024 * 1024 // 10MB
const CHECK_INTERVAL = 5 * 60 * 1000 // Check every 5 minutes
const LOGS_PATH = resolve(process.cwd(), 'logs.txt')

export async function checkLogRotation() {
  try {
    const stats = await stat(LOGS_PATH)

    if (stats.size > MAX_LOG_SIZE) {
      const date = new Date().toISOString().replace(/[:.]/g, '-')
      const archivePath = resolve(process.cwd(), `logs-${date}.txt`)

      // Rename current log file to archive name
      await rename(LOGS_PATH, archivePath)

      console.log(`Rotated logs to ${archivePath}`)
    }
  } catch (error) {
    // File doesn't exist yet, ignore
    if (error.code !== 'ENOENT') {
      console.error('Error rotating logs:', error)
    }
  }
}

export function startLogRotationCheck() {
  // Initial check
  void checkLogRotation()

  // Set up periodic checks
  setInterval(() => {
    void checkLogRotation()
  }, CHECK_INTERVAL)
}

export function L() {
  return 0
}
