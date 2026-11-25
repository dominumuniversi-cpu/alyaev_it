/** Поле формы: метка, подсказка, ошибка. Манифест: docs/manifests/ui/field.md */

/** Единственное место, где задан вид поля ввода. Меняешь здесь — меняется везде,
 *  включая элементы, свёрстанные вручную через INPUT_CLASS (манифест ui/field.md). */
const BASE_INPUT =
  "w-full rounded-[10px] border bg-[color:var(--c-paper)] px-3.5 py-2.5 text-sm text-[color:var(--c-ink)] placeholder:text-[color:var(--c-muted)]/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[color:var(--c-terracotta)] focus:ring-offset-2 focus:ring-offset-[color:var(--c-paper)]";

/** Классы поля для самодельных select/input, которые не влезают в Field.
 *  Экспортируется, чтобы не копировать строку стилей по страницам. */
export const INPUT_CLASS = BASE_INPUT + " border-[color:var(--c-line)]";

/** Стили поля: обычное состояние и состояние ошибки. */
function inputClass(hasError: boolean): string {
  const border = hasError ? "border-[color:var(--c-danger)]" : "border-[color:var(--c-line)]";
  return BASE_INPUT + " " + border;
}

/** Обёртка поля: сама метка не заменяется плейсхолдером. */
function Wrapper({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[color:var(--c-ink)]">
        {label}
        {required ? <span className="ml-1 text-[color:var(--c-lime-ink)]">*</span> : null}
      </label>
      {hint ? (
        <p id={id + "-hint"} className="mb-1.5 text-xs text-[color:var(--c-muted)]">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={id + "-error"} role="alert" className="mt-1.5 text-xs text-[color:var(--c-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Текстовое поле с валидацией на стороне сервера и клиента. */
export function TextField({
  id,
  label,
  hint,
  error,
  required,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        aria-required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint ? id + "-hint" : "", error ? id + "-error" : ""]
          .filter(Boolean)
          .join(" ") || undefined}
        className={inputClass(Boolean(error))}
        {...rest}
      />
    </Wrapper>
  );
}

/** Многострочное поле с ограничением длины. */
export function TextAreaField({
  id,
  label,
  hint,
  error,
  required,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        rows={5}
        aria-required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint ? id + "-hint" : "", error ? id + "-error" : ""]
          .filter(Boolean)
          .join(" ") || undefined}
        className={inputClass(Boolean(error)) + " resize-y"}
        {...rest}
      />
    </Wrapper>
  );
}

/** Выпадающий список с меткой. */
export function SelectField({
  id,
  label,
  hint,
  error,
  required,
  options,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} required={required}>
      <select id={id} aria-required={required} className={inputClass(Boolean(error))} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}