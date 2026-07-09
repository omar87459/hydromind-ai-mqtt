export const DEVICES = [
  { key: "main_pump", label: "Main Water Pump", icon: "💧" },
  { key: "nutrient_pump", label: "Nutrient Pump", icon: "🧪" },
  { key: "ph_pump", label: "pH Dosing Pump", icon: "⚗️" },
  { key: "grow_lights", label: "Grow Lights", icon: "💡" },
  { key: "cooling_fan", label: "Cooling Fan", icon: "🌀" },
];

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
      reason:
        reading?.water_level < 40
          ? "Water level is low — keep the pump running and schedule a reservoir refill."
          : "Maintains circulation and oxygenation of the nutrient solution.",
    },
    nutrient_pump: {
      on: !!(ecIssue && ecIssue.problem_detected.includes("below")),
      reason: ecIssue ? ecIssue.recommended_action : "EC is within range — no dosing needed.",
    },
    ph_pump: {
      on: !!phIssue,
      reason: phIssue ? phIssue.recommended_action : "pH is within range — dosing pump idle.",
    },
    grow_lights: {
      on: !(lightIssue && lightIssue.problem_detected.includes("above")),
      reason: lightIssue
        ? lightIssue.recommended_action
        : "Light intensity is within target for this stage.",
    },
    cooling_fan: {
      on: !!tempIssue,
      reason: tempIssue ? tempIssue.recommended_action : "Temperatures are within range — fan idle.",
    },
  };
}
