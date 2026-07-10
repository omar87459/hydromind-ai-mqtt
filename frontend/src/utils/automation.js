export const DEVICES = [
  { key: "main_pump", icon: "💧" },
  { key: "nutrient_pump", icon: "🧪" },
  { key: "ph_pump", icon: "⚗️" },
  { key: "grow_lights", icon: "💡" },
  { key: "cooling_fan", icon: "🌀" },
];

// Each suggestion returns either a static reasonKey (translated via
// monitoring.reasons.<key>) or a reasonText taken directly from the
// backend's dynamically-generated English recommendation text (not
// translated — see the i18n scope note in README).
export function deriveAutomationSuggestions(reading, issues = []) {
  const findIssue = (param) => issues.find((i) => i.parameter === param);
  const ecIssue = findIssue("ec");
  const phIssue = findIssue("ph");
  const airIssue = findIssue("air_temp");
  const waterTempIssue = findIssue("water_temp");
  const lightIssue = findIssue("light_intensity");
  const tempIssue = airIssue?.problem_detected.includes("above")
    ? airIssue
    : waterTempIssue?.problem_detected.includes("above")
    ? waterTempIssue
    : null;

  return {
    main_pump: {
      on: true,
      reasonKey: reading?.water_level < 40 ? "mainPumpLow" : "mainPumpOk",
    },
    nutrient_pump: {
      on: !!(ecIssue && ecIssue.problem_detected.includes("below")),
      reasonKey: ecIssue ? null : "nutrientOk",
      reasonText: ecIssue ? ecIssue.recommended_action : null,
    },
    ph_pump: {
      on: !!phIssue,
      reasonKey: phIssue ? null : "phOk",
      reasonText: phIssue ? phIssue.recommended_action : null,
    },
    grow_lights: {
      on: !(lightIssue && lightIssue.problem_detected.includes("above")),
      reasonKey: lightIssue ? null : "lightsOk",
      reasonText: lightIssue ? lightIssue.recommended_action : null,
    },
    cooling_fan: {
      on: !!tempIssue,
      reasonKey: tempIssue ? null : "fanOk",
      reasonText: tempIssue ? tempIssue.recommended_action : null,
    },
  };
}
