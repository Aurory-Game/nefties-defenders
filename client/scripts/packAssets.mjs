import texturePacker from 'free-tex-packer-core';
import { copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import Jimp from 'jimp';
import sharp from 'sharp';

const src = 'assets/Characters';

const assets = readdirSync(src);

const charImages = [];
const animsData = [];

const scale = 2 / 3;
const scaleMode = Jimp.RESIZE_HERMITE;

for (const name of assets) {
    const anims = readdirSync(path.join(src, name));
    for (const anim of anims) {
        const dirs = readdirSync(path.join(src, name, anim));
        for (const dir of dirs) {
            const files = readdirSync(path.join(src, name, anim, dir));
            const frames = [];
            animsData.push({
                key: `${name}-${anim}${dir}`,
                type: 'frame',
                frameRate: 12,
                repeat: (anim == 'Death' || anim == 'Spawn') ? 0 : -1,
                frames
            });
            // Sort by frame number, so anim frames are in order.
            files.sort((a, b) => {
                const [an, bn] = [a, b].map(s => Number(s.split('-').at(-1).split('.')[0]));
                return an - bn;
            });
            for (const f of files) {
                const pngPath = `${name}-${anim}${dir}-${f}`;
                charImages.push({
                    path: pngPath,
                    contents: Jimp.read(path.join(src, name, anim, dir, f))
                        .then(img => img.scale(scale, scaleMode).getBufferAsync(Jimp.MIME_PNG))
                });
                frames.push({
                    key: 'img',
                    frame: pngPath
                });
            }
        }
    }
}

// Add towers.
const towerImages = [];
const towersDir = 'assets/Towers';

for (const name of readdirSync(towersDir)) {
    const imgPath = path.join(towersDir, name);
    towerImages.push({
        path: name,
        contents: Jimp.read(imgPath)
            .then(img => img.scale(1 / 4, scaleMode).getBufferAsync(Jimp.MIME_PNG))
    });
}

const allImages = [...charImages, ...towerImages];
console.log(`Resizing ${allImages.length} images.`);

const resolved = await Promise.all(allImages.map(img => img.contents));
allImages.forEach((img, i) => img.contents = resolved[i]);

console.log(`Packing and compressing ${allImages.length} images.`);

function packAndCompress(images, name) {
    return new Promise((res, rej) => {
        texturePacker(images, {
            width: 4096,
            height: 4096,
            powerOfTwo: true,
            padding: 1,
            textureName: name,
            // scale: 0.66, // Not working ideally, resizing before passing to packer.
            // packer: 'OptimalPacker', // Optimal is slightly better, but terribly slow.
            allowRotation: false,
            exporter: 'Phaser3'
        }, async (files, error) => {
            if (error) rej(error);
            else {
                const atlasData = [];
                const textures = [];
                for (const file of files) {
                    if (file.name.endsWith('.json')) { // Pack into multi-atlas.
                        const atlas = JSON.parse(file.buffer.toString('utf-8'));
                        atlasData.push(...atlas.textures);
                    } else {
                        const buffer = await sharp(file.buffer).png({
                            compressionLevel: 9,
                            quality: 90
                        }).toBuffer();
                        textures.push({ name: file.name, buffer });
                        console.log('Compressed ' + file.name);
                    }
                }
                res({ textures, atlasData });
            }
        });
    });
}

const chars = await packAndCompress(charImages, 'chars');
const towers = await packAndCompress(towerImages, 'towers');

console.log('Resizing and compressing background.');
const backFile = 'assets/NeftiesDefenders_Background_NoStructures.jpg';
const backScaled = await Jimp.read(backFile)
    .then(img => img.scaleToFit(723, 1280, scaleMode));
const backCompressed = await sharp(await backScaled.getBufferAsync(Jimp.MIME_PNG)).png({
    compressionLevel: 9,
    quality: 90
}).toBuffer();
const backgroundTexture = { name: 'background.png', buffer: backCompressed };
const backgroundAtlasData = {
    image: 'background.png', frames: [{
        filename: 'background',
        frame: { x: 0, y: 0, w: backScaled.getWidth(), h: backScaled.getHeight() }
    }]
};

const exportDir = path.join('public', 'assets');
rmSync(exportDir, { force: true, recursive: true });
mkdirSync(exportDir, { recursive: true });

for (const tex of [...chars.textures, ...towers.textures, backgroundTexture]) {
    writeFileSync(path.join(exportDir, tex.name), tex.buffer);
    console.log('Exported ' + tex.name);
}

writeFileSync(path.join(exportDir, 'multiatlas.json'), JSON.stringify({
    textures: [...chars.atlasData, ...towers.atlasData, backgroundAtlasData]
}));
console.log('Exported multiatlas.json.');
writeFileSync(path.join(exportDir, 'anims.json'), JSON.stringify({ anims: animsData }));
console.log('Exported anims.json.');

console.log('Processing audio files.');
const audioExportDir = 'assets/audio/';
mkdirSync(path.join('public', audioExportDir), { recursive: true });
const audioSources = ['assets/Audio/Building', 'assets/Audio/Nefties'];
const audioAssets = audioSources.map(src => readdirSync(src).map(file => {
    const { name } = path.parse(file);
    const targetPath = path.join(audioExportDir, file);
    copyFileSync(path.join(src, file), path.join('public', targetPath));
    return {
        path: targetPath,
        id: name,
    };
})).flat();

const audioFiles = [];
for (const audio of audioAssets) {
    audioFiles.push({ type: 'audio', key: audio.id, url: [audio.path] });
}

writeFileSync(path.join(exportDir, 'audiopack.json'), JSON.stringify({
    audio: { files: audioFiles }
}));
console.log('Exported audiopack.json.');

console.log('Done.');
