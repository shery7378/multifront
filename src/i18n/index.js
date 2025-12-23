// i18n main file - exports all translations
import en from './messages/en';
import es from './messages/es';
import fr from './messages/fr';
import ar from './messages/ar';

export const messages = {
  en,
  es,
  fr,
  ar,
};

export { default as en } from './messages/en';
export { default as es } from './messages/es';
export { default as fr } from './messages/fr';
export { default as ar } from './messages/ar';

export * from './config';

