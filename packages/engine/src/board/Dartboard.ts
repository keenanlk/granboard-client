/** Numeric identifiers for every dartboard segment (inner, outer, triple, double for 1–20, plus bull, miss, bust, reset). */
export const SegmentID = {
  INNER_1: 0,
  TRP_1: 1,
  OUTER_1: 2,
  DBL_1: 3,
  INNER_2: 4,
  TRP_2: 5,
  OUTER_2: 6,
  DBL_2: 7,
  INNER_3: 8,
  TRP_3: 9,
  OUTER_3: 10,
  DBL_3: 11,
  INNER_4: 12,
  TRP_4: 13,
  OUTER_4: 14,
  DBL_4: 15,
  INNER_5: 16,
  TRP_5: 17,
  OUTER_5: 18,
  DBL_5: 19,
  INNER_6: 20,
  TRP_6: 21,
  OUTER_6: 22,
  DBL_6: 23,
  INNER_7: 24,
  TRP_7: 25,
  OUTER_7: 26,
  DBL_7: 27,
  INNER_8: 28,
  TRP_8: 29,
  OUTER_8: 30,
  DBL_8: 31,
  INNER_9: 32,
  TRP_9: 33,
  OUTER_9: 34,
  DBL_9: 35,
  INNER_10: 36,
  TRP_10: 37,
  OUTER_10: 38,
  DBL_10: 39,
  INNER_11: 40,
  TRP_11: 41,
  OUTER_11: 42,
  DBL_11: 43,
  INNER_12: 44,
  TRP_12: 45,
  OUTER_12: 46,
  DBL_12: 47,
  INNER_13: 48,
  TRP_13: 49,
  OUTER_13: 50,
  DBL_13: 51,
  INNER_14: 52,
  TRP_14: 53,
  OUTER_14: 54,
  DBL_14: 55,
  INNER_15: 56,
  TRP_15: 57,
  OUTER_15: 58,
  DBL_15: 59,
  INNER_16: 60,
  TRP_16: 61,
  OUTER_16: 62,
  DBL_16: 63,
  INNER_17: 64,
  TRP_17: 65,
  OUTER_17: 66,
  DBL_17: 67,
  INNER_18: 68,
  TRP_18: 69,
  OUTER_18: 70,
  DBL_18: 71,
  INNER_19: 72,
  TRP_19: 73,
  OUTER_19: 74,
  DBL_19: 75,
  INNER_20: 76,
  TRP_20: 77,
  OUTER_20: 78,
  DBL_20: 79,
  BULL: 80,
  DBL_BULL: 81,
  MISS: 82,
  BUST: 83,
  RESET_BUTTON: 84,
} as const;
/** Union type of all valid segment ID values. */
export type SegmentID = (typeof SegmentID)[keyof typeof SegmentID];

/** Numbered sections of the dartboard (1–20, Bull, Other). */
export const SegmentSection = {
  One: 1,
  Two: 2,
  Three: 3,
  Four: 4,
  Five: 5,
  Six: 6,
  Seven: 7,
  Eight: 8,
  Nine: 9,
  Ten: 10,
  Eleven: 11,
  Twelve: 12,
  Thirteen: 13,
  Fourteen: 14,
  Fifteen: 15,
  Sixteen: 16,
  Seventeen: 17,
  Eighteen: 18,
  Nineteen: 19,
  Twenty: 20,
  BULL: 25,
  Other: 26,
} as const;
/** Union type of all valid section values. */
export type SegmentSection =
  (typeof SegmentSection)[keyof typeof SegmentSection];

/** Multiplier ring type of a dartboard segment. */
export const SegmentType = {
  Single: 1,
  Double: 2,
  Triple: 3,
  Other: 4,
} as const;
/** Union type of all valid segment type values. */
export type SegmentType = (typeof SegmentType)[keyof typeof SegmentType];

/** A single dartboard segment with its identity, type, section, point value, and display names. */
export interface Segment {
  ID: SegmentID;
  Type: SegmentType;
  Section: SegmentSection;
  Value: number;
  LongName: string;
  ShortName: string;
}

/**
 * Converts a segment type to its display string.
 *
 * @param type - The segment type (Single, Double, Triple).
 * @param shorthand - If true, returns "D"/"T"; otherwise "Double"/"Triple".
 * @returns The display string, or empty string for singles.
 */
export const SegmentTypeToString = (type: SegmentType, shorthand: boolean) => {
  switch (type) {
    case SegmentType.Single:
      return "";
    case SegmentType.Double:
      return shorthand ? "D" : "Double";
    case SegmentType.Triple:
      return shorthand ? "T" : "Triple";
    default:
      return "";
  }
};

/**
 * Creates a full Segment object from a numeric segment ID.
 *
 * @param segmentId - The segment ID to resolve.
 * @returns A fully populated Segment with type, section, value, and display names.
 */
export const CreateSegment = (segmentId: SegmentID): Segment => {
  if (segmentId < 80) {
    let Type: SegmentType;
    switch (segmentId % 4) {
      case 1:
        Type = SegmentType.Triple;
        break;
      case 3:
        Type = SegmentType.Double;
        break;
      default:
        Type = SegmentType.Single;
    }
    const Section = Math.ceil((segmentId + 1) / 4) as SegmentSection;
    const Value =
      Section *
      (Type === SegmentType.Single
        ? 1
        : Type === SegmentType.Double
          ? 2
          : Type === SegmentType.Triple
            ? 3
            : 0);
    const LongName =
      SegmentTypeToString(Type, false) +
      (Type !== SegmentType.Single ? " " : "") +
      Section;
    const ShortName = SegmentTypeToString(Type, true) + Section;
    return { ID: segmentId, Type, Section, Value, LongName, ShortName };
  } else {
    switch (segmentId) {
      case SegmentID.BULL:
        return {
          ID: segmentId,
          Type: SegmentType.Single,
          Section: SegmentSection.BULL,
          Value: 25,
          LongName: "Bullseye",
          ShortName: "BULL",
        };
      case SegmentID.DBL_BULL:
        return {
          ID: segmentId,
          Type: SegmentType.Double,
          Section: SegmentSection.BULL,
          Value: 50,
          LongName: "Double Bullseye",
          ShortName: "DBULL",
        };
      case SegmentID.RESET_BUTTON:
        return {
          ID: segmentId,
          Type: SegmentType.Other,
          Section: SegmentSection.Other,
          Value: 0,
          LongName: "Reset Button",
          ShortName: "RST",
        };
      case SegmentID.BUST:
        return {
          ID: segmentId,
          Type: SegmentType.Other,
          Section: SegmentSection.Other,
          Value: 0,
          LongName: "Bust",
          ShortName: "Bust",
        };
      case SegmentID.MISS:
      default:
        return {
          ID: segmentId,
          Type: SegmentType.Other,
          Section: SegmentSection.Other,
          Value: 0,
          LongName: "Miss",
          ShortName: "Miss",
        };
    }
  }
};
