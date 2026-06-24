import React from "react";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableBlock({ item }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: 12,
    marginBottom: 8,
    backgroundColor: item.type === "spacer" ? "#f4f4f4" : "#fff",
    border: "1px solid #ccc",
    borderRadius: 6,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <strong>{item.type === "field" ? item.label : item.type === "text" ? "Text block" : "Spacer"}</strong>
      <div style={{ marginTop: 8, color: "#555" }}>
        {item.type === "field" && `Field: ${item.fieldId}`}
        {item.type === "text" && item.label}
        {item.type === "spacer" && "Empty spacer for layout spacing"}
      </div>
    </div>
  );
}

export default function LayoutBuilder({ layout, onDragEnd, onAddTextBlock, onAddSpacerBlock }) {
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event) {
    onDragEnd(event);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button type="button" onClick={onAddTextBlock} style={{ padding: 10, backgroundColor: "#1976d2", color: "white", border: "none", cursor: "pointer" }}>
          Add Text Block
        </button>
        <button type="button" onClick={onAddSpacerBlock} style={{ padding: 10, backgroundColor: "#555", color: "white", border: "none", cursor: "pointer" }}>
          Add Spacer
        </button>
      </div>
      <div style={{ backgroundColor: "#fafafa", padding: 12, borderRadius: 8, border: "1px solid #ddd" }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={layout.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            {layout.map((item) => (
              <SortableBlock key={item.id} item={item} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
