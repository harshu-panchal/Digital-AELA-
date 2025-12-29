// Translation feature disabled. Returns children as-is.
/* eslint-disable react/prop-types */
const AutoTranslated = ({ children, className = "", jsx, ...rest }) => {
  return <span className={className} {...rest}>{children}</span>;
};

export default AutoTranslated;
