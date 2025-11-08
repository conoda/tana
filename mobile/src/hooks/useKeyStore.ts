import { useContext } from "react";
import { KeyStoreContext } from "../contexts/KeyStoreContext";

export const useKeyStore = () => {
  const context = useContext(KeyStoreContext);
  if (!context) {
    throw new Error("useKeyStore must be used within a KeyStoreProvider");
  }
  return context;
};

export default useKeyStore;
