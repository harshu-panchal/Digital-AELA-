// Translation feature disabled: just forward data to render prop or JSON view.
/* eslint-disable react/prop-types */
const TranslatedContent = ({ data, jsx, render, fallback = null }) => {
  if (render && typeof render === "function") {
    return render(data, false);
  }
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

export default TranslatedContent;
