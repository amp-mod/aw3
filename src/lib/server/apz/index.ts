import yauzl, { ZipFile, Entry } from 'yauzl';
import yazl from 'yazl';
import { encode, decode as smileDecode } from 'smile-js';
import fs from 'fs';

// Text size can easily multiply, and we want to keep file size as small as possible.
// We include a underscore before each so we can cause an error if these slip through
// during decoding (the VM doesn't allow extensions to have a _ in their ID)
const extensionShortNames: Record<string, string> = {
  gvyoutubetransformations: '_gv',
  dogeiscutformatnumbers: '_fn',
  obviousalexsensing: '_sp'
};

function shortenExtensions(extensions: string[]): string[] {
  return extensions.map((ext) => extensionShortNames[ext] || ext);
}

function expandExtensions(shortened: string[]): string[] {
  const reverseMap = Object.fromEntries(
    Object.entries(extensionShortNames).map(([full, short]) => [short, full])
  );
  return shortened.map((s) => reverseMap[s] || s);
}

function shortenExtensionURLs(urls: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(urls)) {
    const short = extensionShortNames[key] || key;
    out[short] = val;
  }
  return out;
}

function expandExtensionURLs(urls: Record<string, string>): Record<string, string> {
  const reverseMap = Object.fromEntries(
    Object.entries(extensionShortNames).map(([full, short]) => [short, full])
  );
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(urls)) {
    const full = reverseMap[key] || key;
    out[full] = val;
  }
  return out;
}

const defaultMeta = {
  platform: { name: 'AmpMod', url: 'https://codeberg.org/ampmod/ampmod' }
};

export function projectJsonToSmile(zipPath: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile: ZipFile | undefined) => {
      if (err || !zipfile) return reject(err);

      zipfile.readEntry();

      zipfile.on('entry', (entry: Entry) => {
        const normalized = entry.fileName.replace(/^[./]+/, '');
        if (!normalized.endsWith('project.json')) {
          zipfile.readEntry();
          return;
        }

        zipfile.openReadStream(entry, (err, readStream) => {
          if (err) return reject(err);

          let data = '';
          readStream.setEncoding('utf8');
          readStream.on('data', (chunk) => (data += chunk));

          readStream.on('end', () => {
            try {
              const json = JSON.parse(data);

              if (
                json.meta.platform &&
                json.meta.platform.name !== 'TurboWarp' &&
                json.meta.platform.name !== 'AmpMod'
              ) {
                throw new Error(`"${json.meta.platform.name}" platform is not supported`);
              }

              json.meta = {
                ...defaultMeta,
                version: json.meta.version
              };

              if (Array.isArray(json.extensions))
                json.extensions = shortenExtensions(json.extensions);
              if (json.extensionURLs) json.extensionURLs = shortenExtensionURLs(json.extensionURLs);

              const blockCount: Record<string, number> = {};
              json.targets?.forEach((target: { blocks: Record<string, any> }) => {
                if (!target.blocks) return;
                Object.values(target.blocks).forEach((block: any) => {
                  blockCount[block.opcode] = (blockCount[block.opcode] || 0) + 1;
                });
              });

              const frequentBlocks = Object.entries(blockCount)
                .filter(([_, count]) => count > 5)
                .map(([opcode]) => opcode);

              json.targets?.forEach((target: { blocks: Record<string, any> }) => {
                if (!target.blocks) return;
                Object.values(target.blocks).forEach((block: any) => {
                  const idx = frequentBlocks.indexOf(block.opcode);
                  if (idx !== -1) block.opcode = idx;
                });
              });

              json.x5 = frequentBlocks;

              const smile = encode(json);
              fs.writeFileSync('project.json.smile', smile);
              resolve(smile);
              zipfile.close();
            } catch (e) {
              reject(e);
            }
          });
        });
      });

      zipfile.on('end', () => reject(new Error('project.json not found in ZIP')));
    });
  });
}

export function smileToProjectJson(smile: Uint8Array): any {
  const json = smileDecode(smile);

  if (json.extensions) json.extensions = expandExtensions(json.extensions);
  if (json.extensionURLs) json.extensionURLs = expandExtensionURLs(json.extensionURLs);

  if (Array.isArray(json.x5)) {
    json.targets?.forEach((target: { blocks: Record<string, any> }) => {
      if (!target.blocks) return;
      Object.values(target.blocks).forEach((block: any) => {
        if (typeof block.opcode === 'number') block.opcode = json.x5[block.opcode];
      });
    });
  }

  json.meta.semver = '3.0.0';
  json.meta.vm = '0.2.0';
  json.meta.agent = '';
  delete json.x5;
  return json;
}

export async function repackApzWithSmile(inputZip: string, outputZip: string) {
  return new Promise<void>((resolve, reject) => {
    yauzl.open(inputZip, { lazyEntries: true }, (err, zipfile: ZipFile | undefined) => {
      if (err || !zipfile) return reject(err);

      const zipWriter = new yazl.ZipFile();
      const tempFiles: string[] = [];

      zipfile.readEntry();

      zipfile.on('entry', async (entry: Entry) => {
        const normalized = entry.fileName.replace(/^[./]+/, '');
        if (normalized === 'project.json') {
          try {
            const smile = await JSON.stringify(
              smileToProjectJson(await projectJsonToSmile(inputZip))
            );
            zipWriter.addBuffer(smile, 'project.json');
            zipfile.readEntry();
          } catch (e) {
            reject(e);
          }
          return;
        }

        zipfile.openReadStream(entry, (err, readStream) => {
          if (err) return reject(err);
          zipWriter.addReadStream(readStream!, entry.fileName);
          zipfile.readEntry();
        });
      });

      zipfile.on('end', () => {
        zipWriter.end();
        const outputStream = fs.createWriteStream(outputZip);
        zipWriter.outputStream.pipe(outputStream).on('close', () => {
          resolve();
        });
      });
    });
  });
}
