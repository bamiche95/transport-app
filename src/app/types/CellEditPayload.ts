import { EditableColumnMeta } from "./EditableColumnMeta";
export interface CellEditPayload<T> {
  rowId: string | number;
  columnId: string;
  value: any;
  row: T;
  columnMeta?: EditableColumnMeta;
}
