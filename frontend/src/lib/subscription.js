export const SUBSCRIPTION_EXPIRED_DETAIL = 'La suscripción está vencida o inactiva.';

export const SUBSCRIPTION_EXPIRED_NOTICE =
  'Tu suscripción o etapa de prueba ya terminó. Elige un plan para continuar usando el sistema.';

export const isSubscriptionExpiredError = (error) => {
  const detail = error?.response?.data?.detail;
  return typeof detail === 'string' && detail.trim() === SUBSCRIPTION_EXPIRED_DETAIL;
};

