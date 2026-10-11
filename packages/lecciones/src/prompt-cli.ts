import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { construirPrompt, construirSkill } from './prompt';

const raiz = fileURLToPath(new URL('../../../', import.meta.url));
const piloto: unknown = JSON.parse(
  readFileSync(join(raiz, 'contenido', 'bloque-1-fundamentos', 'mediatriz-segmento.json'), 'utf-8'),
);

const salidas = [
  ['generacion/prompt-leccion.md', construirPrompt(piloto)],
  ['generacion/skill/dibujo-tecnico/SKILL.md', construirSkill(piloto)],
] as const;

for (const [ruta, texto] of salidas) {
  const destino = join(raiz, ruta);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, texto, 'utf-8');
  console.log(`✔ ${ruta} (${texto.length} caracteres)`);
}
