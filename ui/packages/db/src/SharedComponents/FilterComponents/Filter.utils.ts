import { createContext } from "react";
import charData from "../../Data/char_data.generated.json"
import tagData from "@gcsim/db/src/tags.json";

export interface FilterState {
  charFilter: CharFilter;
  tagFilter: TagFilter;
  charIncludeCount: number;
  customFilter: string;
}

export enum ItemFilterState {
  "none",
  "include",
  "exclude",
}

export const charNames = Object.keys(charData.data).map(k => {
  return k
})

export const initialCharFilter = charNames.reduce((acc, charName) => {
  acc[charName] = { state: ItemFilterState.none, charName };
  return acc;
}, {} as CharFilter);

export const initialTagFilter = Object.keys(tagData).reduce((acc, tag) => {
  acc[tag] = { state: ItemFilterState.none, tag}
  return acc
}, {} as TagFilter)

export const initialFilter: FilterState = {
  charFilter: initialCharFilter,
  tagFilter: initialTagFilter,
  charIncludeCount: 0,
  customFilter: "",
};

export const FilterContext = createContext<FilterState>(initialFilter);

// setName: number of pieces
// e.g. { "gladiatorsfinale": 2, "thundersoother": 4 }
export type ArtifactSetFilter = Record<string, number>;

export interface CharFilter {
  //character name
  [key: string]: CharFilterState;
}

export type CharFilterState =
  | {
      charName: string;
      state: ItemFilterState.include;
      weapon?: string;
      sets?: ArtifactSetFilter;
    }
  | {
      state: ItemFilterState.none;
      charName: string;
    }
  | {
      state: ItemFilterState.exclude;
      charName: string;
    };

export interface TagFilter {
  //tag key (int)
  [key: string]: TagFilterState
}

export type TagFilterState =
  | {
      tag: string;
      state: ItemFilterState.include;
    }
  | {
      state: ItemFilterState.none;
      tag: string;
    }

export const FilterDispatchContext = createContext<
  React.Dispatch<FilterActions>
>(null as unknown as React.Dispatch<FilterActions>);

export type FilterActions =
  | CharFilterReducerAction
  | TagFilterReducerAction
  | GeneralFilterAction
  | CustomFilterAction;

interface GeneralFilterAction {
  type: "clearFilter";
}

interface CustomFilterAction {
  type: "setCustomFilter";
  customFilter: string;
}

interface CharFilterReducerAction {
  type:
    | "handleChar"
    | "removeChar"
    | "includeChar"
    | "includeWeapon"
    | "nullWeapon"
    | "includeSet"
    | "nullSet";
  char: string;
  weapon?: string;
  set?: string;
}

interface TagFilterReducerAction {
  type:
    | "handleTag"
  tag: string;
}

export function filterReducer(
  filter: FilterState,
  action: FilterActions
): FilterState {
  switch (action.type) {
    case "handleChar": {
      let newFilterState: ItemFilterState;
      let newCharIncludeCount = filter.charIncludeCount ?? 0;
      switch (filter.charFilter[action.char].state) {
        case ItemFilterState.none:
          //if more than 4 characters are included, do not include the new character
          if (filter.charIncludeCount >= 4)
            newFilterState = ItemFilterState.exclude;
          else {
            newFilterState = ItemFilterState.include;
            newCharIncludeCount++;
          }

          break;
        case ItemFilterState.include:
          newFilterState = ItemFilterState.exclude;
          newCharIncludeCount--;
          break;
        case ItemFilterState.exclude:
          newFilterState = ItemFilterState.none;
          break;
      }

      return {
        ...filter,
        charFilter: {
          ...filter.charFilter,
          [action.char]: {
            state: newFilterState,
            charName: action.char,
          },
        },
        charIncludeCount: newCharIncludeCount,
      };
    }

    case "removeChar": {
      let newCharIncludeCount = filter.charIncludeCount ?? 0;
      if (filter.charFilter[action.char].state === ItemFilterState.include)
        newCharIncludeCount--;
      return {
        ...filter,
        charFilter: {
          ...filter.charFilter,
          [action.char]: {
            state: ItemFilterState.none,
            charName: action.char,
          },
        },
        charIncludeCount: newCharIncludeCount,
      };
    }

    case "includeChar": {
      let newCharIncludeCount = filter.charIncludeCount ?? 0;
      if (filter.charFilter[action.char].state !== ItemFilterState.include)
        newCharIncludeCount++;
      return {
        ...filter,
        charFilter: {
          ...filter.charFilter,
          [action.char]: {
            state: ItemFilterState.include,
            charName: action.char,
          },
        },
        charIncludeCount: newCharIncludeCount,
      };
    }
    case "includeWeapon": {
      return {
        ...filter,
        [action.char]: {
          ...filter[action.char],
          weapon: action.weapon,
        },
      };
    }

    case "nullWeapon": {
      return {
        ...filter,
        [action.char]: {
          ...filter[action.char],
          weapon: "",
        },
      };
    }
    case "includeSet": {
      if (!filter[action.char].set) filter[action.char].set = {};
      if (filter[action.char].set[action.set as string] === 2) {
        return {
          ...filter,
          [action.char]: {
            ...filter[action.char],
            set: {
              ...filter[action.char].set,
              [action.set as string]: 2,
            },
          },
        };
      }
      return {
        ...filter,
        [action.char]: {
          ...filter[action.char],
          set: {
            ...filter[action.char].set,
            [action.set as string]: 2,
          },
        },
      };
    }
    case "nullSet": {
      const { [action.set as string]: _, ...newSet } = filter[action.char].set;
      return {
        ...filter,
        [action.char]: {
          ...filter[action.char],
          set: newSet,
        },
      };
    }
    case "clearFilter": {
      return {
        ...filter,
        charFilter: initialCharFilter,
        tagFilter: initialTagFilter,
        charIncludeCount: 0,
      };
    }
    case "setCustomFilter": {
      return {
        ...filter,
        customFilter: action.customFilter,
      };
    }
    case "handleTag": {
      let newFilterState: ItemFilterState;
      switch (filter.tagFilter[action.tag].state) {
        case ItemFilterState.none:
          newFilterState = ItemFilterState.include;
          break;
        case ItemFilterState.include:
          newFilterState = ItemFilterState.none;
          break;
      }

      return {
        ...filter,
        tagFilter: {
          ...filter.tagFilter,
          [action.tag] : {
            state: newFilterState,
            tag: action.tag,
          }
        }
      };
    }

    default: {
      throw Error("Unknown action: " + action);
    }
  }
}

export const filterCharNames = (
  query: string,
  translatedCharNames: string[]
) => {
  return translatedCharNames.filter((charName) => {
    return charName.toLocaleLowerCase().includes(query.toLocaleLowerCase());
  });
};
