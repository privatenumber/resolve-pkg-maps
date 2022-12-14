interface ArrayConstructor {
	isArray(array: unknown): array is unknown[] | readonly unknown[];
}
