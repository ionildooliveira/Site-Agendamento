const bcrypt = require('bcryptjs');
const { getDB } = require('./db');

function seedDatabase() {
  const db = getDB();

  // Only seed once
  const { count } = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
  if (count > 0) return;

  console.log('🌱 Populando banco de dados com dados iniciais...');

  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminHash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO admin_users (name, email, password_hash) VALUES (?, ?, ?)`)
    .run('Administrador', 'admin@studiobeauty.com', adminHash);

  // ── Professionals ─────────────────────────────────────────────────────────
  const insertPro = db.prepare(
    `INSERT INTO professionals (name, role, bio, specialties) VALUES (?, ?, ?, ?)`
  );
  [
    ['Ana Paula',     'Cabeleireira & Colorista',   'Especialista em mechas, visagismo e colorações de alta performance com 10 anos de experiência.', '["Corte Feminino","Coloração","Escova"]'],
    ['Carla Mendes',  'Cabeleireira & Tratamentos', 'Apaixonada por saúde capilar, cronograma capilar e cortes modernos e sofisticados.', '["Hidratação","Escova","Corte Feminino"]'],
    ['Fernanda Costa','Manicure & Estética',        'Especialista em unhas perfeitas, spa dos pés e design de sobrancelhas harmônicas.', '["Manicure","Pedicure","Sobrancelha"]'],
  ].forEach(p => insertPro.run(...p));

  // ── Services ──────────────────────────────────────────────────────────────
  const insertSvc = db.prepare(
    `INSERT INTO services (name, description, price, duration_minutes, category) VALUES (?, ?, ?, ?, ?)`
  );
  [
    ['Corte Feminino', 'Corte personalizado com lavagem e finalização. Realçamos o melhor do seu visual com técnicas modernas.',          80,  60,  'Cabelo'],
    ['Corte Masculino','Corte moderno e preciso com acabamento impecável e estilo que combina com você.',                                  45,  30,  'Cabelo'],
    ['Escova',         'Escova modeladora com proteção térmica para um resultado brilhante e duradouro.',                                  60,  45,  'Cabelo'],
    ['Hidratação',     'Tratamento profundo para restaurar o brilho, a maciez e a saúde dos seus fios.',                                   90,  60,  'Tratamento'],
    ['Manicure',       'Cuidado completo para suas mãos: cutículas, lixamento e esmaltação à sua escolha.',                               35,  45,  'Unhas'],
    ['Pedicure',       'Tratamento completo para os pés com hidratação e esmaltação para um acabamento perfeito.',                        45,  60,  'Unhas'],
    ['Coloração',      'Coloração profissional com produtos de alta qualidade, lavagem e finalização incluídas.',                         150, 120, 'Cabelo'],
    ['Sobrancelha',    'Design e modelagem de sobrancelha para um olhar marcante, harmônico e expressivo.',                                25,  30,  'Estética'],
  ].forEach(s => insertSvc.run(...s));

  // ── Default Settings ──────────────────────────────────────────────────────
  db.prepare(`
    INSERT OR IGNORE INTO settings (id, working_hours, slot_interval)
    VALUES (1, '{"0":null,"1":{"open":"09:00","close":"19:00"},"2":{"open":"09:00","close":"19:00"},"3":{"open":"09:00","close":"19:00"},"4":{"open":"09:00","close":"19:00"},"5":{"open":"09:00","close":"19:00"},"6":{"open":"09:00","close":"17:00"}}', 30)
  `).run();

  console.log('✅ Banco de dados populado! Admin: admin@studiobeauty.com / admin123');
}

module.exports = { seedDatabase };
