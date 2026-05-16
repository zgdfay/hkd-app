import { useState, useEffect } from 'react';

export function useBoolean(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const setTrue = () => setValue(true);
  const setFalse = () => setValue(false);
  const toggle = () => setValue((v) => !v);

  return { value, setTrue, setFalse, toggle };
}
