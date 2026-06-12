const parseStoredJson = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const obtenerNombreRestauranteLocal = () => {
  const restaurante = parseStoredJson('restauranteActivo');
  if (restaurante?.nombre) {
    return restaurante.nombre;
  }

  const user = parseStoredJson('user');
  return (
    user?.restaurante_nombre ||
    user?.restaurante?.nombre ||
    'Restaurante'
  );
};
