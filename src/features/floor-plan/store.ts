import { create } from "zustand";
import type { FloorPlanGeometryV1 } from "@/features/floor-plan/domain/geometry";

export type EditorMode = "select" | "wall" | "door" | "window" | "room-polygon";

type EditorState = {
  selectedRoomId: string | null;
  editorMode: EditorMode;
  viewMode: "2d" | "3d";
  draftGeometry: FloorPlanGeometryV1 | null;
  isDirty: boolean;
  setSelectedRoomId: (id: string | null) => void;
  setEditorMode: (mode: EditorMode) => void;
  setViewMode: (mode: "2d" | "3d") => void;
  setDraftGeometry: (
    geometry: FloorPlanGeometryV1 | null,
    dirty?: boolean,
  ) => void;
  markClean: () => void;
};

export const useEditorStore = create<EditorState>((set) => ({
  selectedRoomId: null,
  editorMode: "select",
  viewMode: "2d",
  draftGeometry: null,
  isDirty: false,
  setSelectedRoomId: (id) => set({ selectedRoomId: id }),
  setEditorMode: (mode) => set({ editorMode: mode }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setDraftGeometry: (geometry, dirty = true) =>
    set({ draftGeometry: geometry, isDirty: dirty }),
  markClean: () => set({ isDirty: false }),
}));
