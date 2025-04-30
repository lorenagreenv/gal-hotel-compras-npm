import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// --- Configuração do Usuário Admin ---
const adminEmail = "admin@galhotelbar.com"; // Email do administrador
const adminPassword = "senhaforte123"; // Senha temporária (ALTERAR DEPOIS!)
const adminName = "Administrador Gal Hotel";
// -------------------------------------

// Gerar hash da senha
const saltRounds = 10;
const passwordHash = bcrypt.hashSync(adminPassword, saltRounds);

// Gerar ID aleatório (simulando autoincrement, pois D1 local pode ter problemas com last_row_id em scripts)
// Em produção, o ID será gerenciado pelo banco de dados.
const adminId = crypto.randomInt(1000, 9999);

// Montar a query SQL (UPSERT para evitar erro se já existir)
const sql = `
INSERT INTO Users (id, name, email, password_hash, role, created_at, updated_at)
VALUES (${adminId}, '${adminName}', '${adminEmail}', '${passwordHash}', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(email) DO UPDATE SET
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  updated_at = CURRENT_TIMESTAMP;
`;

// Comando Wrangler para executar o SQL
const wranglerCommand = `wrangler d1 execute DB --local --command="${sql.replace(/\n/g, ' ')}"`;

console.log("\n--- Script para Criar Usuário Admin ---");
console.log("\nExecute o seguinte comando no terminal, dentro da pasta do projeto (/home/ubuntu/gal_hotel_compras_app):");
console.log("\n" + wranglerCommand + "\n");
console.log(`Email: ${adminEmail}`);
console.log(`Senha: ${adminPassword} (Lembre-se de alterar após o primeiro login!)`);
console.log("--------------------------------------\n");

