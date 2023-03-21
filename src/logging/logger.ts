export interface Logger {
  error: (message: string | Error) => void
  info: (message: string) => void
  debug: (message: string) => void
}
