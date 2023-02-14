const qrcode = require('qrcode-terminal');
const fs = require('fs');
const mime = require('mime-types')

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth()
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
	if(message.body === '!ping') {
		message.reply('pong');
	}
});


client.on('message', async msg => {
    if (msg.body === 'Sticker' && msg.type === 'image'){
        if(msg.hasMedia) {
            msg.downloadMedia().then(media => {
                if (media){
                    const mediaPath = './upload/';
                    if (!fs.existsSync(mediaPath)){
                        fs.mkdirSync(mediaPath)
                    }
                    const extension = mime.extension(media.mimetype);
                    const filename = new Date().getTime();
                    const fullname = mediaPath + filename + '.' + extension;
                    try {
                        fs.writeFileSync(fullname, media.data, {ecoding: 'base64'});
                        MessageMedia.fromFilePath(filePath = fullname)
                        client.sendMessage(msg.from, new MessageMedia(media.mimetype, media.data, filename), { sendMediaAsSticker:true, stickerAuthor:'Bot', stickerName:'Sticker' })
                        fs.unlinkSync(fullname)
                    } catch(err) {
                        console.log('error ', err);
                    }
                }
            })
        }
    }
   
});

client.initialize();

