import {
  pgTable,
  text,
  serial,
  boolean,
  integer,
  timestamp,
  varchar,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["administrador", "armazenista"]);
export const categoryEnum = pgEnum("category", ["alta_rotacao", "baixa_rotacao"]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nickname: text("nickname").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull(),
  isFirstLogin: boolean("is_first_login").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products (Paletizados) table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  quantityBases: integer("quantity_bases").notNull(),
  unitsPerBase: integer("units_per_base").notNull(),
  category: categoryEnum("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Picos table
export const picos = pgTable("picos", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  bases: integer("bases").notNull().default(0),
  looseUnits: integer("loose_units").notNull().default(0),
  totalUnits: integer("total_units").notNull(),
  towerLocation: varchar("tower_location", { length: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Paletizado Stock table
export const paletizadoStock = pgTable("paletizado_stock", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity Log table for tracking entries and exits
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'entry' or 'exit'
  productCode: text("product_code").notNull(),
  productDescription: text("product_description").notNull(),
  quantity: integer("quantity").notNull(),
  category: categoryEnum("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdPicos: many(picos),
  createdStock: many(paletizadoStock),
}));

export const productsRelations = relations(products, ({ many }) => ({
  picos: many(picos),
  stock: many(paletizadoStock),
}));

export const picosRelations = relations(picos, ({ one }) => ({
  product: one(products, {
    fields: [picos.productId],
    references: [products.id],
  }),
}));

export const paletizadoStockRelations = relations(paletizadoStock, ({ one }) => ({
  product: one(products, {
    fields: [paletizadoStock.productId],
    references: [products.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPicoSchema = createInsertSchema(picos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  towerLocation: z.string().regex(/^\d{2}$/, "Torre deve ter exatamente 2 dígitos (ex: 01, 12)"),
});

export const insertPaletizadoStockSchema = createInsertSchema(paletizadoStock).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Pico = typeof picos.$inferSelect;
export type InsertPico = z.infer<typeof insertPicoSchema>;

export type PaletizadoStock = typeof paletizadoStock.$inferSelect;
export type InsertPaletizadoStock = z.infer<typeof insertPaletizadoStockSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// Extended types with relations
export type PicoWithProduct = Pico & {
  product: Product;
};

export type PaletizadoStockWithProduct = PaletizadoStock & {
  product: Product;
};

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const passwordChangeSchema = z.object({
  newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

export type LoginData = z.infer<typeof loginSchema>;
export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;
