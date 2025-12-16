# A-Hub - Associação Cristofoli

Portal PWA responsivo para associados da Cristofoli, com foco em gestão de locações de espaços, carteirinha digital de associado e sistema de pontuação por participação em eventos.

## Funcionalidades

### Usuário Comum (Associado)
- Visualizar e locar espaços disponíveis
- Carteirinha digital com QR Code
- Escanear QR codes de eventos para ganhar pontos
- Visualizar histórico de pontos e eventos participados

### Administrador
- CRUD completo de usuários
- CRUD completo de espaços
- CRUD completo de eventos
- Gerenciar todas as locações
- QR codes dinâmicos para eventos (renovação automática a cada hora)
- Ajustar pontuações dos usuários

## Módulos

### Locação de Espaços
- Área Gourmet (R$ 350,00 - até 30 pessoas)
- Salão de Festas (R$ 1.250,00 - até 150 pessoas)
- Prevenção de conflito de datas
- Histórico de locações por usuário

### Carteirinha Digital
- Nome completo, data de nascimento, matrícula
- Foto do associado
- ID Único com QR Code
- Validade automática de 1 ano

### Sistema de Pontuação (Association-Points)
- Pontos acumulados via eventos
- Pontuação permanente (não expira)
- Histórico completo de transações

### Eventos
- QR Code dinâmico (válido por 1 hora)
- Limite de escaneamentos por usuário
- Pontos configuráveis por evento

## Tecnologias

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (estilização)
- **Zustand** (gerenciamento de estado)
- **React Router v6** (navegação)
- **QRCode.react** (geração de QR codes)
- **html5-qrcode** (leitura de QR codes)
- **date-fns** (manipulação de datas)
- **Lucide React** (ícones)

## Instalação

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## Credenciais de Demo

### Administrador
- Email: `admin@cristofoli.com.br`
- Senha: `admin123`

### Associado
- Email: `associado@cristofoli.com.br`
- Senha: `user123`

## Estrutura do Projeto

```
src/
├── components/
│   ├── layout/          # Header, Sidebar, BottomNav, Layout
│   └── ui/              # Button, Card, Modal, Input, etc.
├── pages/
│   ├── admin/           # Dashboard, Users, Spaces, Events, Bookings
│   └── user/            # Home, Spaces, Membership, Events, Points, Profile
├── store/               # Zustand stores (useStore, useAuthStore)
├── types/               # TypeScript interfaces
└── App.tsx              # Rotas e componentes principais
```

## Style Guide

### Cores
- **Primary:** #0066CC (corporate blue)
- **Secondary:** #00A86B (success green)
- **Accent:** #FF6B35 (highlight orange)
- **Background:** #F8F9FA (light grey)
- **Text:** #212529 (dark grey)
- **Cards:** #FFFFFF (white)

### Design
- Layout baseado em cards
- Espaçamento padrão: 16px
- Bordas arredondadas: 8px
- Tipografia: Inter
- Totalmente responsivo (mobile-first)

## PWA

O aplicativo está configurado como PWA com:
- Manifest.json para instalação
- Service Worker para cache offline
- Meta tags para iOS e Android
- Ícones em múltiplos tamanhos

## Licença

Projeto proprietário da Associação Cristofoli.
