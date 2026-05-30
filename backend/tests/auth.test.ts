// Pruebas unitarias - Módulo de autenticación
describe('Utilidades de autenticación', () => {

  test('debe validar que un email tiene formato correcto', () => {
    const emailValido = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };
    expect(emailValido('usuario@ejemplo.com')).toBe(true);
    expect(emailValido('correo-invalido')).toBe(false);
  });

  test('debe validar que una contraseña tiene al menos 8 caracteres', () => {
    const contrasenaValida = (pass) => pass.length >= 8;
    expect(contrasenaValida('12345678')).toBe(true);
    expect(contrasenaValida('123')).toBe(false);
  });

  test('debe retornar false si el email está vacío', () => {
    const emailValido = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };
    expect(emailValido('')).toBe(false);
  });

});