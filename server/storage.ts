import {
  users,
  products,
  picos,
  paletizadoStock,
  activityLog,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Pico,
  type InsertPico,
  type PaletizadoStock,
  type InsertPaletizadoStock,
  type ActivityLog,
  type InsertActivityLog,
  type PicoWithProduct,
  type PaletizadoStockWithProduct,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateUserPassword(id: number, hashedPassword: string): Promise<void>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProductByCode(code: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  getAllProducts(): Promise<Product[]>;
  searchProductsByCode(query: string): Promise<Product[]>;
  
  // Pico operations
  getPico(id: number): Promise<PicoWithProduct | undefined>;
  createPico(pico: InsertPico): Promise<Pico>;
  updatePico(id: number, updates: Partial<InsertPico>): Promise<Pico>;
  deletePico(id: number): Promise<void>;
  getAllPicos(): Promise<PicoWithProduct[]>;
  
  // Paletizado Stock operations
  getPaletizadoStock(id: number): Promise<PaletizadoStockWithProduct | undefined>;
  getPaletizadoStockByProductId(productId: number): Promise<PaletizadoStockWithProduct | undefined>;
  createPaletizadoStock(stock: InsertPaletizadoStock): Promise<PaletizadoStock>;
  updatePaletizadoStock(id: number, updates: Partial<InsertPaletizadoStock>): Promise<PaletizadoStock>;
  deletePaletizadoStock(id: number): Promise<void>;
  getAllPaletizadoStock(): Promise<PaletizadoStockWithProduct[]>;
  
  // Activity Log operations
  createActivityLog(activity: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivity(limit?: number): Promise<ActivityLog[]>;
  
  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalPicos: number;
    totalPaletizados: number;
    altaRotacao: number;
    baixaRotacao: number;
    recentEntries: ActivityLog[];
    recentExits: ActivityLog[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.name);
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword, isFirstLogin: false, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductByCode(code: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.code, code));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(products.code);
  }

  async searchProductsByCode(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(like(products.code, `%${query}%`))
      .limit(10);
  }

  // Pico operations
  async getPico(id: number): Promise<PicoWithProduct | undefined> {
    const [pico] = await db
      .select()
      .from(picos)
      .leftJoin(products, eq(picos.productId, products.id))
      .where(eq(picos.id, id));
    
    if (!pico || !pico.products) return undefined;
    
    return {
      ...pico.picos,
      product: pico.products,
    };
  }

  async createPico(insertPico: InsertPico): Promise<Pico> {
    const [pico] = await db
      .insert(picos)
      .values(insertPico)
      .returning();
    return pico;
  }

  async updatePico(id: number, updates: Partial<InsertPico>): Promise<Pico> {
    const [pico] = await db
      .update(picos)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(picos.id, id))
      .returning();
    return pico;
  }

  async deletePico(id: number): Promise<void> {
    await db.delete(picos).where(eq(picos.id, id));
  }

  async getAllPicos(): Promise<PicoWithProduct[]> {
    const results = await db
      .select()
      .from(picos)
      .leftJoin(products, eq(picos.productId, products.id))
      .orderBy(desc(picos.createdAt));
    
    return results
      .filter(result => result.products)
      .map(result => ({
        ...result.picos,
        product: result.products!,
      }));
  }

  // Paletizado Stock operations
  async getPaletizadoStock(id: number): Promise<PaletizadoStockWithProduct | undefined> {
    const [stock] = await db
      .select()
      .from(paletizadoStock)
      .leftJoin(products, eq(paletizadoStock.productId, products.id))
      .where(eq(paletizadoStock.id, id));
    
    if (!stock || !stock.products) return undefined;
    
    return {
      ...stock.paletizado_stock,
      product: stock.products,
    };
  }

  async getPaletizadoStockByProductId(productId: number): Promise<PaletizadoStockWithProduct | undefined> {
    const [stock] = await db
      .select()
      .from(paletizadoStock)
      .leftJoin(products, eq(paletizadoStock.productId, products.id))
      .where(eq(paletizadoStock.productId, productId));
    
    if (!stock || !stock.products) return undefined;
    
    return {
      ...stock.paletizado_stock,
      product: stock.products,
    };
  }

  async createPaletizadoStock(insertStock: InsertPaletizadoStock): Promise<PaletizadoStock> {
    const [stock] = await db
      .insert(paletizadoStock)
      .values(insertStock)
      .returning();
    return stock;
  }

  async updatePaletizadoStock(id: number, updates: Partial<InsertPaletizadoStock>): Promise<PaletizadoStock> {
    const [stock] = await db
      .update(paletizadoStock)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(paletizadoStock.id, id))
      .returning();
    return stock;
  }

  async deletePaletizadoStock(id: number): Promise<void> {
    await db.delete(paletizadoStock).where(eq(paletizadoStock.id, id));
  }

  async getAllPaletizadoStock(): Promise<PaletizadoStockWithProduct[]> {
    const results = await db
      .select()
      .from(paletizadoStock)
      .leftJoin(products, eq(paletizadoStock.productId, products.id))
      .orderBy(desc(paletizadoStock.createdAt));
    
    return results
      .filter(result => result.products)
      .map(result => ({
        ...result.paletizado_stock,
        product: result.products!,
      }));
  }

  // Activity Log operations
  async createActivityLog(insertActivity: InsertActivityLog): Promise<ActivityLog> {
    const [activity] = await db
      .insert(activityLog)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  // Dashboard statistics
  async getDashboardStats() {
    // Count total picos
    const [totalPicosResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(picos);
    
    // Count total paletizados
    const [totalPaletizadosResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(paletizadoStock);
    
    // Count alta rotacao products
    const [altaRotacaoResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.category, 'alta_rotacao'));
    
    // Count baixa rotacao products
    const [baixaRotacaoResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.category, 'baixa_rotacao'));
    
    // Get recent entries and exits
    const recentEntries = await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.type, 'entry'))
      .orderBy(desc(activityLog.createdAt))
      .limit(5);
    
    const recentExits = await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.type, 'exit'))
      .orderBy(desc(activityLog.createdAt))
      .limit(5);
    
    return {
      totalPicos: totalPicosResult?.count || 0,
      totalPaletizados: totalPaletizadosResult?.count || 0,
      altaRotacao: altaRotacaoResult?.count || 0,
      baixaRotacao: baixaRotacaoResult?.count || 0,
      recentEntries,
      recentExits,
    };
  }
}

export const storage = new DatabaseStorage();
