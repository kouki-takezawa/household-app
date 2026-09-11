"use client";

import { useState } from "react";

// 金額入力欄。type="number" のブラウザ標準スピンボタンをやめ、フォーカスが外れている間は
// 3桁区切り（12,000）で表示することで大きな金額でも桁数を目視しやすくする。
// 編集中は区切りカンマを外した生の数字を見せ、カーソル位置がズレる問題を避ける。
// 呼び出し側が持つ state は今まで通り「数字だけの文字列」のままでよい。
//
// 高さ・フォントサイズは他の入力欄（fieldClass、40px前後）より意図的に大きい
// （Revolutの金額入力は56pxで一般テキスト入力の40pxより明確に背が高い＝
// 「一番間違えられないフィールド」を見た目でも最優先にする、という基準に倣った）。
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
      onFocus={(e) => {
        setFocused(true);
        // 既存の金額を編集するとき、選択済み状態にしておくことで
        // そのまま数字を打ち始めれば置き換わる（末尾に連結されない）ようにする。
        // setFocused(true) の再レンダリングでカンマ区切り表示→生の数字表示に
        // 切り替わった後でないと選択範囲がリセットされてしまうため、
        // 描画が反映される次フレームまで待ってから選択する。
        // select() はDOM上フォーカスを伴うため、待っている間にユーザーが
        // 別の欄へ移動していた場合はフォーカスを奪い返してしまう
        // （後続の入力がこのフィールドに誤って書き込まれる）。まだこの欄に
        // フォーカスが残っている場合だけ選択する。
        const input = e.target;
        requestAnimationFrame(() => {
          if (document.activeElement === input) input.select();
        });
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      className={`text-numeral mt-1 w-full rounded-xl border bg-surface px-4 py-4 text-[22px] font-semibold text-foreground outline-none transition-colors focus:ring-2 ${
        hasError ? "border-rose-400 focus:ring-rose-400/30" : "border-line focus:border-brand focus:ring-brand/30"
      }`}
    />
  );
}
