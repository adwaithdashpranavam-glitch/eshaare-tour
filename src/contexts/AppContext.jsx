import React, { createContext, useContext, useReducer } from "react";

const AppStateContext = createContext(null);
const AppDispatchContext = createContext(null);

const initialState = {
  sidebarCollapsed: false,
  activeFilters: {
    leads: { stage: "All", source: "All", assignedTo: "All" },
    cases: { stage: "All", assignedOfficer: "All" },
    payments: { status: "All", dateRange: "All", method: "All" }
  },
  notifications: []
};

function appReducer(state, action) {
  switch (action.type) {
    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed
      };
    case "SET_SIDEBAR_COLLAPSED":
      return {
        ...state,
        sidebarCollapsed: action.payload
      };
    case "SET_LEADS_FILTERS":
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          leads: { ...state.activeFilters.leads, ...action.payload }
        }
      };
    case "SET_CASES_FILTERS":
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          cases: { ...state.activeFilters.cases, ...action.payload }
        }
      };
    case "SET_PAYMENTS_FILTERS":
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          payments: { ...state.activeFilters.payments, ...action.payload }
        }
      };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      };
    case "CLEAR_NOTIFICATIONS":
      return {
        ...state,
        notifications: []
      };
    default:
      return state;
  }
}

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppProvider");
  }
  return context;
};

export const useAppDispatch = () => {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error("useAppDispatch must be used within an AppProvider");
  }
  return context;
};
