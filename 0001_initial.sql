-- Schema for Gal Hotel Compras App

-- Drop existing tables if they exist (for resetting)
DROP TABLE IF EXISTS OrderItems;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Inventory;
DROP TABLE IF EXISTS ProductSuppliers;
DROP TABLE IF EXISTS Suppliers;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Users;

-- Users Table
CREATE TABLE Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN (
        'admin',
        'atendimento',
        'cozinha',
        'bar'
    )) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE Products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT CHECK(category IN (
        'Atendimento/Limpeza',
        'Cozinha',
        'Bar'
    )) NOT NULL,
    unit TEXT NOT NULL, -- UND, KG, PCT, L, CX, etc.
    min_stock REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers Table
CREATE TABLE Suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    contact_name TEXT,
    phone TEXT, -- For WhatsApp
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ProductSuppliers Table (Many-to-Many relationship)
CREATE TABLE ProductSuppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    price REAL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(id) ON DELETE CASCADE,
    UNIQUE (product_id, supplier_id)
);

-- Inventory Table (Tracks current stock)
CREATE TABLE Inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL UNIQUE, -- Each product has one current stock entry
    current_stock REAL NOT NULL DEFAULT 0,
    updated_by INTEGER, -- User ID
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES Users(id) ON DELETE
    SET NULL
);

-- Orders Table
CREATE TABLE Orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    status TEXT CHECK(status IN (
        'pendente',
        'enviado',
        'recebido'
    )) NOT NULL DEFAULT 'pendente',
    total_value REAL,
    created_by INTEGER, -- User ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE
    SET NULL
);

-- OrderItems Table
CREATE TABLE OrderItems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL, -- Price at the time of order
    total_price REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE RESTRICT
);

-- Trigger to update 'updated_at' timestamp on Users table update
CREATE TRIGGER update_users_updated_at
AFTER
UPDATE ON Users FOR EACH ROW BEGIN
UPDATE Users
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;

-- Trigger to update 'updated_at' timestamp on Products table update
CREATE TRIGGER update_products_updated_at
AFTER
UPDATE ON Products FOR EACH ROW BEGIN
UPDATE Products
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;

-- Trigger to update 'updated_at' timestamp on Suppliers table update
CREATE TRIGGER update_suppliers_updated_at
AFTER
UPDATE ON Suppliers FOR EACH ROW BEGIN
UPDATE Suppliers
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;

-- Trigger to update 'updated_at' timestamp on ProductSuppliers table update
CREATE TRIGGER update_productsuppliers_updated_at
AFTER
UPDATE ON ProductSuppliers FOR EACH ROW BEGIN
UPDATE ProductSuppliers
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;

-- Trigger to update 'updated_at' timestamp on Inventory table update
CREATE TRIGGER update_inventory_updated_at
AFTER
UPDATE ON Inventory FOR EACH ROW BEGIN
UPDATE Inventory
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;

-- Trigger to update 'updated_at' timestamp on Orders table update
CREATE TRIGGER update_orders_updated_at
AFTER
UPDATE ON Orders FOR EACH ROW BEGIN
UPDATE Orders
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;

-- Trigger to update 'updated_at' timestamp on OrderItems table update
CREATE TRIGGER update_orderitems_updated_at
AFTER
UPDATE ON OrderItems FOR EACH ROW BEGIN
UPDATE OrderItems
SET updated_at = CURRENT_TIMESTAMP
WHERE id = OLD.id;
END;

