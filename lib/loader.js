import fs from "fs";

import path from "path";

import { fileURLToPath, pathToFileURL } from "url";



const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pluginsDir = path.join(__dirname, "..", "plugins");

// 🔁 Ambil semua file .js dari folder plugin (rekursif)

function getAllPluginFiles(dir, base = "") {

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  let files = [];

  for (const entry of entries) {

    const fullPath = path.join(dir, entry.name);

    const relPath = path.join(base, entry.name);

    if (entry.isDirectory()) {

      files = files.concat(getAllPluginFiles(fullPath, relPath));

    } else if (entry.name.endsWith(".js")) {

      files.push(relPath.replace(/\\/g, "/")); // normalisasi path Windows

    }

  }

  return files;

}

// 🔌 Load plugin full (command + tombol + fungsi)

export async function loadPlugins(bot) {

  const pluginFiles = getAllPluginFiles(pluginsDir);

  const pluginMeta = {};

  const pluginList = [];

  for (const file of pluginFiles) {

    const pluginPath = path.join(pluginsDir, file);

    const pluginURL = pathToFileURL(pluginPath).href;

    const category = file.split("/")[0] || "other";

    try {

      const pluginModule = await import(pluginURL);

      const plugin = pluginModule?.default;

      if (!plugin) {

        console.warn(`⚠️ Plugin tidak valid (tidak ada export default): ${file}`);

        continue;

      }
      // Plugin fungsi biasa

      if (typeof plugin === "function") {

        plugin(bot);

        pluginMeta[file] = {

          type: "function",

          command: [],

          tags: [category],

          desc: "Plugin fungsi biasa (tanpa command)",

          buttons: [],

        };

        console.log(`✅ Fungsi plugin dimuat: ${file}`);

      }

      // Plugin command + tombol

      else if (Array.isArray(plugin.command) && typeof plugin.handler === "function") {

        if (plugin.command.length === 0) {

          console.warn(`⚠️ Plugin tanpa command dilewati: ${file}`);

          continue;

        }

        // Daftarkan command

        bot.command(plugin.command, plugin.handler);

        // Registrasi tombol otomatis

        const btnList = [];

        if (Array.isArray(plugin.buttons)) {

          for (const btn of plugin.buttons) {

            if (btn.id && btn.text && typeof btn.callback === "function") {

              bot.action(btn.id, btn.callback);

              btnList.push({ id: btn.id, text: btn.text });

              console.log(`🔘 Tombol terdaftar: ${file} -> ${btn.text}`);

            } else {

              console.warn(`⚠️ Tombol invalid di plugin ${file}`);

            }

          }

        }

        pluginMeta[file] = {

          type: "command",

          command: plugin.command,

          tags: plugin.tags || [category],

          desc: plugin.desc || "Tanpa deskripsi",

          buttons: btnList,

        };

        console.log(`✅ Command plugin dimuat: ${file}`);

      }

      // Plugin tidak valid

      else {

        console.warn(`⚠️ Plugin tidak valid (format salah): ${file}`);

        continue;

      }

      pluginList.push(file);

    } catch (err) {

      console.error(`❌ Gagal load plugin ${file}:`, err);

    }

  }

  // Inject metadata ke context bot

  bot.context.pluginList = pluginList;

  bot.context.pluginMeta = pluginMeta;

  bot.context.pluginCount = pluginList.length;

  console.log(`\n🔰 Total plugin berhasil dimuat: ${pluginList.length}`);

}