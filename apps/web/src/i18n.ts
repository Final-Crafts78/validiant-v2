import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // We can fetch this from a cookie or header in the future
  const locale = 'en';

  return {
    locale,
    messages: (await import(`../../../packages/shared/src/i18n/${locale}.json`))
      .default,
  };
});
