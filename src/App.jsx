import React, { useState, useEffect } from "react";
import LayoutBuilder from "./LayoutBuilder";

const defaultTemplates = [
  {
    id: 1,
    name: "Default Contact",
    fields: [
      { id: "name", label: "Name", type: "text" },
      { id: "date", label: "Date", type: "date" },
      { id: "address", label: "Address", type: "text" },
    ],
  },
  {
    id: 2,
    name: "Event Entry",
    fields: [
      { id: "name", label: "Attendee Name", type: "text" },
      { id: "date", label: "Event Date", type: "date" },
      { id: "address", label: "Venue", type: "text" },
    ],
  },
];

function App() {
  const [templates, setTemplates] = useState(() => {
    const stored = localStorage.getItem("formStackTemplates");
    return stored ? JSON.parse(stored) : defaultTemplates;
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    const storedId = localStorage.getItem("formStackSelectedTemplateId");
    if (storedId) {
      return Number(storedId);
    }

    const storedTemplates = localStorage.getItem("formStackTemplates");
    const parsedTemplates = storedTemplates ? JSON.parse(storedTemplates) : null;
    return parsedTemplates?.[0]?.id ?? defaultTemplates[0].id;
  });

  // Store form values for the current template fields.
  const [formValues, setFormValues] = useState({ name: "", date: "", address: "" });

  // State for submitted entries.
  const [entries, setEntries] = useState(() => {
    const stored = localStorage.getItem("formStackEntries");
    return stored ? JSON.parse(stored) : [];
  });

  const [additionalForms, setAdditionalForms] = useState([]);
  const [copySuccess, setCopySuccess] = useState("");
  const [vibrateOnDrag, setVibrateOnDrag] = useState(true);

  // Layout state represents the order of blocks in the layout builder.
  const [layout, setLayout] = useState(() => [
    { id: "field-name", type: "field", fieldId: "name", label: "Name" },
    { id: "field-date", type: "field", fieldId: "date", label: "Date" },
    { id: "field-address", type: "field", fieldId: "address", label: "Address" },
  ]);

  // Create a new template using default fields and a generated id.
  function addTemplate() {
    const newTemplate = {
      id: Date.now(),
      name: `Custom Template ${templates.length + 1}`,
      fields: [
        { id: "name", label: "Name", type: "text" },
        { id: "date", label: "Date", type: "date" },
        { id: "address", label: "Address", type: "text" },
      ],
    };

    setTemplates((current) => [...current, newTemplate]);
    setSelectedTemplateId(newTemplate.id);
    setFormValues({ name: "", date: "", address: "" });
  }

  function handleTemplateChange(event) {
    const newTemplateId = Number(event.target.value);
    setSelectedTemplateId(newTemplateId);
    setFormValues({ name: "", date: "", address: "" });
  }

  function handleInputChange(fieldId, value) {
    setFormValues((current) => ({ ...current, [fieldId]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);
    const newEntry = {
      id: Date.now(),
      templateId: selectedTemplateId,
      templateName: selectedTemplate?.name || "Unknown",
      values: { ...formValues },
    };

    setEntries((currentEntries) => [...currentEntries, newEntry]);
    setFormValues({ name: "", date: "", address: "" });
  }

  function createNewForm(templateId) {
    const template = templates.find((item) => item.id === templateId) || defaultTemplates[0];
    const values = template.fields.reduce((acc, field) => ({ ...acc, [field.id]: "" }), {});
    return {
      id: Date.now() + Math.random(),
      selectedTemplateId: templateId,
      values,
    };
  }

  function addBlankForm() {
    setAdditionalForms((current) => [...current, createNewForm(selectedTemplateId)]);
  }

  function handleAdditionalTemplateChange(formId, newTemplateId) {
    setAdditionalForms((current) =>
      current.map((form) =>
        form.id === formId
          ? {
              ...form,
              selectedTemplateId: newTemplateId,
              values: templates.find((template) => template.id === newTemplateId)?.fields.reduce(
                (acc, field) => ({ ...acc, [field.id]: "" }),
                {}
              ),
            }
          : form
      )
    );
  }

  function handleAdditionalInputChange(formId, fieldId, value) {
    setAdditionalForms((current) =>
      current.map((form) =>
        form.id === formId ? { ...form, values: { ...form.values, [fieldId]: value } } : form
      )
    );
  }

  function handleAdditionalSubmit(event, formId) {
    event.preventDefault();
    const form = additionalForms.find((item) => item.id === formId);
    const selectedTemplate = templates.find((template) => template.id === form.selectedTemplateId);
    const newEntry = {
      id: Date.now(),
      templateId: form.selectedTemplateId,
      templateName: selectedTemplate?.name || "Unknown",
      values: { ...form.values },
    };

    setEntries((currentEntries) => [...currentEntries, newEntry]);
    setAdditionalForms((current) =>
      current.map((item) =>
        item.id === formId
          ? {
              ...item,
              values: selectedTemplate.fields.reduce((acc, field) => ({ ...acc, [field.id]: "" }), {}),
            }
          : item
      )
    );
  }

  function getLayoutColumns() {
    return layout.map((item) => {
      if (item.type === "field") {
        return { key: item.id, label: item.label, type: "field", fieldId: item.fieldId };
      }
      if (item.type === "text") {
        return { key: item.id, label: item.label, type: "text" };
      }
      if (item.type === "spacer") {
        return { key: item.id, label: "Spacer", type: "spacer" };
      }
      return { key: item.id, label: item.label || "Block", type: item.type };
    });
  }

  const layoutColumns = getLayoutColumns();

  function createCsvRows(entriesToExport, columns) {
    const headerRow = ["Template", ...columns.map((column) => column.label)];
    const dataRows = entriesToExport.map((entry) => [
      entry.templateName,
      ...columns.map((column) => {
        if (column.type === "field") {
          return entry.values[column.fieldId] ?? "";
        }
        if (column.type === "text") {
          return column.label;
        }
        if (column.type === "spacer") {
          return "";
        }
        return "";
      }),
    ]);
    return [headerRow, ...dataRows];
  }

  function convertRowsToCsv(rows) {
    return rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
  }

  function downloadCsv(csv, fileName = "form-stack-entries.csv") {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function createCleanRows(entriesToExport, columns) {
    const headerRow = ["Template", ...columns.map((column) => column.label)];
    const dataRows = entriesToExport.map((entry) => [
      entry.templateName,
      ...columns.map((column) => {
        if (column.type === "field") {
          return entry.values[column.fieldId] ?? "";
        }
        if (column.type === "text") {
          return column.label;
        }
        return "";
      }),
    ]);
    return [headerRow, ...dataRows];
  }

  function copyForExcel() {
    if (entries.length === 0) {
      return;
    }
    const rows = createCleanRows(entries, layoutColumns);
    const text = rows
      .map((row) => row.map((cell) => String(cell ?? "").replace(/\t/g, " ")).join("\t"))
      .join("\n");

    navigator.clipboard
      .writeText(text)
      .then(() => setCopySuccess("Copied ready-for-Excel data!"))
      .catch(() => setCopySuccess("Copy failed. Please try again."));

    setTimeout(() => setCopySuccess(""), 3000);
  }

  function handleExportCsv() {
    if (entries.length === 0) {
      return;
    }
    const rows = createCsvRows(entries, layoutColumns);
    const csv = convertRowsToCsv(rows);
    downloadCsv(csv);
  }

  function moveItem(array, fromIndex, toIndex) {
    const updated = [...array];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    return updated;
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setLayout((currentLayout) => {
      const oldIndex = currentLayout.findIndex((item) => item.id === active.id);
      const newIndex = currentLayout.findIndex((item) => item.id === over.id);
      return moveItem(currentLayout, oldIndex, newIndex);
    });
  }

  function addTextBlock() {
    setLayout((currentLayout) => [
      ...currentLayout,
      { id: `text-${Date.now()}`, type: "text", label: `Text block ${currentLayout.length + 1}` },
    ]);
  }

  function addSpacerBlock() {
    setLayout((currentLayout) => [
      ...currentLayout,
      { id: `spacer-${Date.now()}`, type: "spacer" },
    ]);
  }

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);

  useEffect(() => {
    localStorage.setItem("formStackTemplates", JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem("formStackEntries", JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem("formStackSelectedTemplateId", String(selectedTemplateId));
  }, [selectedTemplateId]);

  const pageStyle = {
    minHeight: "100vh",
    backgroundColor: "#eef3ff",
    color: "#12233d",
    fontFamily: "Inter, system-ui, sans-serif",
    paddingBottom: 40,
  };

  const pageInnerStyle = {
    maxWidth: 1080,
    margin: "0 auto",
    padding: "24px 24px 0",
  };

  const cardStyle = {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
    padding: 28,
    marginBottom: 24,
  };

  const sectionHeader = {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  };

  const buttonStyle = {
    padding: "12px 18px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
  };

  return (
    <div style={pageStyle}>
      <div style={pageInnerStyle}>
        <div style={{ ...cardStyle, background: "linear-gradient(135deg, #4f7dfc, #6d9cff)", color: "white" }}>
          <div style={sectionHeader}>
            <div>
              <h1 style={{ margin: 0, fontSize: 36, lineHeight: 1.05 }}>Form Stack Builder</h1>
              <p style={{ marginTop: 12, maxWidth: 680, color: "rgba(255,255,255,0.88)", fontSize: 16, lineHeight: 1.75 }}>
                Create templates, build layout blocks, and export structured form entries with a polished interface. Use the drag vibration toggle to make blocks feel more interactive while moving them.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="button" style={{ ...buttonStyle, backgroundColor: "rgba(255,255,255,0.16)", color: "white" }} onClick={() => setVibrateOnDrag((current) => !current)}>
                {vibrateOnDrag ? "Vibrate ON" : "Vibrate OFF"}
              </button>
              <button type="button" style={{ ...buttonStyle, backgroundColor: "rgba(255,255,255,0.24)", color: "white" }} onClick={addBlankForm}>
                Add Blank Form
              </button>
            </div>
          </div>
        </div>

        <section style={cardStyle}>
          <div style={sectionHeader}>
            <div>
              <h2 style={{ margin: 0, fontSize: 24 }}>Template Manager</h2>
              <p style={{ margin: "8px 0 0", color: "#475569" }}>Switch between templates or add a fresh custom template with starter fields.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", color: "#334155", fontWeight: 600 }}>
              Choose a template
              <select value={selectedTemplateId} onChange={handleTemplateChange} style={{ minWidth: 220, padding: 12, borderRadius: 12, border: "1px solid #cbd5e1", backgroundColor: "#f8fafc" }}>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={addTemplate} style={{ ...buttonStyle, backgroundColor: "#2563eb", color: "white" }}>
              Add Template
            </button>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={sectionHeader}>
            <div>
              <h2 style={{ margin: 0, fontSize: 24 }}>Dynamic Form</h2>
              <p style={{ margin: "8px 0 0", color: "#475569" }}>Fill in the selected template fields and submit entries to preview them below.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16, marginTop: 12 }}>
            {selectedTemplate?.fields.map((field) => (
              <label key={field.id} style={{ display: "grid", gap: 8, color: "#1f2937", fontWeight: 600 }}>
                {field.label}
                <input
                  type={field.type}
                  value={formValues[field.id] || ""}
                  onChange={(event) => handleInputChange(field.id, event.target.value)}
                  required
                  style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid #cbd5e1", backgroundColor: "#f8fafc" }}
                />
              </label>
            ))}
            <button type="submit" style={{ ...buttonStyle, backgroundColor: "#2563eb", color: "white", width: 160 }}>
              Submit Entry
            </button>
          </form>
        </section>

        {additionalForms.length > 0 ? (
          <section style={cardStyle}>
            <div style={sectionHeader}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24 }}>Additional Forms</h2>
                <p style={{ margin: "8px 0 0", color: "#475569" }}>Fill multiple forms in parallel and submit each one individually.</p>
              </div>
            </div>

            <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
              {additionalForms.map((form) => {
                const selectedTemplate = templates.find((template) => template.id === form.selectedTemplateId) ?? templates[0];
                return (
                  <div key={form.id} style={{ background: "#f8fbff", borderRadius: 18, border: "1px solid #e2e8f0", padding: 18 }}>
                    <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                      <strong style={{ fontSize: 16, color: "#0f172a" }}>Blank Form</strong>
                    </div>
                    <label style={{ display: "grid", gap: 8, marginBottom: 16, color: "#334155", fontWeight: 600 }}>
                      Template
                      <select
                        value={form.selectedTemplateId}
                        onChange={(event) => handleAdditionalTemplateChange(form.id, Number(event.target.value))}
                        style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                      >
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <form onSubmit={(event) => handleAdditionalSubmit(event, form.id)} style={{ display: "grid", gap: 14 }}>
                      {selectedTemplate.fields.map((field) => (
                        <label key={field.id} style={{ display: "grid", gap: 8, color: "#1f2937", fontWeight: 600 }}>
                          {field.label}
                          <input
                            type={field.type}
                            value={form.values[field.id] || ""}
                            onChange={(event) => handleAdditionalInputChange(form.id, field.id, event.target.value)}
                            required
                            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #cbd5e1", backgroundColor: "#f8fafc" }}
                          />
                        </label>
                      ))}
                      <button type="submit" style={{ ...buttonStyle, backgroundColor: "#2563eb", color: "white" }}>
                        Submit Form
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section style={cardStyle}>
          <div style={sectionHeader}>
            <div>
              <h2 style={{ margin: 0, fontSize: 24 }}>Layout Builder</h2>
              <p style={{ margin: "8px 0 0", color: "#475569" }}>Drag blocks to reorder them. The active item can vibrate while dragging when the toggle is enabled.</p>
            </div>
          </div>
          <LayoutBuilder layout={layout} onDragEnd={handleDragEnd} onAddTextBlock={addTextBlock} onAddSpacerBlock={addSpacerBlock} vibrateOnDrag={vibrateOnDrag} />
        </section>

        <section style={cardStyle}>
          <div style={sectionHeader}>
            <div>
              <h2 style={{ margin: 0, fontSize: 24 }}>Layout Output Preview</h2>
              <p style={{ margin: "8px 0 0", color: "#475569" }}>See how entries will land in rows and copy clean Excel-ready data directly to your clipboard.</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
            <p style={{ color: "#475569", margin: 0 }}>Current block order: {layoutColumns.map((col) => col.label).join(" → ")}</p>
            <div style={{ marginLeft: "auto", display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="button" onClick={handleExportCsv} style={{ ...buttonStyle, backgroundColor: "#16a34a", color: "white" }}>
                Export CSV
              </button>
              <button type="button" onClick={copyForExcel} style={{ ...buttonStyle, backgroundColor: "#2563eb", color: "white" }}>
                Copy for Excel
              </button>
            </div>
          </div>
          {copySuccess ? <p style={{ color: "#0f766e", marginBottom: 16 }}>{copySuccess}</p> : null}

          {entries.length === 0 ? (
            <p style={{ color: "#475569", margin: 0 }}>No entries yet to preview.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 680, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ borderBottom: "2px solid #e2e8f0", padding: 12, textAlign: "left", color: "#0f172a" }}>Template</th>
                    {layoutColumns.map((column) => (
                      <th key={column.key} style={{ borderBottom: "2px solid #e2e8f0", padding: 12, textAlign: "left", color: "#0f172a" }}>
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} style={{ backgroundColor: "#ffffff" }}>
                      <td style={{ borderBottom: "1px solid #eceff4", padding: 12 }}>{entry.templateName}</td>
                      {layoutColumns.map((column) => {
                        const cellValue =
                          column.type === "field"
                            ? entry.values[column.fieldId] ?? ""
                            : column.type === "text"
                            ? column.label
                            : "";
                        return (
                          <td key={column.key} style={{ borderBottom: "1px solid #eceff4", padding: 12 }}>{cellValue}</td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
