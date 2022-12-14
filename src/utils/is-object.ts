export const isObject = (
	object: any,
): object is object => (
	object !== null
	&& typeof object === 'object'
);
