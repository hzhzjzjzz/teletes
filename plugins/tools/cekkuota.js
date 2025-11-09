import fetch from 'node-fetch';

import moment from 'moment-timezone';

// --- FUNGSI HELPER (TETAP SAMA) ---

function parseDataToGB(dataString) {

   if (typeof dataString !== 'string') return 0;

   if (dataString.includes('/')) {

      dataString = dataString.split('/')[0].trim();

   }

   if (dataString.endsWith('GB')) {

      const value = parseFloat(dataString.replace('GB', ''));

      return isNaN(value) ? 0 : value;

   } else if (dataString.endsWith('MB')) {

      const value = parseFloat(dataString.replace('MB', ''));

      return isNaN(value) ? 0 : value / 1024;

   } else if (dataString.endsWith('KB')) {

      const value = parseFloat(dataString.replace('KB', ''));

      return isNaN(value) ? 0 : value / (1024 * 1024);

   } else {

      return 0;

   }

}

async function cek(number) {

   const url = `https://web.garaaa.biz.id/cekxl?msisdn=${number}`;

   try {

      const headers = { 'User-Agent': 'Mozilla/5.0' };

      const response = await fetch(url, { headers: headers });

      if (!response.ok) return { success: false, error: `API merespon dengan status ${response.status}` };

      return await response.json();

   } catch (error) {

      return { success: false, error: 'Gagal menghubungi API.' };

   }

}

// --- FUNGSI LOGIKA UTAMA (BARU) ---

// Kita 'export' fungsi ini agar bisa dipanggil dari 'index.js'

export async function executeCek(ctx, numberInput) {

   // Cek validasi sederhana di sini

   if (!numberInput || numberInput.trim() === '') {

      return ctx.reply('❌ Nomor tidak boleh kosong.');

   }

   

   // Memberi tahu pengguna bahwa proses sedang berjalan

   const loadingMessage = await ctx.reply('🔍 Sedang mengambil data, mohon tunggu...');

 

   try {

      const numbers = numberInput.split(/[,\s\n]+/).filter(num => num.trim() !== '');

      let allResults = '';

      for (const num of numbers) {

         const cleanedNumber = num.replace(/[^0-9]/g, '');

         let formattedNumber;

         if (cleanedNumber.startsWith('62')) {

            formattedNumber = '0' + cleanedNumber.substring(2);

         } else if (cleanedNumber.startsWith('8')) {

            formattedNumber = '0' + cleanedNumber;

         } else {

            formattedNumber = cleanedNumber;

         }

         if (formattedNumber.length < 10 || formattedNumber.length > 14) {

            allResults += `*Nomor ${num} tidak valid.*\n═══════════════════════\n`;

            continue;

         }

         const data = await cek(formattedNumber);

         if (data && data.success === true && typeof data.data === 'string') {

            const separator = 'Detail Kuota:';

            const parts = data.data.split(separator);

            const mainInfoString = parts[0];

            const kuotaInfoString = parts.length > 1 ? parts[1].trim() : '';

            

            const mainInfoLines = mainInfoString.split('\n');

            const parsedMainInfo = {};

            for (const line of mainInfoLines) {

               const lineParts = line.split(':');

               if (lineParts.length === 2) {

                  parsedMainInfo[lineParts[0].trim()] = lineParts[1].trim();

               }

            }

            

            let caption = `

📒 *Nomor* : ${parsedMainInfo['Nomor'] || ''}

📡 *Tipe* : ${parsedMainInfo['Tipe Kartu'] || ''}

📶 *Status* : ${parsedMainInfo['Status 4G'] || ''}

📜 *Dukcapil*: ${parsedMainInfo['Status Dukcapil'] || ''}

⏳ *Umur* : ${parsedMainInfo['Umur Kartu'] || ''}

📅 *Aktif* : ${parsedMainInfo['Masa Aktif'] ? moment(parsedMainInfo['Masa Aktif']).format('DD MMMM YYYY') : ''}

📅 *Tenggang*: ${parsedMainInfo['Masa Berakhir Tenggang'] ? moment(parsedMainInfo['Masa Berakhir Tenggang']).format('DD MMMM YYYY') : ''}

═══════════════════════`;

            if (kuotaInfoString) {

               const packageBlocks = kuotaInfoString.split(/\n\s*\n/).filter(b => b.trim() !== '');

               for (const block of packageBlocks) {

                  const packageLines = block.trim().split('\n');

                  const packageName = packageLines[0].trim();

                  let totalPackageGB = 0;

                  const isPaketAkrabUtama = packageName.toLowerCase() === 'paket akrab';

                  let benefitLineCounter = 0;

                  

                  caption += `\n📦 *${packageName}*\n`;

                  for (const line of packageLines.slice(1)) {

                     const trimmedLine = line.trim();

                     if (trimmedLine.startsWith('-')) {

                        const benefitLine = trimmedLine.substring(1).trim();

                        if (benefitLine.includes(':')) {

                           const [key, value] = benefitLine.split(':').map(s => s.trim());

                           caption += `- ${key} : ${value}\n`;

                           if (value.includes('/')) {

                              benefitLineCounter++;

                              if (isPaketAkrabUtama) {

                                 if (benefitLineCounter === 2) totalPackageGB += parseDataToGB(value);

                              } else {

                                 totalPackageGB += parseDataToGB(value);

                              }

                           }

                        }

                     } else {

                        caption += `${trimmedLine}\n`;

                     }

                  }

                  caption += `\n🧮 *Total Semua* : ${totalPackageGB.toFixed(2)} GB\n`;

                  caption += `═══════════════════════`;

               }

            }

            allResults += caption;

         } else {

            const errorMessage = data.error || `Gagal mendapatkan data untuk nomor ${num}.`;

            allResults += `*Nomor ${num}:* ${errorMessage}\n═══════════════════════\n`;

         }

      }

   

      allResults += '\nGFROFFICIALSTORE✅';

      

      // Edit pesan "loading" dengan hasil akhir

      await ctx.telegram.editMessageText(

         ctx.chat.id,

         loadingMessage.message_id,

         undefined,

         allResults.trim(),

         { parse_mode: 'Markdown' }

      );

   } catch (error) {

      console.error('Error pada handler cek kuota:', error);

      // Jika terjadi error, edit pesan "loading" dengan pesan error

      await ctx.telegram.editMessageText(

         ctx.chat.id,

         loadingMessage.message_id,

         undefined,

         '❌ Terjadi kesalahan saat memproses permintaan Anda.'

      );

   }

}

