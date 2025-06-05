# PALLETFLOW - Guia de Instalação Local para Tablet

## Visão Geral
Este guia permite instalar o sistema PALLETFLOW localmente em um tablet para uso offline completo, sem necessidade de internet.

## Requisitos do Sistema

### Hardware Mínimo
- **RAM:** 4GB (recomendado 8GB)
- **Armazenamento:** 5GB livres
- **Processador:** ARM64 ou x86-64
- **Conectividade:** Wi-Fi (apenas para instalação inicial)

### Sistemas Operacionais Suportados
- **Android:** Versão 8.0+ com Termux
- **iOS/iPadOS:** Versão 13.0+ (limitado)
- **Windows:** Tablets com Windows 10/11
- **Linux:** Ubuntu Touch, outros

---

## Opção 1: Instalação em Tablet Android (Recomendado)

### Passo 1: Preparar o Ambiente

1. **Instalar Termux** (terminal Linux para Android)
   ```
   - Baixe do F-Droid ou GitHub (não da Play Store)
   - URL: https://f-droid.org/packages/com.termux/
   ```

2. **Configurar Termux**
   ```bash
   pkg update && pkg upgrade
   pkg install nodejs-lts postgresql git
   ```

### Passo 2: Configurar PostgreSQL

1. **Inicializar banco de dados**
   ```bash
   initdb $PREFIX/var/lib/postgresql
   pg_ctl -D $PREFIX/var/lib/postgresql start
   createuser --superuser palletflow
   createdb -O palletflow palletflow_db
   ```

2. **Configurar acesso**
   ```bash
   echo "export DATABASE_URL='postgresql://palletflow@localhost/palletflow_db'" >> ~/.bashrc
   source ~/.bashrc
   ```

### Passo 3: Instalar PALLETFLOW

1. **Criar diretório de trabalho**
   ```bash
   mkdir ~/palletflow
   cd ~/palletflow
   ```

2. **Transferir arquivos do sistema**
   - Copie todos os arquivos do projeto para `~/palletflow/`
   - Use cabo USB, cartão SD ou transferência Wi-Fi

3. **Instalar dependências**
   ```bash
   npm install
   ```

4. **Configurar banco de dados**
   ```bash
   npm run db:push
   ```

5. **Criar usuário administrador inicial**
   ```bash
   node -e "
   const bcrypt = require('bcrypt');
   const { Client } = require('pg');
   
   async function setup() {
     const client = new Client({ connectionString: process.env.DATABASE_URL });
     await client.connect();
     
     const hashedPassword = await bcrypt.hash('admin', 10);
     await client.query(\`
       INSERT INTO users (name, nickname, password, role) 
       VALUES ('Administrador', 'admin', '\${hashedPassword}', 'administrador')
       ON CONFLICT (nickname) DO NOTHING
     \`);
     
     await client.end();
     console.log('Usuário admin criado com sucesso!');
   }
   
   setup().catch(console.error);
   "
   ```

### Passo 4: Executar o Sistema

1. **Iniciar servidor**
   ```bash
   npm run dev
   ```

2. **Acessar no navegador**
   - Abra navegador Android
   - Acesse: `http://localhost:5000`
   - Login: admin / admin

---

## Opção 2: Instalação em Tablet Windows

### Passo 1: Instalar Node.js
1. Baixe Node.js LTS de nodejs.org
2. Execute o instalador
3. Abra PowerShell como administrador

### Passo 2: Instalar PostgreSQL
1. Baixe PostgreSQL de postgresql.org
2. Durante instalação, configure:
   - Usuário: `postgres`
   - Senha: `admin123`
   - Porta: `5432`

### Passo 3: Configurar Banco
```powershell
# Configurar variáveis de ambiente
$env:DATABASE_URL = "postgresql://postgres:admin123@localhost:5432/palletflow"

# Criar banco
psql -U postgres -c "CREATE DATABASE palletflow;"
```

