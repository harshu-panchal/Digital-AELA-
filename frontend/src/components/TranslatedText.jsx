// Translation feature disabled: component simply renders its children unchanged.
/* eslint-disable react/prop-types */
const TranslatedText = ({ children, className = "", jsx, ...rest }) => {
  // Drop the non-DOM 'jsx' prop to avoid React warnings
  return <span className={className} {...rest}>{children}</span>;
};

export default TranslatedText;
