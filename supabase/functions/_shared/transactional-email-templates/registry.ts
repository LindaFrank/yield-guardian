// deno-lint-ignore-file no-explicit-any
import { template as contactConfirmation } from './contact-confirmation.tsx'

export interface TemplateEntry {
  component: any
  subject: string | ((data: Record<string, unknown>) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'contact-confirmation': contactConfirmation,
}
