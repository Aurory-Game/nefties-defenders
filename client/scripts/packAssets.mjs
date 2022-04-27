import texturePacker from 'free-tex-packer-core';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import Jimp from 'jimp';
import sharp from 'sharp';

const src = 'assets/Characters';

const assets = readdirSync(src);

const images = [];
const animsData = [];

const scale = 2/3;
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
                images.push({
                    path: pngPath,
                    // contents: readFileSync(path.join(src, name, anim, dir, f))
                    contents: Jimp.read(path.join(src, name, anim, dir, f))
                        .then(img => img.scale(scale, scaleMode).getBufferAsync(Jimp.MIME_PNG))
                });
                frames.push({
                    key: 'anims',
                    frame: pngPath
                });
            }
        }
    }
}

console.log(`Resizing ${images.length} images.`);

const resolved = await Promise.all(images.map(img => img.contents));
images.forEach((img, i) => img.contents = resolved[i]);

console.log(`Packing ${images.length} images.`);

texturePacker(images, {
    width: 4096,
    height: 4096,
    powerOfTwo: true,
    padding: 1,
    // scale: 0.66, // Not working ideally, resizing before passing to packer.
    // packer: 'OptimalPacker', // Optimal is slightly better, but terribly slow.
    allowRotation: false,
    exporter: 'Phaser3'
}, async (files, error) => {
    if (error) {
        console.error('Failed', error);
    } else {
        const baseDir = path.join('public', 'assets', 'chars');
        rmSync(baseDir, { force: true, recursive: true });
        mkdirSync(baseDir, { recursive: true });
        const textures = [];
        for (const file of files) {
            if (file.name.endsWith('.json')) { // Pack into multi-atlas.
                const atlas = JSON.parse(file.buffer.toString('utf-8'));
                textures.push(...atlas.textures);
            } else {
                const buffer = await sharp(file.buffer).png({
                    compressionLevel: 9,
                    quality: 90
                }).toBuffer();
                writeFileSync(path.join(baseDir, file.name), buffer);
                console.log('Compressed and exported '+file.name);
            }
        }
        writeFileSync(path.join(baseDir, 'multiatlas.json'), JSON.stringify({ textures }));
        console.log('Exported multiatlas.json.');

        writeFileSync(path.join(baseDir, 'anims.json'), JSON.stringify({ anims: animsData }));
        console.log('Exported anims.json.');
        console.log('Done.');
    }
});
