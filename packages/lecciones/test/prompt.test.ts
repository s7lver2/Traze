import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import piloto from '../../../contenido/bloque-1-trazados/mediatriz-segmento.json';
import { construirPrompt, construirSkill } from '../src/prompt';
import { COMPROBACIONES, DERIVADOS, MARCA_VOCABULARIO, PRIMITIVAS } from '../src/vocabulario';

function leer(ruta: string): string {
  const archivo = fileURLToPath(new URL(`../../../${ruta}`, import.meta.url));
  return readFileSync(archivo, 'utf-8').replace(/\r\n/g, '\n');
}

describe('construirPrompt', () => {
  it('describe cada entrada del vocabulario', () => {
    const prompt = construirPrompt(piloto);
    for (const entrada of [...PRIMITIVAS, ...DERIVADOS, ...COMPROBACIONES]) {
      expect(prompt, entrada.tipo).toContain(`**${entrada.tipo}**`);
    }
  });

  it('incluye el ejemplo completo sin su clave meta', () => {
    const prompt = construirPrompt({ ...piloto, meta: { version: 2 } });
    expect(prompt).toContain(JSON.stringify(piloto, null, 2));
    expect(prompt).not.toContain('"meta"');
  });

  it('explica la marca de vocabulario insuficiente y prohíbe la clave meta', () => {
    const prompt = construirPrompt(piloto);
    expect(prompt).toContain(MARCA_VOCABULARIO);
    expect(prompt).toContain('No incluyas la clave «meta»');
  });

  it('cabe holgadamente en un mensaje de chat', () => {
    expect(construirPrompt(piloto).length).toBeLessThan(30000);
  });
});

describe('construirSkill', () => {
  it('lleva cabecera de skill y el apartado de uso dentro del repositorio', () => {
    const skill = construirSkill(piloto);
    expect(skill.startsWith('---\nname: dibujo-tecnico\n')).toBe(true);
    expect(skill).toContain('generacion/borradores/');
    expect(skill).toContain('pnpm comprobar');
  });
});

describe('archivos generados', () => {
  it('el prompt maestro está al día', () => {
    expect(leer('generacion/prompt-leccion.md'), 'prompt desactualizado: ejecuta pnpm prompt').toBe(
      construirPrompt(piloto),
    );
  });

  it('la skill está al día', () => {
    expect(
      leer('generacion/skill/dibujo-tecnico/SKILL.md'),
      'skill desactualizada: ejecuta pnpm prompt',
    ).toBe(construirSkill(piloto));
  });
});
