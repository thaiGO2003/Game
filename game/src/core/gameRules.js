import { t } from "../i18n/index.js";

export const LOSE_CONDITION = {
  NO_UNITS: "NO_UNITS",
  NO_HEARTS: "NO_HEARTS"
};

export const DEFAULT_LOSE_CONDITION = LOSE_CONDITION.NO_UNITS;

export function normalizeLoseCondition(value) {
  if (value === LOSE_CONDITION.NO_HEARTS) return LOSE_CONDITION.NO_HEARTS;
  return LOSE_CONDITION.NO_UNITS;
}

export function getLoseConditionLabel(value) {
  const normalized = normalizeLoseCondition(value);
  if (normalized === LOSE_CONDITION.NO_HEARTS) return t("lose.noHearts");
  return t("lose.noUnits");
}
