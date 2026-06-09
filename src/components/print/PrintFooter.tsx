import { DISCLAIMERS } from '@/config/copy';

export function PrintFooter() {
  return (
    <div className="print-footer">
      <p>{DISCLAIMERS.PRINT_FOOTER}</p>
    </div>
  );
}
