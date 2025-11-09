import fetch from 'node-fetch';
import crypto from 'crypto';

export default {
   command: ['cekin'],
   tags: ['owner', 'gifar'],
   desc: 'Mengecek stok produk Akrab via Anhtronik.',

   async handler(ctx) {
      // --- Kredensial & Konfigurasi ---
      const OWNER_ID = '1284296702'; // Ganti dengan ID numerik Anda
      const API_ID = 'NZE757663C';
      const API_KEY = '55a0bfa0a802e8fb79262cc20a0ee3af118398d5962f096081140fa71ef3d990';
      const CMD = 'stock_akrab';
      const API_URL = 'https://anhtronik.com/integration/api/stock-akrab';

      // Pengecekan akses owner
      if (ctx.from.id.toString() !== OWNER_ID) {
         return ctx.reply('❌ Perintah ini hanya dapat digunakan oleh Owner.');
      }

      let loadingMessage;
      try {
         // Memberi tahu pengguna bahwa proses sedang berjalan
         loadingMessage = await ctx.reply('⏳ Mohon tunggu, sedang mengambil data stok terbaru...');

         // Membuat signature MD5
         const signature = crypto.createHash('md5').update(API_ID + API_KEY + CMD).digest('hex');

         const requestBody = {
            cmd: CMD,
            api_id: API_ID,
            signature: signature,
         };

         const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
         });

         if (!response.ok) {
            throw new Error(`Gagal menghubungi server. Status: ${response.status}`);
         }

         const result = await response.json();

         let finalMessage;

         // Cek status dari balasan JSON API
         if (result.code === 200 && result.status === 'success') {
            let messageBody = '';
            
            if (result.data && result.data.length > 0) {
               result.data.forEach(item => {
                  const hargaAsli = parseInt(item.price);
                  const hargaJual = hargaAsli + 5000; // Markup harga
                  
                  messageBody += `\n📦 *${item.name}*
   - Kode: \`${item.code}\`
   - Harga: Rp ${hargaJual.toLocaleString('id-ID')}
   - Stok: ${item.stock}\n`;
               });
            } else {
               messageBody = '\n\n_Tidak ada data stok yang tersedia saat ini._';
            }
            
            finalMessage = `✅ *Stok Akrab Tersedia:*\n═══════════════════════${messageBody}`;

         } else {
            // Jika API mengembalikan status gagal
            finalMessage = `❌ *Gagal Cek Stok:*\nStatus: ${result.status}\nPesan: ${result.message}`;
         }

         // Edit pesan "loading" dengan hasil akhir
         await ctx.telegram.editMessageText(
            ctx.chat.id,
            loadingMessage.message_id,
            undefined,
            finalMessage,
            { parse_mode: 'Markdown' }
         );

      } catch (error) {
         // Menangani error koneksi atau error lainnya
         console.error('Error saat menghubungi API:', error);
         
         // Pastikan loadingMessage ada sebelum mencoba mengeditnya
         if (loadingMessage) {
            await ctx.telegram.editMessageText(
               ctx.chat.id,
               loadingMessage.message_id,
               undefined,
               `❌ *Terjadi Kesalahan Koneksi:*\nTerjadi masalah saat mencoba mengambil data. Silakan coba lagi nanti.`,
               { parse_mode: 'Markdown' }
            );
         } else {
            await ctx.reply(`❌ *Terjadi Kesalahan Koneksi:*\nTerjadi masalah saat mencoba mengambil data. Silakan coba lagi nanti.`);
         }
      }
   }
};