import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  EEO_GENDER_OPTIONS,
  EEO_LATINO_OPTIONS,
  EEO_VETERAN_OPTIONS,
  EEO_DISABILITY_OPTIONS,
} from "@/lib/test-data";
import { useTest } from "@/context/TestContext";

export default function EEOSection() {
  const { eeoData, setEeoField } = useTest();

  const sections = [
    { key: "gender", label: "Gender", options: EEO_GENDER_OPTIONS },
    { key: "latino", label: "Hispanic or Latino", options: EEO_LATINO_OPTIONS },
    { key: "veteran", label: "Veteran Status", options: EEO_VETERAN_OPTIONS },
    { key: "disability", label: "Disability Status", options: EEO_DISABILITY_OPTIONS },
  ];

  return (
    <div className="space-y-6 border-t border-border pt-6">
      <div>
        <h3 className="text-lg font-semibold">
          Voluntary Self-Identification (EEO)
          <span className="text-xs font-normal text-muted-foreground ml-2">Not scored</span>
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          This information is collected for Equal Employment Opportunity
          compliance. It will not affect your assessment score.
        </p>
      </div>

      {sections.map((section) => (
        <div key={section.key} className="space-y-3">
          <Label className="text-sm font-medium">{section.label}</Label>
          <RadioGroup
            value={eeoData[section.key] || ""}
            onValueChange={(val) => setEeoField(section.key, val)}
          >
            {section.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${section.key}-${option}`} />
                <Label
                  htmlFor={`${section.key}-${option}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}
    </div>
  );
}
