import type { ComplimentDto } from '../../shared/api/types';
import { formatDate } from '../../shared/lib/format';
import { Button } from '../../shared/ui/Button';
import table from '../../shared/ui/Table.module.css';
import styles from './ComplimentsTable.module.css';

type ComplimentsTableProps = {
  compliments: ComplimentDto[];
  busy: boolean;
  onEdit: (compliment: ComplimentDto) => void;
  onRequeue: (compliment: ComplimentDto) => void;
  onDelete: (compliment: ComplimentDto) => void;
};

export function ComplimentsTable({ compliments, busy, onEdit, onRequeue, onDelete }: ComplimentsTableProps) {
  return (
    <table className={table.table}>
      <thead>
        <tr>
          <th className={styles.titleColumn}>Заголовок</th>
          <th>Текст</th>
          <th>Статус</th>
          <th>Создан</th>
          <th>
            <span className={styles.hidden}>Действия</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {compliments.map((compliment) => (
          <tr key={compliment.id}>
            <td data-label="Заголовок" className={styles.title}>
              {compliment.title}
            </td>
            <td data-label="Текст">
              <span className={styles.text} title={compliment.text}>
                {compliment.text}
              </span>
            </td>
            <td data-label="Статус">
              <span className={compliment.isBeenPushed ? table.badgeMuted : table.badgeSuccess}>
                {compliment.isBeenPushed ? 'Отправлен' : 'В очереди'}
              </span>
            </td>
            <td data-label="Создан" className={styles.date}>
              {formatDate(compliment.createdAt)}
            </td>
            <td>
              <div className={table.actions}>
                <Button variant="ghost" onClick={() => onEdit(compliment)} aria-label={`Изменить «${compliment.title}»`}>
                  Изменить
                </Button>
                {compliment.isBeenPushed && (
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => onRequeue(compliment)}
                    aria-label={`Вернуть в очередь «${compliment.title}»`}
                  >
                    Вернуть в очередь
                  </Button>
                )}
                <Button variant="ghost" onClick={() => onDelete(compliment)} aria-label={`Удалить «${compliment.title}»`}>
                  Удалить
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