// --- HANDLER PERINTAH (YANG DIMODIFIKASI) ---

export default {

   command: ['ceksaldo', 'cekkartu', 'cekpaket', 'cekkuota', 'dompul', 'cek', 'axis', 'xl'],

   tags: ['tools'],

   desc: 'Mengecek sisa kuota dan info kartu XL/Axis.',

   async handler(ctx) {

      const text = ctx.message?.text?.split(' ').slice(1).join(' ');

      

      if (!text) {

         // --- BAGIAN BARU: JIKA TIDAK ADA NOMOR, MINTA NOMOR ---

         

         // 1. Set Sesi

         ctx.session.awaiting = 'cek';

         

         // 2. Kirim pesan permintaan

         const promptMsg = await ctx.reply('Masukan nomor ...\nBisa massal, pisahkan dengan Enter.\n\nKetik "exit" untuk membatalkan');

         

         // 3. Set Timeout 30 detik

         setTimeout(async () => {

            // Cek apakah sesinya masih ada (belum dibalas)

            if (ctx.session && ctx.session.awaiting === 'cek') {

               ctx.session.awaiting = null; // Hapus sesi

               await ctx.reply('⏰ Waktu input habis (30 detik)\nSilakan ketik /cek untuk mengulang');

               

               // Coba hapus pesan "Masukan nomor..."

               try { 

                  await ctx.telegram.deleteMessage(ctx.chat.id, promptMsg.message_id); 

               } catch(e) {

                  // biarkan jika gagal (mungkin sudah dihapus)

               }

            }

         }, 30000); // 30000 milidetik = 30 detik

      } else {

         // --- CARA LAMA: JIKA ADA NOMOR, LANGSUNG EKSEKUSI ---

         return executeCek(ctx, text);

      }

   }

};