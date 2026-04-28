export const PROJECT_MESSAGE_CLASS = "fund-message";

const STATUS_ICON_CLASS_MAP = {
  success: "fund-message__status fund-message__status--success",
  error: "fund-message__status fund-message__status--error",
};

export function buildProjectMessageOptions({ message, type = "success", center = true, ...rest }) {
  const normalizedType = STATUS_ICON_CLASS_MAP[type] ? type : "success";

  return {
    message,
    type: normalizedType,
    center,
    ...rest,
    customClass: [PROJECT_MESSAGE_CLASS, `${PROJECT_MESSAGE_CLASS}--${normalizedType}`, rest.customClass]
      .filter(Boolean)
      .join(" "),
    iconClass: STATUS_ICON_CLASS_MAP[normalizedType],
  };
}

export function showProjectMessage(vm, options) {
  return vm.$message(buildProjectMessageOptions(options));
}
