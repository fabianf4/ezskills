import { resolve } from 'node:path';
import { buildIndex } from '../src/services/indexer/build-index.js';

const skillsDir = resolve(process.cwd(), 'catalog');
const indexPath = resolve(skillsDir, 'index.json');
const skills = await buildIndex({ skillsDir });
console.log(`Indexed ${skills.length} skills -> ${indexPath}`);
