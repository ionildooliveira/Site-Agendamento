---
name: security-auth-and-notifications
description: Segurança da aplicação, autenticação JWT, hashing bcrypt, troca de credenciais e fluxo transacional de recuperação de senha por e-mail via Nodemailer.
---

# Security, Auth and Notifications Skill

Esta skill descreve os protocolos de proteção, criptografia e mensageria da plataforma.

## 1. Autenticação e Gestão de Sessão do Lojista

- **Algoritmo de Hash:** `bcryptjs` com 10 salt rounds na criação ou alteração de senhas.
- **JSON Web Tokens (JWT):** Assinados com a chave secreta `JWT_SECRET` e expiração de 24 horas.
- **Payload do Token:**
  ```json
  {
    "id": 1,
    "email": "contato@studiobeauty.com",
    "name": "Admin - Studio Beauty",
    "company_id": "11111111-1111-1111-1111-111111111111"
  }
  ```
- **Middleware de Autenticação (`authenticateAdmin`):**
  Lê o header `Authorization: Bearer <token>`. Rejeita com status `401` se ausente e `403` se expirado ou adulterado.

---

## 2. Fluxo Transacional de Recuperação de Senha

O sistema implementa recuperação de senha sem expor tokens abertos no banco de dados:

```
1. Administrador solicita recuperação informando seu e-mail no login
2. Backend busca usuário na empresa correspondente
3. Gera um token JWT específico com validade estrita de 15 minutos:
   jwt.sign({ reset_password_admin_id: admin.id }, JWT_SECRET, { expiresIn: '15m' })
4. Monta link personalizado com o slug da empresa:
   https://app.com/{companySlug}/admin/reset-password?token={token}
5. Envia e-mail formatado em HTML via Nodemailer (SMTP)
6. Na tela de redefinição, backend valida o token JWT e aplica o novo hash bcrypt
```

---

## 3. Atualização Segura de Credenciais (`PUT /api/auth/admin/credentials`)

Para alterar e-mail ou senha no painel administrativo:
1. O lojista **deve obrigatoriamente** fornecer a senha atual (`currentPassword`).
2. O backend valida a senha atual via `bcrypt.compareSync`.
3. Se um novo e-mail for fornecido, valida se já não pertence a outro administrador no sistema.
4. Se uma nova senha for fornecida, exige tamanho mínimo de 6 caracteres.
