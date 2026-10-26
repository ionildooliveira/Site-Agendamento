---
name: gallery-and-media-storage
description: Gerenciamento de fotos e mídia com upload multipart em memória (Multer), integração com Supabase Storage e isolamento por pasta de tenant.
---

# Gallery and Media Storage Skill

Esta skill descreve o fluxo de upload, armazenamento em nuvem e exclusão de arquivos de imagem.

## 1. Arquitetura de Mídia com Supabase Storage

O armazenamento de fotos (fotos de capa do salão e galeria de trabalhos) utiliza o serviço de Object Storage do Supabase:

- **Bucket:** `gallery` (configurado como público para visualização das URLs).
- **Estrutura de Pastas:** Cada tenant possui sua própria pasta isolada:
  `gallery/{tenantId}/{timestamp}-{randomHash}.{ext}`
- **Multer em Memória:** Para compatibilidade total com ambientes serverless (Vercel), o Multer armazena temporariamente o buffer do arquivo em memória:
  `const upload = multer({ storage: multer.memoryStorage() });`

---

## 2. Fluxo de Upload de Imagens (`POST /api/gallery`)

```javascript
// 1. Gera nome único e caminho isolado por tenant
const fileExt = req.file.originalname.split('.').pop();
const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
const filePath = `${req.tenantId}/${fileName}`;

// 2. Faz upload para o bucket
const { error: uploadError } = await supabase.storage
  .from('gallery')
  .upload(filePath, req.file.buffer, {
    contentType: req.file.mimetype,
    upsert: false
  });

// 3. Obtém a URL pública do Supabase
const { data: { publicUrl } } = supabase.storage
  .from('gallery')
  .getPublicUrl(filePath);

// 4. Salva o registro no banco com título e descrição
const { data } = await supabase
  .from('gallery_images')
  .insert({
    company_id: req.tenantId,
    image_url: publicUrl,
    title,
    description
  });
```

---

## 3. Exclusão Limpa com Limpeza de Armazenamento (`DELETE /api/gallery/:id`)

Ao excluir uma imagem no painel, o sistema executa a deleção em duas etapas:
1. Extrai o caminho relativo do arquivo no bucket a partir da URL pública armazenada.
2. Invoca `supabase.storage.from('gallery').remove([filePath])` para liberar espaço em disco.
3. Remove o registro correspondente da tabela `gallery_images`.
