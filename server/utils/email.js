const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || '',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
};

const sendRecoveryEmail = async (to, resetLink, companyName = 'Studio Beauty') => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER || `"${companyName}" <no-reply@studiobeauty.com>`,
    to,
    subject: `Recuperação de Senha - ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Recuperação de Senha</h2>
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no ${companyName}.</p>
        <p>Se você não fez essa solicitação, pode ignorar este e-mail. Caso contrário, clique no botão abaixo para redefinir sua senha:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Redefinir Minha Senha</a>
        </div>
        <p style="font-size: 12px; color: #666;">
          Ou copie e cole o seguinte link no seu navegador:<br>
          <a href="${resetLink}" style="color: #0066cc; word-break: break-all;">${resetLink}</a>
        </p>
        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 40px;">
          Este link é válido por 15 minutos.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return false;
  }
};

module.exports = {
  sendRecoveryEmail
};
