// utils/logger.ts - Logging utility for frontend
import { Platform } from 'react-native';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  platform: string;
}

class Logger {
  private currentLevel: LogLevel;
  private logHistory: LogEntry[] = [];
  private maxHistorySize: number = 100;

  constructor() {
    this.currentLevel = LogLevel.INFO;
  }

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private formatMessage(level: string, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      platform: Platform.OS,
    };
  }

  private addToHistory(entry: LogEntry) {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  debug(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const entry = this.formatMessage('DEBUG', message, data);
    this.addToHistory(entry);
    console.debug(`[DEBUG] ${message}`, data || '');
  }

  info(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const entry = this.formatMessage('INFO', message, data);
    this.addToHistory(entry);
    console.info(`[INFO] ${message}`, data || '');
  }

  warn(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const entry = this.formatMessage('WARN', message, data);
    this.addToHistory(entry);
    console.warn(`[WARN] ${message}`, data || '');
  }

  error(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const entry = this.formatMessage('ERROR', message, data);
    this.addToHistory(entry);
    console.error(`[ERROR] ${message}`, data || '');
  }

  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  clearHistory() {
    this.logHistory = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }
}

const logger = new Logger();

// Set log level based on environment
if (__DEV__) {
  logger.setLevel(LogLevel.DEBUG);
} else {
  logger.setLevel(LogLevel.WARN);
}

export default logger;
