// Shared field-rendering helpers for the anesthesia data-entry forms
// (New Anesth form, Postop visit, Intubation offsite, ...).

export function Field({ label, children }) {
  return (
    <label className="af-field">
      {label}
      {children}
    </label>
  );
}

export function TextInput({ label, value, onChange }) {
  return (
    <Field label={label}>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function RadioGroup({ label, options, value, onChange }) {
  return (
    <Field label={label}>
      <div className="af-options">
        {options.map((opt) => (
          <label key={opt} className="af-option">
            <input type="radio" checked={value === opt} onChange={() => onChange(opt)} />
            {opt}
          </label>
        ))}
      </div>
    </Field>
  );
}

export function CheckboxGroup({ label, options, value, onChange }) {
  function toggle(opt) {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  }
  return (
    <Field label={label}>
      <div className="af-options">
        {options.map((opt) => (
          <label key={opt} className="af-option">
            <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} />
            {opt}
          </label>
        ))}
      </div>
    </Field>
  );
}

export function OfficerSelect({ label, value, onChange, officers }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- เลือก --</option>
        {officers.map((o) => (
          <option key={o.officer_id} value={o.officer_name}>
            {o.officer_name}
          </option>
        ))}
      </select>
    </Field>
  );
}
