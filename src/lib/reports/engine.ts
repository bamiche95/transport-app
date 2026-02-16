import { REPORT_SCHEMA } from "./schema";

interface ReportConfig {
  fields: string[]; // These are the IDs selected by the user, e.g., ["jobs.job_id", "users.name"]
  filters: {
    fieldId: string;
    operator: string;
    value: string;
  }[];
}

export function generateReportSql(entityKey: string, config: ReportConfig) {
  const schema = REPORT_SCHEMA[entityKey];
  if (!schema) throw new Error(`Schema not found for entity: ${entityKey}`);

  // 1. Map selected IDs to their actual SQL definitions
  const selectClauses = config.fields.map(fieldId => {
    const fieldDef = schema.fields.find(f => f.id === fieldId);
    if (!fieldDef) return fieldId; // Fallback
    
    // We alias the column so the result set key matches the ID (e.g., "users.name")
    // Note: We use backticks or quotes for aliases with dots
    return `${fieldDef.sql} AS \`${fieldDef.id}\``;
  });

  const selectFields = selectClauses.length > 0 ? selectClauses.join(", ") : "*";
  
  // 2. Build the FROM and JOIN sections
  let sql = `SELECT ${selectFields} FROM ${schema.table}`;
  
  if (schema.joins && schema.joins.length > 0) {
    // Since your joins are already full strings, just join them with spaces
    sql += ` ${schema.joins.join(" ")}`;
  }

  const params: any[] = [];
  const filterClauses: string[] = [];

  // 3. Build WHERE clauses using the .sql property for accuracy
  config.filters.forEach((filter) => {
    const fieldDef = schema.fields.find(f => f.id === filter.fieldId);
    const sqlColumn = fieldDef ? fieldDef.sql : filter.fieldId;

    let operator = "=";
    let value = filter.value;

    switch (filter.operator) {
      case "contains":
        operator = "LIKE";
        value = `%${filter.value}%`;
        break;
      case "gt": operator = ">"; break;
      case "lt": operator = "<"; break;
      case "date_is": operator = "="; break;
    }

    filterClauses.push(`${sqlColumn} ${operator} ?`);
    params.push(value);
  });

  if (filterClauses.length > 0) {
    sql += ` WHERE ${filterClauses.join(" AND ")}`;
  }

  return { sql, params };
}