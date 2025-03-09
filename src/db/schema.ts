import { sql } from "drizzle-orm";
import { text, sqliteTable, integer } from "drizzle-orm/sqlite-core";

export const locks = sqliteTable("locks", {
  id: text("id").primaryKey(),
  title: text("title"),
  content: text("content").notNull(),
  delayMinutes: integer("delay_minutes").notNull(),
  salt: text("salt"),
  isEncrypted: integer("is_encrypted", { mode: "boolean" }).default(false),
  createdAt: integer("created_at").default(sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000)`),
  accessRequestedAt: integer("access_requested_at"),
  lastAccessed: integer("last_accessed"),
});

export type Lock = typeof locks.$inferSelect;
export type NewLock = typeof locks.$inferInsert;