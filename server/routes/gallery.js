const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDB } = require('../database/db');
const { authenticateAdmin } = require('../middleware/auth');
const { setTenantId } = require('../middleware/tenant');

// Configurar o multer para armazenar os arquivos na pasta uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// GET /api/gallery
router.get('/', setTenantId, async (req, res) => {
  try {
    const supabase = getDB();
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('company_id', req.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar galeria:', error);
    res.status(500).json({ error: 'Erro ao buscar imagens da galeria' });
  }
});

// POST /api/gallery (admin)
router.post('/', authenticateAdmin, setTenantId, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const { title, description } = req.body;
    
    // O backend roda tipicamente na porta 3001, mas vamos armazenar apenas o caminho relativo
    // para facilitar caso mude de domínio
    const imageUrl = `/uploads/${req.file.filename}`;

    const supabase = getDB();
    const { data, error } = await supabase
      .from('gallery_images')
      .insert({
        company_id: req.tenantId,
        image_url: imageUrl,
        title: title || null,
        description: description || null
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

// DELETE /api/gallery/:id (admin)
router.delete('/:id', authenticateAdmin, setTenantId, async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getDB();

    // 1. Buscar a imagem para saber o arquivo que deve ser deletado
    const { data: image, error: fetchError } = await supabase
      .from('gallery_images')
      .select('image_url')
      .eq('id', id)
      .eq('company_id', req.tenantId)
      .single();

    if (fetchError || !image) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    // 2. Deletar do banco de dados
    const { error: deleteError } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', id)
      .eq('company_id', req.tenantId);

    if (deleteError) throw deleteError;

    // 3. Deletar o arquivo físico localmente
    if (image.image_url.startsWith('/uploads/')) {
      const filename = image.image_url.replace('/uploads/', '');
      const filepath = path.join(__dirname, '../uploads', filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir imagem:', error);
    res.status(500).json({ error: 'Erro ao excluir imagem' });
  }
});

module.exports = router;
