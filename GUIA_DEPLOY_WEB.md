# PALLETFLOW - Guia de Deploy Web

## Visão Geral
Este guia permite fazer deploy do sistema PALLETFLOW na web para acesso via internet através de tablet ou qualquer dispositivo conectado.

## Opções de Deploy

### 1. Replit Deployments (Mais Simples)
✅ **Recomendado para iniciantes**
- Setup automático
- SSL/HTTPS incluído
- Domínio gratuito .replit.app
- Banco PostgreSQL incluído

### 2. Vercel + Neon Database
✅ **Boa performance**
- Deploy gratuito
- Banco PostgreSQL gerenciado
- Domínio personalizado disponível

### 3. Railway
✅ **Solução completa**
- Deploy com um comando
- Banco PostgreSQL incluído
- Monitoramento integrado

### 4. VPS/Servidor Próprio
✅ **Controle total**
- Maior customização
- Domínio próprio
- Controle de custos

---

## Opção 1: Deploy no Replit (Recomendado)

### Passo 1: Preparar Projeto
1. **Acesse replit.com e faça login**
2. **Importe projeto existente:**
   - Click "Create Repl"
   - Selecione "Import from GitHub"
   - Cole URL do repositório ou faça upload dos arquivos

### Passo 2: Configurar Database
```bash
# No console do Replit, execute:
npm run db:push
```

### Passo 3: Deploy
1. **Configure secrets necessárias:**
   - `SESSION_SECRET`: uma string aleatória longa
   - `DATABASE_URL`: será configurada automaticamente

2. **Inicie deployment:**
   - Click no botão "Deploy"
   - Aguarde processo completar
   - Anote URL gerada (ex: yourapp.replit.app)

### Passo 4: Configurar Usuário Admin
```javascript
// Execute no console do Replit
const bcrypt = require('bcrypt');
const { pool } = require('./server/db');

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin', 10);
  await pool.query(`
    INSERT INTO users (name, nickname, password, role) 
    VALUES ('Administrador', 'admin', $1, 'administrador')
    ON CONFLICT (nickname) DO NOTHING
  `, [hashedPassword]);
  console.log('Admin criado!');
}

createAdmin();
```

---

## Opção 2: Deploy no Vercel + Neon

### Passo 1: Configurar Banco Neon
1. **Acesse neon.tech e crie conta**
2. **Crie novo projeto:**
   - Nome: "palletflow-db"
   - Região: us-east-1
3. **Anote connection string**

### Passo 2: Preparar Projeto para Vercel
1. **Criar vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

2. **Instalar Vercel CLI:**
```bash
npm install -g vercel
```

### Passo 3: Deploy
```bash
# Login no Vercel
vercel login

# Deploy
vercel

# Configurar variáveis de ambiente
vercel env add DATABASE_URL
vercel env add SESSION_SECRET

# Deploy final
vercel --prod
```

---

## Opção 3: Deploy no Railway

### Passo 1: Preparar Railway
1. **Acesse railway.app e conecte GitHub**
2. **Crie novo projeto:**
   - "New Project" → "Deploy from GitHub repo"
   - Selecione repositório do PALLETFLOW

### Passo 2: Configurar Database
1. **Adicionar PostgreSQL:**
   - Click "Add Service" → "Database" → "PostgreSQL"
   - Anote dados de conexão

### Passo 3: Configurar Variáveis
```bash
# No dashboard Railway, adicione:
DATABASE_URL=postgresql://user:pass@host:port/dbname
SESSION_SECRET=your-random-secret-string
NODE_ENV=production
```

### Passo 4: Deploy Automático
- Railway fará deploy automaticamente
- Anote URL gerada
- Configure domínio personalizado se desejar

---

## Opção 4: VPS/Servidor Próprio

