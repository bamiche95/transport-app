export type EditableColumnMeta = {
  editable?: boolean;
  inputType?: "text" | "date" | "select";
  options?: { id?: any; label: string; value: any }[]; // for select
  apiField?: string; // backend field name
};