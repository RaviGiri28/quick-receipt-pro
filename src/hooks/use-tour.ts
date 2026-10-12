import { createContext, useContext } from 'react';

export interface TourContextValue {
  active: boolean;
  // Starts the guided tour from the first step.
  start: () => void;
}

export const TourContext = createContext<TourContextValue>({ active: false, start: () => {} });

export const useTour = () => useContext(TourContext);
