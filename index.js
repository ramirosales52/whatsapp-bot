const { GoogleGenAI } = require("@google/genai");
const qrcode = require('qrcode-terminal');
const dotenv = require("dotenv")
const schedule = require("node-schedule");

dotenv.config()

const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: "/usr/bin/google-chrome-stable"
  }
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  console.log('WHATSAPP WEB => Authenticated');
});

client.on("ready", async () => {
  console.log("WHATSAPP WEB => Ready");
});

client.on('message', message => {
  if (message.body === '!ping') {
    message.reply('pong');
  }
});

client.on('message', async msg => {
  if (msg.body === 'Sticker') {
    if (msg.hasMedia) {
      msg.downloadMedia().then(media => {
        if (media) {
          try {
            client.sendMessage(
              msg.from,
              media,
              {
                sendMediaAsSticker: true,
                stickerAuthor: 'Bot',
                stickerName: 'Sticker'
              }
            )
          } catch (err) {
            console.log('error ', err);
          }
        }
      })
    }
  }

  if (msg.body === '@todos') {
    const chat = await msg.getChat();
    if (chat.isGroup) {
      let text = '';
      let mentions = [];

      for (let participant of chat.participants) {
        mentions.push(`${participant.id.user}@c.us`);
        text += `@${participant.id.user} `;
      }

      await chat.sendMessage(text, { mentions });
    }
  }

  if (msg.body === '!memide') {
    function meMide() {
      const chance = Math.random();
      if (chance < 0.05) {
        return Math.floor(Math.random() * 31) + 20;
      } else {
        return Math.floor(Math.random() * 21);
      }
    }

    msg.reply(`Te mide ${meMide()} cm 😏`);
  }

  if (msg.body === '!sorteo') {
    const chat = await msg.getChat();
    if (chat.isGroup) {
      const participantes = chat.participants;

      const elegido = participantes[Math.floor(Math.random() * participantes.length)];
      const numero = elegido.id.user;
      const mention = [`${numero}@c.us`];

      await chat.sendMessage(`@${numero} saliste sortea2`, {
        mentions: mention,
      });
    }
  }

  if (msg.body === '!facha') {
    const nivel = Math.floor(Math.random() * 101);
    const barra = '🟥'.repeat(nivel / 10) + '⬛'.repeat(10 - nivel / 10);
    msg.reply(`Nivel de facha: ${nivel}%\n${barra}`);
  }

  if (msg.body.startsWith('!ia ')) {
    const prompt = msg.body.slice(3).trim();
    if (!prompt) return msg.reply("Escribí algo despues de `!ia`");

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Sos normal, si tenes que ser grosero podes. Respuestas de no mas de un parrafo."
        }
      });

      msg.reply(response.text);
    } catch (error) {
      console.error("Error con Gemini:", error);
      msg.reply("Error con la ia");
    }
  }

  if (msg.body.startsWith("!programar")) {
    try {
      const args = msg.body.split(" ");
      if (args.length < 4) {
        return msg.reply("Formato inválido. Usa: !programar dd/mm/yyyy hh:mm mensaje");
      }

      const fechaStr = args[1];
      const horaStr = args[2];
      const mensaje = args.slice(3).join(" ");

      const [dia, mes, anio] = fechaStr.split("/").map(Number);
      const [hora, minutos] = horaStr.split(":").map(Number);

      const fecha = new Date(anio, mes - 1, dia, hora, minutos);

      // Chequeo rápido
      if (isNaN(fecha.getTime())) {
        return msg.reply("Fecha/hora inválida.");
      }
      if (fecha <= new Date()) {
        return msg.reply("La fecha/hora debe ser en el futuro.");
      }

      schedule.scheduleJob(fecha, () => {
        client.sendMessage(msg.from, mensaje);
      });

      msg.reply(`Mensaje programado para el ${fechaStr} a las ${horaStr}`);
    } catch (err) {
      console.error("Error al programar mensaje:", err);
      msg.reply("Hubo un error al programar el mensaje.");
    }
  }

  if (msg.body.startsWith("!resumen")) {
    try {
      const args = msg.body.trim().split(/\s+/);
      if (args.length !== 2 || isNaN(parseInt(args[1]))) {
        return msg.reply("Uso: !resumen [cantMensajes] (1 a 50)");
      }

      let cantidad = parseInt(args[1]);
      if (cantidad < 1) cantidad = 1;
      if (cantidad > 50) cantidad = 50;

      const chat = await msg.getChat();
      const mensajes = await chat.fetchMessages({ limit: cantidad + 1 });

      const textoMensajes = mensajes
        .filter(m => m.id._serialized !== msg.id._serialized)
        .reverse()
        .map(m => `${m._data.notifyName || m.from}: ${m.body}`)
        .join("\n");

      const prompt = `Resumí estos últimos ${cantidad} mensajes del chat: ${textoMensajes}`;

      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Resume los siguientes mensajes de WhatsApp de forma breve y clara."
        }
      });

      msg.reply(
        response.text || "No pude generar el resumen."
      );

    } catch (error) {
      console.error("Error en resumen:", error);
      msg.reply("Error al generar el resumen.");
    }
  }
});

client.initialize();
