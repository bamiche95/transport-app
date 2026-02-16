
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getUserFromJWT } from "@/lib/auth";
import { REPORT_SCHEMA } from "@/lib/reports/schema";

export async function POST(req: NextRequest) {
    const user = await getUserFromJWT();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { entity, fields, filters } = body;

        // 1. Validate Entity
        const schema = REPORT_SCHEMA[entity];
        if (!schema) {
            return NextResponse.json({ error: "Invalid entity source" }, { status: 400 });
        }

        // 2. Build SELECT Clause
        // Ensure all requested fields exist in the schema to prevent SQL injection via column names
        const selectedColumns = fields.map((fieldId: string) => {
            const fieldDef = schema.fields.find(f => f.id === fieldId);
            if (!fieldDef) return null; // or throw error
            return `${fieldDef.sql} AS '${fieldDef.label}'`;
        }).filter(Boolean);

        if (selectedColumns.length === 0) {
            return NextResponse.json({ error: "No valid fields selected" }, { status: 400 });
        }

        const selectClause = selectedColumns.join(", ");

        // 3. Build FROM / JOIN Clause
        let fromClause = `FROM ${schema.table}`;
        if (schema.joins) {
            fromClause += " " + schema.joins.join(" ");
        }

        // 4. Build WHERE Clause
        let whereClause = "WHERE 1=1";
        const params: any[] = [];

        if (Array.isArray(filters)) {
            for (const filter of filters) {
                const fieldDef = schema.fields.find(f => f.id === filter.fieldId);
                if (!fieldDef) continue;

                if (filter.operator === 'equals') {
                    whereClause += ` AND ${fieldDef.sql} = ?`;
                    params.push(filter.value);
                } else if (filter.operator === 'contains') {
                    whereClause += ` AND ${fieldDef.sql} LIKE ?`;
                    params.push(`%${filter.value}%`);
                } else if (filter.operator === 'gt') {
                    whereClause += ` AND ${fieldDef.sql} > ?`;
                    params.push(filter.value);
                } else if (filter.operator === 'lt') {
                    whereClause += ` AND ${fieldDef.sql} < ?`;
                    params.push(filter.value);
                } else if (filter.operator === 'date_is') {
                    // Assumes YYYY-MM-DD
                    whereClause += ` AND DATE(${fieldDef.sql}) = ?`;
                    params.push(filter.value);
                } else if (filter.operator === 'date_before') {
                    whereClause += ` AND DATE(${fieldDef.sql}) < ?`;
                    params.push(filter.value);
                } else if (filter.operator === 'date_after') {
                    whereClause += ` AND DATE(${fieldDef.sql}) > ?`;
                    params.push(filter.value);
                }
            }
        }

        // 5. Construct Final Query
        const sql = `SELECT ${selectClause} ${fromClause} ${whereClause} LIMIT 1000`; // Limit for safety

        // console.log("Executing Report SQL:", sql, params);

        const [rows] = await pool.query(sql, params);

        return NextResponse.json({ data: rows, sql }); // Returning SQL for debug (remove in prod)

    } catch (error: any) {
        console.error("Report Generation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
