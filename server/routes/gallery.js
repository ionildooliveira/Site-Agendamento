const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getDB } = require('../database/db');
const { authenticateAdmin } = require('../middleware/auth');
const { setTenantId } = require('../middleware/tenant');

// Configurar o multer para armazenar os arquivos na memória (necessário para serverless)
const upload = multer({ storage: multer.memoryStorage() });

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
    const supabase = getDB();
    
    // Gerar nome de arquivo único
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
    const filePath = `${req.tenantId}/${fileName}`;

    // Fazer upload para o bucket 'gallery'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no Supabase Storage:', uploadError);
      throw uploadError;
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath);

    // Salvar no banco de dados com a URL completa do Supabase
    const { data, error } = await supabase
      .from('gallery_images')
      .insert({
        company_id: req.tenantId,
        image_url: publicUrl,
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

    // 2. Extrair o caminho do arquivo do Supabase Storage se for uma URL do Supabase
    if (image.image_url.includes('/storage/v1/object/public/gallery/')) {
      const filePath = image.image_url.split('/storage/v1/object/public/gallery/')[1];
      
      // Deletar do Storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('gallery')
          .remove([filePath]);
          
        if (storageError) {
          console.error('Erro ao deletar arquivo do storage:', storageError);
          // Continua mesmo se falhar no storage, para não deixar dados órfãos no BD
        }
      }
    }

    // 3. Deletar do banco de dados
    const { error: deleteError } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', id)
      .eq('company_id', req.tenantId);

    if (deleteError) throw deleteError;

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir imagem:', error);
    res.status(500).json({ error: 'Erro ao excluir imagem' });
  }
});

module.exports = router;