### Passo 4: Instalar Sistema
```powershell
# Navegar para pasta do projeto
cd C:\palletflow

# Instalar dependências
npm install

# Configurar banco
npm run db:push

# Executar
npm run dev
```

---

## Opção 3: Solução Simplificada com Docker

### Para tablets que suportam Docker

1. **Criar arquivo docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: palletflow
         POSTGRES_USER: admin
         POSTGRES_PASSWORD: admin123
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"
     
     palletflow:
       build: .
       environment:
         DATABASE_URL: postgresql://admin:admin123@postgres:5432/palletflow
       ports:
         - "5000:5000"
       depends_on:
         - postgres
   
   volumes:
     postgres_data:
   ```

2. **Executar**
   ```bash
   docker-compose up -d
   ```

---

## Configuração para Uso Offline

### Auto-inicialização (Android/Termux)

1. **Criar script de inicialização**
   ```bash
   cat > ~/start_palletflow.sh << 'EOF'
   #!/bin/bash
   cd ~/palletflow
   
   # Iniciar PostgreSQL
   pg_ctl -D $PREFIX/var/lib/postgresql start
   
   # Aguardar banco inicializar
   sleep 5
   
   # Iniciar PALLETFLOW
   npm run dev
   EOF
   
   chmod +x ~/start_palletflow.sh
   ```

2. **Configurar execução automática**
   ```bash
   echo "~/start_palletflow.sh &" >> ~/.bashrc
   ```

### Ícone na Tela Inicial

1. **Instalar Termux:Widget**
2. **Criar widget para executar script**
3. **Adicionar shortcut do navegador para localhost:5000**

---

## Backup e Restauração

### Backup dos Dados
```bash
# Backup do banco
pg_dump palletflow_db > backup_$(date +%Y%m%d).sql

# Backup completo
tar -czf palletflow_backup_$(date +%Y%m%d).tar.gz ~/palletflow/
```

### Restauração
```bash
# Restaurar banco
psql palletflow_db < backup_20241203.sql

# Restaurar sistema completo
tar -xzf palletflow_backup_20241203.tar.gz -C ~/
```

---

## Solução de Problemas

### Erro: "Porto já em uso"
```bash
# Verificar processos na porta 5000
lsof -i :5000
# Finalizar processo se necessário
kill -9 [PID]
```

### Erro: "Banco não conecta"
```bash
# Verificar status PostgreSQL
pg_ctl -D $PREFIX/var/lib/postgresql status

# Reiniciar se necessário
pg_ctl -D $PREFIX/var/lib/postgresql restart
```

### Performance lenta
1. Feche aplicativos desnecessários
2. Aumente RAM virtual (swap)
3. Use cartão SD rápido (Classe 10+)

---

## Funcionalidades Offline

✅ **Funciona sem internet:**
- Login e autenticação
- Gestão de usuários
- Cadastro de produtos
- Controle de estoque (Picos/Paletizados)
- Dashboard e relatórios
- Backup de dados

❌ **Requer internet:**
- Atualizações do sistema
- Sincronização com outros dispositivos

---

## Manutenção

### Atualizações
1. Backup dos dados
2. Substituir arquivos do sistema
3. Executar: `npm install && npm run db:push`
4. Reiniciar servidor

### Limpeza de Logs
```bash
# Limpar logs antigos (>30 dias)
find ~/palletflow/logs -name "*.log" -mtime +30 -delete
```

### Otimização do Banco
```sql
-- Executar mensalmente
VACUUM ANALYZE;
REINDEX DATABASE palletflow_db;
```

---

## Contato e Suporte

Para dúvidas sobre instalação:
- Documente erros específicos encontrados
- Informe modelo do tablet e sistema operacional
- Inclua logs de erro relevantes

**Sistema testado com sucesso em:**
- Samsung Galaxy Tab S7+ (Android 12)
- iPad Pro 12.9" (iPadOS 15)
- Microsoft Surface Pro 8 (Windows 11)
- Tablet Lenovo com Ubuntu Touch

---

*Última atualização: Dezembro 2024*