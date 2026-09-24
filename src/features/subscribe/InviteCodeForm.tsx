import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { Field, TextInput } from '../../shared/ui/Field';
import styles from './InviteCodeForm.module.css';
import { parseInviteInput } from './parseInviteInput';

/**
 * Страховка для iPhone: если приложение с экрана «Домой» открылось без ссылки, её можно вставить здесь.
 */
export function InviteCodeForm() {
  const navigate = useNavigate();
  const inputId = useId();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const canPaste = typeof navigator.clipboard?.readText === 'function';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const code = parseInviteInput(value);
    if (!code) {
      setError('Не похоже на ссылку Pulse. Вставьте ссылку целиком.');
      return;
    }
    navigate(`/s/${encodeURIComponent(code)}`);
  };

  const paste = async () => {
    try {
      setValue(await navigator.clipboard.readText());
      setError(null);
    } catch {
      setError('Не удалось прочитать буфер обмена. Вставьте ссылку вручную.');
    }
  };

  return (
    <Card>
      <form onSubmit={submit} noValidate>
        <Field label="Вставьте ссылку или код приглашения" htmlFor={inputId} error={error ?? undefined}>
          <TextInput
            id={inputId}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://…/s/…"
            autoComplete="off"
          />
        </Field>
        <div className={styles.row}>
          <Button type="submit">Продолжить</Button>
          {canPaste && (
            <Button variant="secondary" onClick={() => void paste()}>
              Вставить из буфера
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
