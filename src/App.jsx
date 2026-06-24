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

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>Form Stack Builder</h1>

      <section style={{ marginBottom: 24 }}>
        <h2>Template Manager</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label>
            Choose a template
            <select value={selectedTemplateId} onChange={handleTemplateChange} style={{ marginLeft: 8, padding: 8 }}>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={addTemplate} style={{ padding: 10, backgroundColor: "#1976d2", color: "white", border: "none", cursor: "pointer" }}>
            Add Template
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Dynamic Form</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginBottom: 24 }}>
          {selectedTemplate?.fields.map((field) => (
            <label key={field.id}>
              {field.label}
              <input
                type={field.type}
                value={formValues[field.id] || ""}
                onChange={(event) => handleInputChange(field.id, event.target.value)}
                required
                style={{ width: "100%", padding: 8, marginTop: 4 }}
              />
            </label>
          ))}

          <button type="submit" style={{ padding: 10, backgroundColor: "#1976d2", color: "white", border: "none", cursor: "pointer" }}>
            Submit
          </button>
        </form>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Layout Builder</h2>
        <LayoutBuilder layout={layout} onDragEnd={handleDragEnd} onAddTextBlock={addTextBlock} onAddSpacerBlock={addSpacerBlock} />
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Layout Output Preview</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <p style={{ color: "#555", margin: 0 }}>
            Current block order: {layoutColumns.map((col) => col.label).join(" → ")}
          </p>
          <button type="button" onClick={handleExportCsv} style={{ padding: 10, backgroundColor: "#388e3c", color: "white", border: "none", cursor: "pointer" }}>
            Export CSV
          </button>
        </div>
        {entries.length === 0 ? (
          <p>No entries yet to preview.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ borderBottom: "2px solid #ddd", padding: 8, textAlign: "left" }}>Template</th>
                {layoutColumns.map((column) => (
                  <th key={column.key} style={{ borderBottom: "2px solid #ddd", padding: 8, textAlign: "left" }}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{entry.templateName}</td>
                  {layoutColumns.map((column) => {
                    const cellValue =
                      column.type === "field"
                        ? entry.values[column.fieldId] ?? ""
                        : column.type === "text"
                        ? column.label
                        : "";
                    return (
                      <td key={column.key} style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                        {cellValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default App;
