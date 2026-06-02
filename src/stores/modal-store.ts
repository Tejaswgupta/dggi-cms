import { createStore } from "zustand/vanilla";

export enum ModalType {
  NOT_LOGGED_IN = "NOT_LOGGED_IN",
  CONFIRM_DELETE_TASK = "CONFIRM_DELETE_TASK",
  EDIT_PASSKEY = "EDIT_PASSKEY",
  DELETE_PASSKEY = "DELETE_PASSKEY",
  DRAFT_TEMPLATE_SEARCH = "DRAFT_TEMPLATE_SEARCH",
}

type ModalState = {
  type: ModalType | null;
  isOpen: boolean;
  data?: {
    [key: string]: any;
    placeholders?: Array<{ name: string; description: string }>;
    onSave?: (descriptions: Record<string, string>) => void;
  };
};

type ModalActions = {
  onOpen: (type: ModalType, data?: { [key: string]: any }) => void;
  onClose: () => void;
};

export type ModalStore = ModalState & ModalActions;

export const initModalStore = (): ModalState => {
  return {
    type: null,
    isOpen: false,
  };
};

const defaultInitState: ModalState = {
  type: null,
  isOpen: false,
};

export const createModalStore = (initState: ModalState = defaultInitState) => {
  return createStore<ModalStore>()((set) => ({
    ...initState,
    onOpen: (type, data?: { [key: string]: any }) =>
      set({ type, isOpen: true, data }),
    onClose: () => set(defaultInitState),
  }));
};
