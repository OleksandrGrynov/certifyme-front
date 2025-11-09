
import toast from "react-hot-toast";
import i18n from "../i18n/i18n";

export const tLabel = (ua, en) => (i18n.language === "ua" ? ua : en);

export const tToast = {
  success: (ua, en, options) => toast.success(tLabel(ua, en), options),
  error: (ua, en, options) => toast.error(tLabel(ua, en), options),
  loading: (ua, en, options) => toast.loading(tLabel(ua, en), options),
  message: (ua, en, options) => toast(tLabel(ua, en), options),
};

export default tToast;

