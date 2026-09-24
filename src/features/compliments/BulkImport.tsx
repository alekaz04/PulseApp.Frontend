import { useId, useState, type FormEvent } from 'react';
import type { ComplimentInput } from '../../shared/api/types';
import { Button } from '../../shared/ui/Button';
import { Field, TextArea, TextInput } from '../../shared/ui/Field';
import { Modal } from '../../shared/ui/Modal';
import styles from './BulkImport.module.css';
import { charCount, TITLE_MAX } from './model';
import { DEFAULT_BULK_TITLE, parseBulk } from './parseBulk';

type BulkImportProps = {
  pending: boolean;
  onSubmit: (items: ComplimentInput[]) => void;
  onClose: () => void;
};

export function BulkImport({ pending, onSubmit, onClose }: BulkImportProps) {
  const formId = useId();
  const [title, setTitle] = useState(DEFAULT_BULK_TITLE);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const result = parseBulk(title, text);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (result.ok) {
      onSubmit(result.items);
    }
  };

  return (
    <Modal
      title="Добавить списком"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" form={formId} disabled={pending}>
            {pending ? 'Добавляем…' : 'Добавить'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        <Field label="Заголовок для всех" htmlFor={`${formId}-title`} count={charCount(title)} max={TITLE_MAX}>
          <TextInput id={`${formId}-title`} value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="Тексты, по одному на строку" htmlFor={`${formId}-text`} hint="Пустые строки пропускаются.">
          <TextArea
            id={`${formId}-text`}
            rows={10}
            value={text}
            autoFocus
            onChange={(event) => setText(event.target.value)}
          />
        </Field>
        {result.ok && <p className={styles.summary}>{`Будет добавлено: ${result.items.length}`}</p>}
        {!result.ok && submitted && (
          <p className={styles.error} role="alert">
            {result.error}
          </p>
        )}
      </form>
    </Modal>
  );
}
