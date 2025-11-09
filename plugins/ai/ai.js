import axios from 'axios'; // Added semicolon
import fs from 'fs'; // Added semicolon
import path from 'path'; // Added semicolon
import { config } from '../../config.js'; // Added semicolon

// Daftar model AI
const listmodel = [
    'gpt-4.1-nano','gpt-4.1-mini','gpt-4.1','o4-mini','deepseek-r1',
    'deepseek-v3','claude-3.7','gemini-2.0','grok-3-mini','qwen-qwq-32b',
    'gpt-4o','o3','gpt-4o-mini','llama-3.3'
]; // Added semicolon

// Default user settings
const defaultSettings = {
    model: 'grok-3-mini',
    system_prompt: 'Be a helpful AI assistant.',
    auto: false
}; // Added semicolon

// Lokasi database JSON
const dbPath = path.resolve('./json/ai-custom.json'); // Added semicolon

// Load user settings
function loadUserSettings() {
    try {
        if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(path.dirname(dbPath), { recursive: true });
            fs.writeFileSync(dbPath, '{}');
        }
        return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch (e) {
        console.error('❗️ Gagal load settings:', e); // Fixed emoji
        return {};
    }
}

// Simpan user settings
function saveUserSettings(settings) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(settings, null, 2), 'utf-8');
    } catch (e) {
        console.error('❗️ Gagal simpan settings:', e); // Fixed emoji
    }
}

// Panggil API AI
async function chatai(q, model, system_prompt) {
    if (!listmodel.includes(model)) {
        return { error: `❌ Model tidak tersedia:\n${listmodel.map(m => `• ${m}`).join('\n')}` }; // Fixed emoji and bullet
    }

    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://ai-interface.anisaofc.my.id/'
    }; // Added semicolon

    const data = {
        question: q,
        model,
        system_prompt
    }; // Added semicolon

    try {
        const res = await axios.post('https://ai-interface.anisaofc.my.id/api/chat', data, { headers, timeout: 15000 });
        return res.data;
    } catch (e) {
        const errorMsg = e.response?.data?.message || e.message || 'Request gagal';
        console.error('API Error:', e); // Log the full error for debugging
        return { error: `❌ ${errorMsg}` }; // Fixed emoji
    }
}

// Fungsi helper process AI
async function processAI(ctx, query, current) {
    try {
        await ctx.reply('⏳ *Sedang berpikir...*', { parse_mode: 'Markdown' }); // Fixed emoji
        const res = await chatai(query, current.model, current.system_prompt);

        if (res.error) {
            return await ctx.reply(`❌ *Gagal:* ${res.error}`, { parse_mode: 'Markdown' }); // Fixed emoji
        }

        // Basic check for response existence
        if (!res.response) {
             return await ctx.reply(`❌ *Gagal:* Tidak menerima respons dari AI.`, { parse_mode: 'Markdown' });
        }

        // Format balasan
        const replyText = `┌───〔 💬 *Jawaban dari ${current.model}* 〕───┐
${res.response}
└───────────────┘`; // Fixed formatting and emojis

        return await ctx.reply(replyText, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });
    } catch (e) {
        console.error('Process AI Error:', e); // Log the full error
        return await ctx.reply(`⚠️ *Terjadi kesalahan:* ${e.message}`, { parse_mode: 'Markdown' }); // Fixed emoji
    }
}

// Export plugin
export default {
    command: ['ai', 'aion', 'aioff'],
    tags: ['ai'],
    desc: '💬 Auto AI: Semua chat otomatis dijawab AI (bisa on/off)', // Fixed emoji

    async handler(ctx, next) {
        const sender = ctx.from?.id?.toString();
        const text = ctx.message?.text?.trim();

        if (!text || !sender) return next(); // Pastikan sender ada

        const userSettings = loadUserSettings();
        if (!userSettings[sender]) {
            userSettings[sender] = { ...defaultSettings };
        }
        const current = userSettings[sender];

        // Toggle Auto ON
        if (text === '/aion') {
            current.auto = true;
            saveUserSettings(userSettings);
            return await ctx.reply(`✅ *Auto AI diaktifkan!*\nSekarang semua pesanmu akan dijawab AI.`, { parse_mode: 'Markdown' }); // Fixed emoji
        }

        // Toggle Auto OFF
        if (text === '/aioff') {
            current.auto = false;
            saveUserSettings(userSettings);
            return await ctx.reply(`🚫 *Auto AI dimatikan!*\nGunakan \`/ai pertanyaanmu\` untuk manual.`, { parse_mode: 'Markdown' }); // Fixed emoji
        }

        // Set model & prompt
        if (text.toLowerCase().startsWith('/ai set')) {
            const input = text.slice(7).split('|').map(i => i.trim());
            const model = input[0];
            const system_prompt = input[1];

            if (!model || !listmodel.includes(model)) {
                return await ctx.reply(`🚫 *Model tidak valid!*\nModel tersedia:\n${listmodel.map(m => `• ${m}`).join('\n')}`, { parse_mode: 'Markdown' }); // Fixed emoji and bullet
            }

            if (!system_prompt) {
                return await ctx.reply(`📝 *Prompt kosong!*\nContoh: /ai set gpt-4o | Kamu asisten pemrograman`, { parse_mode: 'Markdown' }); // Fixed emoji
            }

            current.model = model;
            current.system_prompt = system_prompt;
            saveUserSettings(userSettings);
            return await ctx.reply(`✅ Pengaturan tersimpan!\n📦 Model: ${model}\n🧠 Prompt: ${system_prompt}`, { parse_mode: 'Markdown' }); // Fixed emojis
        }

        // Menu /ai
        if (text === '/ai') {
            const menuText = `┌───〔 🤖 ${config.BOTNAME} AI 〕───┐
│ 💬 Ketik apa saja, bisa auto dijawab AI!
│
│ ⚙️ Atur Model & Prompt:
│ Contoh: /ai set gpt-4o | Kamu asisten ramah
│
│ 🔧 Pengaturanmu:
│ • Model: ${current.model}
│ • Prompt: ${current.system_prompt}
│ • Auto: ${current.auto ? 'ON ✅' : 'OFF ❌'}
│
│ ✨ Gunakan /aion atau /aioff
└───────────────┘`; // Fixed emojis and formatting
            return await ctx.reply(menuText, { parse_mode: 'Markdown' });
        }

        // Skip command lain
        if (text.startsWith('/') && !text.startsWith('/ai')) {
            return next();
        }

        // Auto AI aktif → semua chat langsung diproses
        if (current.auto) {
            return await processAI(ctx, text, current);
        }

        // Manual pakai /ai pertanyaan
        if (text.startsWith('/ai ')) {
            const query = text.replace(/^\/ai\s*/, '');
            if (!query) return next(); // Jika hanya /ai spasi, jangan proses
            return await processAI(ctx, query, current);
        }

        // Auto off & bukan /ai → lanjut handler lain
        return next();
    }
};