### Passo 1: Configurar Servidor
```bash
# Ubuntu 20.04/22.04 LTS
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Passo 2: Configurar Banco
```bash
# Criar usuário e banco
sudo -u postgres createuser --createdb palletflow
sudo -u postgres createdb palletflow_db -O palletflow
sudo -u postgres psql -c "ALTER USER palletflow PASSWORD 'senha_forte';"
```

### Passo 3: Deploy Aplicação
```bash
# Clonar projeto
git clone <repository-url> /var/www/palletflow
cd /var/www/palletflow

# Instalar dependências
npm install

# Configurar ambiente
echo "DATABASE_URL=postgresql://palletflow:senha_forte@localhost/palletflow_db" > .env
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env
echo "NODE_ENV=production" >> .env

# Configurar banco
npm run db:push

# Build para produção
npm run build
```

### Passo 4: Configurar Nginx
```nginx
# /etc/nginx/sites-available/palletflow
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/palletflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Passo 5: Configurar SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

### Passo 6: Configurar PM2 (Process Manager)
```bash
# Instalar PM2
npm install -g pm2

# Criar ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'palletflow',
    script: 'server/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Configurações de Segurança

### Para Todos os Deploys

1. **Variáveis de Ambiente Obrigatórias:**
```bash
DATABASE_URL=sua_connection_string_postgresql
SESSION_SECRET=string_aleatoria_longa_e_segura
NODE_ENV=production
```

2. **Configurar CORS (se necessário):**
```javascript
// server/index.ts
app.use(cors({
  origin: ['https://seu-dominio.com'],
  credentials: true
}));
```

3. **Backup Automático:**
```bash
# Script de backup diário
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
# Upload para cloud storage
```

---

## Acesso via Tablet

### Após Deploy Completo

1. **URL de Acesso:**
   - Replit: `https://yourapp.replit.app`
   - Vercel: `https://yourapp.vercel.app`
   - Railway: `https://yourapp.railway.app`
   - VPS: `https://seu-dominio.com`

2. **Criar Atalho na Tela Inicial:**
   - Abra navegador no tablet
   - Acesse URL do sistema
   - Menu → "Adicionar à tela inicial"
   - Ícone será criado como app nativo

3. **Login Padrão:**
   - Usuário: `admin`
   - Senha: `admin` (altere imediatamente)

---

## Monitoramento e Manutenção

### Logs e Debugging
```bash
# Vercel
vercel logs

# Railway
railway logs

# VPS
pm2 logs palletflow
```

### Atualizações
```bash
# Para VPS
cd /var/www/palletflow
git pull origin main
npm install
npm run build
pm2 restart palletflow
```

### Backup
```bash
# Backup semanal automático
crontab -e
# Adicionar linha:
0 2 * * 0 pg_dump $DATABASE_URL | gzip > backup_$(date +\%Y\%m\%d).sql.gz
```

---

## Resolução de Problemas

### Erro 500 - Internal Server Error
1. Verificar logs da aplicação
2. Confirmar variáveis de ambiente
3. Testar conexão com banco

### Erro de Conexão com Banco
1. Verificar DATABASE_URL
2. Confirmar firewall/security groups
3. Testar conexão manual

### Performance Lenta
1. Otimizar queries do banco
2. Implementar cache
3. Usar CDN para assets estáticos

---

## Custos Estimados

### Opções Gratuitas
- **Replit:** Gratuito com limitações
- **Vercel:** Gratuito até certos limites
- **Railway:** $5/mês após trial
- **Neon Database:** Gratuito até 3GB

### Opções Pagas
- **VPS (DigitalOcean):** $5-20/mês
- **AWS/GCP:** $10-50/mês
- **Domínio próprio:** $10-15/ano

---

## Próximos Passos

1. **Escolher opção de deploy**
2. **Configurar banco de dados**
3. **Fazer deploy inicial**
4. **Configurar SSL/domínio**
5. **Testar acesso via tablet**
6. **Configurar backup automático**
7. **Documentar URL para equipe**

---

*Para suporte técnico, documente a opção escolhida e eventuais erros encontrados*