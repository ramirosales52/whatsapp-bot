const { GoogleGenAI } = require("@google/genai");
const qrcode = require('qrcode-terminal');
const dotenv = require("dotenv")

dotenv.config()

const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
  authStrategy: new LocalAuth()
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});


client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', (session) => {
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
    const prompt = msg.body.slice(4).trim();
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
});

client.initialize();
