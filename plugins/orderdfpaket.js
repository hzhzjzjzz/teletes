import fetch from 'node-fetch';

import { v4 as uuidv4 } from 'uuid';

export default {

   command: ['belidf', 'orderdf', 'ordergifar'],

   tags: ['transaksi', 'gifar'],

   desc: 'Melakukan pembelian produk melalui API Gifar (Khusus Owner).',

   async handler(ctx) {

      // --- PENAMBAHAN KODE PENGECEKAN OWNER ---

      // Ganti dengan ID Telegram Anda sebagai pemilik

      const OWNER_ID = '1284296702'; // ID dalam bentuk string

      const fromId = ctx.message?.from?.id;

      

      // Mengecek apakah ID pengirim sama dengan OWNER_ID

      // Mengubah fromId menjadi String untuk perbandingan yang aman

      if (String(fromId) !== OWNER_ID) {

          return await ctx.reply("❌ Perintah ini hanya dapat digunakan oleh Owner Bot.");

      }

      // --- AKHIR DARI PENAMBAHAN KODE ---

      // Konstanta API

      const API_KEY = 'EBC2C599-0F51-4C0F-AC5B-197F6B7556C3';

      const BASE_URL = 'https://panel.khfy-store.com/api_v2/trx';

      const text = ctx.message?.text?.split(' ').slice(1).join(' ');

      

      if (!text) {

         return await ctx.reply(

            '*Format salah!* Masukkan kode produk dan nomor tujuan.\nContoh: `/beli BPAL19 087812345678`',

            { parse_mode: 'Markdown' }

         );

      }

      const args = text.split(/\s+/);

      const productCode = args[0];

      const destination = args[1];

      if (!productCode || !destination) {

         return await ctx.reply('❌ Kode produk dan nomor tujuan harus dimasukkan.', { parse_mode: 'Markdown' });

      }

      

      const cleanedDestination = destination.replace(/[^0-9]/g, '');

      const refId = uuidv4();

      

      const API_URL = `${BASE_URL}?produk=${productCode}&tujuan=${cleanedDestination}&reff_id=${refId}&api_key=${API_KEY}`;

      

      try {

         await ctx.reply('⏳ Transaksi Anda sedang diproses, mohon tunggu...');

         

         const response = await fetch(API_URL, { method: 'GET' });

         const result = await response.json();

         if (result.status === 'success') {

            const data = result.data || {};

            

            let message = `🎉 *TRANSAKSI BERHASIL DIPROSES!* 🎉

═══════════════════════

📦 *Produk:* ${productCode}

📞 *Tujuan:* ${cleanedDestination}

🆔 *Ref ID Anda:* \`${refId}\`

💰 *Harga:* ${data.price ? `Rp ${data.price.toLocaleString('id-ID')}` : 'Mohon tunggu update status'}

📊 *Status:* ${result.message || 'PENDING'}

═══════════════════════

`;

            await ctx.reply(message.trim(), { parse_mode: 'Markdown' });

         } else {

            const errorMessage = result.message || 'Terjadi kesalahan tidak diketahui.';

            await ctx.reply(`❌ *Transaksi Gagal:*\nStatus: ${errorMessage}`, { parse_mode: 'Markdown' });

         }

      } catch (error) {

         console.error('Error saat melakukan transaksi:', error);

         await ctx.reply('❌ Terjadi kesalahan koneksi server. Mohon coba lagi nanti.', { parse_mode: 'Markdown' });

      }

   }

};