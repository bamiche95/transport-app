export type EditableColumnMeta = {
  editable?: boolean;
  inputType?: "text" | "date" | "select" | "autocomplete";
  options?: { id?: any; label: string; value: any }[]; // for select
  apiField?: string; // backend field name
  searchConfig?: {
    searchUrl: string; // e.g. "/api/customers"
    labelKey: string;  // e.g. "customer_name"
    valueKey: string;  // e.g. "customer_id" or "customer_name"
  };
};