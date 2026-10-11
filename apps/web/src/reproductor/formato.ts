export const decimal = (numero: number, cifras: number): string =>
  numero.toFixed(cifras).replace('.', ',');
