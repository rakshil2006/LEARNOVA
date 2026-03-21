import { useContext } from "react";
import { NotificationContext } from "../context/NotificationContext";

export function useToast() {
  return useContext(NotificationContext).toast;
}
