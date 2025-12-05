import { PrismaClient } from '@/app/generated/prisma';

// Singleton pattern for PrismaClient
// Prevents creating multiple instances in development due to hot reload

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Helper type for Prisma errors
export interface PrismaError {
  code: string;
  meta?: { target?: string[] };
  message: string;
}

// Type guard for Prisma errors
export function isPrismaError(error: unknown): error is PrismaError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as PrismaError).code === 'string'
  );
}

// Common Prisma error codes
export const PRISMA_ERROR_CODES = {
  UNIQUE_CONSTRAINT: 'P2002',
  RECORD_NOT_FOUND: 'P2025',
  FOREIGN_KEY_CONSTRAINT: 'P2003',
  INVALID_DATA: 'P2005',
} as const;

// Helper to get human-readable error messages
export function getPrismaErrorMessage(error: unknown): string {
  if (!isPrismaError(error)) {
    return 'An unexpected error occurred';
  }

  switch (error.code) {
    case PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT:
      const field = error.meta?.target?.[0] || 'field';
      return `A record with this ${field} already exists`;
    case PRISMA_ERROR_CODES.RECORD_NOT_FOUND:
      return 'Record not found';
    case PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT:
      return 'Cannot delete this record because it has related data';
    case PRISMA_ERROR_CODES.INVALID_DATA:
      return 'Invalid data provided';
    default:
      return 'Database operation failed';
  }
}
