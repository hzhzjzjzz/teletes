import fetch from 'node-fetch';

export default {

   command: ['cekstok1', 'stokakrab'],

   tags: ['gifar', 'store'],

   desc: 'Mengecek stok produk Akrab yang tersedia melalui API.',

   async handler(ctx) {

      // URL API untuk cek stok

      const API_URL = 'https://panel.khfy-store.com/api_v3/cek_stock_akrab';

      try {

         // Memberi tahu pengguna bahwa proses sedang berjalan

         await ctx.reply('⏳ Mohon tunggu, sedang mengambil data stok terbaru...');

         const response = await fetch(API_URL);

         // Jika respons dari server tidak OK (misal: error 404, 500)

         if (!response.ok) {

             throw new Error(`Gagal menghubungi server. Status: ${response.status}`);

         }

         const result = await response.json();

         // Cek status dari balasan JSON API

         if (result.ok && result.data && result.data.length > 0) {

            

            // 1. Kelompokkan data berdasarkan nama produk untuk tampilan yang lebih rapi

            const groupedProducts = result.data.reduce((groups, item) => {

                let category = '📦 Produk Lainnya'; // Kategori default

                if (item.nama.startsWith('Bonus Akrab L')) {

                    category = '🔹 Bonus Akrab L';

                } else if (item.nama.startsWith('Bonus Akrab XXL')) {

                    category = '🔸 Bonus Akrab XXL';

                } else if (['SuperMini', 'Mini', 'Big', 'Jumbo', 'MegaBig'].some(prefix => item.nama.startsWith(prefix))) {

                    category = '⚡ Paket Akrab Reguler';

                }

                

                if (!groups[category]) {

                    groups[category] = [];

                }

                groups[category].push(item);

                return groups;

            }, {});

            let message = '✅ *Daftar Stok Produk Akrab*\n═══════════════════════\n';

            

            // 2. Iterasi dan buat pesan per kelompok

            for (const category in groupedProducts) {

                message += `\n*— ${category} —*\n`;

                

                groupedProducts[category].forEach(product => {

                    const isAvailable = product.sisa_slot > 0;

                    const statusEmoji = isAvailable ? '🟢' : '🔴';

                    const statusText = isAvailable ? `Tersedia (${product.sisa_slot} Slot)` : 'Kosong';

                    

                    message += `\n*${product.nama}*\n`;

                    // Menggunakan backtick ` untuk format 'code' di Telegram

                    message += `   - Kode: \`${product.type}\`\n`; 

                    message += `   - Status: ${statusEmoji} ${statusText}\n`;

                });

            }

            // Mengirim pesan ke Telegram menggunakan ctx.reply dengan parse_mode Markdown

            await ctx.reply(message.trim(), { parse_mode: 'Markdown' });

         } else {

            // Jika API mengembalikan status `ok: false` atau data kosong

            const errorMessage = result.message || 'Data produk tidak ditemukan.';

            await ctx.reply(`❌ *Gagal Mengambil Data:*\n${errorMessage}`, { parse_mode: 'Markdown' });

         }

      } catch (error) {

         // Menangani error koneksi atau error lainnya

         console.error('Error saat menghubungi API:', error);

         await ctx.reply(`❌ *Terjadi Kesalahan Koneksi:*\nTerjadi masalah saat mencoba mengambil data. Silakan coba lagi nanti.`, { parse_mode: 'Markdown' });

      }

   }

};