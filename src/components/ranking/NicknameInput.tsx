"use client";

import { validateDisplayName } from "../../ranking/rankingValidation";

type NicknameInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (nickname: string) => void;
};

export function NicknameInput({ value, onChange, onSubmit }: NicknameInputProps) {
  const validation = validateDisplayName(value);
  const fieldError = value.length > 0 && !validation.ok
    ? validation.message.replaceAll("表示名", "ニックネーム")
    : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validation.ok) {
      onSubmit(validation.value);
    }
  }

  return (
    <form className="title-nickname-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="ranking-nickname">ランキング用ニックネーム</label>
      <div className="title-nickname-row">
        <input
          id="ranking-nickname"
          name="nickname"
          value={value}
          maxLength={24}
          autoComplete="off"
          spellCheck={false}
          aria-describedby="ranking-nickname-note ranking-nickname-error"
          aria-invalid={Boolean(fieldError)}
          placeholder="1〜12文字"
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <button
          className="primary-action title-start-action"
          type="submit"
          disabled={!validation.ok}
        >
          ゲーム開始
        </button>
      </div>
      <p id="ranking-nickname-note" className="title-nickname-note">
        ニックネームとゲーム結果はこのPCのランキングに表示されます。本名や連絡先は入力しないでください。
      </p>
      {fieldError && (
        <p id="ranking-nickname-error" className="ranking-form-error" role="alert">
          {fieldError}
        </p>
      )}
    </form>
  );
}
