// plugins/getcode.js
// Uso (solo owner):
//   .getcode plugins/work.js      → muestra el código del archivo
//   .getcode comandos/ig.js       → también funciona con rutas
//   Máximo 4000 caracteres por mensaje, si es más largo te manda en partes

import fs from 'fs';
import path from 'path';

function chunkText(text, size = 3500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

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
- *${global.prefix}getcode plugins/work.js*
- *${global.prefix}getcode comandos/ig.js*
- *${global.prefix}getcode config.json*

Te muestra el código completo del archivo.`,
      quoted: msg
    });
  }

  const filePath = path.resolve(args[0]);

  // Seguridad: que no salga de la carpeta del bot
  if (!filePath.startsWith(process.cwd())) {
    await conn.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
    return conn.sendMessage(chatId, {
      text: "❌ Ruta no permitida. Solo puedes leer archivos del bot.",
      quoted: msg
    });
  }

  if (!fs.existsSync(filePath)) {
    await conn.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
    return conn.sendMessage(chatId, {
      text: `❌ El archivo no existe:\n*${args[0]}*`,
      quoted: msg
    });
  }

  try {
    await conn.sendMessage(chatId, { react: { text: "⏳", key: msg.key } });
    
    let content = fs.readFileSync(filePath, "utf-8");
    const ext = path.extname(filePath).slice(1) || "txt";

    // Si es muy largo lo parte en varios mensajes
    const chunks = chunkText(content);

    await conn.sendMessage(chatId, { react: { text: "✅", key: msg.key } });
    await conn.sendMessage(chatId, {
      text: `📁 *Archivo:* ${args[0]}\n📊 *Tamaño:* ${(content.length / 1024).toFixed(2)} KB\n📄 *Parte 1/${chunks.length}*`,
      quoted: msg
    });

    for (let i = 0; i < chunks.length; i++) {
      await conn.sendMessage(chatId, {
        text: `\`\`${ext}\n${chunks[i]}\n\`\``,
        quoted: msg
      });
    }

  } catch (e) {
    await conn.sendMessage(chatId, { react: { text: "❌", key: msg.key } });
    conn.sendMessage(chatId, { text: `❌ Error al leer: ${e.message}`, quoted: msg });
  }
};

handler.command = ["getcode", "gc"];
export default handler;