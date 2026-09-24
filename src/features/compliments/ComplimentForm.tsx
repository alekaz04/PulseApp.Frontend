import { useId, useState, type FormEvent } from 'react';
import type { ComplimentInput } from '../../shared/api/types';
import { Button } from '../../shared/ui/Button';
import { Field, TextArea, TextInput } from '../../shared/ui/Field';
import { Modal } from '../../shared/ui/Modal';
import { charCount, hasErrors, TEXT_MAX, TITLE_MAX, validateCompliment, type ComplimentErrors } from './model';

type ComplimentFormProps = {
  title: string;
  initial?: ComplimentInput;
  submitLabel: string;
  pending: boolean;
  onSubmit: (input: ComplimentInput) => void;
  onClose: () => void;
};

export function ComplimentForm({ title, initial, submitLabel, pending, onSubmit, onClose }: ComplimentFormProps) {
  const formId = useId();
  const [values, setValues] = useState<ComplimentInput>(initial ?? { title: '', text: '' });
  const [errors, setErrors] = useState<ComplimentErrors>({});

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const cleaned = { title: values.title.trim(), text: values.text.trim() };
    const nextErrors = validateCompliment(cleaned);
    setErrors(nextErrors);
    if (!hasErrors(nextErrors)) {
      onSubmit(cleaned);
    }
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" form={formId} disabled={pending}>
            {pending ? 'Сохраняем…' : submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        <Field
          label="Заголовок"
          htmlFor={`${formId}-title`}
          error={errors.title}
          count={charCount(values.title)}
          max={TITLE_MAX}
        >
          <TextInput
            id={`${formId}-title`}
            value={values.title}
            autoFocus
            onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
          />
        </Field>
        <Field
          label="Текст"
          htmlFor={`${formId}-text`}
          error={errors.text}
          count={charCount(values.text)}
          max={TEXT_MAX}
          hint="На экране блокировки видно 2–4 строки — коротко лучше."
        >
          <TextArea
            id={`${formId}-text`}
            rows={5}
            value={values.text}
            onChange={(event) => setValues((prev) => ({ ...prev, text: event.target.value }))}
          />
        </Field>
      </form>
    </Modal>
  );
}
