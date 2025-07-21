import { varchar, timestamp, uuid, text, integer, decimal } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Standard UUID column for primary keys and foreign keys
 */
export function uuidColumn(name: string = "id") {
  return uuid(name).primaryKey().defaultRandom();
}

/**
 * Standard timestamp columns with timezone support
 */
export function timestampColumns() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  };
}

/**
 * Market-specific columns
 */
export function marketIdColumn() {
  return varchar("market_id", { length: 100 }).notNull();
}

/**
 * Currency amount columns with proper precision
 */
export function currencyColumn(name: string) {
  return decimal(name, { precision: 18, scale: 6 });
}

/**
 * Confidence score column (0-100)
 */
export function confidenceColumn() {
  return integer("confidence").notNull();
} 