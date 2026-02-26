import { t } from "../i18n/index.js";

export const LOSE_CONDITION = {
  NO_UNITS: "NO_UNITS"
};

export const DEFAULT_LOSE_CONDITION = LOSE_CONDITION.NO_UNITS;

export function normalizeLoseCondition(_value) {
  return LOSE_CONDITION.NO_UNITS;
}

export function getLoseConditionLabel(_value) {
  return t("lose.noUnits");
}
