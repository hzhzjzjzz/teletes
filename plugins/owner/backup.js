import fs from "fs";
import path from "path";
import archiver from "archiver";
import { config } from "../../config.js";

const BACKUP_DIR = "./";
const EXCLUDE = [
    "node_modules",
    ".git",
    ".DS_Store",
    ".npm",
    "package-lock.json",
    "logs"
];
const MAX_FILE_MB = 49; // Batas aman Telegram

function escapeMarkdown(text) {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

function getTimestamp() {
    const now = new Date();
    const pad = n => n.toString().padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
    )}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(
        now.getSeconds()
    )}`;
}

async function createBackupZip(onProgress) {
    return new Promise((resolve, reject) => {
        const zipName = `${config.BOTNAME}.zip`;
        const output = fs.createWriteStream(zipName);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => resolve(zipName));
        archive.on("error", err => reject(err));
        archive.pipe(output);

        let totalBytes = 0;
        let processedBytes = 0;

        archive.on("progress", data => {
            totalBytes = data.fs.totalBytes || totalBytes;
            processedBytes = data.fs.processedBytes || processedBytes;
            if (totalBytes > 0) {
                const percent = Math.floor((processedBytes / totalBytes) * 100);
                onProgress(Math.min(percent, 100));
            }
        });

        function addDir(dirPath, base = "") {
            fs.readdirSync(dirPath).forEach(file => {
                if (EXCLUDE.includes(file)) return;
                const fullPath = path.join(dirPath, file);
                const relPath = path.join(base, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) addDir(fullPath, relPath);
                else archive.file(fullPath, { name: relPath });
            });
        }

        addDir(BACKUP_DIR);
        archive.finalize();
    });
}

function splitFile(filePath, partSizeMB = MAX_FILE_MB) {
    const partSize = partSizeMB * 1024 * 1024;
    const buffer = Buffer.alloc(partSize);
    const fileName = path.basename(filePath);
    const fd = fs.openSync(filePath, "r");
    let partNum = 1;
    let bytesRead;
    const parts = [];

    while ((bytesRead = fs.readSync(fd, buffer, 0, partSize, null)) > 0) {
        const partName = `${fileName}.part${partNum}`;
        fs.writeFileSync(partName, buffer.slice(0, bytesRead));
        parts.push(partName);
        partNum++;
    }

    fs.closeSync(fd);
    return parts;
}

export default {
    command: ["backup"],
    tags: ["owner"],
    owner: true,
    desc: "📦 Backup data bot (khusus Owner)",

    async handler(ctx) {
        const senderId = String(ctx.from.id);
        const ownerId = String(config.OWNER_ID);

        if (senderId !== ownerId) {
            return ctx.reply(
                escapeMarkdown(
                    "❌ Hanya Master-ku yang bisa pakai perintah ini 🫩"
                ),
                { parse_mode: "MarkdownV2" }
            );
        }

        let loadingMsg;
        let lastProgress = -1;

        try {
            loadingMsg = await ctx.reply(
                escapeMarkdown(
                    ` Membuat backup khusus untuk Master~\n[░░░░░░░░░░] 0%\n📝 Status: Menyiapkan file...`
                ),
                { parse_mode: "MarkdownV2" }
            );

            const updateProgress = async val => {
                if (val === lastProgress) return;
                lastProgress = val;
                const filled = "▓".repeat(Math.floor(val / 10));
                const empty = "░".repeat(10 - Math.floor(val / 10));
                const status =
                    val < 100 ? " Mengarsip file..." : "💌 Mengirim file...";

                const text = escapeMarkdown(
                    `[${filled}${empty}] ${val}%\n${status} 🫩`
                );
                try {
                    await ctx.telegram.editMessageText(
                        ctx.chat.id,
                        loadingMsg.message_id,
                        undefined,
                        text,
                        { parse_mode: "MarkdownV2" }
                    );
                } catch (_) {}
            };

            const zipPath = await createBackupZip(updateProgress);

            const stats = fs.statSync(zipPath);
            let filesToSend = [zipPath];
            if (stats.size > MAX_FILE_MB * 1024 * 1024) {
                filesToSend = splitFile(zipPath);
                fs.unlinkSync(zipPath);
            }

            const captionBase = escapeMarkdown(
                `📆 Tanggal: ${new Date().toLocaleString("id-ID", {
                    timeZone: config.timezone
                })}\n📬 Dikirim ke Master 🫩`
            );

            if (ctx.chat.type !== "private") {
                await ctx.reply(
                    escapeMarkdown(
                        "📬 Backup akan dikirim ke chat pribadi Master~ 💌"
                    ),
                    { parse_mode: "MarkdownV2" }
                );
            }

            for (const file of filesToSend) {
                const caption = escapeMarkdown(
                    `╭━━━💌 Backup Selesai, Master ✦~ 🫩━━━╮\n file: ${file}\n${captionBase}\n╰━━━━━━━━━━━━━━━━━━━━╯`
                );
                await ctx.telegram.sendDocument(
                    ownerId,
                    { source: file },
                    { caption, parse_mode: "MarkdownV2" }
                );
                fs.unlinkSync(file);
            }
        } catch (e) {
            console.error(e);
            await ctx.reply(
                escapeMarkdown(
                    `❌ Aduh Master, backup gagal 🫩\nAlasan: ${e.message || e}`
                ),
                { parse_mode: "MarkdownV2" }
            );
        } finally {
            if (loadingMsg) {
                ctx.telegram
                    .deleteMessage(ctx.chat.id, loadingMsg.message_id)
                    .catch(() => {});
            }
        }
    }
};
