"use client";

import * as React from "react";

function Select(props) {
  return <select {...props} />;
}

function SelectGroup(props) {
  return <optgroup {...props} />;
}

function SelectValue(props) {
  return <option {...props} />;
}

function SelectTrigger({ children, ...props }) {
  return <select {...props}>{children}</select>;
}

function SelectContent(props) {
  return <>{props.children}</>;
}

function SelectLabel(props) {
  return <label {...props} />;
}

function SelectItem(props) {
  return <option {...props} />;
}

function SelectSeparator() {
  return null;
}

function SelectScrollUpButton(props) {
  return <button type="button" {...props} />;
}

function SelectScrollDownButton(props) {
  return <button type="button" {...props} />;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
