"use client";

import { useState } from "react";
import { fieldClass } from "./form";

// 金額入力欄。type="number" のブラウザ標準スピンボタンをやめ、フォーカスが外れている間は
// 3桁区切り（12,000）で表示することで大きな金額でも桁数を目視しやすくする。
// 編集中は区切りカンマを外した生の数字を見せ、カーソル位置がズレる問題を避ける。
// 呼び出し側が持つ state は今まで通り「数字だけの文字列」のままでよい。
export function AmountField({
  value,
  onChange,
  hasError = false,
  placeholder = "0",
}: {
  value: string;
  onChange: (raw: string) => void;
  hasError?: boolean;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);

  const display =
    !focused && value !== "" && !Number.isNaN(Number(value))
      ? Number(value).toLocaleString("ja-JP")
      : value;

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      className={fieldClass(hasError)}
    />
  );
}
