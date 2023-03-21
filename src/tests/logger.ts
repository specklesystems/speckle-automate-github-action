import { pino, LoggerOptions, stdTimeFunctions } from 'pino'

export function getLogger(): pino.Logger<LoggerOptions> {
  const pinoOptions: LoggerOptions = {
    base: undefined, // Set to undefined to avoid adding pid, hostname properties to each log.
    formatters: {
      level: (label: string) => {
        return { level: label }
      }
    },
    level: 'debug',
    timestamp: stdTimeFunctions.isoTime
  }

  pinoOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      destination: 2, //stderr
      ignore: 'time',
      levelFirst: true,
      singleLine: true
    }
  }

  return pino(pinoOptions)
}
