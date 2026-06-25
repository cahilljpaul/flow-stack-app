import React, { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableBlock({ item, isActive, vibrateOnDrag, onUpdateSpacerBlock }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const outerStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: 0,
    marginBottom: 12,
    borderRadius: 16,
    cursor: "grab",
  };

  const spacerHeight = Number(item.height) || 48;
  const spacerBackground = item.backgroundColor || "#f8fafc";
  const spacerBorderColor = item.borderColor || "#dbeafe";
  const spacerRadius = Number(item.borderRadius) || 14;

  const innerStyle = {
    padding: 18,
    borderRadius: item.type === "spacer" ? spacerRadius : 16,
    backgroundColor: item.type === "spacer" ? spacerBackground : "#ffffff",
    border: item.type === "spacer" ? `1px solid ${spacerBorderColor}` : "1px solid #dbeafe",
    boxShadow: isActive ? "0 22px 44px rgba(59, 130, 246, 0.18)" : "0 6px 20px rgba(15, 23, 42, 0.07)",
    transition: "box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease",
    animation: vibrateOnDrag && isActive ? "vibrate 0.16s linear infinite" : undefined,
    minHeight: item.type === "spacer" ? spacerHeight : undefined,
    display: item.type === "spacer" ? "flex" : "block",
    alignItems: item.type === "spacer" ? "center" : undefined,
    justifyContent: item.type === "spacer" ? "center" : undefined,
  };

  return (
    <div ref={setNodeRef} style={outerStyle} {...attributes} {...listeners}>
      <div style={innerStyle}>
        <div style={{ width: "100%" }}>
          <strong>{item.type === "field" ? item.label : item.type === "text" ? "Text block" : `Spacer · ${spacerHeight}px`}</strong>
          <div style={{ marginTop: 10, color: "#475569", lineHeight: 1.6, fontSize: 14 }}>
            {item.type === "field" && `Field: ${item.fieldId}`}
            {item.type === "text" && item.label}
            {item.type === "spacer" && "Use the controls below to style this spacer."}
          </div>
          {item.type === "spacer" ? (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              <label style={{ display: "grid", gap: 4, fontSize: 12, color: "#475569" }}>
                Height
                <input
                  type="number"
                  min="8"
                  max="240"
                  value={spacerHeight}
                  onChange={(event) => onUpdateSpacerBlock(item.id, { height: Number(event.target.value) || 8 })}
                  onPointerDown={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                  style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 12, color: "#475569" }}>
                Background
                <input
                  type="color"
                  value={spacerBackground}
                  onChange={(event) => onUpdateSpacerBlock(item.id, { backgroundColor: event.target.value })}
                  onPointerDown={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                  style={{ width: "100%", height: 36, border: "1px solid #cbd5e1", borderRadius: 10, padding: 2, backgroundColor: "#ffffff" }}
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 12, color: "#475569" }}>
                Radius
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={spacerRadius}
                  onChange={(event) => onUpdateSpacerBlock(item.id, { borderRadius: Number(event.target.value) })}
                  onPointerDown={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                />
              </label>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function LayoutBuilder({ layout, onDragEnd, onAddTextBlock, onAddSpacerBlock, onUpdateSpacerBlock, vibrateOnDrag }) {
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
              <SortableBlock
                key={item.id}
                item={item}
                isActive={item.id === activeId}
                vibrateOnDrag={vibrateOnDrag}
                onUpdateSpacerBlock={onUpdateSpacerBlock}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
