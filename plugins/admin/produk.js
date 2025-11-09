import fetch from 'node-fetch';
import crypto from 'crypto';

export default {
    command: ['listproduk', 'daftarharga'],
    tags: ['produk', 'harga'],
    desc: 'Melihat daftar produk yang tersedia.',

    async handler(ctx) {
        // Ganti dengan kredensial akun Anhtronik Anda
        const API_ID = 'NZE757663C';
        const API_KEY = '55a0bfa0a802e8fb79262cc20a0ee3af118398d5962f096081140fa71ef3d990';
        const CMD = 'product';
        const API_URL = 'https://anhtronik.com/integration/api/product';
        
        const text = ctx.message?.text?.split(' ').slice(1).join(' ');

        // Membuat signature MD5
        const signature = crypto.createHash('md5').update(API_ID + API_KEY + CMD).digest('hex');
        
        let requestBody = {
            cmd: CMD,
            api_id: API_ID,
            signature: signature,
        };

        // Opsi: Tambahkan filter kategori jika ada input teks
        if (text) {
            const categoryId = parseInt(text.trim());
            if (!isNaN(categoryId)) {
                requestBody.category_id = categoryId;
            }
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            
            // Logika untuk menangani respons yang berhasil
            if (response.ok) {
                const result = await response.json();

                if (result.code === 200 && result.status === 'success') {
                    let message = '✅ *Daftar Produk:*\n═══════════════════════\n';
                    
                    if (result.data && result.data.length > 0) {
                        result.data.forEach(item => {
                            message += `\n📦 *${item.name}*\n`;
                            message += `    - Kode: ${item.code}\n`;
                            message += `    - Harga: Rp ${item.price.toLocaleString()}\n`;
                            message += `    - Status: ${item.status}\n`;
                        });
                    } else {
                        message = '❌ *Tidak ada produk yang tersedia saat ini.*';
                    }
                    
                    await ctx.reply(message.trim(), { parse_mode: 'Markdown' });
                } else {
                    // Balasan jika API mengembalikan status gagal dengan format JSON yang benar
                    await ctx.reply(`❌ *Gagal Mendapatkan Daftar Produk:*\nStatus: ${result.status}\nPesan: ${result.message}`);
                }
            } else {
                // Balasan jika HTTP request gagal (misalnya, Timeout atau Server Error)
                throw new Error(`Koneksi Gagal. Server mengembalikan status: ${response.status}`);
            }

        } catch (error) {
            console.error('❌ FATAL ERROR (Koneksi/Reply):', error.message);
            // Menggunakan ctx.reply di dalam catch block untuk mengirim pesan error
            ctx.reply(`❌ *Koneksi Gagal*\n\nTerjadi kesalahan saat menghubungi server. Mohon periksa kembali API URL dan pastikan server Anda mendukung koneksi ke port tersebut.`);
        }
    }
};