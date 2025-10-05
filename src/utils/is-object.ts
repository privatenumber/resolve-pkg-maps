export const isObject = (
	object: unknown,
): object is object => (
	object !== null
	&& typeof object === 'object'
);
