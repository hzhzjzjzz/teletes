import fetch from 'node-fetch';

// Mapping untuk judul kategori, bisa Anda sesuaikan atau tambahkan
const categoryMap = {
    'BEKASANL': '📦 Bonus Akrab L (Bekasan)',
    'BEKASANXL': '📦 Bonus Akrab XL (Bekasan)',
    'BEKASANXXL': '📦 Bonus Akrab XXL (Bekasan)',
    'KUBER': '⚡ Kuota Bersama (Reguler)',
    // Tambahkan mapping kategori lain jika ada
};

export default {
   command: ['listproduk', 'daftarharga', 'cekstok'],
   tags: ['gifar', 'harga'],
   desc: 'Menampilkan daftar produk beserta status stoknya dari API.',

   async handler(ctx) {
      // API Key dan URL dari skrip asli Anda
      const API_KEY = 'EBC2C599-0F51-4C0F-AC5B-197F6B7556C3';
      const API_URL = `https://panel.khfy-store.com/api_v2/list_product?api_key=${API_KEY}`;

      try {
         // Memberi tahu pengguna bahwa permintaan sedang diproses
         await ctx.reply('⏳ Sedang mengambil data produk, mohon tunggu sebentar...');

         const response = await fetch(API_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
         });

         if (!response.ok) {
             throw new Error(`API mengembalikan status ${response.status}: ${response.statusText}`);
         }

         const result = await response.json();

         if (result.ok && result.data && result.data.length > 0) {
            
            // 1. Mengelompokkan data berdasarkan kode provider
            const groupedProducts = result.data.reduce((groups, item) => {
                const providerCode = item.kode_provider;
                if (!groups[providerCode]) {
                    groups[providerCode] = [];
                }
                groups[providerCode].push(item);
                return groups;
            }, {});

            let message = '✅ *Daftar Produk & Stok:*\n═══════════════════════\n';
            
            // 2. Iterasi dan tampilkan per kelompok
            for (const providerCode in groupedProducts) {
                const categoryTitle = categoryMap[providerCode] || `[KATEGORI: ${providerCode}]`;
                message += `\n*— ${categoryTitle} —*\n`;
                
                groupedProducts[providerCode].forEach(product => {
                    const statusText = product.gangguan === 1 ? '⚠️ GANGGUAN' : (product.kosong === 1 ? '🔴 KOSONG' : '🟢 Tersedia');
                    const finalPrice = product.harga_final.toLocaleString('id-ID');
                    
                    // Menampilkan jumlah stok
                    const stockUnit = product.stock !== undefined ? `${product.stock} Unit` : (product.kosong === 0 ? 'YA' : '0'); 

                    message += `\n*${product.nama_produk}* (${product.kode_produk})\n`;
                    message += `   - Harga: *Rp ${finalPrice}*\n`;
                    message += `   - Status: ${statusText}\n`;
                    message += `   - Jumlah Stok: ${stockUnit}\n`;
                    
                    // Membersihkan deskripsi dari karakter yang tidak perlu
                    const cleanDeskripsi = product.deskripsi.replace(/\r\n/g, '\n').replace(/~ /g, '- ');
                    message += `   - Detail: _${cleanDeskripsi}_\n`;
                });
            }

            // Mengirim pesan ke Telegram menggunakan ctx.reply dengan parse_mode Markdown
            await ctx.reply(message.trim(), { parse_mode: 'Markdown' });

         } else {
            const errorMessage = result.message || 'Pesan tidak tersedia';
            await ctx.reply(`❌ *Gagal Mengambil Daftar Produk:*\nStatus: ${result.status || 'T/A'}\nPesan: ${errorMessage}`, { parse_mode: 'Markdown' });
         }
      } catch (error) {
         console.error('Error saat menghubungi API:', error);
         await ctx.reply(`❌ *Terjadi Kesalahan Koneksi:*\n${error.message}`, { parse_mode: 'Markdown' });
      }
   }
};