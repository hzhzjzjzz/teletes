import fetch from 'node-fetch';

import moment from 'moment-timezone';

export default {

    command: ['cektrx', 'cekstatus'],

    tags: ['gifar'],

    desc: 'Mengecek status transaksi berdasarkan TrxID.',

    async handler(ctx) {

        // Kredensial akun Anhtronik Anda

        const KODE_RESELLER = 'NF00051';

        const PIN = '967400';

        const PASSWORD = 'gifar123';

        const API_URL = 'http://213.163.206.110:3333/api';

        const text = ctx.message?.text?.split(' ').slice(1).join(' ');

        if (!text) {

            return ctx.reply('❌ Format salah! Masukkan ID transaksi (TrxID).\nContoh: /cektrx 1010');

        }

        const trxId = text.trim();

        const timeFormatted = moment().tz("Asia/Jakarta").format("HHmmss");

        try {

            const response = await fetch(API_URL, {

                method: 'POST',

                headers: {

                    'Content-Type': 'application/json'

                },

                body: JSON.stringify({

                    req: 'cmd',

                    kodereseller: KODE_RESELLER,

                    perintah: `CEK.${trxId}`,

                    time: timeFormatted,

                    pin: PIN,

                    password: PASSWORD

                })

            });

            const result = await response.json();

            if (result.status_code === '0' && result.status === 'Sukses') {

                const message = `✅ *Status Transaksi Ditemukan!*\n\n${result.msg}`;

                await ctx.reply(message, { parse_mode: 'Markdown' });

            } else {

                await ctx.reply(`❌ *Status Transaksi Gagal Dicek*\nStatus: ${result.status}\nAlasan: ${result.msg}`);

            }

        } catch (error) {

            console.error('Error saat melakukan cek transaksi:', error);

            ctx.reply('❌ Terjadi kesalahan saat menghubungi server. Mohon coba lagi nanti.');

        }

    }

};