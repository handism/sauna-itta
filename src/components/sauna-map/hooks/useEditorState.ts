import { useReducer } from "react";
import { LatLng, SaunaVisit } from "../types";

type EditorMode = "list" | "creating:pick" | "creating:form" | "editing";

interface EditorState {
  mode: EditorMode;
  editingId: string | null;
  selectedLocation: LatLng | null;
  isSidebarExpanded: boolean;
  mapTarget: LatLng | null;
}

type EditorAction =
  | { type: "start_create"; isMobile: boolean }
  | { type: "start_edit"; visit: SaunaVisit }
  | { type: "select_location"; location: LatLng; isMobile: boolean }
  | { type: "cancel_edit"; completed: boolean; isMobile: boolean }
  | { type: "toggle_sidebar" };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "start_create":
      return {
        ...state,
        mode: "creating:pick",
        editingId: null,
        selectedLocation: null,
        isSidebarExpanded: action.isMobile ? false : state.isSidebarExpanded,
      };

    case "start_edit":
      return {
        ...state,
        mode: "editing",
        editingId: action.visit.id,
        selectedLocation: { lat: action.visit.lat, lng: action.visit.lng },
        mapTarget: { lat: action.visit.lat, lng: action.visit.lng },
        isSidebarExpanded: true,
      };

    case "select_location":
      return {
        ...state,
        mode: state.mode === "creating:pick" ? "creating:form" : state.mode,
        selectedLocation: action.location,
        isSidebarExpanded: action.isMobile ? true : state.isSidebarExpanded,
      };

    case "cancel_edit":
      return {
        ...state,
        mode: "list",
        editingId: null,
        selectedLocation: null,
        isSidebarExpanded: action.isMobile ? action.completed : state.isSidebarExpanded,
      };

    case "toggle_sidebar":
      return {
        ...state,
        isSidebarExpanded: !state.isSidebarExpanded,
      };

    default:
      return state;
  }
}

export function useEditorState(isMobile: boolean) {
  const [state, dispatch] = useReducer(editorReducer, {
    mode: "list",
    editingId: null,
    selectedLocation: null,
    isSidebarExpanded: !isMobile,
    mapTarget: null,
  });

  return {
    state,
    startCreate: () => dispatch({ type: "start_create", isMobile }),
    startEdit: (visit: SaunaVisit) => dispatch({ type: "start_edit", visit }),
    selectLocation: (location: LatLng) =>
      dispatch({ type: "select_location", location, isMobile }),
    cancelEdit: (completed = false) =>
      dispatch({ type: "cancel_edit", completed, isMobile }),
    toggleSidebar: () => dispatch({ type: "toggle_sidebar" }),
  };
}
