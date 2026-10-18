const zones = Intl.supportedValuesOf('timeZone');

export const DEFAULT_TIME_ZONE = 'Africa/Cairo';

export const TIME_ZONES = zones.includes('UTC') ? zones : ['UTC', ...zones];

export const timeZoneOptions = () =>
	TIME_ZONES.map((zone) => ({ value: zone, label: zone.replaceAll('_', ' ') }));
