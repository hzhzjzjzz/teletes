import fetch from 'node-fetch';
import crypto from 'crypto';

export default {
   command: ['cektrxhan', 'statushan'],
   tags: ['gifar'],
   desc: 'Mengecek status transaksi berdasarkan Ref ID.',

   async handler(ctx) {
      // Ganti dengan ID Telegram Anda sebagai pemilik (contoh: '123456789')
      const OWNER_ID = '1284296702';

      // Pengecekan akses owner
      const fromId = ctx.message?.from?.id;
      if (fromId != OWNER_ID) {
          return ctx.reply('❌ Hanya owner bot yang bisa menggunakan perintah ini.');
      }
      
      // Kredensial akun Anhtronik Anda
      const API_ID = 'NZE757663C';
      const API_KEY = '55a0bfa0a802e8fb79262cc20a0ee3af118398d5962f096081140fa71ef3d990';
      const CMD = 'status';
      const API_URL = 'https://anhtronik.com/integration/api/status';

      const text = ctx.message?.text?.split(' ').slice(1).join(' ');
      const refId = text ? text.trim() : null;

      if (!refId) {
         return ctx.reply('❌ Format salah! Masukkan ID referensi transaksi yang ingin dicek.\nContoh: /cektrx INV123456');
      }

      // Membuat signature MD5: api_id + api_key + cmd + ref_id
      const signature = crypto.createHash('md5').update(API_ID + API_KEY + CMD + refId).digest('hex');

      const requestBody = {
         cmd: CMD,
         api_id: API_ID,
         ref_id: refId,
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
            const data = result.data;
            const hargaBaru = data.product_price + 5000;
            
            let message = `✅ *Status Transaksi Ditemukan!*\n`;
            message += `═══════════════════════\n`;
            message += `🆔 Trx ID: *${data.trx_id}*\n`;
            message += `🔗 Ref ID: *${data.ref_id}*\n`;
            message += `📞 Tujuan: *${data.destination}*\n`;
            message += `📦 Produk: *${data.product_name}* (${data.product_code})\n`;
            message += `💰 Harga: Rp ${hargaBaru.toLocaleString('id-ID')}\n`; // Menampilkan harga baru
            message += `📊 Status: *${data.status}*\n`;
            if (data.serial_number) {
                message += `📝 Serial Number: *${data.serial_number}*\n`;
            }
            message += `═══════════════════════\n`;

            await ctx.reply(message.trim(), { parse_mode: 'Markdown' });
         } else {
            await ctx.reply(`❌ *Gagal Cek Status Transaksi:*\nStatus: ${result.status}\nPesan: ${result.message}`);
         }
      } catch (error) {
         console.error('Error saat menghubungi API:', error);
         ctx.reply('❌ Terjadi kesalahan saat menghubungi server. Mohon coba lagi nanti.');
      }
   },
};