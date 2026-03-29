import { toast } from "sonner";

export const showSuccess = (msg) => {
  toast.success(msg);
};

export const showError = (msg) => {
  toast.error(msg);
};

export const showInfo = (msg) => {
  toast(msg);
};

export const showLoading = (msg) => {
  return toast.loading(msg);
};

export const dismissToast = (id) => {
  toast.dismiss(id);
};
