import React, { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableBlock({ item, isActive, vibrateOnDrag }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const outerStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: 0,
    marginBottom: 12,
    borderRadius: 16,
    cursor: "grab",
  };

  const innerStyle = {
    padding: 18,
    borderRadius: 16,
    backgroundColor: item.type === "spacer" ? "#f8fafc" : "#ffffff",
    border: "1px solid #dbeafe",
    boxShadow: isActive ? "0 22px 44px rgba(59, 130, 246, 0.18)" : "0 6px 20px rgba(15, 23, 42, 0.07)",
    transition: "box-shadow 180ms ease, background-color 180ms ease",
    animation: vibrateOnDrag && isActive ? "vibrate 0.16s linear infinite" : undefined,
  };

  return (
    <div ref={setNodeRef} style={outerStyle} {...attributes} {...listeners}>
      <div style={innerStyle}>
        <strong>{item.type === "field" ? item.label : item.type === "text" ? "Text block" : "Spacer"}</strong>
        <div style={{ marginTop: 10, color: "#475569", lineHeight: 1.6, fontSize: 14 }}>
          {item.type === "field" && `Field: ${item.fieldId}`}
          {item.type === "text" && item.label}
          {item.type === "spacer" && "Empty spacer for layout spacing"}
        </div>
      </div>
    </div>
  );
}

export default function LayoutBuilder({ layout, onDragEnd, onAddTextBlock, onAddSpacerBlock, vibrateOnDrag }) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    setActiveId(null);
    onDragEnd(event);
  }

  return (
    <div>
      <style>{`
        @keyframes vibrate {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-1px, 0); }
          50% { transform: translate(1px, 0); }
          75% { transform: translate(-1px, 0); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <button type="button" onClick={onAddTextBlock} className="btn-primary btn-wide">
          Add Text Block
        </button>
        <button type="button" onClick={onAddSpacerBlock} className="btn-ghost btn-wide">
          Add Spacer
        </button>
      </div>
      <div style={{ backgroundColor: "#f8fbff", padding: 18, borderRadius: 20, border: "1px solid #e2e8f0" }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={layout.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            {layout.map((item) => (
              <SortableBlock key={item.id} item={item} isActive={item.id === activeId} vibrateOnDrag={vibrateOnDrag} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
