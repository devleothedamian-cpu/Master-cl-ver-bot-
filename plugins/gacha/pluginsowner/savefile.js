// plugins/savefile.js
// Uso (solo owner):
//.savefile plugins/work.js → respondiendo a un mensaje con el código
// También funciona pasando la ruta completa
// Guarda o actualiza cualquier archivo del bot

import fs from 'fs';
import path from 'path';

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const numero = (sender || "").replace(/\D/g, "");
  const fromMe =!!msg.key.fromMe;
  const botID = (conn.user?.id || "").replace(/\D/g, "");

  // ✅ Misma verificación que tu darnivel
  if (!global.isOwner?.(numero) &&!fromMe && numero!== botID) {
    await conn.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
    return conn.sendMessage(chatId, {
      text: "🚫 Solo los owners o el mismo bot pueden usar este comando.",
      quoted: msg
    });
  }

  if (!args?.length) {
    return conn.sendMessage(chatId, {
      text: `✳️ *Uso:*
• *${global.prefix}savefile plugins/work.js*
• *${global.prefix}savefile comandos/ig.js*

*Importante:* Debes *responder* al mensaje que contiene el código que quieres guardar.`,
      quoted: msg
    });
  }

  const filePath = path.resolve(args[0]);

  // Seguridad: que no salga de la carpeta del bot
  if (!filePath.startsWith(process.cwd())) {
    await conn.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
    return conn.sendMessage(chatId, {
      text: "❌ Ruta no permitida. Solo puedes guardar dentro del bot.",
      quoted: msg
    });
  }

  // El código debe venir citado
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
    || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;

  if (!quoted) {
    await conn.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
    return conn.sendMessage(chatId, {
      text: `❌ Debes *responder* al mensaje con el código.\n\n*Ejemplo:*\n1. Manda el código\n2. Responde a ese mensaje con: *${global.prefix}savefile ${args[0]}*`,
      quoted: msg
    });
  }

  try {
    // Crear carpetas si no existen
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const existe = fs.existsSync(filePath);
    fs.writeFileSync(filePath, quoted, 'utf-8');

    await conn.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
    await conn.sendMessage(chatId, {
      text: `✅ *Archivo ${existe? 'ACTUALIZADO' : 'CREADO'}*
📁 *Ruta:* ${args[0]}
👤 *Por:* @${numero}
🤖 *Bot:* ${global.botName}

*Reinicia el bot para aplicar cambios*`,
      mentions: [`${numero}@s.whatsapp.net`],
      quoted: msg
    });

  } catch (e) {
    await conn.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
    conn.sendMessage(chatId, { text: `❌ Error: ${e.message}`, quoted: msg });
  }
};

handler.command = ["savefile", "sf"];
export default handler;