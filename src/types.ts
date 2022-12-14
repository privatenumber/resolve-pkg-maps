export type PathConditionsMap = {
	[condition: string]: PathConditions | null;
};

type PathOrMap = string | PathConditionsMap;

export type PathConditions = PathOrMap | readonly PathOrMap[];
