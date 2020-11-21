import {OptionalIntlConfig, IntlCache, IntlShape} from './types';
import {createFormatters, DEFAULT_INTL_CONFIG} from './utils';
import {InvalidConfigError, MissingDataError} from './error';
import {formatNumber, formatNumberToParts} from './number';
import {formatRelativeTime} from './relativeTime';
import {
  formatDate,
  formatDateToParts,
  formatTime,
  formatTimeToParts,
  formatDateTimeRange,
} from './dateTime';
import {formatPlural} from './plural';
import {formatMessage} from './message';
import {formatList} from './list';
import {formatDisplayName} from './displayName';

export interface CreateIntlFn<
  T = string,
  C extends OptionalIntlConfig<T> = OptionalIntlConfig<T>,
  S extends IntlShape<T> = IntlShape<T>
> {
  (config: C, cache?: IntlCache): S;
}

/**
 * Create intl object
 * @param config intl config
 * @param cache cache for formatter instances to prevent memory leak
 */
export function createIntl<T = string>(
  config: OptionalIntlConfig<T>,
  cache?: IntlCache
): IntlShape<T> {
  const formatters = createFormatters(cache);
  const resolvedConfig = {
    ...DEFAULT_INTL_CONFIG,
    ...config,
  };

  const {locale, defaultLocale, onError} = resolvedConfig;
  if (!locale) {
    if (onError) {
      onError(
        new InvalidConfigError(
          `"locale" was not configured, using "${defaultLocale}" as fallback. See https://formatjs.io/docs/react-intl/api#intlshape for more details`
        )
      );
    }
    // Since there's no registered locale data for `locale`, this will
    // fallback to the `defaultLocale` to make sure things can render.
    // The `messages` are overridden to the `defaultProps` empty object
    // to maintain referential equality across re-renders. It's assumed
    // each <FormattedMessage> contains a `defaultMessage` prop.
    resolvedConfig.locale = resolvedConfig.defaultLocale || 'en';
  } else if (!Intl.NumberFormat.supportedLocalesOf(locale).length && onError) {
    onError(
      new MissingDataError(
        `Missing locale data for locale: "${locale}" in Intl.NumberFormat. Using default locale: "${defaultLocale}" as fallback. See https://formatjs.io/docs/react-intl#runtime-requirements for more details`
      )
    );
  } else if (
    !Intl.DateTimeFormat.supportedLocalesOf(locale).length &&
    onError
  ) {
    onError(
      new MissingDataError(
        `Missing locale data for locale: "${locale}" in Intl.DateTimeFormat. Using default locale: "${defaultLocale}" as fallback. See https://formatjs.io/docs/react-intl#runtime-requirements for more details`
      )
    );
  }

  const firstMessage = config.messages
    ? config.messages[Object.keys(config.messages)[0]]
    : undefined;
  if (
    config.defaultRichTextElements &&
    firstMessage &&
    typeof firstMessage === 'string'
  ) {
    console.warn(`[@formatjs/intl] "defaultRichTextElements" was specified but "message" was not pre-compiled. 
Please consider using "@formatjs/cli" to pre-compile your messages for performance.
For more details see https://formatjs.io/docs/getting-started/message-distribution`);
  }
  return {
    ...resolvedConfig,
    formatters,
    formatNumber: formatNumber.bind(
      null,
      resolvedConfig,
      formatters.getNumberFormat
    ),
    formatNumberToParts: formatNumberToParts.bind(
      null,
      resolvedConfig,
      formatters.getNumberFormat
    ),
    formatRelativeTime: formatRelativeTime.bind(
      null,
      resolvedConfig,
      formatters.getRelativeTimeFormat
    ),
    formatDate: formatDate.bind(
      null,
      resolvedConfig,
      formatters.getDateTimeFormat
    ),
    formatDateToParts: formatDateToParts.bind(
      null,
      resolvedConfig,
      formatters.getDateTimeFormat
    ),
    formatTime: formatTime.bind(
      null,
      resolvedConfig,
      formatters.getDateTimeFormat
    ),
    formatDateTimeRange: formatDateTimeRange.bind(
      null,
      resolvedConfig,
      formatters.getDateTimeFormat
    ),
    formatTimeToParts: formatTimeToParts.bind(
      null,
      resolvedConfig,
      formatters.getDateTimeFormat
    ),
    formatPlural: formatPlural.bind(
      null,
      resolvedConfig,
      formatters.getPluralRules
    ),
    formatMessage: formatMessage.bind(null, resolvedConfig, formatters),
    formatList: formatList.bind(null, resolvedConfig, formatters.getListFormat),
    formatDisplayName: formatDisplayName.bind(
      null,
      resolvedConfig,
      formatters.getDisplayNames
    ),
  };
}
