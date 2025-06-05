import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import session from "express-session";
import {
  loginSchema,
  passwordChangeSchema,
  insertUserSchema,
  insertProductSchema,
  insertPicoSchema,
  insertPaletizadoStockSchema,
  type User,
} from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    user?: User;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "palletflow-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Initialize default admin user
  const initializeDefaultUser = async () => {
    const existingAdmin = await storage.getUserByUsername("admin");
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin", 10);
      await storage.createUser({
        name: "Administrador",
        nickname: "Admin",
        username: "admin",
        password: hashedPassword,
        role: "administrador",
        isFirstLogin: true,
      });
    }
  };

  await initializeDefaultUser();

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session.user || req.session.user.role !== "administrador") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      req.session.userId = user.id;
      req.session.user = user;

      res.json({ user: { ...user, password: undefined }, isFirstLogin: user.isFirstLogin });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { newPassword } = passwordChangeSchema.parse(req.body);
      const userId = req.session.userId!;

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(userId, hashedPassword);

      // Update session
      const updatedUser = await storage.getUser(userId);
      req.session.user = updatedUser;

      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ ...user, password: undefined });
  });

  // User management routes
  app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.put("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      const user = await storage.updateUser(id, updates);
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete user" });
    }
  });

  // Product management routes
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/search", requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }
      const products = await storage.searchProductsByCode(query);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.post("/api/products", requireAuth, requireAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const product = await storage.updateProduct(id, updates);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete product" });
    }
  });

  // Pico management routes
  app.get("/api/picos", requireAuth, async (req, res) => {
    try {
      const picos = await storage.getAllPicos();
      res.json(picos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch picos" });
    }
  });

  app.post("/api/picos", requireAuth, async (req, res) => {
    try {
      const { productCode, bases, looseUnits, towerLocation } = req.body;
      
      const product = await storage.getProductByCode(productCode);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const totalUnits = (bases * product.unitsPerBase) + looseUnits;
      
      const picoData = insertPicoSchema.parse({
        productId: product.id,
        bases,
        looseUnits,
        totalUnits,
        towerLocation,
      });

      const pico = await storage.createPico(picoData);
      
      // Log activity
      await storage.createActivityLog({
        type: "entry",
        productCode: product.code,
        productDescription: product.description,
        quantity: totalUnits,
        category: product.category,
      });

      res.json(pico);
    } catch (error) {
      res.status(400).json({ message: "Invalid pico data" });
    }
  });

  app.put("/api/picos/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { bases, looseUnits, towerLocation } = req.body;
      
      const existingPico = await storage.getPico(id);
      if (!existingPico) {
        return res.status(404).json({ message: "Pico not found" });
      }

      const totalUnits = (bases * existingPico.product.unitsPerBase) + looseUnits;
      
      const updates = {
        bases,
        looseUnits,
        totalUnits,
        ...(towerLocation && { towerLocation }),
      };

      const pico = await storage.updatePico(id, updates);
      res.json(pico);
    } catch (error) {
      res.status(400).json({ message: "Failed to update pico" });
    }
  });

  app.delete("/api/picos/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const pico = await storage.getPico(id);
      if (!pico) {
        return res.status(404).json({ message: "Pico not found" });
      }

      await storage.deletePico(id);
      
      // Log activity
      await storage.createActivityLog({
        type: "exit",
        productCode: pico.product.code,
        productDescription: pico.product.description,
        quantity: pico.totalUnits,
        category: pico.product.category,
      });

      res.json({ message: "Pico eliminated successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to eliminate pico" });
    }
  });

  // Paletizado Stock management routes
  app.get("/api/paletizado-stock", requireAuth, async (req, res) => {
    try {
      const stock = await storage.getAllPaletizadoStock();
      res.json(stock);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch paletizado stock" });
    }
  });

  app.post("/api/paletizado-stock", requireAuth, async (req, res) => {
    try {
      const { productCode, quantity } = req.body;
      
      const product = await storage.getProductByCode(productCode);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if stock already exists for this product
      const existingStock = await storage.getPaletizadoStockByProductId(product.id);
      
      let stock;
      if (existingStock) {
        // Update existing stock
        stock = await storage.updatePaletizadoStock(existingStock.id, {
          quantity: existingStock.quantity + quantity,
        });
      } else {
        // Create new stock entry
        const stockData = insertPaletizadoStockSchema.parse({
          productId: product.id,
          quantity,
        });
        stock = await storage.createPaletizadoStock(stockData);
      }

      // Log activity
      await storage.createActivityLog({
        type: "entry",
        productCode: product.code,
        productDescription: product.description,
        quantity,
        category: product.category,
      });

      res.json(stock);
    } catch (error) {
      res.status(400).json({ message: "Invalid stock data" });
    }
  });

  app.put("/api/paletizado-stock/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      
      const stock = await storage.updatePaletizadoStock(id, { quantity });
      res.json(stock);
    } catch (error) {
      res.status(400).json({ message: "Failed to update stock" });
    }
  });

  app.delete("/api/paletizado-stock/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const stock = await storage.getPaletizadoStock(id);
      if (!stock) {
        return res.status(404).json({ message: "Stock not found" });
      }

      await storage.deletePaletizadoStock(id);
      
      // Log activity
      await storage.createActivityLog({
        type: "exit",
        productCode: stock.product.code,
        productDescription: stock.product.description,
        quantity: stock.quantity,
        category: stock.product.category,
      });

      res.json({ message: "Stock eliminated successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to eliminate stock" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
