/** Тип шага процесса для инфографики. Манифест: docs/manifests/ui/process-flow.md */
export interface ProcessStep {
  /** Заголовок шага, он же смысл (номер шага считается по порядку). */
  title: string;
  /** Пояснение одной строкой. */
  text: string;
}
