// Shared sample plans everyone sees. They are read only, so one visitor can't change them for the next;
// visitors try the loop on their own copy instead.
export const SAMPLE_IDS = new Set<string>(["parachute-wivba"]);

export const isSample = (id: string) => SAMPLE_IDS.has(id);
