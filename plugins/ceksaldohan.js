import fetch from 'node-fetch';

import crypto from 'crypto';

export default {

   command: ['ceksaldo', 'saldo'],

   tags: ['gifar'],

   desc: 'Mengecek saldo akun.',

   async handler(ctx) {

      // Ganti dengan ID Telegram Anda sebagai pemilik (contoh: '123456789')

      const OWNER_ID = '1284296702';

      // Pengecekan akses owner

      const fromId = ctx.message?.from?.id;

      if (fromId != OWNER_ID) {

          return ctx.reply('❌ Hanya owner bot yang bisa menggunakan perintah ini.');

      }

      

      // Kredensial akun Anhtronik Anda yang sebenarnya

      const API_ID = 'NZE757663C';

      const API_KEY = '55a0bfa0a802e8fb79262cc20a0ee3af118398d5962f096081140fa71ef3d990';

      const CMD = 'balance';

      const API_URL = 'https://anhtronik.com/integration/api/balance';

      // Membuat signature MD5

      const signature = crypto.createHash('md5').update(API_ID + API_KEY + CMD).digest('hex');

      const requestBody = {

         cmd: CMD,

         api_id: API_ID,

         signature: signature,

      };

      try {

         const response = await fetch(API_URL, {

            method: 'POST',

            headers: {

               'Content-Type': 'application/json',

            },

            body: JSON.stringify(requestBody),

         });

         const result = await response.json();

         if (result.code === 200 && result.status === 'success') {

            const balance = result.data.balance;

            const formattedBalance = `Rp ${balance.toLocaleString('id-ID')}`;

            

            let message = `✅ *Informasi Saldo*\n` +

                          `═══════════════════════\n` +

                          `👤 Nama: ${result.data.name}\n` +

                          `💰 Saldo: ${formattedBalance}\n` +

                          `═══════════════════════\n`;

            await ctx.reply(message.trim(), { parse_mode: 'Markdown' });

         } else {

            await ctx.reply(`❌ *Gagal Cek Saldo:*\nStatus: ${result.status}\nPesan: ${result.message}`);

         }

      } catch (error) {

         console.error('Error saat menghubungi API:', error);

         ctx.reply('Terjadi kesalahan saat menghubungi server. Mohon coba lagi nanti.');

      }

   },

};